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
 *   7. makes sure a Python with numpy + Pillow exists for the tools (a shared venv at
 *      ~/.local/share/youtube-video-production/venv, made once; override with YVP_PYTHON),
 *      then makes the paper grain, public/paper/grain.png
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
const USAGE = `Install the v3 component kit into a Remotion project.

  node <skill>/scripts/install-kit.mjs <project> [--style paper-notes|sketchbook]

<project> is required (use . for the current directory). Idempotent: re-running updates the kit
and tools and changes nothing else.`;
if (args.includes("--help") || args.includes("-h")) {
  console.log(USAGE);
  process.exit(0);
}
if (!args.some((a, i) => !a.startsWith("--") && args[i - 1] !== "--style")) {
  console.log(USAGE);
  process.exit(2);
}
const styleArg = (() => {
  const eq = args.find((a) => a.startsWith("--style="));
  if (eq) return eq.slice("--style=".length);
  return args.includes("--style") ? args[args.indexOf("--style") + 1] : null;
})();
const project = path.resolve(args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--style") ?? ".");
const styleName = styleArg ?? "paper-notes";

// 1. A Remotion project --------------------------------------------------------------
const pkgPath = path.join(project, "package.json");
if (!fs.existsSync(pkgPath)) fail(`${project} has no package.json. Create the project first: npx create-video@latest --yes --blank <dir>`);
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const remotionVersion = pkg.dependencies?.remotion ?? pkg.devDependencies?.remotion;
if (!remotionVersion) fail(`${project} does not depend on remotion.`);
let src = ["src", "remotion", "app"].map((d) => path.join(project, d)).find((d) => fs.existsSync(path.join(d, "Root.tsx")));
if (!src) {
  // A bare project (package.json only): give it the standard entry point and an empty Root.
  src = path.join(project, "src");
  fs.mkdirSync(src, { recursive: true });
  fs.writeFileSync(path.join(src, "Root.tsx"), `import { Composition } from "remotion";\n\nexport const RemotionRoot: React.FC = () => {\n  return (\n    <>\n    </>\n  );\n};\n`);
  if (!fs.existsSync(path.join(src, "index.ts"))) {
    fs.writeFileSync(path.join(src, "index.ts"), `import { registerRoot } from "remotion";\nimport { RemotionRoot } from "./Root";\n\nregisterRoot(RemotionRoot);\n`);
  }
  say("No Root.tsx found: created src/Root.tsx and src/index.ts");
}
const stylePath = path.join(SKILL, "styles", `${styleName}.json`);
if (!fs.existsSync(stylePath)) fail(`no style "${styleName}" (have: ${fs.readdirSync(path.join(SKILL, "styles")).map((f) => f.replace(".json", "")).join(", ")}).`);
const style = JSON.parse(fs.readFileSync(stylePath, "utf8"));
say(`Remotion project: ${project} (remotion ${remotionVersion})${styleArg ? `, requested style ${styleArg}` : ""}`);

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
const changed = [];
for (const f of fs.readdirSync(path.join(KIT, "src", "kit"))) {
  const to = path.join(kitDest, f);
  const from = path.join(KIT, "src", "kit", f);
  if (fs.existsSync(to) && !fs.readFileSync(to).equals(fs.readFileSync(from))) changed.push(f);
  fs.copyFileSync(from, to);
  copied += 1;
}
if (changed.length) say(`  updated from the skill (local edits to these are replaced): ${changed.join(", ")}`);
const styleDest = path.join(kitDest, "style.json");
if (!fs.existsSync(styleDest)) {
  fs.copyFileSync(stylePath, styleDest);
  say(`  style.json: ${styleName}`);
} else {
  const kept = JSON.parse(fs.readFileSync(styleDest, "utf8")).name;
  if (styleArg && kept !== styleArg) say(`  style.json: kept the project's "${kept}" (delete src/kit/style.json to switch to ${styleArg})`);
  else say(`  style.json: kept the project's "${kept}"`);
}
say(`Kit → ${path.relative(project, kitDest)}/ (${copied} files)`);
// Everything below follows the style the project actually has, not the --style default, so a
// plain re-run never re-themes a sketchbook project as paper-notes.
const effective = JSON.parse(fs.readFileSync(styleDest, "utf8"));

// 4. Theme the pen and ink from the style -----------------------------------------------
const tokensPath = path.join(src, "whiteboard", "tokens.ts");
let tokens = fs.readFileSync(tokensPath, "utf8");
const missedTokens = [];
const setToken = (key, value) => {
  const re = new RegExp(`(\\n  ${key}: )"[^"]*"`);
  if (!re.test(tokens)) missedTokens.push(key);
  tokens = tokens.replace(re, `$1"${value}"`);
};
setToken("line", effective.ink.line);
setToken("dim", effective.ink.soft);
setToken("accent", effective.ink.line);
setToken("paper", effective.chapters[Object.keys(effective.chapters)[0]].ground);
setToken("surface", effective.ink.card);
setToken("border", effective.ink.cardEdge);
setToken("body", effective.marker.body);
setToken("rim", effective.marker.rim);
fs.writeFileSync(tokensPath, tokens);
if (missedTokens.length) say(`  ! whiteboard tokens not found, set them by hand in tokens.ts: ${missedTokens.join(", ")}`);
say(`Whiteboard tokens: ink and marker themed from "${effective.name}"`);

// 5. Fonts: local files, so no render depends on the network ----------------------------
const version = String(remotionVersion).replace(/^[\^~]/, "");
const fontPkgs = [...new Set([effective.fonts.serif.fontsource, effective.fonts.sans.fontsource])].map((f) => `@fontsource/${f}`);
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
for (const font of [effective.fonts.serif, effective.fonts.sans]) {
  const faceList = [...font.weights.map((w) => [w, "normal"]), ...font.italic.map((w) => [w, "italic"])];
  for (const [w, st] of faceList) {
    const file = `${font.fontsource}-latin-${w}-${st}.woff2`;
    const from = path.join(project, "node_modules", "@fontsource", font.fontsource, "files", file);
    if (!fs.existsSync(from)) fail(`font file missing: ${from}`);
    fs.copyFileSync(from, path.join(fontDir, file));
    faces += 1;
  }
}
say(`Fonts → public/fonts/ (${faces} faces; licences: ${[...new Set([effective.fonts.serif.licence, effective.fonts.sans.licence])].join(", ")})`);

// 6. Tools ----------------------------------------------------------------------------
const tools = path.join(project, "tools");
fs.mkdirSync(tools, { recursive: true });
for (const f of fs.readdirSync(path.join(KIT, "tools"))) fs.copyFileSync(path.join(KIT, "tools", f), path.join(tools, f));
for (const f of ["frame-fill.py", "event-gaps.py", "gap-words.py", "sound-design.py", "contact-sheet.py", "draft-takes.py", "make-paper.py", "check-storyboard.py", "focus-check.py"]) {
  const from = path.join(SKILL, "scripts", f);
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(tools, f));
}
for (const f of fs.readdirSync(tools)) if (/\.(sh|py|mjs)$/.test(f)) fs.chmodSync(path.join(tools, f), 0o755);
say(`Tools → tools/ (${fs.readdirSync(tools).length} files)`);

