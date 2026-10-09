#!/usr/bin/env python3
"""Sound design from the picture: effects placed on what actually happens on screen, plus a
music bed, levelled under the voice.

    python3 -I tools/sound-design.py <measure.mp4> --out out/sound [--narration voice.wav]
        [--beats beats.json] [--picture 0.05,0.62] [--note 0.64,0.95] [--seed 11]

<measure.mp4> is the video rendered with decorative motion held still
(`--props='{"measure":true}'`), at any scale. Every frame is compared with the one before:

| On screen | Detected as | Sound |
|---|---|---|
| ink being drawn in the picture zone | small, continuous change there | pencil scratch, gated |
| something arriving in the picture (wash, label, ring) | a sudden larger change | soft pop |
| a note typing | small changes in the note zone | quiet ticks, capped at 14 a second |
| a stamp landing, a card changing | a large change in the note zone | thump / paper swish |
| a beat changing | a beat boundary in `--beats` (or most of the frame changing) | paper whoosh |

Effects are synthesised from seeded noise and sine partials (ported from the biopsy build's
`sfx.mjs`): no samples, no licences to record. The music bed is a slow pad with a soft
arpeggio from the same source.

Levels are set absolutely, not normalised to the mix: the bed sits at -22 LUFS and the effects
at -24 LUFS (less if their peaks would clip). With a voice (`--narration`, mastered to -14 LUFS),
the bed is ducked about 4 dB while it speaks, so it sits about 12 dB under speech and comes back
in the pauses; effects duck harder. Measured with a speech-like test signal: threshold 0.1 /
ratio 3 ducked the bed 6.8 dB (20 dB under speech, effectively gone); 0.15 / 2.5 ducks 4.0 dB.
The sum is limited to -1 dBTP. Without a voice, nothing is pushed up to fill the silence.

Writes events.json (what was heard where), sfx.wav, music.wav and mix.wav.
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import numpy as np

SR = 48000
W, H = 480, 270
PIXEL = 24

# Target loudness of each stem (LUFS), relative to a -14 LUFS voice.
MUSIC_LUFS, SFX_LUFS = -22.0, -24.0


# ---------------------------------------------------------------- analysis

def frames(video: Path) -> tuple[np.ndarray, float]:
    probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate",
                            "-of", "csv=p=0", str(video)], capture_output=True, text=True, check=True).stdout.strip()
    num, den = (int(x) for x in probe.split("/"))
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-vf", f"scale={W}:{H}", "-f", "rawvideo",
                          "-pix_fmt", "gray", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.int16), num / den


def detect(video: Path, picture: tuple[float, float], note: tuple[float, float]) -> dict:
    f, fps = frames(video)
    changed = np.abs(np.diff(f, axis=0)) > PIXEL
    px0, px1 = (int(W * v) for v in picture)
    nx0, nx1 = (int(W * v) for v in note)
    pic = changed[:, int(H * 0.1):, px0:px1].mean(axis=(1, 2))
    note_all = changed[:, int(H * 0.1):, nx0:nx1].mean(axis=(1, 2))
    whole = changed.mean(axis=(1, 2))

    drawing = ((pic > 0.00004) & (pic < 0.006)).astype(float)
    events: list[dict] = []
    last: dict[str, float] = {}

    def add(kind: str, t: float, gap: float, gain: float = 1.0) -> None:
        if t - last.get(kind, -99) >= gap:
            events.append({"t": round(t, 3), "type": kind, "gain": round(float(gain), 2)})
            last[kind] = t

    for i in range(len(whole)):
        t = (i + 1) / fps
        if whole[i] > 0.12:
            add("whoosh", t, 1.5)
            drawing[i] = 0
            continue
        if pic[i] >= 0.006:
            add("pop", t, 0.25, min(1.0, pic[i] / 0.03))
        if note_all[i] >= 0.03:
            add("swish", t, 0.6)
        elif note_all[i] >= 0.012:
            add("thump", t, 0.6)
        elif note_all[i] > 0.0004:
            add("tick", t, 1 / 14, 0.6 + 0.4 * np.random.default_rng(i).random())
    return {"fps": fps, "duration": len(f) / fps, "drawing": drawing.tolist(), "events": events}


# ---------------------------------------------------------------- synthesis

def one_pole_lowpass(x: np.ndarray, fc: float) -> np.ndarray:
    """y[n] = (1-a)x[n] + a*y[n-1], as an FFT convolution with its (truncated) exponential
    impulse response. numpy only: SciPy's compiled modules fail to load on some macOS builds."""
    a = np.exp(-2 * np.pi * fc / SR)
    length = int(np.ceil(np.log(1e-6) / np.log(a))) + 1
    kernel = (1 - a) * a ** np.arange(length)
    size = 1 << int(np.ceil(np.log2(len(x) + length - 1)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(kernel, size), size)
    return y[: len(x)]


def highpass(x: np.ndarray, fc: float) -> np.ndarray:
    return x - one_pole_lowpass(x, fc)


def place(buf: np.ndarray, start: float, sound: np.ndarray, gain: float) -> None:
    s0 = int(start * SR)
    if s0 >= len(buf):
        return
    end = min(len(buf), s0 + len(sound))
    lo = max(0, -s0)
    buf[max(0, s0):end] += sound[lo:end - s0] * gain


def cue(kind: str, rng: np.random.Generator) -> np.ndarray:
    t = lambda d: np.arange(int(d * SR)) / SR  # noqa: E731
    noise = lambda d: rng.uniform(-1, 1, int(d * SR))  # noqa: E731
    if kind == "pop":
        x = t(0.14)
        return np.sin(2 * np.pi * (620 + 900 * x) * x) * np.exp(-x / 0.035)
    if kind == "tick":
        return highpass(noise(0.05), 1500) * np.exp(-t(0.05) / 0.008)
    if kind == "thump":
        x = t(0.35)
        body = np.sin(2 * np.pi * (140 - 80 * x) * x) * np.exp(-x / 0.08)
        click = noise(0.35) * np.exp(-x / 0.006) * 0.4
        return body + click
    if kind == "swish":
        x = t(0.45)
        return highpass(one_pole_lowpass(noise(0.45), 3000), 600) * np.sin(np.pi * x / 0.45)
    if kind == "whoosh":
        x = t(0.6)
        return one_pole_lowpass(highpass(noise(0.6), 400), 2200) * np.sin(np.pi * x / 0.6) ** 2
    raise ValueError(f"unknown cue {kind}")


GAINS = {"pop": 0.22, "tick": 0.10, "thump": 0.5, "swish": 0.28, "whoosh": 0.35}


def build_sfx(analysis: dict, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = int((analysis["duration"] + 0.5) * SR)
    buf = np.zeros(n)
    # Pencil scratch: band-limited noise, gated by "ink is being drawn", with grain.
    draw = np.repeat(np.asarray(analysis["drawing"]), int(round(SR / analysis["fps"])))[:n]
    draw = np.pad(draw, (0, n - len(draw)))
    gate = one_pole_lowpass(draw, 12)
    grain = 0.55 + 0.45 * np.abs(one_pole_lowpass(rng.uniform(-1, 1, n), 30) * 8)
    buf += one_pole_lowpass(highpass(rng.uniform(-1, 1, n), 1100), 4200) * gate * grain * 0.09
    for e in analysis["events"]:
        place(buf, e["t"], cue(e["type"], rng), GAINS[e["type"]] * e["gain"])
    return buf


CHORDS = [[48, 55, 64, 71], [45, 52, 60, 67], [41, 48, 57, 64], [43, 50, 59, 62]]  # Cmaj7 Am7 Fmaj7 G6
BAR = 4.2


def build_music(duration: float) -> np.ndarray:
    n = int((duration + 0.5) * SR)
    buf = np.zeros(n)
    midi = lambda m: 440 * 2 ** ((m - 69) / 12)  # noqa: E731
    for b in range(int(duration / BAR) + 2):
        chord, t0 = CHORDS[b % 4], b * BAR
        d = BAR + 1.2
        x = np.arange(int(d * SR)) / SR
        env = np.minimum(1, x / 1.4) * np.minimum(1, (d - x) / 1.2) * (1 + 0.08 * np.sin(x * 2.3))
        for m in chord:
            f = midi(m)
            place(buf, t0, (np.sin(2 * np.pi * f * x) + 0.25 * np.sin(4 * np.pi * f * x)) * env, 0.045)
        for s, k in enumerate([0, 2, 1, 3, 2, 1, 3, 2]):
            f = midi(chord[k] + 12)
            y = np.arange(int(1.2 * SR)) / SR
            pluck = (np.sin(2 * np.pi * f * y) + 0.3 * np.sin(6 * np.pi * f * y) * np.exp(-y / 0.05)) * np.exp(-y / 0.35)
            place(buf, t0 + s * BAR / 8, pluck * np.minimum(1, y / 0.006), 0.05)
    fade = np.minimum(1, np.arange(n) / (1.5 * SR)) * np.minimum(1, (n - np.arange(n)) / (2.5 * SR))
    return one_pole_lowpass(buf, 3500) * fade


# ---------------------------------------------------------------- levels and mix

def write_wav(path: Path, x: np.ndarray) -> None:
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", str(path)],
                   input=pcm.tobytes(), check=True)


def loudness(path: Path) -> float:
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    for line in reversed(out.splitlines()):
        if line.strip().startswith("I:"):
            return float(line.split()[1])
    raise RuntimeError(f"could not measure {path}")


def level(x: np.ndarray, target: float, scratch: Path, name: str) -> np.ndarray:
    """Gain to the target loudness, but never past a 0.89 sample peak: a clipped stem makes
    inter-sample overs that a sample limiter downstream cannot remove."""
    peak = np.max(np.abs(x)) or 1.0
    x = x / peak * 0.5
    write_wav(scratch, x)
    gain = 10 ** ((target - loudness(scratch)) / 20)
    safe = 0.89 / (np.max(np.abs(x)) or 1.0)
    if gain > safe:
        print(f"  {name}: peaks allow {20 * np.log10(safe / gain):+.1f} dB short of {target} LUFS; kept peak-safe")
        gain = safe
    return x * gain


def true_peak(path: Path) -> float:
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    for line in reversed(out.splitlines()):
        if line.strip().startswith("Peak:"):
            return float(line.split()[1])
    raise RuntimeError(f"could not measure true peak of {path}")


def mix(out: Path, narration: Path | None, ceiling_dbtp: float = -1.0) -> Path:
    """Sum the stems (bed and effects ducked under the voice, if there is one) and limit to
    the true-peak ceiling. alimiter works on samples, so the result is measured and the limit
    lowered until the true peak is under the ceiling (the master-audio.py lesson)."""
    dest = out / "mix.wav"
    if narration:
        inputs = ["-i", str(narration), "-i", str(out / "music.wav"), "-i", str(out / "sfx.wav")]
        body = ("[0]asplit=3[vo][k1][k2];[1][k1]sidechaincompress=threshold=0.15:ratio=2.5:attack=40:release=600[mu];"
                "[2][k2]sidechaincompress=threshold=0.05:ratio=4:attack=15:release=350[fx];"
                "[vo][mu][fx]amix=inputs=3:normalize=0")
    else:
        inputs = ["-i", str(out / "music.wav"), "-i", str(out / "sfx.wav")]
        body = "[0][1]amix=inputs=2:normalize=0"
    margin = 0.4
    for _ in range(6):
        limit = 10 ** ((ceiling_dbtp - margin) / 20)
        graph = f"{body},alimiter=limit={limit:.4f}:level=false[a]"
        subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", graph, "-map", "[a]",
                        "-ar", str(SR), str(dest)], check=True)
        tp = true_peak(dest)
        if tp <= ceiling_dbtp:
            return dest
        margin += tp - ceiling_dbtp + 0.1
    raise RuntimeError(f"true peak {tp:.2f} dBTP still above {ceiling_dbtp} after 6 passes")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--narration", type=Path)
    ap.add_argument("--beats", type=Path, help="beats.json: a whoosh on every beat boundary")
    ap.add_argument("--picture", default="0.05,0.62")
    ap.add_argument("--note", default="0.64,0.95")
    ap.add_argument("--seed", type=int, default=11)
    args = ap.parse_args()
    if not args.video.exists():
        raise SystemExit(f"no such video: {args.video}")
    args.out.mkdir(parents=True, exist_ok=True)
    zone = lambda s: tuple(float(v) for v in s.split(","))  # noqa: E731

    analysis = detect(args.video, zone(args.picture), zone(args.note))
    if args.beats:
        # A dissolve between similar paper tints changes too little per frame to detect, so
        # beat changes come from the grid, which is exact.
        grid = json.loads(args.beats.read_text())
        bounds = [b["startFrame"] / grid["fps"] for b in grid["beats"][1:]]
        analysis["events"] = [e for e in analysis["events"] if e["type"] != "whoosh"] + [
            {"t": round(t, 3), "type": "whoosh", "gain": 1.0} for t in bounds]
    counts: dict[str, int] = {}
    for e in analysis["events"]:
        counts[e["type"]] = counts.get(e["type"], 0) + 1
    drawn = sum(analysis["drawing"]) / analysis["fps"]
    (args.out / "events.json").write_text(json.dumps({"counts": counts, "drawingSeconds": round(drawn, 1),
                                                       "events": analysis["events"]}, indent=1))
    scratch = args.out / ".level.wav"
    write_wav(args.out / "sfx.wav", level(build_sfx(analysis, args.seed), SFX_LUFS, scratch, "sfx"))
    write_wav(args.out / "music.wav", level(build_music(analysis["duration"]), MUSIC_LUFS, scratch, "music"))
    scratch.unlink(missing_ok=True)
    dest = mix(args.out, args.narration)
    print(f"events: {counts}, pen drawing {drawn:.0f}s of {analysis['duration']:.0f}s")
    print(f"sfx {loudness(args.out / 'sfx.wav'):.1f} LUFS, music {loudness(args.out / 'music.wav'):.1f} LUFS, "
          f"mix true peak {true_peak(dest):.1f} dBTP -> {dest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
