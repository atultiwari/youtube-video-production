#!/usr/bin/env node
// Static check before QA (build-all.sh step 0): within each makeBeat({...}) block of the given
// source files, a literal step id (`id: "x", at:`) may appear only once. Template ids (`al${i}`)
// are not checked here; makeBeat throws on those at render. Added after E06, where a duplicate
// id failed the render only after the 10-minute QA pass.
//   node tools/lint-beats.mjs src/e06/*.tsx src/shorts/E06S*.tsx
import fs from "node:fs";
let bad = 0;
for (const file of process.argv.slice(2)) {
  const text = fs.readFileSync(file, "utf8");
  const blocks = text.split(/makeBeat\(\{/).slice(1);
  blocks.forEach((blk, i) => {
    const ids = [...blk.matchAll(/\{\s*id:\s*"([^"]+)",\s*at:/g)].map((m) => m[1]);
    const dup = [...new Set(ids.filter((id, k) => ids.indexOf(id) !== k))];
    if (dup.length) { bad += 1; console.error(`${file}: beat block ${i + 1}: step id used twice: ${dup.join(", ")}`); }
  });
}
if (bad) process.exit(1);
console.log("lint-beats: no duplicate step ids");