// 7. Python for the tools, then paper ---------------------------------------------------
// The tools run as `python3 -I`, which ignores user site-packages, so a `pip install --user`
// numpy is invisible to them (E01, Nov 2026: several failed runs). Use a venv that has them.
const hasDeps = (py) => { try { execFileSync(py, ["-I", "-c", "import numpy, PIL"], { stdio: "ignore" }); return true; } catch { return false; } };
const VENV = path.join(os.homedir(), ".local", "share", "youtube-video-production", "venv");
let py = process.env.YVP_PYTHON || (fs.existsSync(path.join(VENV, "bin", "python3")) ? path.join(VENV, "bin", "python3") : "python3");
if (!hasDeps(py)) {
  say(`Python tools need numpy and Pillow: creating ${VENV} (once)`);
  execFileSync("python3", ["-m", "venv", VENV], { stdio: "inherit" });
  py = path.join(VENV, "bin", "python3");
  execFileSync(py, ["-m", "pip", "install", "-q", "numpy", "pillow"], { stdio: "inherit" });
  if (!hasDeps(py)) fail("numpy/Pillow still not importable; set YVP_PYTHON to a python3 that has them.");
}
say(`Python for tools: ${py}  (build-all.sh finds it; elsewhere run tools with this python)`);
const grain = path.join(project, "public", effective.paper.grain);
if (!fs.existsSync(grain)) {
  execFileSync(py, ["-I", path.join(tools, "make-paper.py"), grain, "--width", "1920", "--height", "1920"], { stdio: "inherit" });
}

