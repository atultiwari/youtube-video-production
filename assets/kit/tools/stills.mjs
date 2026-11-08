#!/usr/bin/env node
/**
 * Render a list of stills with one bundle (v2 step 11: one frame per beat, before any render).
 *
 *   node tools/stills.mjs <composition> <beats.json> <outDir> midpoints|ends|every:<seconds>
 *
 * `ends` is half a second before each beat's cut: the picture fully built, which is what a
 * layout review needs (midpoints show it half drawn). `lines:<lines.json>` (E12) adds a still just
 * before every spoken line after the first in each beat, i.e. each picture fully built before an
 * `until` clears it, as `beat-NN-L<i>`, plus the beat end: the whole layout review in one pass.
 */
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const [id, gridPath, outDir, mode] = process.argv.slice(2);
if (!id || !gridPath || !outDir || !mode) {
  console.error("usage: node tools/stills.mjs <composition> <beats.json> <outDir> midpoints|ends|every:<seconds>");
  process.exit(1);
}

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id });
const grid = JSON.parse(fs.readFileSync(gridPath, "utf8"));

const frames =
  mode === "midpoints"
    ? grid.beats.map((b) => ({ name: `beat-${b.beat}`, frame: b.startFrame + Math.floor(b.durationFrames / 2) }))
    : mode.startsWith("lines:")
    ? (() => {
        const L = JSON.parse(fs.readFileSync(mode.slice(6), "utf8"));
        return grid.beats.flatMap((b) => {
          const ls = L.beats.find((x) => x.beat === b.beat)?.lines ?? [];
          return [
            ...ls.slice(1).map((l, i) => ({ name: `beat-${b.beat}-L${i}`, frame: b.startFrame + Math.round(l.start * grid.fps) - 4 })),
            { name: `beat-${b.beat}-end`, frame: b.startFrame + b.durationFrames - Math.round(composition.fps / 2) },
          ];
        });
      })()
    : mode === "ends"
    ? grid.beats.map((b) => ({ name: `beat-${b.beat}`, frame: b.startFrame + b.durationFrames - Math.round(composition.fps / 2) }))
    : (() => {
        const step = Math.round(Number(mode.split(":")[1]) * composition.fps);
        if (!mode.startsWith("every:") || !Number.isFinite(step) || step <= 0) {
          console.error(`bad mode "${mode}": use midpoints, ends or every:<seconds>`);
          process.exit(2);
        }
        return Array.from({ length: Math.ceil(composition.durationInFrames / step) }, (_, i) => ({
          name: `t-${String(i * step).padStart(5, "0")}`,
          frame: i * step,
        }));
      })();

fs.mkdirSync(outDir, { recursive: true });
for (const { name, frame } of frames) {
  await renderStill({ composition, serveUrl, frame, output: path.join(outDir, `${name}.png`) });
  process.stdout.write(`${name} (${frame})  `);
}
console.log(`\n${frames.length} stills → ${outDir}`);
