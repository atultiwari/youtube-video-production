#!/usr/bin/env python3
"""One focus at a time: how often is more than one place on screen being drawn or written?

    ./focus-check.py <measure.mp4> [--grid beats.json --lines lines.json] [--rate 10]

Render with decorative motion held still first (`--props='{"measure":true}'`), so line boil
and push-ins do not count. Frames 1/rate s apart are compared; the changed pixels are pooled
into cells of 1/48 of the frame width, cells are joined to their neighbours (a gap of one cell
is still one place), and each connected group of at least 3 cells is one *active region*.

A change over more than a quarter of the frame is a transition (a cut or a dissolve between
beats), not a split: it is counted as one region.

A frame with two or more active regions is a **split-focus frame**: the pen draws in one place
while text types in another, or two washes arrive at once. A viewer cannot follow both, and
without narration nothing tells them which to follow (owner, 2026-10-09).

Reports the share of the runtime in split focus, and the share in *sustained* split focus: runs
of 0.3 s or more. Shorter runs are handoffs, one step's last frames meeting the next step's
first, and the eye follows those. Target: sustained split under 5% of the runtime, and no run
longer than 0.5 s. With --grid/--lines it says where the worst runs are.
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import numpy as np

W, H = 480, 270
CELL = 10  # px at 480 wide: 48 x 27 cells
PIXEL = 24
MIN_CELLS = 3
TRANSITION = 0.25  # share of the frame changing at once: a cut or a dissolve


def frames(video: Path, rate: int):
    size = W * H
    proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(video), "-vf", f"fps={rate},scale={W}:{H}",
                             "-f", "rawvideo", "-pix_fmt", "gray", "-"], stdout=subprocess.PIPE)
    assert proc.stdout is not None
    while True:
        chunk = proc.stdout.read(size)
        if len(chunk) < size:
            break
        yield np.frombuffer(chunk, np.uint8).reshape(H, W).astype(np.int16)
    if proc.wait() != 0:
        raise SystemExit(f"ffmpeg could not read {video}")


def regions(changed: np.ndarray) -> int:
    """Connected groups of active cells (8-neighbour, after a one-cell dilation)."""
    gh, gw = H // CELL, W // CELL
    cells = changed[: gh * CELL, : gw * CELL].reshape(gh, CELL, gw, CELL).any(axis=(1, 3))
    grown = cells.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            grown |= np.roll(np.roll(cells, dy, axis=0), dx, axis=1)
    seen = np.zeros_like(grown)
    count = 0
    for y in range(gh):
        for x in range(gw):
            if not grown[y, x] or seen[y, x]:
                continue
            stack, size = [(y, x)], 0
            seen[y, x] = True
            while stack:
                cy, cx = stack.pop()
                size += int(cells[cy, cx])
                for ny in (cy - 1, cy, cy + 1):
                    for nx in (cx - 1, cx, cx + 1):
                        if 0 <= ny < gh and 0 <= nx < gw and grown[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True
                            stack.append((ny, nx))
            if size >= MIN_CELLS:
                count += 1
    return count


def locate(t: float, grid: dict | None, lines: dict | None) -> str:
    if not grid or not lines:
        return ""
    for b in grid["beats"]:
        b0 = b["startFrame"] / grid["fps"]
        if b0 <= t < b0 + b["durationFrames"] / grid["fps"]:
            local = t - b0
            ls = lines.get(b["beat"], [])
            before = [i for i, l in enumerate(ls) if l["start"] <= local + 1e-6]
            return f"beat {b['beat']} line {before[-1]}" if before else f"beat {b['beat']}"
    return ""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path)
    ap.add_argument("--grid", type=Path)
    ap.add_argument("--lines", type=Path)
    ap.add_argument("--rate", type=int, default=10)
    ap.add_argument("--json", type=Path, help="write per-sample region counts here")
    args = ap.parse_args()
    grid = json.loads(args.grid.read_text()) if args.grid else None
    lines = {b["beat"]: b["lines"] for b in json.loads(args.lines.read_text())["beats"]} if args.lines else None
    counts, prev = [], None
    for cur in frames(args.video, args.rate):
        if prev is not None:
            changed = np.abs(cur - prev) > PIXEL
            counts.append(1 if changed.mean() > TRANSITION else regions(changed))
        prev = cur
    c = np.array(counts)
    split = c >= 2
    active = c >= 1
    dt = 1 / args.rate
    runs, start = [], None
    for i, s in enumerate(list(split) + [False]):
        if s and start is None:
            start = i
        elif not s and start is not None:
            runs.append((start * dt, (i - start) * dt))
            start = None
    runs.sort(key=lambda r: -r[1])
    for t, d in runs[:8]:
        print(f"{t:7.1f}s  {d:4.1f}s split  {locate(t, grid, lines)}")
    sustained = sum(d for _, d in runs if d >= 0.3 - 1e-9)
    share_all = split.mean() * 100 if len(c) else 0.0
    share_active = split.sum() / max(1, active.sum()) * 100
    longest = runs[0][1] if runs else 0.0
    total = len(c) * dt
    print(f"\nsustained split focus {sustained / max(total, 1e-9) * 100:.1f}% of the runtime (runs >= 0.3 s); "
          f"all split {share_all:.0f}% ({share_active:.0f}% of the time anything moves); "
          f"longest {longest:.1f} s; max regions at once {c.max() if len(c) else 0}")
    if args.json:
        args.json.write_text(json.dumps({"rate": args.rate, "regions": c.tolist()}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
