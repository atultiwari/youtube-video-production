#!/usr/bin/env python3
"""Static stretches (rubric criterion 5), located on the script.

    python3 -I tools/event-gaps.py <measure.mp4> <beats.json> <lines.json> [--min 4]

Render with decorative motion held still first (`--props='{"measure":true}'`: no push-in, no
line boil), so only real events count: strokes, arrivals, highlights, cuts.

How an event is detected. Frames 0.5 s apart are compared, and an event is any visible change
(a pixel moving by more than 24 levels in any channel) covering at least 0.25% of the frame,
about a 70 x 70 px patch at 1080p. A static stretch is a run of comparisons with no event.

Why not ffmpeg's freezedetect: it averages the difference over the whole frame and compares
consecutive frames, so a local arrival (a label, a highlight, a cell drifting to the wall) never
crosses its threshold, although a viewer plainly sees it. Measured on the pilot, it reported
stretches in which a still showed three neutrophils drifting to the wall.

Each stretch is reported with the beat and line it falls in, so a fix can be placed on a cue
word in that line.
"""
from __future__ import annotations

import json
import subprocess
import sys

import numpy as np

W, H, RATE = 480, 270, 2
PIXEL, AREA = 24, 0.0025


def samples(video: str) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps={RATE},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.int16)


def events(frames: np.ndarray) -> np.ndarray:
    """events[i] is True when sample i+1 differs visibly from sample i."""
    diff = np.abs(frames[1:] - frames[:-1]).max(axis=3) > PIXEL
    return diff.mean(axis=(1, 2)) >= AREA


def stretches(flags: np.ndarray, minimum: float) -> list[tuple[float, float]]:
    out, run_start = [], None
    for i, flag in enumerate(list(flags) + [True]):
        if not flag and run_start is None:
            run_start = i
        elif flag and run_start is not None:
            dur = (i - run_start + 1) / RATE  # comparisons span one extra interval
            if dur >= minimum:
                out.append((run_start / RATE, dur))
            run_start = None
    return out


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--") and not a.replace(".", "").isdigit()]
    if len(args) != 3:
        print(__doc__)
        return 2
    minimum = float(sys.argv[sys.argv.index("--min") + 1]) if "--min" in sys.argv else 4.0
    video, grid_path, lines_path = args
    grid = json.load(open(grid_path))
    lines = {b["beat"]: b["lines"] for b in json.load(open(lines_path))["beats"]}
    fps, total = grid["fps"], grid["totalFrames"] / grid["fps"]
    found = stretches(events(samples(video)), minimum)
    for start, dur in found:
        where = "?"
        for b in grid["beats"]:
            b0 = b["startFrame"] / fps
            if b0 <= start < b0 + b["durationFrames"] / fps:
                local = start - b0
                idx = max(i for i, l in enumerate(lines[b["beat"]]) if l["start"] <= local + 1e-6)
                where = f"beat {b['beat']} line {idx} (+{local - lines[b['beat']][idx]['start']:.1f}s)"
        print(f"{start:7.1f}s  {dur:4.1f}s  {where}")
    static = sum(d for _, d in found)
    print(f"\n{len(found)} static stretches >= {minimum}s, {static:.1f}s of {total:.1f}s ({static / total * 100:.0f}%)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
