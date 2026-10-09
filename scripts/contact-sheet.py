#!/usr/bin/env python3
"""Tile stills into one labelled contact sheet, for the stills review (step 11).

    ./contact-sheet.py <dir-of-pngs> <out.png> [--tile 384] [--columns 8] [--phone]

Each tile is captioned with its file name (beat-NN, or t-FRAME). `--phone` instead makes the
phone test: every still downscaled to 360 px wide and shown at that size, which is how small
text looks in a feed.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


def sheet(paths: list[Path], tile: int, columns: int) -> Image.Image:
    first = Image.open(paths[0])
    th = round(tile * first.height / first.width)
    cap = 22
    rows = (len(paths) + columns - 1) // columns
    out = Image.new("RGB", (columns * (tile + 6) + 6, rows * (th + cap + 6) + 6), "white")
    draw = ImageDraw.Draw(out)
    for i, p in enumerate(paths):
        x = 6 + (i % columns) * (tile + 6)
        y = 6 + (i // columns) * (th + cap + 6)
        out.paste(Image.open(p).convert("RGB").resize((tile, th), Image.LANCZOS), (x, y))
        draw.text((x + 4, y + th + 4), p.stem, fill="black")
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("dir", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--tile", type=int, default=384)
    ap.add_argument("--columns", type=int, default=8)
    ap.add_argument("--phone", action="store_true", help="360 px wide tiles: the phone test")
    args = ap.parse_args()
    paths = sorted(args.dir.glob("*.png"))
    if not paths:
        raise SystemExit(f"no stills in {args.dir}")
    tile = 360 if args.phone else args.tile
    sheet(paths, tile, args.columns if not args.phone else 3).save(args.out)
    print(f"{len(paths)} stills -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
