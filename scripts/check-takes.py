#!/usr/bin/env python3
"""Transcribe every take with Whisper and compare it with the script, word by word.

    python3 -I check-takes.py --script docs/A/script.md --takes out/A/takes [--beats 06,44] [--retranscribe]

Writes <takes>/../whisper/en-NN.json (word timestamps) and prints, per beat,
the share of script words heard and every place the take differs from the script.
Sarvam's own quality check does not catch everything: one take said "100" for
"one hundred and eighty" and a regeneration fixed it.
"""
from __future__ import annotations

import argparse
import difflib
import json
import re
import subprocess
import tempfile
import wave
from pathlib import Path

SCRIPT: Path = Path("tts/script.md")
TAKES: Path = Path("tts/takes")
MODEL = "mlx-community/whisper-large-v3-turbo"
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def say_int(n: int) -> str:
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    if n < 1000:
        rest = n % 100
        return ONES[n // 100] + " hundred" + ("" if rest == 0 else " and " + say_int(rest))
    if n < 1_000_000:
        rest = n % 1000
        return say_int(n // 1000) + " thousand" + ("" if rest == 0 else (" and " if rest < 100 else " ") + say_int(rest))
    return str(n)


def say_number(token: str) -> str:
    """Spell a Whisper number token the way the script writes it."""
    pct = token.endswith("%")
    core = token.rstrip("%").replace(",", "")
    if re.fullmatch(r"\d+\.\d+", core):
        whole, frac = core.split(".")
        words = say_int(int(whole)) + " point " + " ".join(ONES[int(d)] for d in frac)
    elif re.fullmatch(r"(19|20)\d\d", core):
        words = say_int(int(core[:2])) + " " + say_int(int(core[2:]))
    elif re.fullmatch(r"\d+", core):
        words = say_int(int(core))
    else:
        return token
    return words + (" percent" if pct else "")


def norm_words(text: str) -> list[str]:
    out: list[str] = []
    for raw in text.replace("-", " ").split():
        tok = raw.strip(".,!?;:\"'“”‘’()").lower()
        if any(c.isdigit() for c in tok):
            out.extend(say_number(tok).split())
        elif tok:
            out.append(re.sub(r"[^a-z0-9éè]", "", tok.replace("é", "e").replace("è", "e")))
    return [w for w in out if w]


def script_beats() -> dict[str, str]:
    beats: dict[str, list[str]] = {}
    current = None
    for line in SCRIPT.read_text().splitlines():
        m = re.match(r"^##\s+(\d+)\s*·", line)
        if m:
            current = m.group(1)
            beats[current] = []
        elif current and line.strip():
            beats[current].append(line.strip())
    return {b: " ".join(lines) for b, lines in beats.items()}


def take_audio(beat: str, tmp: str) -> Path:
    """The beat's take: en-NN.wav, or its parts en-NNa.wav, en-NNb.wav… joined in name order
    (sarvam-tts.py splits beats over 1,000 characters)."""
    one = TAKES / f"en-{beat}.wav"
    if one.exists():
        return one
    parts = sorted(TAKES.glob(f"en-{beat}[a-z].wav"))
    if not parts:
        raise SystemExit(f"no take for beat {beat} in {TAKES} (en-{beat}.wav or en-{beat}a.wav …)")
    joined = Path(tmp) / f"en-{beat}.wav"
    with wave.open(str(joined), "wb") as out:
        for i, p in enumerate(parts):
            with wave.open(str(p)) as w:
                if i == 0:
                    out.setparams(w.getparams())
                out.writeframes(w.readframes(w.getnframes()))
    return joined


def transcribe(beat: str, force: bool) -> dict:
    out = TAKES.parent / "whisper" / f"en-{beat}.json"
    if out.exists() and not force:
        return json.loads(out.read_text())
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        audio = take_audio(beat, tmp)
        outdir = Path(tmp) / "json"
        outdir.mkdir()
        # Without --condition-on-previous-text False, Whisper repeated whole sentences at the end
        # of long takes (E01: "The Stanford faculty scored…" three times); the take was clean.
        done = subprocess.run(
            ["mlx_whisper", str(audio), "--model", MODEL, "--language", "en",
             "--word-timestamps", "True", "--condition-on-previous-text", "False",
             "--output-format", "json", "--output-dir", str(outdir)],
            capture_output=True, text=True,
        )
        found = list(outdir.glob("*.json"))
        if done.returncode != 0 or not found:
            raise SystemExit(f"mlx_whisper failed on beat {beat}:\n{done.stderr[-600:]}")
        data = json.loads(found[0].read_text())
    out.write_text(json.dumps(data))
    return data


def main() -> int:
    global SCRIPT, TAKES
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--script", type=Path, default=SCRIPT, help="beat script (## NN · Title)")
    ap.add_argument("--takes", type=Path, default=TAKES, help="folder with en-NN.wav takes")
    ap.add_argument("--beats", help="comma-separated beat numbers")
    ap.add_argument("--retranscribe", action="store_true")
    args = ap.parse_args()
    SCRIPT, TAKES = args.script, args.takes
    beats = script_beats()
    only = set(args.beats.split(",")) if args.beats else None
    flagged = 0
    for beat, text in beats.items():
        if only and beat not in only:
            continue
        data = transcribe(beat, args.retranscribe)
        heard = norm_words(data.get("text", ""))
        want = norm_words(text)
        sm = difflib.SequenceMatcher(a=want, b=heard, autojunk=False)
        ratio = sum(b.size for b in sm.get_matching_blocks()) / max(1, len(want))
        diffs = [(" ".join(want[i1:i2]), " ".join(heard[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != "equal"]
        mark = "OK " if ratio >= 0.95 else "CHK"
        if ratio < 0.95:
            flagged += 1
        print(f"{mark} {beat} {ratio:5.1%}  " + "  |  ".join(f"[{a}] → [{b}]" for a, b in diffs)[:400])
    print(f"\n{flagged} beat(s) under 95% word match")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
