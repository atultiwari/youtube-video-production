#!/usr/bin/env python3
"""Join per-beat takes into one narration track per language, on one shared frame grid.

    ./build-audio-grid.py takes/ --out build/
    ./build-audio-grid.py takes/ --out build/ --reference en --max-tempo 1.12

Takes are named `<lang>-<beat>[part].wav` -- `en-01.wav`, `hi-02a.wav`, `hi-02b.wav`. Parts of
one beat are joined in filename order.

A dual-audio upload is one video with alternate audio tracks: the platform swaps the audio and
leaves the picture alone. So the tracks must agree on where every beat starts, to the frame --
not merely on total length.

Sizing each slot to the slowest language is the obvious approach and it is wrong: it put 35
seconds of silence into the primary track, audible as dead air. Instead every other language is
time-stretched to the reference language's beat with `atempo`, which changes rate without
touching pitch. The stretch is capped, because past about 1.12x delivery sounds hurried; beats
needing more keep a little padding, which is bounded and small rather than absent and unbounded.
A beat where the other language is already shorter is left alone -- padding it costs nothing,
slowing it sounds like a fault.

Rate changes land at beat boundaries, inside the pause between beats, never mid-sentence.

Writes `beats.json`: the single definition of timing for the whole build. Never hand-edit it --
every track is padded to this exact grid.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def run(args: list[str]) -> None:
    done = subprocess.run(args, capture_output=True, text=True)
    if done.returncode != 0:
        raise SystemExit(f"ffmpeg failed:\n  {' '.join(args)}\n{done.stderr.strip()}")


def parts_by_beat(takes: Path, lang: str) -> dict[str, list[Path]]:
    found: dict[str, list[Path]] = {}
    for path in sorted(takes.glob(f"{lang}-*.wav")):
        match = re.fullmatch(rf"{lang}-(\d+)([a-z]?)", path.stem)
        if not match:
            raise SystemExit(f"unexpected take name: {path.name}")
        found.setdefault(match.group(1), []).append(path)
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("takes", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--reference", default="en",
                        help="language every other is fitted to (default: en)")
    parser.add_argument("--max-tempo", type=float, default=1.12,
                        help="cap on speed-up; past ~1.12 delivery sounds hurried")
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--tail", type=float, default=0.45,
                        help="pad per beat so a cut never lands on the last syllable")
    parser.add_argument("--rate", type=int, default=48000)
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    langs = sorted({p.stem.split("-")[0] for p in args.takes.glob("*-*.wav")})
    if not langs:
        raise SystemExit(f"no <lang>-<beat>.wav takes in {args.takes}")
    if args.reference not in langs:
        raise SystemExit(f"reference language {args.reference!r} not among {langs}")

    grouped = {lang: parts_by_beat(args.takes, lang) for lang in langs}
    beats = sorted(grouped[args.reference])
    for lang in langs:
        if sorted(grouped[lang]) != beats:
            raise SystemExit(f"{lang} has beats {sorted(grouped[lang])}, expected {beats}")

    joined: dict[tuple[str, str], Path] = {}
    length: dict[tuple[str, str], float] = {}
    for beat in beats:
        for lang in langs:
            parts = grouped[lang][beat]
            dest = args.out / f"{lang}-{beat}-joined.wav"
            if len(parts) == 1:
                dest.write_bytes(parts[0].read_bytes())
            else:
                listing = args.out / f"{lang}-{beat}.txt"
                listing.write_text("".join(f"file '{p.resolve()}'\n" for p in parts))
                run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0",
                     "-i", str(listing), "-c", "copy", str(dest)])
                listing.unlink()
            joined[(lang, beat)] = dest
            length[(lang, beat)] = duration(dest)

    print(f"fitting to {args.reference}, cap {args.max_tempo}x\n")
    print(f"{'beat':<6}{'ref':>9}{'other':>9}{'tempo':>9}{'padding':>10}")
    print("-" * 43)
    slots: dict[str, int] = {}
    for beat in beats:
        ref = length[(args.reference, beat)]
        longest = ref
        for lang in langs:
            if lang == args.reference:
                continue
            raw = length[(lang, beat)]
            tempo = min(max(raw / ref, 1.0), args.max_tempo)
            if tempo > 1.001:
                fitted = args.out / f"{lang}-{beat}-fit.wav"
                run(["ffmpeg", "-v", "error", "-y", "-i", str(joined[(lang, beat)]),
                     "-filter:a", f"atempo={tempo:.5f}", "-ar", str(args.rate), "-ac", "1",
                     "-c:a", "pcm_s16le", str(fitted)])
                joined[(lang, beat)] = fitted
                length[(lang, beat)] = duration(fitted)
            longest = max(longest, length[(lang, beat)])
            print(f"{beat:<6}{ref:>8.1f}s{raw:>8.1f}s{tempo:>8.3f}x{longest - ref:>9.1f}s")
        slots[beat] = int(round((longest + args.tail) * args.fps))
    print()

    grid, frame = [], 0
    for beat in beats:
        grid.append({"beat": beat, "startFrame": frame, "durationFrames": slots[beat]})
        frame += slots[beat]

    for lang in langs:
        pieces = []
        for beat in beats:
            padded = args.out / f"{lang}-{beat}-padded.wav"
            run(["ffmpeg", "-v", "error", "-y", "-i", str(joined[(lang, beat)]),
                 "-af", f"apad=whole_dur={slots[beat] / args.fps}",
                 "-ar", str(args.rate), "-ac", "1", "-c:a", "pcm_s16le", str(padded)])
            pieces.append(padded)
        listing = args.out / f"{lang}-all.txt"
        listing.write_text("".join(f"file '{p.resolve()}'\n" for p in pieces))
        track = args.out / f"{lang}-narration.wav"
        run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0",
             "-i", str(listing), "-c", "copy", str(track)])
        listing.unlink()
        for piece in pieces:
            piece.unlink()

        got = int(round(duration(track) * args.fps))
        if abs(got - frame) > 1:
            raise SystemExit(f"{lang}: assembled {got} frames, grid says {frame}")
        print(f"{track.name}  {duration(track):7.2f}s  {got} frames")

    (args.out / "beats.json").write_text(
        json.dumps({"fps": args.fps, "totalFrames": frame, "beats": grid}, indent=2) + "\n")
    secs = frame / args.fps
    print(f"\ngrid: {frame} frames = {secs:.2f}s ({int(secs // 60)}:{secs % 60:04.1f})")
    print("beats.json written -- never hand-edit it.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
