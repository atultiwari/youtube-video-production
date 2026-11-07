#!/usr/bin/env python3
"""For every static stretch event-gaps.py found, the words spoken inside it.

    python3 -I gap-words.py out/A/event-gaps.txt public/A/grid/beats.json public/A/lines.json

An event placed on one of these words fills the gap (`useBeat().word("cue", line)`). Each word
is printed as word@line, the line index inside its beat, which is what `word()` takes. A gap
with a cue word already in it means that step's event is too small to register: give it a
highlight wash, not another label (09-motion.md, "What counts as an event").

Word times in lines.json are seconds from the beat's start (not the line's).
"""
from __future__ import annotations

import argparse
import json
import re


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("gaps")
    ap.add_argument("beats")
    ap.add_argument("lines")
    a = ap.parse_args()
    grid = json.load(open(a.beats))
    lines = json.load(open(a.lines))
    fps = grid.get("fps", 30)
    start = {b["beat"]: b["startFrame"] / fps for b in grid["beats"]}
    by_beat = {b["beat"]: b["lines"] for b in lines["beats"]}
    n = 0
    for row in open(a.gaps):
        m = re.match(r"\s*([\d.]+)s\s+([\d.]+)s\s+beat (\S+) line (\d+)", row)
        if not m:
            continue
        t, d, beat = float(m[1]), float(m[2]), m[3]
        loc = t - start[beat]
        words = [f"{w['word']}@{i}" for i, ln in enumerate(by_beat.get(beat, []))
                 for w in ln.get("words", []) if loc + 0.3 <= w["start"] <= loc + d - 0.3]
        print(f"  beat {beat} {loc:6.1f}s +{d:.1f}s: {' '.join(words) or '(no words: a pause; add an event or shorten the tail)'}")
        n += 1
    if not n:
        print("  no static stretches")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
