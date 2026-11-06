#!/usr/bin/env python3
"""Report which pipeline step a video is on, from what is actually on disk.

    ./video-status.py path/to/STATUS.md
    ./video-status.py path/to/STATUS.md --root /path/to/project

Two kinds of fact go into knowing where a video stands, and they are kept apart on purpose.

**What can be derived** -- does a script exist, are there takes, is there a grid, a composition,
a render -- is derived here, every time, from the filesystem. A status file that claims a step is
done when the artefact is missing is worse than no status file, and hand-maintained checklists
drift within a day.

**What cannot be derived** -- the angle chosen and why, what was rejected and why, what the owner
has not decided yet -- lives in STATUS.md as prose. That is the part worth writing by hand,
because it is the part a fresh session cannot reconstruct from the files and will otherwise
re-litigate.

Paths are declared in STATUS.md's front matter, so any project layout works.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

VALIDATE = ("validated", "validation", "2  Validate the claims")
CAPTURE = ("captured", "captures", "3  Reconnaissance capture")
RESEARCH = ("researched", "references", "3  Reference research")
SCRIPT = ("scripted", "script", "4  Script")
STORYBOARD = ("storyboarded", "storyboard", "5a  Storyboard")
# Gate 2 is the owner's decision, not a file: STATUS.md records it as `gate2: <date>`.
GATE2 = ("approved", "@gate2", "5b  Key frames, Gate 2")
RECORD = [
    ("recorded", "takes", "6  Record the voiceover"),
    ("gridded", "grid", "8  Measure -> grid"),
    ("built", "composition", "10  Build"),
]
SOUND = ("sounded", "sound", "10b  Sound")
QA = ("checked", "@qa", "11  Visual QA")
RENDER = ("rendered", "@render", "12  Render")

# Step 0 of the skill. An illustrated explainer has no app to capture, so step 3 is reference
# research instead; a hybrid does both. A STATUS.md without `mode:` predates modes, and every
# video made before them was a screen tutorial.
# The storyboard (5a) is for drawn pictures, so tutorials have none. Sound (10b) is for every
# mode, but only checked when STATUS.md declares a `sound` path: older files predate it.
MODES = {
    "tutorial": ("screen tutorial", [VALIDATE, CAPTURE, SCRIPT, *RECORD, SOUND, QA, RENDER]),
    "illustrated": ("illustrated explainer", [VALIDATE, RESEARCH, SCRIPT, STORYBOARD, GATE2, *RECORD, SOUND, QA, RENDER]),
    "hybrid": ("hybrid", [VALIDATE, RESEARCH, CAPTURE, SCRIPT, STORYBOARD, GATE2, *RECORD, SOUND, QA, RENDER]),
    # Motion-graphics news/incident explainer (remotion-motion-explainer): no drawing, no
    # storyboard; Gate 2 is the owner approving the silent preview with temporary captions.
    "motion": ("motion explainer", [VALIDATE, RESEARCH, SCRIPT, GATE2, *RECORD, SOUND, QA, RENDER]),
}
OPTIONAL = {"storyboard", "sound"}


def front_matter(text: str) -> dict:
    """Minimal YAML: scalars, inline lists, and one nested `paths:` block."""
    if not text.startswith("---"):
        raise SystemExit("STATUS.md must open with a --- front-matter block")
    body = text.split("---", 2)[1]
    data: dict = {}
    section = None
    for line in body.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        indented = line.startswith(("  ", "\t"))
        match = re.match(r"\s*([\w-]+):\s*(.*)", line)
        if not match:
            continue
        key, value = match.group(1), match.group(2).split("#")[0].strip()
        if indented and section:
            data[section][key] = value
        elif not value:
            section = key
            data[key] = {}
        else:
            section = None
            if value.startswith("["):
                data[key] = [v.strip() for v in value.strip("[]").split(",") if v.strip()]
            else:
                data[key] = value
    return data


def has_content(path: Path) -> bool:
    if not path.exists():
        return False
    if path.is_dir():
        return any(p.is_file() and not p.name.startswith(".") for p in path.rglob("*"))
    return path.stat().st_size > 0


def voiced(path: Path) -> bool:
    """Takes with sound in them. Draft takes (draft-takes.py) are silence: timing, not a voice.

    Reads 8-, 16-, 24- and 32-bit PCM, the whole file. A wav it cannot decode (float, compressed)
    is counted as a recording: a draft is always 16-bit PCM, so only a real take looks like that.
    """
    import wave
    for wav in sorted(path.glob("*.wav")) if path.is_dir() else []:
        try:
            with wave.open(str(wav)) as w:
                width, frames = w.getsampwidth(), w.readframes(w.getnframes())
        except (wave.Error, EOFError):
            return True
        limit = 0.01 * (1 << (8 * width - 1))
        if width == 1:
            loud = any(abs(x - 128) > limit for x in frames)
        elif width in (2, 4):
            from array import array
            samples = array("h" if width == 2 else "i", frames[: len(frames) - len(frames) % width])
            loud = bool(samples) and max(map(abs, samples)) > limit
        else:  # 24-bit: stop at the first loud sample
            loud = any(abs(int.from_bytes(frames[i:i + width], "little", signed=True)) > limit
                       for i in range(0, len(frames) - width + 1, width))
        if loud:
            return True
    return False


def step_done(path_key: str, paths: dict[str, Path], meta: dict) -> tuple[bool, str]:
    """Is a step done, and a note on why not when it is worth saying."""
    renders = paths.get("renders")
    if path_key == "@gate2":
        return bool(meta.get("gate2")), "" if meta.get("gate2") else "   (record `gate2: <date>` in STATUS.md)"
    if path_key == "@qa":
        if renders is None:
            return False, "   (no renders path declared)"
        report = renders / "qa.json"
        if not (report.exists() and (renders / "focus.txt").exists()):
            return False, ""
        try:
            issues = sum(len(f.get("issues", [])) for f in json.loads(report.read_text()))
        except (ValueError, AttributeError, TypeError):
            return False, "   (qa.json unreadable)"
        return issues == 0, "" if issues == 0 else f"   ({issues} QA issues open)"
    if path_key == "@render":
        if renders is None:
            return False, "   (no renders path declared)"
        ok = renders.exists() and any(
            f.suffix == ".mp4" and f.stem not in ("measure",) and not f.stem.endswith("-silent")
            for f in renders.iterdir())
        return ok, ""
    path = paths.get(path_key)
    if path_key == "takes" and path is not None and has_content(path) and not voiced(path):
        return False, "   (draft takes only: silent timing, not a recording)"
    return bool(path) and has_content(path), "" if path else "   (no path declared)"


def section(text: str, name: str) -> list[str]:
    match = re.search(rf"^##\s+{re.escape(name)}\s*$(.*?)(?=^##\s|\Z)", text, re.M | re.S)
    if not match:
        return []
    return [l.strip() for l in match.group(1).splitlines() if l.strip().startswith("-")]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("status", type=Path)
    parser.add_argument("--root", type=Path,
                        help="resolve paths against this (default: STATUS.md's directory)")
    args = parser.parse_args()

    text = args.status.read_text()
    meta = front_matter(text)
    root = args.root or args.status.parent
    paths = {k: (root / v) for k, v in (meta.get("paths") or {}).items()}

    mode = meta.get("mode", "tutorial")
    if mode not in MODES:
        raise SystemExit(f"{args.status}: unknown mode {mode!r}; use one of: {', '.join(MODES)}")
    mode_name, steps = MODES[mode]

    print(f"{meta.get('video', '?')} · {meta.get('title', 'untitled')}")
    print(f"{meta.get('format', '?')} · {mode_name} · "
          f"{', '.join(meta.get('languages', []) or ['?'])}\n")

    done, next_step = {}, None
    for key, path_key, label in steps:
        if paths.get(path_key) is None and path_key in OPTIONAL:
            continue
        ok, note = step_done(path_key, paths, meta)
        done[key] = ok
        mark = "done" if ok else "    "
        if not ok and next_step is None:
            next_step = label
            mark = "NEXT"
        print(f"  [{mark}] {label}{note}")

    # The grid is the one artefact worth reading rather than merely counting.
    grid = paths.get("grid")
    if grid and grid.exists():
        data = json.loads(grid.read_text())
        secs = data["totalFrames"] / data.get("fps", 30)
        print(f"\n  grid: {data['totalFrames']} frames, {len(data['beats'])} beats, "
              f"{int(secs // 60)}:{secs % 60:04.1f}")

    takes = paths.get("takes")
    if takes and takes.exists():
        by_lang: dict[str, int] = {}
        for wav in takes.glob("*-*.wav"):
            by_lang[wav.stem.split("-")[0]] = by_lang.get(wav.stem.split("-")[0], 0) + 1
        if by_lang:
            print("  takes: " + ", ".join(f"{k} x{v}" for k, v in sorted(by_lang.items())))

    for heading in ("Where it stands", "Blocked on", "Open questions"):
        items = section(text, heading)
        if heading == "Where it stands":
            match = re.search(r"^##\s+Where it stands\s*$(.*?)(?=^##\s|\Z)", text, re.M | re.S)
            prose = " ".join(l.strip() for l in (match.group(1) if match else "").splitlines()
                             if l.strip() and not l.strip().startswith("-"))
            if prose:
                print(f"\n{heading}:\n  {prose}")
            continue
        if items:
            print(f"\n{heading}:")
            for item in items:
                print(f"  {item}")

    if next_step:
        print(f"\n-> next: {next_step}")
    else:
        print("\n-> all derivable steps have artefacts; publishing is the remaining step.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
