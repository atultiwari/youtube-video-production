#!/usr/bin/env node
/**
 * Visual QA: render a frame every N seconds with `qa: true`, collect what QAProbe logs.
 *
 *   node tools/qa.mjs <composition> [--every 1] [--json out.json]
 *
 * Exit status 1 if any frame has an issue, so it can gate a render.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith("--") && !/^[0-9.]+$/.test(a) && !a.endsWith(".json"));
const every = Number(args[args.indexOf("--every") + 1]) || 1;
const jsonOut = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;
if (!id) {
  console.error("usage: node tools/qa.mjs <composition> [--every 1] [--json out.json]");
  process.exit(2);
}

const inputProps = { qa: true, measure: true };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id, inputProps });
const step = Math.round(every * composition.fps);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "qa-"));
const results = [];
const only = args.includes("--frame") ? [Number(args[args.indexOf("--frame") + 1])] : null;
const frames = only ?? Array.from({ length: Math.ceil(composition.durationInFrames / step) }, (_, i) => i * step);
for (const frame of frames) {
  let report = null;
  await renderStill({
    composition, serveUrl, frame, inputProps, output: path.join(scratch, "f.png"), logLevel: "error",
    onBrowserLog: (log) => {
      const text = log.text ?? "";
      if (text.startsWith("QA ")) report = JSON.parse(text.slice(3));
    },
  });
  if (!report) throw new Error(`frame ${frame}: QAProbe did not report (is it mounted?)`);
  results.push(report);
  for (const issue of report.issues) console.log(`${(frame / composition.fps).toFixed(0).padStart(4)}s  ${issue}`);
}
fs.rmSync(scratch, { recursive: true, force: true });
const bad = results.filter((r) => r.issues.length > 0);
console.log(`\n${results.length} frames checked, ${bad.length} with issues, ${results.reduce((n, r) => n + r.issues.length, 0)} issues`);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(results, null, 1));
process.exit(bad.length > 0 ? 1 : 0);
