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
    elif re.fullmatch(r"200\d", core):
        words = "two thousand" + ("" if core == "2000" else " " + ONES[int(core[3])])
    elif re.fullmatch(r"(19|20)\d\d", core):
        words = say_int(int(core[:2])) + " " + say_int(int(core[2:]))
    elif re.fullmatch(r"\d+", core):
        words = say_int(int(core))
    else:
        return token
    return words + (" percent" if pct else "")


def say_digits(tok: str) -> list[str]:
    """A Whisper token with digits, as spoken words. Besides plain numbers, accepts the forms
    Whisper writes for spelled-out script words (E07, Nov 2026, correct takes that failed 95%):
    "2x2" / "2×2" → "two by two", and letter-digit mixes "f1" → "f one", "covid19" → "covid nineteen"."""
    if re.fullmatch(r"\d\+", tok):  # IHC scores: Whisper writes "three plus" as "3+" (E22)
        return [ONES[int(tok[0])], "plus"]
    m = re.fullmatch(r"(\d+)[x×](\d+)", tok)
    if m:
        return [*say_int(int(m.group(1))).split(), "by", *say_int(int(m.group(2))).split()]
    words = say_number(tok)
    if words == tok and re.search(r"[a-z]", tok):
        out: list[str] = []
        for run in re.findall(r"[a-z]+|\d+", tok):
            out.extend([run] if run.isalpha() else say_int(int(run)).split())
        return out
    return words.split()


def norm_words(text: str) -> list[str]:
    out: list[str] = []
    for raw in text.replace("-", " ").split():
        tok = raw.strip(".,!?;:\"'“”‘’()").lower()
        if any(c.isdigit() for c in tok):
            out.extend(say_digits(tok))
        elif tok in ("x", "×") and out and out[-1] in ONES + TENS:
            out.append("by")  # "2 × 2" written with spaces (E07)
        elif tok:
            out.append(re.sub(r"[^a-z0-9éè]", "", tok.replace("é", "e").replace("è", "e")))
    out = [w for w in out if w]
    # Years 2001-2009 as spoken: "twenty oh five" and "two thousand and five" both mean what Whisper
    # writes as "2005" (E22: two correct takes scored 94.6% on "In twenty oh one").
    fixed: list[str] = []
    i = 0
    while i < len(out):
        if out[i:i + 2] == ["twenty", "oh"] and i + 2 < len(out) and out[i + 2] in ONES[1:10]:
            fixed += ["two", "thousand", out[i + 2]]
            i += 3
        elif out[i:i + 3] == ["two", "thousand", "and"] and i + 3 < len(out) and out[i + 3] in ONES[1:10]:
            fixed += ["two", "thousand"]
            i += 3
        else:
            fixed.append(out[i])
            i += 1
    return fixed


#: British → American spellings Whisper writes (it hears Indian/British English but spells US).
#: Applied to both the script and the transcript, so either spelling matches (E02, Nov 2026:
#: "labelling", "haematologist", "unlabelled" alone pushed a clean take under 95%).
UK_WORDS = {"centre": "center", "centres": "centers", "metre": "meter", "litre": "liter", "fibre": "fiber",
            "theatre": "theater", "programme": "program", "programmes": "programs", "grey": "gray",
            "practise": "practice", "licence": "license", "defence": "defense", "analyse": "analyze",
            "analysed": "analyzed", "analysing": "analyzing", "catalogue": "catalog", "dialogue": "dialog",
            # Homophones Whisper cannot tell apart; both sides map to one form (E19: "medical council"
            # was written "counsel" in four takes of two different lines).
            "counsel": "council",
            # Units Whisper abbreviates on correct audio (E22: "two centimetres" → "2 cm", 90% on a short line).
            "centimetre": "cm", "centimetres": "cm", "centimeter": "cm", "centimeters": "cm",
            "millimetre": "mm", "millimetres": "mm", "millimeter": "mm", "millimeters": "mm"}
UK_RULES = [
    (re.compile(r"^(un)?(label|model|travel|cancel|signal|level|channel|fuel|total|counsel)l(ed|ing|er|ers)$"), r"\1\2\3"),
    (re.compile(r"^(an)?haem"), r"\1hem"),
    (re.compile(r"^(an)?aem"), r"\1em"),
    (re.compile(r"^paed"), "ped"),
    (re.compile(r"^oe(dema|soph|strog)"), r"e\1"),
    (re.compile(r"^([a-z]{2,})our(s|ed|ing|al)?$"), r"\1or\2"),
    (re.compile(r"^([a-z]{3,})is(e|ed|es|ing|ation|ations)$"), r"\1iz\2"),
]


