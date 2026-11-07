#!/usr/bin/env python3
"""Captions (.srt) for upload, from the grid and the word timings: the script's own spelling,
timed to the spoken word.

    python3 -I captions-srt.py public/A/grid/beats.json public/A/lines.json --out out/A/A.srt

Cues break at a sentence end, after a comma once the cue is long enough, or at about 70
characters, and never run past 7 s; each cue is wrapped to two balanced lines of about 42
characters. Run it after word-timestamps.py (lines.json must have word times) and on the final
grid. YouTube takes the file as is (youtube-uploader's `captions` field).
"""
from __future__ import annotations

import argparse
import json
import re


def ts(x: float) -> str:
    ms = int(round(x * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def wrap(t: str, width: int = 42) -> str:
    if len(t) <= width:
        return t
    w = t.split()
    best = min(range(1, len(w)), key=lambda j: abs(len(" ".join(w[:j])) - len(" ".join(w[j:]))))
    return " ".join(w[:best]) + "\n" + " ".join(w[best:])


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("beats")
    ap.add_argument("lines")
    ap.add_argument("--out", required=True)
    ap.add_argument("--max-chars", type=int, default=70)
    ap.add_argument("--max-seconds", type=float, default=7.0)
    a = ap.parse_args()
    grid = json.load(open(a.beats))
    lines = json.load(open(a.lines))
    fps = grid.get("fps", 30)
    start = {b["beat"]: b["startFrame"] / fps for b in grid["beats"]}
    cues: list[tuple[float, float, str]] = []
    for b in lines["beats"]:
        s0 = start[b["beat"]]
        for ln in b["lines"]:
            ws = ln.get("words") or []
            if not ws:
                raise SystemExit(f"beat {b['beat']}: no word times; run word-timestamps.py first")
            # Each whitespace token of the script line starts at its first spoken word.
            toks, idx = [], 0
            for t in ln["text"].split():
                k = len(re.findall(r"[A-Za-z0-9']+", t.replace("’", "'")))
                st = ws[min(idx, len(ws) - 1)]["start"] if k else (toks[-1][1] if toks else ln["start"])
                toks.append((t, st))
                idx += k
            end_line = ln["start"] + ln["duration"]
            cur: list[tuple[str, float]] = []
            for i, (t, st) in enumerate(toks):
                cur.append((t, st))
                text = " ".join(x for x, _ in cur)
                last = i == len(toks) - 1
                if last or (t[-1] in ".?!" and len(cur) >= 3) or len(text) >= a.max_chars or (t[-1] in ",;:" and len(text) >= 45):
                    nxt = toks[i + 1][1] if not last else end_line
                    cues.append((s0 + cur[0][1], s0 + min(nxt, cur[0][1] + a.max_seconds), text))
                    cur = []
    out = []
    for i, (s, e, t) in enumerate(cues, 1):
        out.append(f"{i}\n{ts(s)} --> {ts(max(e - 0.05, s + 0.8))}\n{wrap(t)}\n")
    with open(a.out, "w") as f:
        f.write("\n".join(out))
    print(f"{len(cues)} cues -> {a.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
