#!/usr/bin/env python3
"""Lint a storyboard before anything is built (step 5a, references/08-storyboard.md).

    ./check-storyboard.py STORYBOARD.md [--lines public/A/lines.json] [--max-gap 4]

Always checked:
- every beat has a picture (`- picture:` that is not "none" or text);
- every spoken line has at least one picture event (`- line N "word": ...`);
- notes are short enough to read while the line is spoken: 55 characters on 16:9, 48 on 9:16.

With `--lines` (from draft-takes.py, or regenerated from the real takes):
- every cue word is actually spoken in its line;
- no stretch of a beat goes longer than `--max-gap` seconds (default 4) without a visual event.
  Event times use the kit's own formula: line start + the word's share of the line.

Exit status 1 if anything is flagged. Every rule names a measured failure: see the v3 pilot log.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

NO_PICTURE = {"", "none", "n/a", "-", "text", "text only", "card", "title card"}
NOTE_MAX = {"longform": 55, "short": 48}
EVENT = re.compile(r'^\s*-\s*line\s+(\d+)\s+"([^"]+)"\s*:\s*(.+)$')
NOTE = re.compile(r"^\s*-\s*line\s+(\d+)\s*:\s*(.+)$")
WORDS = re.compile(r"[A-Za-z0-9']+")


def plain(text: str) -> str:
    return text.replace("\u2019", "'").replace("\u2018", "'")


def parse(text: str) -> tuple[dict, list[dict]]:
    meta: dict = {}
    if text.startswith("---"):
        head, text = text.split("---", 2)[1:]
        for line in head.splitlines():
            m = re.match(r"\s*([\w-]+):\s*([^#]*)", line)
            if m:
                meta[m.group(1)] = m.group(2).strip()
    beats: list[dict] = []
    section = None
    for raw in text.splitlines():
        heading = re.match(r"^##\s+(\d+)\s*·\s*(.+)$", raw.strip())
        if heading:
            beats.append({"beat": heading.group(1), "title": heading.group(2), "picture": None, "events": [], "notes": []})
            section = None
            continue
        if not beats:
            continue
        field = re.match(r"^-\s*([\w ]+):\s*(.*)$", raw)
        if field:
            key, value = field.group(1).strip().lower(), field.group(2).strip()
            section = key if key in ("events", "notes") else None
            if key == "picture":
                beats[-1]["picture"] = value
            continue
        if section == "events" and (m := EVENT.match(raw)):
            beats[-1]["events"].append({"line": int(m.group(1)), "word": m.group(2), "what": m.group(3)})
        elif section == "notes" and (m := NOTE.match(raw)):
            beats[-1]["notes"].append({"line": int(m.group(1)), "text": m.group(2).strip()})
    return meta, beats


def word_time(line: dict, word: str) -> float | None:
    words = WORDS.findall(plain(line["text"]))
    index = next((i for i, w in enumerate(words) if w.lower().startswith(word.lower())), None)
    if index is None:
        return None
    exact = line.get("words")
    if exact and index < len(exact):
        return exact[index]["start"]
    return line["start"] + index / len(words) * line["duration"]


def check(meta: dict, beats: list[dict], lines: dict | None, max_gap: float) -> list[str]:
    problems: list[str] = []
    note_max = NOTE_MAX.get(meta.get("format", "longform"), 55)
    by_beat = {b["beat"]: b["lines"] for b in lines["beats"]} if lines else {}
    for b in beats:
        tag = f"beat {b['beat']}"
        picture = (b["picture"] or "").strip().lower()
        if picture in NO_PICTURE:
            problems.append(f"{tag}: no picture. Every beat needs one central picture; text is the caption, not the content.")
        for n in b["notes"]:
            if len(n["text"]) > note_max:
                problems.append(f"{tag} line {n['line']}: note too long ({len(n['text'])} chars, max {note_max}): {n['text']}")
        spoken_lines = sorted({n["line"] for n in b["notes"]} | {e["line"] for e in b["events"]})
        if b["beat"] in by_beat:
            spoken_lines = list(range(len(by_beat[b["beat"]])))
        for i in spoken_lines:
            if not any(e["line"] == i for e in b["events"]):
                problems.append(f"{tag} line {i}: no picture event. Each spoken line needs one, on a cue word.")
        if lines and b["beat"] not in by_beat:
            problems.append(f"{tag}: not in lines.json, so its timing was not checked (re-run draft-takes.py or word-timestamps.py)")
            continue
        if b["beat"] not in by_beat:
            continue
        beat_lines = by_beat[b["beat"]]
        if not beat_lines:
            problems.append(f"{tag}: no lines in lines.json")
            continue
        times: list[float] = [beat_lines[n["line"]]["start"] for n in b["notes"] if n["line"] < len(beat_lines)]
        for e in b["events"]:
            if e["line"] >= len(beat_lines):
                problems.append(f'{tag}: event "{e["word"]}" is on line {e["line"]}, but the beat has {len(beat_lines)} lines')
                continue
            t = word_time(beat_lines[e["line"]], e["word"])
            if t is None:
                problems.append(f'{tag} line {e["line"]}: "{e["word"]}" is not spoken in: {beat_lines[e["line"]]["text"]}')
            else:
                times.append(t)
        end = beat_lines[-1]["start"] + beat_lines[-1]["duration"]
        marks = sorted(set([0.0, *times, end]))
        for a, z in zip(marks, marks[1:]):
            if z - a > max_gap:
                before = [i for i, l in enumerate(beat_lines) if l["start"] <= a + 1e-6]
                where = f"line {before[-1]}" if before else "before line 0"
                problems.append(f"{tag} {where}: no visual event for {z - a:.1f} s (from {a:.1f} s to {z:.1f} s in the beat)")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("storyboard", type=Path)
    ap.add_argument("--lines", type=Path)
    ap.add_argument("--max-gap", type=float, default=4.0)
    args = ap.parse_args()
    if not args.storyboard.exists():
        raise SystemExit(f"no such storyboard: {args.storyboard}")
    meta, beats = parse(args.storyboard.read_text())
    if not beats:
        raise SystemExit(f"{args.storyboard}: no '## NN · Title' beats found")
    lines = json.loads(args.lines.read_text()) if args.lines else None
    problems = check(meta, beats, lines, args.max_gap)
    for p in problems:
        print(p)
    note = "" if lines else " (timing not checked: pass --lines to check cue words and gaps)"
    if problems:
        print(f"\n{len(problems)} problem(s) in {len(beats)} beats{note}")
        return 1
    print(f"{args.storyboard}: clean, {len(beats)} beats{note}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
