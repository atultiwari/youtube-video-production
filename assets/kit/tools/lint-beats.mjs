#!/usr/bin/env node
// Static check before QA (build-all.sh step 0), over the given source files.
//
// 1. Within each makeBeat({...}) block, a literal step id (`id: "x", at:`) may appear only once.
//    Template ids (`al${i}`) are not checked here; makeBeat throws on those at render. Added after
//    E06, where a duplicate id failed the render only after the 10-minute QA pass. Fails the run.
// 2. With --lines <lines.json>: a cue `b.word("x", i)` whose word occurs more than once in line i
//    is reported with the occurrence b.word picks (the first exact match, else the first prefix
//    match), so a drawing does not land early on an unintended earlier word (E07: "recall" hit
//    "precision recall curve" before the "recall" that was meant). Warns only.
//    The beat id comes from the block's name: `export const B07 = makeBeat` → "07", `B1` → "01".
//
//   node tools/lint-beats.mjs src/e07/*.tsx --lines public/E07/lines.json
import fs from "node:fs";

const args = process.argv.slice(2);
const li = args.indexOf("--lines");
const linesPath = li >= 0 ? args[li + 1] : null;
const files = args.filter((_, i) => li < 0 || (i !== li && i !== li + 1));
const lines = linesPath && fs.existsSync(linesPath) ? JSON.parse(fs.readFileSync(linesPath, "utf8")) : null;
const wordsOf = (text) => (text.replace(/[‘’]/g, "'").match(/[A-Za-z0-9']+/g) ?? []);

let bad = 0, warned = 0;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const parts = text.split(/makeBeat\(\{/);
  parts.slice(1).forEach((blk, i) => {
    const ids = [...blk.matchAll(/\{\s*id:\s*"([^"]+)",\s*at:/g)].map((m) => m[1]);
    const dup = [...new Set(ids.filter((id, k) => ids.indexOf(id) !== k))];
    if (dup.length) { bad += 1; console.error(`${file}: beat block ${i + 1}: step id used twice: ${dup.join(", ")}`); }
    if (!lines) return;
    const name = parts[i].match(/const\s+[A-Za-z_]*?(\d+)\s*=\s*$/);
    if (!name) return;
    const beat = lines.beats.find((b) => b.beat === name[1].padStart(2, "0"));
    if (!beat) return;
    const seen = new Set();
    for (const m of blk.matchAll(/b\.word\(\s*"([^"]+)"\s*,\s*(\d+)\s*\)/g)) {
      const [, cue, n] = m;
      const key = `${cue}|${n}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const line = beat.lines[Number(n)];
      if (!line) continue;
      const words = wordsOf(line.text).map((w) => w.toLowerCase());
      const c = cue.replace(/[‘’]/g, "'").toLowerCase();
      let hits = words.map((w, k) => (w === c ? k : -1)).filter((k) => k >= 0);
      const kind = hits.length ? "exact" : "prefix";
      if (!hits.length) hits = words.map((w, k) => (w.startsWith(c) ? k : -1)).filter((k) => k >= 0);
      if (hits.length < 2) continue;
      warned += 1;
      const ctx = (k) => `"…${words.slice(Math.max(0, k - 3), k + 2).join(" ")}…"`;
      console.warn(`${file}: beat ${beat.beat} line ${n}: cue "${cue}" occurs ${hits.length}× (${kind}); b.word picks word ${hits[0] + 1}, ${ctx(hits[0])}; later: ${hits.slice(1).map(ctx).join(", ")}. Cue a word unique to the part you mean, or pass the occurrence (b.word("w", line, n), n from 0), if that is not the first.`);
    }
  });
}
if (bad) process.exit(1);
console.log(`lint-beats: no duplicate step ids${lines ? `; ${warned} repeated cue word(s) reported` : ""}`);
