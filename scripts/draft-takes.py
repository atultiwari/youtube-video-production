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
        elif line and beats and not line.startswith(("#", ">", "<!--")):
            beats[-1]["lines"].append(line)
    if not beats:
        raise SystemExit(f"no '## NN · Title' beats found in {script}")
    return beats


def words(text: str) -> int:
    return len(re.findall(r"[A-Za-z']+", text))


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
    for old in args.takes.glob("en-*.wav"):
        old.unlink()

    paste, out, total_words = [], [], 0
    for beat in beats:
        counts = [words(l) for l in beat["lines"]]
        seconds = sum(counts) * 60 / WPM
        silent(args.takes / f"en-{beat['beat']}.wav", seconds)
        offset, lines = 0.0, []
        for text, n in zip(beat["lines"], counts):
            lines.append({"text": text, "start": round(offset, 3),
                          "duration": round(n * 60 / WPM, 3)})
            offset += n * 60 / WPM
        out.append({"beat": beat["beat"], "title": beat["title"], "lines": lines})
        paste.extend(beat["lines"])
        total_words += sum(counts)
        print(f"beat {beat['beat']}  {sum(counts):4d} words  {seconds:6.1f}s  {beat['title']}")

    args.paste.parent.mkdir(parents=True, exist_ok=True)
    args.paste.write_text("\n\n".join(paste) + "\n")
    args.lines.parent.mkdir(parents=True, exist_ok=True)
    args.lines.write_text(json.dumps({"wpm": WPM, "beats": out}, indent=2) + "\n")
    secs = total_words * 60 / WPM
    print(f"\n{total_words} words = {secs:.1f}s at {WPM} wpm ({int(secs // 60)}:{secs % 60:04.1f})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
