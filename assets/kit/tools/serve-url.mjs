/**
 * One small Remotion bundle per build, reused by every render and still.
 *
 * Why: bundle() copies the whole public/ folder into a new temp folder on every call and never
 * deletes it. With every episode's audio in public/ (3.8 GB by E22) each call left ~4 GB, and one
 * episode build makes 6+ calls (E22 left 48 GB). Here the bundle gets a slim public folder (shared
 * fonts/paper/whiteboard + this video's own folder, APFS clones, so ~0 extra space) and is made once.
 *
 *   node tools/serve-url.mjs <key> <outDir>   -> bundles to <outDir>, prints its path
 *   import { serveUrlFor } from "./serve-url.mjs"
 *     -> $REMOTION_SERVE_URL if set (build-all.sh sets it), else a slim bundle for <key> that is
 *        deleted when the process exits.
 */
import { bundle } from "@remotion/bundler";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SHARED = ["fonts", "paper", "whiteboard"];

/** Slim copy of public/: shared assets + public/<key> (the video's narration, grid, lines). */
export function slimPublic(key, dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const src = path.resolve("public");
  const wanted = [...SHARED, key].filter((d) => fs.existsSync(path.join(src, d)));
  if (!fs.existsSync(path.join(src, key))) {
    // No folder for this key: fall back to everything rather than render with missing files.
    return src;
  }
  for (const d of wanted) execFileSync("cp", ["-c", "-R", path.join(src, d), path.join(dir, d)]);
  return dir;
}

export async function makeBundle(key, outDir) {
  const publicDir = slimPublic(key, `${outDir}-public`);
  const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir, outDir });
  if (publicDir !== path.resolve("public")) fs.rmSync(publicDir, { recursive: true, force: true });
  return serveUrl;
}

export async function serveUrlFor(key) {
  if (process.env.REMOTION_SERVE_URL) return process.env.REMOTION_SERVE_URL;
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), `yvp-bundle-${key}-`));
  const cleanup = () => fs.rmSync(outDir, { recursive: true, force: true });
  process.on("exit", cleanup);
  for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { cleanup(); process.exit(130); });
  return makeBundle(key, outDir);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [key, outDir] = process.argv.slice(2);
  if (!key || !outDir) { console.error("usage: node tools/serve-url.mjs <key> <outDir>"); process.exit(2); }
  console.log(await makeBundle(key, path.resolve(outDir)));
}