// 8. Demos ----------------------------------------------------------------------------
const rootPath = path.join(src, "Root.tsx");
let root = fs.readFileSync(rootPath, "utf8");
if (!root.includes("kit-demo")) {
  // `return (\n  <>`, `=> (\n  <>`, or failing those the first fragment `<>` anywhere.
  const opening = root.match(/return\s*\(\s*\n(\s*)<>|=>\s*\(\s*\n(\s*)<>/) ?? root.match(/()()<>/);
  if (!opening) {
    say(`Add the demos to ${rootPath} by hand:\n  import { KitDemo, KIT_DEMO_FRAMES } from "./kit/KitDemo";`);
  } else {
    const indent = opening[1] ?? opening[2] ?? "    ";
    const comp = (id, w, h) =>
      `${indent}  <Composition id="${id}" component={KitDemo} durationInFrames={KIT_DEMO_FRAMES} fps={30} width={${w}} height={${h}} />\n`;
    root = root.replace(opening[0], `${opening[0]}\n${comp("kit-demo", 1920, 1080)}${comp("kit-demo-vertical", 1080, 1920)}`);
    if (!/import\s+\{[^}]*\bComposition\b[^}]*\}\s+from\s+["']remotion["']/.test(root)) root = `import { Composition } from "remotion";\n${root}`;
    // After the last import statement, single- or multi-line, with or without a semicolon.
    const imports = [...root.matchAll(/^import[\s\S]*?from\s+["'][^"']+["'];?[ \t]*$/gm)];
    const last = imports[imports.length - 1];
    if (!last) {
      say(`Could not place the import in ${rootPath}; add it by hand:\n  import { KIT_DEMO_FRAMES, KitDemo } from "./kit/KitDemo";`);
    } else {
      const at = last.index + last[0].length;
      root = `${root.slice(0, at)}\nimport { KIT_DEMO_FRAMES, KitDemo } from "./kit/KitDemo";${root.slice(at)}`;
    }
    fs.writeFileSync(rootPath, root);
    say("Registered kit-demo and kit-demo-vertical in Root.tsx");
  }
}

// The object library's still test, added to projects installed before it existed too.
root = fs.readFileSync(rootPath, "utf8");
if (!root.includes("kit-objects") && root.includes("kit-demo")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-demo" [^\n]*\n)/, `$1$2<Composition id="kit-objects" component={ObjectsDemo} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/(import \{ KIT_DEMO_FRAMES, KitDemo \} from "\.\/kit\/KitDemo";)/, `$1\nimport { ObjectsDemo } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects") && root.includes("ObjectsDemo }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects (the drawing library) in Root.tsx"); }
  else say(`Register the drawing library by hand: <Composition id="kit-objects" component={ObjectsDemo} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 2 of the library (E02, Nov 2026: blood-film cells, slide, fundus, IV bag, monitor, Go board, blackboard).
root = fs.readFileSync(rootPath, "utf8");
if (root.includes("kit-objects") && !root.includes("kit-objects-2")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects" [^\n]*\n)/, `$1$2<Composition id="kit-objects-2" component={ObjectsDemo2} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/import \{ ObjectsDemo \} from "\.\/kit\/ObjectsDemo";/, `import { ObjectsDemo, ObjectsDemo2 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-2") && root.includes("ObjectsDemo2 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-2 (drawing library, page 2) in Root.tsx"); }
  else say(`Register page 2 by hand: <Composition id="kit-objects-2" component={ObjectsDemo2} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 3 (E03, Nov 2026: spreadsheet, database, plantar foot with ulcer, monofilament, phone, clock, blood tube, head MRI).
root = fs.readFileSync(rootPath, "utf8");
if (root.includes("kit-objects-2") && !root.includes("kit-objects-3")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-2" [^\n]*\n)/, `$1$2<Composition id="kit-objects-3" component={ObjectsDemo3} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/import \{ ObjectsDemo, ObjectsDemo2 \} from "\.\/kit\/ObjectsDemo";/, `import { ObjectsDemo, ObjectsDemo2, ObjectsDemo3 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-3") && root.includes("ObjectsDemo3 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-3 (drawing library, page 3) in Root.tsx"); }
  else say(`Register page 3 by hand: <Composition id="kit-objects-3" component={ObjectsDemo3} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 4 (E04, Nov 2026: skin lesion with ruler and marker ring, ruler, skin marker, question paper, padlock, dial).
root = fs.readFileSync(rootPath, "utf8");
if (root.includes("kit-objects-3") && !root.includes("kit-objects-4")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-3" [^\n]*\n)/, `$1$2<Composition id="kit-objects-4" component={ObjectsDemo4} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/import \{ ObjectsDemo, ObjectsDemo2, ObjectsDemo3 \} from "\.\/kit\/ObjectsDemo";/, `import { ObjectsDemo, ObjectsDemo2, ObjectsDemo3, ObjectsDemo4 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-4") && root.includes("ObjectsDemo4 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-4 (drawing library, page 4) in Root.tsx"); }
  else say(`Register page 4 by hand: <Composition id="kit-objects-4" component={ObjectsDemo4} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 5 (E05, Nov 2026: ward bed, broad-leaved tree for a forest, blister strip of tablets).
root = fs.readFileSync(rootPath, "utf8");
if (root.includes("kit-objects-4") && !root.includes("kit-objects-5")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-4" [^\n]*\n)/, `$1$2<Composition id="kit-objects-5" component={ObjectsDemo5} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/import \{ ObjectsDemo, ObjectsDemo2, ObjectsDemo3, ObjectsDemo4 \} from "\.\/kit\/ObjectsDemo";/, `import { ObjectsDemo, ObjectsDemo2, ObjectsDemo3, ObjectsDemo4, ObjectsDemo5 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-5") && root.includes("ObjectsDemo5 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-5 (drawing library, page 5) in Root.tsx"); }
  else say(`Register page 5 by hand: <Composition id="kit-objects-5" component={ObjectsDemo5} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 6 (E06, Nov 2026: neuron, H&E colon tile normal/tumour, network, error landscape, kidney, dog, car, apple).
root = fs.readFileSync(rootPath, "utf8");
if (root.includes("kit-objects-5") && !root.includes("kit-objects-6")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-5" [^\n]*\n)/, `$1$2<Composition id="kit-objects-6" component={ObjectsDemo6} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/import \{ ObjectsDemo, ObjectsDemo2, ObjectsDemo3, ObjectsDemo4, ObjectsDemo5 \} from "\.\/kit\/ObjectsDemo";/, `import { ObjectsDemo, ObjectsDemo2, ObjectsDemo3, ObjectsDemo4, ObjectsDemo5, ObjectsDemo6 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-6") && root.includes("ObjectsDemo6 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-6 (drawing library, page 6) in Root.tsx"); }
  else say(`Register page 6 by hand: <Composition id="kit-objects-6" component={ObjectsDemo6} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 7 (E07, Nov 2026: diagnostic 2×2 table, vial, rupee coin, alarm bell, and metrics.tsx's frame-driven table, slider, PPV bar).
root = fs.readFileSync(rootPath, "utf8");
if (root.includes("kit-objects-6") && !root.includes("kit-objects-7")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-6" [^\n]*\n)/, `$1$2<Composition id="kit-objects-7" component={ObjectsDemo7} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/import \{ ObjectsDemo, ObjectsDemo2, ObjectsDemo3, ObjectsDemo4, ObjectsDemo5, ObjectsDemo6 \} from "\.\/kit\/ObjectsDemo";/, `import { ObjectsDemo, ObjectsDemo2, ObjectsDemo3, ObjectsDemo4, ObjectsDemo5, ObjectsDemo6, ObjectsDemo7 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-7") && root.includes("ObjectsDemo7 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-7 (drawing library, page 7) in Root.tsx"); }
  else say(`Register page 7 by hand: <Composition id="kit-objects-7" component={ObjectsDemo7} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 8 (E08, Nov 2026: CT scanner with gantry ring and patient table, desktop EHR screen, cloud, microchip, Wi-Fi, kidney ultrasound fan).
root = fs.readFileSync(rootPath, "utf8");
if (root.includes("kit-objects-7") && !root.includes("kit-objects-8")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-7" [^\n]*\n)/, `$1$2<Composition id="kit-objects-8" component={ObjectsDemo8} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/import \{ ObjectsDemo, ObjectsDemo2, ObjectsDemo3, ObjectsDemo4, ObjectsDemo5, ObjectsDemo6, ObjectsDemo7 \} from "\.\/kit\/ObjectsDemo";/, `import { ObjectsDemo, ObjectsDemo2, ObjectsDemo3, ObjectsDemo4, ObjectsDemo5, ObjectsDemo6, ObjectsDemo7, ObjectsDemo8 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-8") && root.includes("ObjectsDemo8 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-8 (drawing library, page 8) in Root.tsx"); }
  else say(`Register page 8 by hand: <Composition id="kit-objects-8" component={ObjectsDemo8} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 9 (E09, Nov 2026: hospital report sheet with a real report layout, cloth bag, magnifier, book pile, transformer layer stack, attention arcs).
root = fs.readFileSync(rootPath, "utf8");
if (root.includes("kit-objects-8") && !root.includes("kit-objects-9")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-8" [^\n]*\n)/, `$1$2<Composition id="kit-objects-9" component={ObjectsDemo9} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/ObjectsDemo7, ObjectsDemo8 \} from "\.\/kit\/ObjectsDemo";/, `ObjectsDemo7, ObjectsDemo8, ObjectsDemo9 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-9") && root.includes("ObjectsDemo9 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-9 (drawing library, page 9) in Root.tsx"); }
  else say(`Register page 9 by hand: <Composition id="kit-objects-9" component={ObjectsDemo9} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 10 (E10, Nov 2026: open laptop with a perspective keyboard deck, server rack with drive bays and status lights).
if (root.includes("kit-objects-9") && !root.includes("kit-objects-10")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-9" [^\n]*\n)/, `$1$2<Composition id="kit-objects-10" component={ObjectsDemo10} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/ObjectsDemo8, ObjectsDemo9 \} from "\.\/kit\/ObjectsDemo";/, `ObjectsDemo8, ObjectsDemo9, ObjectsDemo10 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-10") && root.includes("ObjectsDemo10 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-10 (drawing library, page 10) in Root.tsx"); }
  else say(`Register page 10 by hand: <Composition id="kit-objects-10" component={ObjectsDemo10} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 11 (E11, Nov 2026: exam-hall desk with a book rack, closed textbook, open textbook, journal reference list).
if (root.includes("kit-objects-10") && !root.includes("kit-objects-11")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-10" [^\n]*\n)/, `$1$2<Composition id="kit-objects-11" component={ObjectsDemo11} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/ObjectsDemo9, ObjectsDemo10 \} from "\.\/kit\/ObjectsDemo";/, `ObjectsDemo9, ObjectsDemo10, ObjectsDemo11 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-11") && root.includes("ObjectsDemo11 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-11 (drawing library, page 11) in Root.tsx"); }
  else say(`Register page 11 by hand: <Composition id="kit-objects-11" component={ObjectsDemo11} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}
if (root.includes("kit-objects-11") && !root.includes("kit-objects-12")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-11" [^\n]*\n)/, `$1$2<Composition id="kit-objects-12" component={ObjectsDemo12} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/ObjectsDemo10, ObjectsDemo11 \} from "\.\/kit\/ObjectsDemo";/, `ObjectsDemo10, ObjectsDemo11, ObjectsDemo12 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-12") && root.includes("ObjectsDemo12 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-12 (drawing library, page 12) in Root.tsx"); }
  else say(`Register page 12 by hand: <Composition id="kit-objects-12" component={ObjectsDemo12} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}
