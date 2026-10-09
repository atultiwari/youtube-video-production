#!/usr/bin/env python3
"""Make the paper grain overlay the kit lays over each chapter's ground colour.

    ./make-paper.py <out.png> [--width 1920 --height 1080 --seed 7]

A transparent PNG: low-contrast fibre noise, sparse dark specks (as in the Millennium
reference) and a few soft blotches. Seeded, so every build gets the same paper.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def paper(width: int, height: int, seed: int) -> Image.Image:
    rng = np.random.default_rng(seed)
    grain = rng.normal(0, 1, (height, width))
    norm = Image.fromarray(((grain - grain.min()) / np.ptp(grain) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    g = np.asarray(norm).astype(float) / 255.0
    rgba = np.zeros((height, width, 4), np.uint8)
    rgba[..., 0:3] = np.where((g < 0.5)[..., None], 60, 255)
    rgba[..., 3] = (np.abs(g - 0.5) * 2 * 22).astype(np.uint8)
    for _ in range(int(900 * width * height / (1920 * 1080))):
        x, y = rng.integers(0, width), rng.integers(0, height)
        r = int(rng.choice([1, 1, 1, 2]))
        rgba[max(0, y - r + 1):y + r, max(0, x - r + 1):x + r, 0:3] = 50
        rgba[max(0, y - r + 1):y + r, max(0, x - r + 1):x + r, 3] = int(rng.uniform(60, 150))
    yy, xx = np.mgrid[0:height, 0:width]
    for _ in range(14):
        cx, cy, rad = rng.uniform(0, width), rng.uniform(0, height), rng.uniform(150, 450)
        blot = (np.clip(1 - np.hypot(xx - cx, yy - cy) / rad, 0, 1) ** 2 * rng.uniform(6, 12)).astype(np.uint8)
        mask = blot > rgba[..., 3]
        rgba[..., 0:3][mask] = (120, 95, 60)
        rgba[..., 3] = np.maximum(rgba[..., 3], blot)
    return Image.fromarray(rgba, "RGBA")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("out", type=Path)
    ap.add_argument("--width", type=int, default=1920)
    ap.add_argument("--height", type=int, default=1080)
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    paper(args.width, args.height, args.seed).save(args.out, optimize=True)
    print(args.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
