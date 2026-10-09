# Long form: chapters, and videos of 15–30 minutes

v2 assumed seven to twelve minutes. A Pathology Notes lecture runs longer, and a long video is
built and checked a chapter at a time.

## The chapter template

A chapter of 3–5 minutes, with beats in this order:

1. **Opener** — the chapter heading written by the pen, and the question it answers.
2. **Concept** — the mechanism, drawn (the pilot's microcirculation, the venule wall).
3. **Morphology** — what it looks like: gross, then micrograph, with stain and magnification
   (12-pathology-visuals.md).
4. **Differentials** — what it is not: a typeset comparison, not drawn.
5. **Pearls** — the one or two things worth remembering, as notes.
6. **Quiz** — one question, a pause, the answer stamped.
7. **Recap** — the chapter map, as in the pilot's last beat.

Not every chapter needs all seven; the order holds when they appear.

## Build and render per chapter

- One composition per chapter, sharing the same style and kit. A chapter's `beats.json` comes
  from its own takes.
- Run `tools/build-all.sh` per chapter: QA, event gaps and sound are per chapter anyway, and a
  fix to chapter 4 should not cost a render of chapters 1–3.
- Join the chapter renders with ffmpeg's concat demuxer (same codec settings, so `-c copy`
  works), then re-master the joined audio once: −14 LUFS, −1 dBTP.

## YouTube chapters

```
scripts/chapters.py public/A/grid/beats.json docs/A/script.md [--group 01,04,09]
```

Prints the description's chapter list from the grid, so timestamps never drift from the video.
For a joined long video, run it on the joined grid, with `--group` naming the first beat of
each chapter. YouTube shows chapters only if the list starts at 0:00, has at least three, and
none is under 10 s; the script checks all three.

## Status

Keep one `STATUS.md` per chapter (`video: A-03`), plus one for the whole video. The chapter
files say where each chapter stands; the video file says which chapters are done and what is
blocking the join.