// Page 13 (E13, Nov 2026: OPD desk with a recording phone, seated patient, EHR clinic note with Sign, tumour board, USB-C plug).
if (root.includes("kit-objects-12") && !root.includes("kit-objects-13")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-12" [^\n]*\n)/, `$1$2<Composition id="kit-objects-13" component={ObjectsDemo13} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/ObjectsDemo11, ObjectsDemo12 \} from "\.\/kit\/ObjectsDemo";/, `ObjectsDemo11, ObjectsDemo12, ObjectsDemo13 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-13") && root.includes("ObjectsDemo13 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-13 (drawing library, page 13) in Root.tsx"); }
  else say(`Register page 13 by hand: <Composition id="kit-objects-13" component={ObjectsDemo13} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}
// Page 14 (E14, Nov 2026: microscope, H&E slide, the GAN forger at an easel and the detective with a magnifier, DR fundus lesions, squamous and thyroid H&E tiles).
if (root.includes("kit-objects-13") && !root.includes("kit-objects-14")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-13" [^\n]*\n)/, `$1$2<Composition id="kit-objects-14" component={ObjectsDemo14} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/ObjectsDemo12, ObjectsDemo13 \} from "\.\/kit\/ObjectsDemo";/, `ObjectsDemo12, ObjectsDemo13, ObjectsDemo14 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-14") && root.includes("ObjectsDemo14 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-14 (drawing library, page 14) in Root.tsx"); }
  else say(`Register page 14 by hand: <Composition id="kit-objects-14" component={ObjectsDemo14} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}
