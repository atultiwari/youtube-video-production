#!/usr/bin/env python3
"""Exact line and word times from the real takes (step 8, after the grid).

    ./word-timestamps.py docs/A/script.md out/A/takes --lines public/A/lines.json \\
        [--model mlx-community/whisper-large-v3-turbo] [--language en]

Transcribes each beat's take (`en-<beat>.wav`, parts joined in name order) with word timestamps
(mlx_whisper), aligns the transcript to the script's lines word by word, and writes
`lines.json`: every line's start and duration inside its beat, and every word's start. The kit
lands notes on line starts and underlines, strokes and stamps on the exact spoken word.

Alignment is by sequence matching on normalised words, so a mis-heard word does not shift the
rest: unmatched script words take the time of the nearest matched neighbour. The share of
script words matched is reported per beat; under 85% usually means the wrong take or a script
that has drifted from what was recorded.

Like beats.json, lines.json is generated: never hand-edit it. Re-run after any re-take.
"""
from __future__ import annotations

import argparse
import difflib
import json
import re
import subprocess
import tempfile
from pathlib import Path

WORD = re.compile(r"[A-Za-z0-9']+")


def script_beats(script: Path) -> list[dict]:
    beats: list[dict] = []
    for raw in script.read_text().splitlines():
        line = raw.strip()
        heading = re.match(r"^##\s+(\d+)\s*·\s*(.+)$", line)
        if heading:
            beats.append({"beat": heading.group(1), "title": heading.group(2), "lines": []})
        elif line and beats and not line.startswith(("#", ">", "<!--", "-")):
            beats[-1]["lines"].append(line)
    if not beats:
        raise SystemExit(f"no '## NN · Title' beats in {script}")
    return beats


def norm(w: str) -> str:
    return re.sub(r"[^a-z0-9]", "", w.lower())


def transcribe(audio: Path, model: str, language: str) -> list[dict]:
    with tempfile.TemporaryDirectory() as tmp:
        done = subprocess.run(["mlx_whisper", str(audio), "--model", model, "--language", language,
                               "--word-timestamps", "True", "--output-format", "json", "--output-dir", tmp],
                              capture_output=True, text=True)
        if done.returncode != 0:
            raise SystemExit(f"mlx_whisper failed on {audio}:\n{done.stderr[-800:]}")
        data = json.loads(next(Path(tmp).glob("*.json")).read_text())
    return [{"word": w["word"].strip(), "start": float(w["start"]), "end": float(w["end"])}
            for seg in data["segments"] for w in seg.get("words", [])]


def take_for(takes: Path, beat: str, lang: str) -> Path:
    parts = sorted(takes.glob(f"{lang}-{beat}*.wav"))
    if not parts:
        raise SystemExit(f"no take for beat {beat} in {takes}")
    if len(parts) == 1:
        return parts[0]
    joined = Path(tempfile.mkdtemp()) / f"{lang}-{beat}.wav"
    listing = joined.with_suffix(".txt")
    listing.write_text("".join(f"file '{p.resolve()}'\n" for p in parts))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing), "-c", "copy", str(joined)], check=True)
    return joined


def align(lines: list[str], heard: list[dict]) -> tuple[list[dict], float]:
    script_words = [(i, w) for i, text in enumerate(lines) for w in WORD.findall(text)]
    a = [norm(w) for _, w in script_words]
    b = [norm(h["word"]) for h in heard]
    times: list[float | None] = [None] * len(a)
    ends: list[float | None] = [None] * len(a)
    for block in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_matching_blocks():
        for k in range(block.size):
            times[block.a + k] = heard[block.b + k]["start"]
            ends[block.a + k] = heard[block.b + k]["end"]
    matched = sum(t is not None for t in times) / max(1, len(times))
    # Fill gaps from the nearest matched neighbour, keeping order.
    last = 0.0
    for k, t in enumerate(times):
        if t is None:
            nxt = next((times[j] for j in range(k + 1, len(times)) if times[j] is not None), None)
            times[k] = last if nxt is None else (last + nxt) / 2 if last else nxt
        last = times[k]  # type: ignore[assignment]
    out = []
    for i, text in enumerate(lines):
        idx = [k for k, (li, _) in enumerate(script_words) if li == i]
        words = [{"word": script_words[k][1], "start": round(float(times[k]), 3)} for k in idx]
        end_candidates = [e for k in idx if (e := ends[k]) is not None]
        out.append({"text": text, "start": words[0]["start"] if words else last,
                    "end": max(end_candidates) if end_candidates else (words[-1]["start"] if words else last), "words": words})
    for i, line in enumerate(out):
        nxt = out[i + 1]["start"] if i + 1 < len(out) else line["end"]
        line["duration"] = round(max(0.1, nxt - line["start"]), 3)
        line["start"] = round(line["start"], 3)
        del line["end"]
    return out, matched


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("script", type=Path)
    ap.add_argument("takes", type=Path)
    ap.add_argument("--lines", type=Path, required=True)
    ap.add_argument("--model", default="mlx-community/whisper-large-v3-turbo")
    ap.add_argument("--language", default="en")
    args = ap.parse_args()
    beats = []
    for beat in script_beats(args.script):
        heard = transcribe(take_for(args.takes, beat["beat"], args.language), args.model, args.language)
        lines, matched = align(beat["lines"], heard)
        flag = "" if matched >= 0.85 else "  <- check the take and the script"
        print(f"beat {beat['beat']}: {len(heard)} words heard, {matched * 100:.0f}% of script words matched{flag}")
        beats.append({"beat": beat["beat"], "title": beat["title"], "lines": lines})
    args.lines.parent.mkdir(parents=True, exist_ok=True)
    args.lines.write_text(json.dumps({"source": "word-timestamps", "beats": beats}, indent=1) + "\n")
    print(f"lines.json written -- never hand-edit it: {args.lines}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
