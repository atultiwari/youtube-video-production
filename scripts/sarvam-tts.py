#!/usr/bin/env python3
"""One take per beat in your cloned voice, from Sarvam's API: no browser, no downloads.

    export SARVAM_API_KEY=...            # once, in ~/.zshrc (04-voice.md)
    ./sarvam-tts.py docs/A/script.md --takes out/A/takes --voice svc-...   [--dry-run]

Reads a script written in beats (`## 01 · Title` headings, one paragraph per spoken line, the
same format draft-takes.py reads) and writes `en-<beat>.wav` per beat into --takes, where
master-audio.py and build-audio-grid.py pick them up. Each request goes to
`POST /voices/clone` with the cloned voice's ID, as WAV, with Sarvam's quality check (it
regenerates audio that does not match the text) and text normalisation (numbers and dates
spoken) on.

- **The 1,000-character cap.** A beat longer than that is split between sentences into parts,
  `en-01a.wav`, `en-01b.wav`, which build-audio-grid.py joins back into one beat.
- **Real takes are kept.** A take that already has sound in it is skipped unless --force; a
  silent draft take is replaced. Re-run after a failure and only the missing takes are made.
- **Retries** on rate limits and server errors; a rejected key or request stops at once.
- **The key** comes only from SARVAM_API_KEY. It is never printed, logged or written to disk.
- **tts.json** in --takes records, per take: the text, its characters, the request ID and the
  settings, so any take can be traced and regenerated.

--voice defaults to SARVAM_VOICE_ID. List your voice IDs on the playground (Voice Cloning ->
List voices) or with `GET /voices`. --dry-run prints the plan and the character count (what
you are billed on) without a key or a request.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
import uuid
import wave
from dataclasses import dataclass
from pathlib import Path

API_BASE = os.environ.get("SARVAM_API_BASE", "https://api.sarvam.ai")
MAX_CHARS = 1000          # per request, for cloned voices (REST)
ATTEMPTS = 4
RETRY_DELAY = float(os.environ.get("SARVAM_RETRY_DELAY", "2"))
RETRYABLE = {408, 429, 500, 502, 503, 504}


class Fatal(Exception):
    """A failure no retry will fix: a rejected key, a bad request."""


@dataclass(frozen=True)
class Take:
    name: str      # en-01.wav or en-01a.wav
    beat: str
    text: str


def parse(script: Path) -> list[tuple[str, list[str]]]:
    beats: list[tuple[str, list[str]]] = []
    for raw in script.read_text().splitlines():
        line = raw.strip()
        heading = re.match(r"^##\s+(\d+)\s*·\s*(.+)$", line)
        if heading:
            beats.append((heading.group(1), []))
        elif line and beats and not line.startswith(("#", ">", "<!--", "-")):
            beats[-1][1].append(line)
    if not beats:
        raise SystemExit(f"no '## NN · Title' beats found in {script}")
    return beats


def chunks(text: str, limit: int = MAX_CHARS) -> list[str]:
    """Pieces of at most `limit` characters, cut between sentences (or, failing that, words)."""
    if len(text) <= limit:
        return [text]
    sentences = re.split(r"(?<=[.!?…])\s+", text)
    pieces: list[str] = []
    current = ""
    for sentence in sentences:
        while len(sentence) > limit:  # one sentence over the cap: cut at the last space
            cut = sentence.rfind(" ", 0, limit)
            cut = cut if cut > 0 else limit
            if current:
                pieces.append(current)
                current = ""
            pieces.append(sentence[:cut].strip())
            sentence = sentence[cut:].strip()
        joined = f"{current} {sentence}".strip()
        if len(joined) <= limit:
            current = joined
        else:
            pieces.append(current)
            current = sentence
    if current:
        pieces.append(current)
    return pieces


def plan(beats: list[tuple[str, list[str]]], prefix: str, only: set[str] | None) -> list[Take]:
    takes: list[Take] = []
    for beat, lines in beats:
        if only and beat not in only:
            continue
        if not lines:
            continue
        parts = chunks(" ".join(lines))
        for i, part in enumerate(parts):
            suffix = "" if len(parts) == 1 else "abcdefghijklmnopqrstuvwxyz"[i]
            takes.append(Take(f"{prefix}-{beat}{suffix}.wav", beat, part))
    return takes


def voiced(path: Path) -> bool:
    """A take with sound in it: a real recording, never overwritten without --force."""
    try:
        with wave.open(str(path)) as w:
            if w.getsampwidth() != 2:
                return True
            data = w.readframes(w.getnframes())
    except (wave.Error, EOFError, OSError):
        return path.exists() and path.stat().st_size > 0
    from array import array
    samples = array("h", data[: len(data) - len(data) % 2])
    return bool(samples) and max(map(abs, samples)) > 300


def multipart(fields: dict[str, str]) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    out = io.BytesIO()
    for name, value in fields.items():
        out.write(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n".encode())
        out.write(value.encode("utf-8") + b"\r\n")
    out.write(f"--{boundary}--\r\n".encode())
    return out.getvalue(), f"multipart/form-data; boundary={boundary}"


def request(key: str, fields: dict[str, str]) -> dict:
    """POST /voices/clone, with retries on the failures a retry can fix."""
    body, content_type = multipart(fields)
    for attempt in range(1, ATTEMPTS + 1):
        req = urllib.request.Request(f"{API_BASE}/voices/clone", data=body, method="POST",
                                     headers={"api-subscription-key": key, "Content-Type": content_type})
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "replace")[:300]
            if error.code not in RETRYABLE:
                hint = " (check SARVAM_API_KEY)" if error.code in (401, 403) else ""
                raise Fatal(f"HTTP {error.code}{hint}: {detail}") from None
            reason = f"HTTP {error.code}"
        except (urllib.error.URLError, TimeoutError) as error:
            reason = f"network: {getattr(error, 'reason', error)}"
        if attempt == ATTEMPTS:
            raise RuntimeError(f"gave up after {ATTEMPTS} attempts ({reason})")
        time.sleep(RETRY_DELAY * 2 ** (attempt - 1))
    raise AssertionError("unreachable")


def save(path: Path, audio_b64: str) -> float:
    """Write the take atomically after checking it is a playable WAV; return its seconds."""
    data = base64.b64decode(audio_b64)
    with wave.open(io.BytesIO(data)) as w:
        frames, rate = w.getnframes(), w.getframerate()
    if frames == 0:
        raise RuntimeError("the API returned an empty WAV")
    tmp = path.with_suffix(".wav.part")
    tmp.write_bytes(data)
    tmp.replace(path)
    return frames / rate


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("script", type=Path)
    ap.add_argument("--takes", type=Path, required=True, help="folder for <lang>-<beat>.wav")
    ap.add_argument("--voice", default=os.environ.get("SARVAM_VOICE_ID"), help="cloned voice ID (svc-...)")
    ap.add_argument("--language", default="en-IN", help="language code (default en-IN)")
    ap.add_argument("--beats", help="only these beats, e.g. 02,04")
    ap.add_argument("--sample-rate", type=int, default=24000, help="Hz (default 24000, the voice's native rate)")
    ap.add_argument("--pace", type=float, default=1.0, help="0.5-2.0 (default 1.0)")
    ap.add_argument("--no-qc", action="store_true", help="skip Sarvam's quality check (faster)")
    ap.add_argument("--no-normalize", action="store_true", help="do not spell out numbers and dates")
    ap.add_argument("--force", action="store_true", help="regenerate takes that already have sound")
    ap.add_argument("--dry-run", action="store_true", help="print the plan; no key, no request")
    args = ap.parse_args()

    if not args.voice or not args.voice.startswith("svc-"):
        raise SystemExit("--voice (or SARVAM_VOICE_ID) must be a cloned voice ID, svc-...")
    if not 0.5 <= args.pace <= 2.0:
        raise SystemExit("--pace must be between 0.5 and 2.0")
    only = {b.strip().zfill(2) for b in args.beats.split(",")} if args.beats else None
    prefix = args.language.split("-")[0]
    takes = plan(parse(args.script), prefix, only)
    total = sum(len(t.text) for t in takes)

    if args.dry_run:
        for t in takes:
            print(f"{t.name:<12} {len(t.text):5d} chars  {t.text[:60]}{'...' if len(t.text) > 60 else ''}")
        print(f"\n{len(takes)} takes, {total} characters, voice {args.voice}, {args.language}")
        return 0

    key = os.environ.get("SARVAM_API_KEY", "").strip()
    if not key:
        print("SARVAM_API_KEY is not set: see references/04-voice.md, 'Setting the API key'.", file=sys.stderr)
        return 2

    args.takes.mkdir(parents=True, exist_ok=True)
    manifest_path = args.takes / "tts.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {"takes": {}}
    settings = {"voice_id": args.voice, "language_code": args.language, "speech_sample_rate": args.sample_rate,
                "pace": args.pace, "enable_qc": not args.no_qc, "enable_text_normalization": not args.no_normalize}
    manifest.update({k: v for k, v in settings.items()})

    made = kept = failed = 0
    for t in takes:
        path = args.takes / t.name
        if path.exists() and voiced(path) and not args.force:
            print(f"{t.name:<12} kept (already recorded; --force to regenerate)")
            kept += 1
            continue
        fields = {"text": t.text, "voice_id": args.voice, "language_code": args.language,
                  "output_audio_codec": "wav", "speech_sample_rate": str(args.sample_rate),
                  "pace": f"{args.pace:g}", "enable_qc": str(not args.no_qc).lower(),
                  "enable_text_normalization": str(not args.no_normalize).lower()}
        try:
            reply = request(key, fields)
            seconds = save(path, reply["audio"])
        except Fatal as error:
            print(f"{t.name:<12} FAILED: {error}", file=sys.stderr)
            failed += 1
            break  # a rejected key or request fails every take the same way
        except (RuntimeError, KeyError, wave.Error, ValueError) as error:
            print(f"{t.name:<12} FAILED: {error}", file=sys.stderr)
            failed += 1
            continue
        manifest["takes"][t.name] = {"beat": t.beat, "chars": len(t.text), "seconds": round(seconds, 2),
                                     "request_id": reply.get("request_id"),
                                     "text_sha1": hashlib.sha1(t.text.encode()).hexdigest()[:12], "text": t.text}
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
        print(f"{t.name:<12} {len(t.text):5d} chars  {seconds:6.2f}s")
        made += 1

    print(f"\n{made} made, {kept} kept, {failed} failed; {total} characters planned -> {args.takes}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