if (root.includes("kit-objects-14") && !root.includes("kit-objects-15")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-14" [^\n]*\n)/, `$1$2<Composition id="kit-objects-15" component={ObjectsDemo15} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/ObjectsDemo13, ObjectsDemo14 \} from "\.\/kit\/ObjectsDemo";/, `ObjectsDemo13, ObjectsDemo14, ObjectsDemo15 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-15") && root.includes("ObjectsDemo15 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-15 (drawing library, page 15) in Root.tsx"); }
  else say(`Register page 15 by hand: <Composition id="kit-objects-15" component={ObjectsDemo15} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 16 (E15, Nov 2026: the bias zoo map from above, the zoo gate, a fenced enclosure with a name plaque, the Fitzpatrick tone scale, a paw print).
if (root.includes("kit-objects-15") && !root.includes("kit-objects-16")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-15" [^\n]*\n)/, `$1$2<Composition id="kit-objects-16" component={ObjectsDemo16} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/ObjectsDemo14, ObjectsDemo15 \} from "\.\/kit\/ObjectsDemo";/, `ObjectsDemo14, ObjectsDemo15, ObjectsDemo16 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-16") && root.includes("ObjectsDemo16 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-16 (drawing library, page 16) in Root.tsx"); }
  else say(`Register page 16 by hand: <Composition id="kit-objects-16" component={ObjectsDemo16} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 17 (E16, Nov 2026: a see-saw that tilts by angle, a CC mammogram with a spiculated mass, a colonoscopy view with the AI's detection box).
if (root.includes("kit-objects-16") && !root.includes("kit-objects-17")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-16" [^\n]*\n)/, `$1$2<Composition id="kit-objects-17" component={ObjectsDemo17} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/ObjectsDemo15, ObjectsDemo16 \} from "\.\/kit\/ObjectsDemo";/, `ObjectsDemo15, ObjectsDemo16, ObjectsDemo17 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-17") && root.includes("ObjectsDemo17 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-17 (drawing library, page 17) in Root.tsx"); }
  else say(`Register page 17 by hand: <Composition id="kit-objects-17" component={ObjectsDemo17} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 18 (E17, Nov 2026: a breast core-biopsy slide with label and barcode, H&E breast tiles (IDC, normal lobule), a Grad-CAM heat spot, a SHAP waterfall, LIME superpixels, an X-ray lead marker, a model card, a snow bank).
if (root.includes("kit-objects-17") && !root.includes("kit-objects-18")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-17" [^\n]*\n)/, `$1$2<Composition id="kit-objects-18" component={ObjectsDemo18} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/ObjectsDemo16, ObjectsDemo17 \} from "\.\/kit\/ObjectsDemo";/, `ObjectsDemo16, ObjectsDemo17, ObjectsDemo18 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-18") && root.includes("ObjectsDemo18 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-18 (drawing library, page 18) in Root.tsx"); }
  else say(`Register page 18 by hand: <Composition id="kit-objects-18" component={ObjectsDemo18} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

