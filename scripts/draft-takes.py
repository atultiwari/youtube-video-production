#!/usr/bin/env python3
"""A draft grid before the takes exist: for the storyboard's key-frame stills, never a release.

    ./draft-takes.py docs/A/script.md --takes out/A/draft-takes \\
        --paste out/A/paste.txt --lines public/A/lines.json

Reads a script written in beats (`## 01 · Title` headings, one paragraph per spoken line) and:

- writes the plain paste block that `check-script.py` lints;
- writes one SILENT take per beat, `en-<beat>.wav`, lasting the beat's word count at 179 wpm
  (the measured cloned-voice rate), so `build-audio-grid.py` can write a draft `beats.json`
  exactly as it would from real takes;
- writes `lines.json`: each line's text and its offset in the beat, by word share. The kit
  places notes and cue-word events from it.

Word-count timing is an estimate (25% wrong on a real script; see mistakes.md). It is good
enough to judge a look at Gate 2. Real takes replace the draft grid before the build is final,
and `lines.json` is then regenerated from them (see 09-motion.md).
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

WPM = 179
RATE = 48000


def parse(script: Path) -> list[dict]:
    beats: list[dict] = []
    for raw in script.read_text().splitlines():
        line = raw.strip()
        heading = re.match(r"^##\s+(\d+)\s*·\s*(.+)$", line)
        if heading:
            beats.append({"beat": heading.group(1), "title": heading.group(2), "lines": []})
        elif line and beats and not line.startswith(("#", ">", "<!--", "-")):
            beats[-1]["lines"].append(line)
    if not beats:
        raise SystemExit(f"no '## NN · Title' beats found in {script}")
    return beats


def words(text: str) -> int:
    # Same tokens as the kit, check-storyboard.py and word-timestamps.py, digits included.
    return len(re.findall(r"[A-Za-z0-9']+", text.replace("\u2019", "'").replace("\u2018", "'")))


MIN_LINE = 0.5  # seconds: a line of one number ("42.") still takes time to say


def is_real_take(path: Path) -> bool:
    """A wav with any sound in it: a recording, which a draft must never overwrite."""
    import wave
    try:
        with wave.open(str(path)) as w:
            data = w.readframes(w.getnframes())
    except (wave.Error, EOFError):
        return True
    return any(b != 0 for b in data)


def silent(path: Path, seconds: float) -> None:
    done = subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"anullsrc=r={RATE}:cl=mono",
         "-t", f"{seconds:.3f}", "-c:a", "pcm_s16le", str(path)],
        capture_output=True, text=True)
    if done.returncode != 0:
        raise SystemExit(f"ffmpeg failed for {path}:\n{done.stderr.strip()}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("script", type=Path)
    ap.add_argument("--takes", type=Path, required=True)
    ap.add_argument("--paste", type=Path, required=True)
    ap.add_argument("--lines", type=Path, required=True)
    args = ap.parse_args()

    beats = parse(args.script)
    args.takes.mkdir(parents=True, exist_ok=True)
    real = [p.name for p in args.takes.glob("en-*.wav") if is_real_take(p)]
    if real:
        raise SystemExit(f"{args.takes} holds real takes ({', '.join(real[:3])}...): point --takes at a "
                         "separate draft folder, e.g. out/A/draft-takes. Nothing was deleted.")
    for old in args.takes.glob("en-*.wav"):
        old.unlink()

    paste, out, total_words = [], [], 0
    for beat in beats:
        counts = [words(l) for l in beat["lines"]]
        durs = [max(MIN_LINE, n * 60 / WPM) for n in counts]
        seconds = sum(durs)
        silent(args.takes / f"en-{beat['beat']}.wav", seconds)
        offset, lines = 0.0, []
        for text, dur in zip(beat["lines"], durs):
            lines.append({"text": text.replace("\u2019", "'").replace("\u2018", "'"), "start": round(offset, 3),
                          "duration": round(dur, 3)})
            offset += dur
        out.append({"beat": beat["beat"], "title": beat["title"], "lines": lines})
        paste.extend(beat["lines"])
        total_words += sum(counts)
        print(f"beat {beat['beat']}  {sum(counts):4d} words  {seconds:6.1f}s  {beat['title']}")

    args.paste.parent.mkdir(parents=True, exist_ok=True)
    args.paste.write_text("\n\n".join(paste) + "\n")
    args.lines.parent.mkdir(parents=True, exist_ok=True)
    args.lines.write_text(json.dumps({"source": "draft", "wpm": WPM, "beats": out}, indent=2) + "\n")
    secs = total_words * 60 / WPM
    print(f"\n{total_words} words = {secs:.1f}s at {WPM} wpm ({int(secs // 60)}:{secs % 60:04.1f})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
