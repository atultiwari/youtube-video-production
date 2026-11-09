#!/usr/bin/env python3
"""Lint narration for the delivery traps that break text-to-speech.

    ./check-script.py script.txt
    ./check-script.py script.txt --opening    # also check the first line

Reads plain text or a beat script: one paragraph per beat-line, blank lines between; lines
starting with `#` (beat headings) are skipped. Every rule here exists
because a real take came back wrong; see references/mistakes.md.

Exit status is 1 if anything is flagged, so it can gate a build.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

#: A line this short that ends in a full stop reads as a heading, and the engine does not
#: reliably pause after it -- the next word fuses on. "Compute." and "Generalisation." both did.
HEADING_WORDS = 2

#: Second-person pronouns and concrete anchors. An opening line with neither is about the topic
#: rather than the viewer, and measured retention says that is the line people leave on.
YOU_WORDS = {"you", "your", "yours", "you're", "you've"}

#: Two capital letters on their own ("PA", "AP"): the cloned voice swallowed them (E01: "PA chest
#: film" was heard as "PHS film"). Spell the meaning out, or respell in the TTS map. These pairs
#: were said clearly and are allowed; add more with --allow.
LETTER_PAIRS_OK = {"AI", "OK", "TV", "UK", "US", "EU"}


def fused_headings(text: str) -> list[tuple[int, str]]:
    """Short sentences that another sentence follows, whether or not a line break separates them."""
    found = []
    lines = [l.rstrip() for l in text.splitlines()]
    for index, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        # A whole line that is a heading fuses with whatever line follows it.
        following = next((l for l in lines[index + 1:] if l.strip()), "")
        if following and len(stripped.split()) <= HEADING_WORDS and stripped[-1] in ".!?":
            found.append((index + 1, stripped))
            continue
        # And the same shape inside a line.
        for match in re.finditer(r"(?:^|(?<=[.?!])\s)([^.?!]+[.?!])(?=\s+\S)", line):
            sentence = match.group(1).strip()
            if len(sentence.split()) <= HEADING_WORDS:
                found.append((index + 1, sentence))
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("script", type=Path)
    parser.add_argument("--opening", action="store_true",
                        help="also check that the first line addresses the viewer")
    parser.add_argument("--allow", default="",
                        help="comma-separated two-letter abbreviations that are fine, e.g. ML,DL")
    parser.add_argument("--respell", type=Path,
                        help="the sarvam-tts.py --respell map: its written forms are blanked before linting, "
                             "so a respelled trial name (Tele-HF -> 'Tele H F') is not flagged (E23)")
    args = parser.parse_args()

    # Markdown headings (`# Title`, `## 01 · Beat`) are structure, not narration: blank them
    # out, keeping line numbers, so they are neither linted (their digits) nor taken as the
    # opening line. E01 and E02 failed both checks on headings alone (Nov 2026).
    text = "\n".join("" if l.lstrip().startswith("#") else l for l in args.script.read_text().splitlines())
    if args.respell:
        import json
        for written in sorted(json.loads(args.respell.read_text()), key=len, reverse=True):
            text = re.sub(rf"(?<![\w-]){re.escape(written)}(?![\w-])", lambda m: "x" * len(m.group(0)), text)
    problems: list[str] = []

    for line_no, sentence in fused_headings(text):
        problems.append(
            f"line {line_no}: short sentence followed by more text -- {sentence!r}\n"
            f"    No pause is bought here; the next word fuses onto it. Rewrite as one sentence.")

    for line_no, line in enumerate(text.splitlines(), 1):
        for match in re.finditer(r"\d", line):
            problems.append(
                f"line {line_no}: digit in spoken text at column {match.start() + 1}\n"
                f"    Spell it out; numerals are read unpredictably.")
            break
        allowed = LETTER_PAIRS_OK | {a.strip().upper() for a in args.allow.split(",") if a.strip()}
        if not line.lstrip().startswith("#"):
            for match in re.finditer(r"\b[A-Z]{2}\b", line):
                if match.group(0) not in allowed:
                    problems.append(
                        f"line {line_no}: letter pair {match.group(0)!r}\n"
                        f"    The cloned voice swallows bare letter pairs. Say what it means, or respell it "
                        f"(sarvam-tts.py --respell), or --allow it after hearing a take.")
                    break
        if "—" in line or "–" in line:
            problems.append(
                f"line {line_no}: em or en dash in spoken text\n"
                f"    Dashes make the missing-pause problem worse. Use a full stop or comma.")
        if re.match(r"\s*(?:[-*•]|\d+[.)])\s", line):
            problems.append(
                f"line {line_no}: list marker in spoken text\n"
                f"    Bullets and numbering get read aloud. Use plain paragraphs.")

    if args.opening:
        first = next((l.strip() for l in text.splitlines() if l.strip()), "")
        words = {w.strip(".,!?;:").lower() for w in first.split()}
        if not (words & YOU_WORDS):
            problems.append(
                "opening line does not address the viewer\n"
                "    Measured: 75.8% swipe away, and the openings that held named something the\n"
                "    viewer already owned. Avoid opening on a definition, a number or the topic.")

    if problems:
        print(f"{len(problems)} problem(s) in {args.script}:\n", file=sys.stderr)
        for problem in problems:
            print(f"  {problem}\n", file=sys.stderr)
        return 1

    words = len(text.split())
    print(f"{args.script}: clean. {words} words, about "
          f"{words / 179 * 60 // 60:.0f}:{words / 179 * 60 % 60:04.1f} at 179 wpm "
          f"(an ordering signal only -- the take decides).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