def us_spelling(word: str) -> str:
    word = UK_WORDS.get(word, word)
    for pattern, repl in UK_RULES:
        word = pattern.sub(repl, word)
    return word


def load_respell(path: Path | None) -> list[tuple[str, list[str]]]:
    """(written word, spoken words) pairs from a --respell map, e.g. CheXpert → chest expert."""
    if not path or not path.exists():
        return []
    pairs = json.loads(path.read_text())
    return [(norm_words(k)[0], norm_words(v)) for k, v in pairs.items() if norm_words(k) and norm_words(v)]


def canon(words: list[str], respell: list[tuple[str, list[str]]], heard: bool) -> list[str]:
    """Words compared on meaning, not spelling: US spelling, "data set" as one word, and on the
    transcript side a respelled name heard as its spoken form ("chest expert", "chestexpert",
    "ben jee oh") put back as the script's written word ("chexpert", "bengio")."""
    out: list[str] = []
    i = 0
    while i < len(words):
        if heard:
            hit = None
            for key, spoken in respell:
                n = len(spoken)
                if words[i:i + n] == spoken:
                    hit = (key, n)
                elif words[i] == "".join(spoken):
                    hit = (key, 1)
                if hit:
                    break
            if hit:
                out.append(hit[0])
                i += hit[1]
                continue
        if words[i] == "data" and i + 1 < len(words) and words[i + 1] in ("set", "sets"):
            out.append("data" + words[i + 1])
            i += 2
            continue
        out.append(us_spelling(words[i]))
        i += 1
    return out


#: Words Whisper reliably writes as a homophone of a correct take: script word → what it hears.
#: Accepted only when the script has the word and not the homophone itself (E05: "Bayes" was heard
#: as "base" in every take). Extend per project with --heard-as (a JSON map of the same shape).
HEARD_AS = {"bayes": ["base", "bays", "baze"]}


def accept_heard_as(want: list[str], heard: list[str], extra: dict[str, list[str]]) -> list[str]:
    """Put a known homophone in the transcript back as the script's word."""
    table = {**HEARD_AS, **{k.lower(): [v.lower() for v in vs] for k, vs in extra.items()}}
    script = set(want)
    swap = {v: k for k, vs in table.items() if k in script for v in vs if v not in script}
    return [swap.get(w, w) for w in heard]


def merge_compounds(words: list[str], other: list[str]) -> list[str]:
    """Join a split pair ("cut", "off") when the other side has it as one word ("cutoff"), so
    hyphenated, spaced and closed forms of a compound all match (E05: "cut-off" vs "cutoff")."""
    single = set(other)
    out: list[str] = []
    i = 0
    while i < len(words):
        if i + 1 < len(words) and words[i] + words[i + 1] in single:
            out.append(words[i] + words[i + 1])
            i += 2
            continue
        out.append(words[i])
        i += 1
    return out


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
    # A cached transcript is reused only while it is newer than every file of the take: after a
    # retake (sarvam-tts.py --force) the old JSON would score the new take against the old audio
    # (E03, Nov 2026: a good retake was counted as a second failure).
    wavs = [TAKES / f"en-{beat}.wav"] + sorted(TAKES.glob(f"en-{beat}[a-z].wav"))
    newest = max((w.stat().st_mtime for w in wavs if w.exists()), default=0)
    if out.exists() and not force and out.stat().st_mtime >= newest:
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
    ap.add_argument("--respell", type=Path, default=Path("docs/respell.json"),
                    help="the sarvam-tts.py --respell map; respelled names count as matches")
    ap.add_argument("--heard-as", type=Path, default=None,
                    help="JSON map of script word -> homophones Whisper writes for it (added to HEARD_AS)")
    args = ap.parse_args()
    SCRIPT, TAKES = args.script, args.takes
    beats = script_beats()
    only = set(args.beats.split(",")) if args.beats else None
    respell = load_respell(args.respell)
    heard_as = json.loads(args.heard_as.read_text()) if args.heard_as and args.heard_as.exists() else {}
    flagged = 0
    for beat, text in beats.items():
        if only and beat not in only:
            continue
        data = transcribe(beat, args.retranscribe)
        heard = canon(norm_words(data.get("text", "")), respell, heard=True)
        want = canon(norm_words(text), respell, heard=False)
        heard = accept_heard_as(want, heard, heard_as)
        want, heard = merge_compounds(want, heard), merge_compounds(heard, want)
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
