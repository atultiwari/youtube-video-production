#!/usr/bin/env python3
"""YouTube chapter timestamps for the description, from the generated grid.

    ./chapters.py public/A/grid/beats.json docs/A/script.md [--group 01,03,05]

One chapter per beat, titled from the script's `## NN · Title` headings, timed from beats.json,
so the timestamps can never drift from the video. `--group` lists the beats that start a
chapter, for a long video whose beats are finer than its chapters.

YouTube shows chapters only when the list starts at 0:00, has at least three entries, and
every chapter is at least 10 seconds long; this exits 1 (and says which) when any rule fails.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


def stamp(seconds: float) -> str:
    s = int(seconds)
    h, m, sec = s // 3600, (s % 3600) // 60, s % 60
    return f"{h}:{m:02d}:{sec:02d}" if h else f"{m}:{sec:02d}"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("grid", type=Path)
    ap.add_argument("script", type=Path)
    ap.add_argument("--group", help="comma-separated beat ids that start a chapter")
    args = ap.parse_args()
    grid = json.loads(args.grid.read_text())
    titles = dict(re.findall(r"^##\s+(\d+)\s*·\s*(.+)$", args.script.read_text(), re.M))
    fps, total = grid["fps"], grid["totalFrames"] / grid["fps"]
    starts = {b["beat"]: b["startFrame"] / fps for b in grid["beats"]}
    ids = args.group.split(",") if args.group else [b["beat"] for b in grid["beats"]]
    missing = [i for i in ids if i not in starts or i not in titles]
    if missing:
        print(f"no beat or title for: {', '.join(missing)}", file=sys.stderr)
        return 1
    chapters = [(starts[i], titles[i].strip()) for i in ids]
    problems = []
    if chapters[0][0] != 0:
        problems.append("the first chapter must start at 0:00")
    if len(chapters) < 3:
        problems.append(f"YouTube needs at least 3 chapters; got {len(chapters)}")
    for (t, title), nxt in zip(chapters, [c[0] for c in chapters[1:]] + [total]):
        if nxt - t < 10:
            problems.append(f'"{title}" is {nxt - t:.1f} s, under 10 s: YouTube will not show the chapters')
    for t, title in chapters:
        print(f"{stamp(t)} {title}")
    if problems:
        print("\n".join(problems), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
