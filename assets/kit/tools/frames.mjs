#!/usr/bin/env node
/**
 * Render chosen frames with one bundle.
 *
 *   node tools/frames.mjs <composition> <outDir> <frame...> [--props='{"measure":true}']
 */
import fs from "node:fs";
import path from "node:path";
import { serveUrlFor } from "./serve-url.mjs";
import { renderStill, selectComposition } from "@remotion/renderer";

const args = process.argv.slice(2);
const propsArg = args.find((a) => a.startsWith("--props="));
const inputProps = propsArg ? JSON.parse(propsArg.slice("--props=".length)) : {};
const [id, outDir, ...frames] = args.filter((a) => !a.startsWith("--"));
if (!id || !outDir || frames.length === 0) {
  console.error("usage: node tools/frames.mjs <composition> <outDir> <frame...>");
  process.exit(1);
}

const serveUrl = await serveUrlFor(id);
const composition = await selectComposition({ serveUrl, id, inputProps });
fs.mkdirSync(outDir, { recursive: true });
for (const frame of frames.map(Number)) {
  const output = path.join(outDir, `f-${String(frame).padStart(5, "0")}.png`);
  await renderStill({ composition, serveUrl, frame, inputProps, output });
}
console.log(`${frames.length} stills → ${outDir}`);
