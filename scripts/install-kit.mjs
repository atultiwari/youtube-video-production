#!/usr/bin/env node
/**
 * Install the v3 component kit into a Remotion project.
 *
 *   node <skill>/scripts/install-kit.mjs <project> [--style paper-notes|sketchbook]
 *
 * In order:
 *   1. checks it is a Remotion project
 *   2. makes sure remotion-whiteboard's toolkit is in src/whiteboard (runs that skill's
 *      installer if it is installed; otherwise STOPS: the kit draws with it and must not
 *      improvise a replacement)
 *   3. copies the kit to src/kit, and the style to src/kit/style.json (kept if already there)
 *   4. themes the whiteboard pen and ink from the style
 *   5. copies the style's fonts (Fontsource, OFL) to public/fonts, and adds @remotion/fonts at
 *      the project's own Remotion version: no render fetches fonts from the network
 *   6. copies the build and QA tools to tools/
 *   7. makes the paper grain, public/paper/grain.png
 *   8. registers `kit-demo` (16:9) and `kit-demo-vertical` (9:16), the kit's still tests
 *
 * Idempotent: re-running updates the kit and tools and changes nothing else.
 */

import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(HERE, "..");
const KIT = path.join(SKILL, "assets", "kit");
const say = (m) => console.log(m);
const fail = (m) => {
  console.error(`\ninstall-kit: ${m}`);
  process.exit(1);
};

const args = process.argv.slice(2);
const project = path.resolve(args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--style") ?? ".");
const styleName = args.includes("--style") ? args[args.indexOf("--style") + 1] : "paper-notes";

// 1. A Remotion project --------------------------------------------------------------
const pkgPath = path.join(project, "package.json");
if (!fs.existsSync(pkgPath)) fail(`${project} has no package.json. Create the project first: npx create-video@latest --yes --blank <dir>`);
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const remotionVersion = pkg.dependencies?.remotion ?? pkg.devDependencies?.remotion;
if (!remotionVersion) fail(`${project} does not depend on remotion.`);
const src = ["src", "remotion", "app"].map((d) => path.join(project, d)).find((d) => fs.existsSync(path.join(d, "Root.tsx")));
if (!src) fail(`no Root.tsx under src/, remotion/ or app/ in ${project}.`);
const stylePath = path.join(SKILL, "styles", `${styleName}.json`);
if (!fs.existsSync(stylePath)) fail(`no style "${styleName}" (have: ${fs.readdirSync(path.join(SKILL, "styles")).map((f) => f.replace(".json", "")).join(", ")}).`);
const style = JSON.parse(fs.readFileSync(stylePath, "utf8"));
say(`Remotion project: ${project} (remotion ${remotionVersion}), style ${styleName}`);

// 2. remotion-whiteboard: the drawing engine ----------------------------------------
if (!fs.existsSync(path.join(src, "whiteboard", "index.ts"))) {
  const candidates = [
    process.env.REMOTION_WHITEBOARD,
    path.join(os.homedir(), ".claude", "skills", "remotion-whiteboard"),
    path.join(project, ".claude", "skills", "remotion-whiteboard"),
  ].filter(Boolean);
  const wb = candidates.map((d) => path.join(d, "scripts", "install.mjs")).find((f) => fs.existsSync(f));
  if (!wb) {
    fail(
      "remotion-whiteboard is not installed, and the kit draws with it. Install that skill\n" +
        "(github.com/atultiwari/remotion-whiteboard, symlinked into ~/.claude/skills/) and re-run.\n" +
        "Do not improvise a drawing component instead.",
    );
  }
  say(`Installing the whiteboard toolkit with ${wb}`);
  execFileSync("node", [wb, project], { stdio: "inherit" });
} else {
  say("Whiteboard toolkit: present");
}

// 3. Kit and style ---------------------------------------------------------------------
const kitDest = path.join(src, "kit");
fs.mkdirSync(kitDest, { recursive: true });
let copied = 0;
for (const f of fs.readdirSync(path.join(KIT, "src", "kit"))) {
  fs.copyFileSync(path.join(KIT, "src", "kit", f), path.join(kitDest, f));
  copied += 1;
}
const styleDest = path.join(kitDest, "style.json");
if (fs.existsSync(styleDest) && JSON.parse(fs.readFileSync(styleDest, "utf8")).name !== styleName) {
  say(`  style.json: kept the project's "${JSON.parse(fs.readFileSync(styleDest, "utf8")).name}" (delete it to switch to ${styleName})`);
} else if (!fs.existsSync(styleDest)) {
  fs.copyFileSync(stylePath, styleDest);
  say(`  style.json: ${styleName}`);
} else {
  say("  style.json: kept the project's copy");
}
say(`Kit → ${path.relative(project, kitDest)}/ (${copied} files)`);

// 4. Theme the pen and ink from the style -----------------------------------------------
const tokensPath = path.join(src, "whiteboard", "tokens.ts");
let tokens = fs.readFileSync(tokensPath, "utf8");
const setToken = (key, value) => {
  tokens = tokens.replace(new RegExp(`(\\n  ${key}: )"[^"]*"`), `$1"${value}"`);
};
setToken("line", style.ink.line);
setToken("dim", style.ink.soft);
setToken("accent", style.ink.line);
setToken("paper", style.chapters[Object.keys(style.chapters)[0]].ground);
setToken("surface", style.ink.card);
setToken("border", style.ink.cardEdge);
setToken("body", style.marker.body);
setToken("rim", style.marker.rim);
fs.writeFileSync(tokensPath, tokens);
say("Whiteboard tokens: ink and marker themed from the style");

// 5. Fonts: local files, so no render depends on the network ----------------------------
const version = String(remotionVersion).replace(/^[\^~]/, "");
const fontPkgs = [...new Set([style.fonts.serif.fontsource, style.fonts.sans.fontsource])].map((f) => `@fontsource/${f}`);
const missing = ["@remotion/fonts", ...fontPkgs].filter((p) => !fs.existsSync(path.join(project, "node_modules", p)));
if (missing.length) {
  say(`Adding ${missing.join(", ")}`);
  if (missing.includes("@remotion/fonts")) execSync(`npm install --save-exact @remotion/fonts@${version}`, { cwd: project, stdio: "inherit" });
  const dev = missing.filter((p) => p.startsWith("@fontsource/"));
  if (dev.length) execSync(`npm install --save-dev ${dev.join(" ")}`, { cwd: project, stdio: "inherit" });
}
const fontDir = path.join(project, "public", "fonts");
fs.mkdirSync(fontDir, { recursive: true });
let faces = 0;
for (const font of [style.fonts.serif, style.fonts.sans]) {
  const faceList = [...font.weights.map((w) => [w, "normal"]), ...font.italic.map((w) => [w, "italic"])];
  for (const [w, st] of faceList) {
    const file = `${font.fontsource}-latin-${w}-${st}.woff2`;
    const from = path.join(project, "node_modules", "@fontsource", font.fontsource, "files", file);
    if (!fs.existsSync(from)) fail(`font file missing: ${from}`);
    fs.copyFileSync(from, path.join(fontDir, file));
    faces += 1;
  }
}
say(`Fonts → public/fonts/ (${faces} faces, ${[style.fonts.serif.licence]} — OFL allows bundling)`);

// 6. Tools ----------------------------------------------------------------------------
const tools = path.join(project, "tools");
fs.mkdirSync(tools, { recursive: true });
for (const f of fs.readdirSync(path.join(KIT, "tools"))) fs.copyFileSync(path.join(KIT, "tools", f), path.join(tools, f));
for (const f of ["frame-fill.py", "event-gaps.py", "sound-design.py", "contact-sheet.py", "draft-takes.py", "make-paper.py", "check-storyboard.py"]) {
  const from = path.join(SKILL, "scripts", f);
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(tools, f));
}
for (const f of fs.readdirSync(tools)) if (/\.(sh|py|mjs)$/.test(f)) fs.chmodSync(path.join(tools, f), 0o755);
say(`Tools → tools/ (${fs.readdirSync(tools).length} files)`);

