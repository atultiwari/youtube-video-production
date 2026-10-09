#!/usr/bin/env python3
"""How much of each frame is used: rubric criterion 2.

    python3 -I tools/frame-fill.py <dir-of-stills> [--json]

Ground-agnostic: the ground is each frame's median colour, so dark boards and tinted paper are
measured the same way. A pixel is content when it differs from the ground by more than 30 (max
channel) after a light blur; specks of paper grain are removed with a 5x5 opening. The top
110 px, the bottom 70 px and the left 8% are excluded: corner tags and margin chrome (a progress
spine) live there, and a thin strip of chrome must not fake a full frame.

Reports the median content bounding box (share of the frame), the share of frames under 25%,
and empty frames.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

TOP, BOTTOM, LEFT, THRESHOLD = 110, 70, 0.08, 30


def fill(path: Path) -> float:
    im = Image.open(path).convert("RGB").filter(ImageFilter.GaussianBlur(1.2))
    a = np.asarray(im).astype(int)
    h = a.shape[0]
    # Margins are in 1080p units of the frame's short side, so a 1080 x 1920 Short is measured
    # with the same 110 / 70 px as a 1920 x 1080 frame.
    scale = min(a.shape[0], a.shape[1]) / 1080
    a = a[int(TOP * scale): h - int(BOTTOM * scale), int(a.shape[1] * LEFT):]
    ground = np.median(a.reshape(-1, 3), axis=0)
    mask = (np.abs(a - ground).max(axis=2) > THRESHOLD).astype(np.uint8) * 255
    opened = Image.fromarray(mask).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    m = np.asarray(opened) > 0
    ys, xs = np.nonzero(m)
    if len(xs) == 0:
        return 0.0
    return float((xs.max() - xs.min()) * (ys.max() - ys.min()) / (a.shape[0] * a.shape[1]))


def main() -> int:
    if "-h" in sys.argv or "--help" in sys.argv:
        print(__doc__)
        return 0
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    frames = sorted(Path(sys.argv[1]).glob("*.png"))
    if not frames:
        raise SystemExit(f"no stills in {sys.argv[1]}")
    values = np.array([fill(p) for p in frames])
    result = {
        "frames": len(values),
        "median_bbox": round(float(np.median(values)), 3),
        "under_25": round(float(np.mean(values < 0.25)), 3),
        "empty": int(np.sum(values < 0.01)),
    }
    if "--json" in sys.argv:
        print(json.dumps(result))
    else:
        print(f"{result['frames']} frames | median content bbox {result['median_bbox'] * 100:.0f}% | "
              f"under 25%: {result['under_25'] * 100:.0f}% of frames | empty: {result['empty']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