// Page 19 (E19, Nov 2026: a world map with regulator pins (USA, EU, India), a Pap smear field with HSIL-like cells, scales of justice, a passport).
if (root.includes("kit-objects-18") && !root.includes("kit-objects-19")) {
  root = root.replace(/(\n(\s*)<Composition id="kit-objects-18" [^\n]*\n)/, `$1$2<Composition id="kit-objects-19" component={ObjectsDemo19} durationInFrames={60} fps={30} width={1920} height={1080} />\n`);
  root = root.replace(/ObjectsDemo17, ObjectsDemo18 \} from "\.\/kit\/ObjectsDemo";/, `ObjectsDemo17, ObjectsDemo18, ObjectsDemo19 } from "./kit/ObjectsDemo";`);
  if (root.includes("kit-objects-19") && root.includes("ObjectsDemo19 }")) { fs.writeFileSync(rootPath, root); say("Registered kit-objects-19 (drawing library, page 19) in Root.tsx"); }
  else say(`Register page 19 by hand: <Composition id="kit-objects-19" component={ObjectsDemo19} durationInFrames={60} fps={30} width={1920} height={1080} />`);
}

say("\nDone. Check the install:");
say(`  cd ${path.relative(process.cwd(), project) || "."}`);
say("  npx tsc --noEmit && node tools/qa.mjs kit-demo && node tools/qa.mjs kit-demo-vertical");
say("  npx remotion still kit-objects out/objects.png --frame=59   # does every object look like the real thing?");
say("  npx remotion still kit-objects-2 out/objects-2.png --frame=59");
say("  npx remotion still kit-objects-3 out/objects-3.png --frame=59");
say("  npx remotion still kit-objects-4 out/objects-4.png --frame=59");
say("  npx remotion still kit-objects-5 out/objects-5.png --frame=59");
say("  npx remotion still kit-objects-6 out/objects-6.png --frame=59");
say("  npx remotion still kit-objects-7 out/objects-7.png --frame=59");
