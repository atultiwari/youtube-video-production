#!/usr/bin/env python3
"""Master narration to a delivery loudness target.

    ./master-audio.py build/en-narration.wav build/hi-narration.wav --out mastered/

YouTube normalises loud uploads down and never quiet ones up, so a track mastered quiet simply
plays quieter than everything around it. The target is -14 LUFS integrated, -1.0 dBTP.

Gain, then a true-peak limiter, iterated. One pass lands about 1.2 LU short: the crest factor of
speech is around 20 dB, so peaks reach the ceiling well before the integrated loudness arrives
and the normaliser declines to limit them. Limiting explicitly overshoots the other way, because
limiting removes energy and therefore loudness -- hence the loop.

The limiter runs at 192 kHz because true peak is an inter-sample measurement; a limiter working
on 48 kHz samples alone lets the reconstructed waveform overshoot the ceiling it was asked to hold.

Two mistakes this exists to prevent:

  * `alimiter`'s `limit` is a LINEAR amplitude ratio in [0.0625, 1], not decibels. Passing a dB
    value is out of range and the filter silently fails to build.
  * A wrapper that does not raise hides that failure -- the loop then re-measures a stale output
    file and reports identical numbers every pass. Five passes of "no change" is the signature.

--voice-eq adds a fixed tonal correction before the gain, for a cloned voice that learned an
untreated room from its sample: high-pass at 80 Hz, -3 dB at 350 Hz and -2 dB at 750 Hz (the
boxy band; the first clone measured +12 dB there against 1-2 kHz) and +2.5 dB at 3.5 kHz
(presence). EQ only. A gate or expander shortened the echo tails from 170 ms to 70 ms but chopped
word endings audibly (owner, 2026-10-12), so this does not remove echo: a re-recorded sample does.

Each file is measured and corrected on its own. Alternate language tracks are heard one at a
time; matching them to each other rather than to the target leaves the quieter one wrong.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


def measure(path: Path, i: float, tp: float, lra: float) -> dict:
    done = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
         "-af", f"loudnorm=I={i}:TP={tp}:LRA={lra}:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True)
    blob = re.search(r"\{[^{}]*\"input_i\".*?\}", done.stderr, re.S)
    if not blob:
        raise SystemExit(f"could not measure {path.name}:\n{done.stderr[-800:]}")
    return json.loads(blob.group(0))


VOICE_EQ = ("highpass=f=80,equalizer=f=350:t=q:w=1.2:g=-3,"
            "equalizer=f=750:t=q:w=1.4:g=-2,equalizer=f=3500:t=q:w=1.4:g=2.5,")


def chain(gain_db: float, ceiling: float, voice_eq: bool = False) -> str:
    return ((VOICE_EQ if voice_eq else "") +
            f"volume={gain_db:.2f}dB,"
            f"aresample=192000,"
            f"alimiter=limit={ceiling:.4f}:attack=4:release=60:level=disabled,"
            f"aresample=48000")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("tracks", nargs="+", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--lufs", type=float, default=-14.0)
    parser.add_argument("--true-peak", type=float, default=-1.0)
    parser.add_argument("--lra", type=float, default=11.0)
    parser.add_argument("--tolerance", type=float, default=0.25)
    parser.add_argument("--passes", type=int, default=5)
    parser.add_argument("--voice-eq", action="store_true",
                        help="tonal correction for a clone with room colour (EQ only, see above)")
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    # dB -> linear, with 0.4 dB of headroom for inter-sample peaks the limiter cannot see.
    ceiling = 10 ** ((args.true_peak - 0.4) / 20)

    failed = False
    for src in args.tracks:
        before = measure(src, args.lufs, args.true_peak, args.lra)
        if args.voice_eq:  # EQ changes loudness: measure what the gain will act on
            eqd = args.out / f".eq-{src.name}"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", VOICE_EQ.rstrip(","),
                            "-c:a", "pcm_s16le", str(eqd)], check=True)
            before = measure(eqd, args.lufs, args.true_peak, args.lra)
            eqd.unlink()
        print(f"\n{src.name}")
        print(f"  measured: {before['input_i']} LUFS, true peak {before['input_tp']} dBTP")

        gain_db = args.lufs - float(before["input_i"])
        dest = args.out / src.name
        got = before
        for attempt in range(1, args.passes + 1):
            done = subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", chain(gain_db, ceiling, args.voice_eq),
                 "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(dest)],
                capture_output=True, text=True)
            if done.returncode != 0:
                raise SystemExit(f"ffmpeg failed on {src.name}:\n{done.stderr.strip()}")
            got = measure(dest, args.lufs, args.true_peak, args.lra)
            error = args.lufs - float(got["input_i"])
            print(f"  pass {attempt}: {gain_db:+5.2f} dB -> {got['input_i']} LUFS, "
                  f"peak {got['input_tp']} dBTP")
            if abs(error) <= args.tolerance:
                break
            gain_db += error

        off = abs(float(got["input_i"]) - args.lufs)
        over = float(got["input_tp"]) > args.true_peak + 0.3
        if off > 1.0 or over:
            print(f"  WARNING: {src.name} outside target", file=sys.stderr)
            failed = True
        else:
            print(f"  result:   {got['input_i']} LUFS, peak {got['input_tp']} dBTP, "
                  f"range {got['input_lra']} LU")

    if not failed:
        print("\nIf the composition sums mono narration to stereo it arrives about 3 LU hotter "
              "than measured;\napply a gain correction there (0.728 in practice).")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
