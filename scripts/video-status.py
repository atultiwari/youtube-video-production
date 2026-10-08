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
LATER = [
    ("scripted", "script", "4  Script"),
    ("recorded", "takes", "6  Record the voiceover"),
    ("gridded", "grid", "8  Measure -> grid"),
    ("built", "composition", "10  Build"),
    ("rendered", "renders", "12  Render"),
]

# Step 0 of the skill. An illustrated explainer has no app to capture, so step 3 is reference
# research instead; a hybrid does both. A STATUS.md without `mode:` predates modes, and every
# video made before them was a screen tutorial.
MODES = {
    "tutorial": ("screen tutorial", [VALIDATE, CAPTURE, *LATER]),
    "illustrated": ("illustrated explainer", [VALIDATE, RESEARCH, *LATER]),
    "hybrid": ("hybrid", [VALIDATE, RESEARCH, CAPTURE, *LATER]),
}


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
        path = paths.get(path_key)
        ok = bool(path) and has_content(path)
        done[key] = ok
        mark = "done" if ok else "    "
        if not ok and next_step is None:
            next_step = label
            mark = "NEXT"
        where = "" if path else "   (no path declared)"
        print(f"  [{mark}] {label}{where}")

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