// 7. Paper ----------------------------------------------------------------------------
const grain = path.join(project, "public", style.paper.grain);
if (!fs.existsSync(grain)) {
  execFileSync("python3", ["-I", path.join(tools, "make-paper.py"), grain, "--width", "1920", "--height", "1920"], { stdio: "inherit" });
}

// 8. Demos ----------------------------------------------------------------------------
const rootPath = path.join(src, "Root.tsx");
let root = fs.readFileSync(rootPath, "utf8");
if (!root.includes("kit-demo")) {
  const opening = root.match(/return\s*\(\s*\n(\s*)<>|=>\s*\(\s*\n(\s*)<>/);
  if (!opening) {
    say(`Add the demos to ${rootPath} by hand:\n  import { KitDemo, KIT_DEMO_FRAMES } from "./kit/KitDemo";`);
  } else {
    const indent = opening[1] ?? opening[2] ?? "    ";
    const comp = (id, w, h) =>
      `${indent}  <Composition id="${id}" component={KitDemo} durationInFrames={KIT_DEMO_FRAMES} fps={30} width={${w}} height={${h}} />\n`;
    root = root.replace(opening[0], `${opening[0]}\n${comp("kit-demo", 1920, 1080)}${comp("kit-demo-vertical", 1080, 1920)}`);
    if (!/import\s+\{[^}]*\bComposition\b[^}]*\}\s+from\s+["']remotion["']/.test(root)) root = `import { Composition } from "remotion";\n${root}`;
    const imports = [...root.matchAll(/^import .*?;$/gm)];
    const last = imports[imports.length - 1];
    const at = last.index + last[0].length;
    root = `${root.slice(0, at)}\nimport { KIT_DEMO_FRAMES, KitDemo } from "./kit/KitDemo";${root.slice(at)}`;
    fs.writeFileSync(rootPath, root);
    say("Registered kit-demo and kit-demo-vertical in Root.tsx");
  }
}

say("\nDone. Check the install:");
say(`  cd ${path.relative(process.cwd(), project) || "."}`);
say("  npx tsc --noEmit && node tools/qa.mjs kit-demo && node tools/qa.mjs kit-demo-vertical");
