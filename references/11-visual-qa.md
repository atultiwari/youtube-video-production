# 11 · Stills review, upgraded: visual QA with numbers

v2's stills review rendered one frame per beat and looked. It found real bugs, but it had no
checklist and no measurements, and in both v2 test videos it passed frames that were mostly
empty and, in one, text overlapping text. This is the same step with a standard.

## One command

In a project with the kit installed:

```
tools/build-all.sh <composition> <key> [--narration public/<key>/grid/en-narration.wav] [--deliver-4k]
```

It runs, in the order the checks depend on each other:

1. **QA probe** on a frame every second (`tools/qa.mjs`). Stops if any frame has an issue.
2. **Measure render** with decorative motion held still, then **event gaps**.
3. **Sound design** from the measure render (10-sound.md).
4. **Full render**, muxed with the mix.
5. **Stills**: one per beat midpoint and one every 2 s; contact sheets; a phone sheet;
   **frame fill**.

## What each check is, and the failure behind it

| Check | Tool | Pass | Behind it |
|---|---|---|---|
| Text overlap, text outside the frame, text under the minimum, one-line text that wraps | `QAProbe` + `tools/qa.mjs` | 0 issues | v2's S-107 had two lines overlapping, and the stills review passed it; the pilot's eyeballed sheets missed label collisions until a probe measured the real layout |
| One focus at a time | `scripts/focus-check.py` | sustained split focus (runs ≥ 0.3 s) under 5%; no run over 0.5 s | the first v3 builds drew in up to six places at once: 17% and 27% of their runtime |
| Frame fill | `scripts/frame-fill.py` | median content box ≥ 50% | v2: 21% (longform) and 18% (Short) |
| Event gaps | `scripts/event-gaps.py` | no stretch ≥ 4 s; under 25% at worst | v2: 52% and 53% static |
| Phone test | `scripts/contact-sheet.py --phone` | the note reads at 360 px wide | card headers at 23 px vanished |
| Contact sheet every 2 s | `scripts/contact-sheet.py` | read it; score against the rubric | label-on-stroke collisions showed only here, never on the beat midpoints |

**Midpoints are not enough.** On the pilot, every collision between a label and a stroke or a
stamp was found on the 2-second sheet; none showed on the eight beat midpoints.

## How the probe works

Kit components tag their text with `data-qa` (kind) and `data-qa-size` (px). With
`--props='{"qa":true}'`, `QAProbe` measures every tagged element in the page after layout and
logs what is wrong; `tools/qa.mjs` renders a frame every second and collects the log.

- It measures one animation frame late, holding the screenshot with `delayRender`. In a layout
  effect the composition wrapper has not been sized yet, every box has a zero-width parent, and
  right-anchored text wraps to one word per line: the probe reported the series tag at x −443
  until this was fixed.
- Elements in different beats (two beats mid-dissolve) are never compared.
- It checks text against text, not text against strokes: that is what the 2-second sheet is for.

## How the event detector works

Frames 0.5 s apart are compared; an event is a visible change (a pixel moving by more than 24
levels) over at least 0.25% of the frame, about a 70 × 70 px patch at 1080p. ffmpeg's
`freezedetect` was tried first and is wrong for this: it averages change over the whole frame
between consecutive frames, so it reported "static" while a still showed three neutrophils
drifting to the wall. Baselines and pilot were re-measured with the same detector.

At the quarter-scale measure render, a highlight smaller than about 120 × 56 px (`HL` w < 60 or
h < 28) under a 36 px label does not register. E03's table cells were 23% static until their
highlights were enlarged to that size (beatspec.tsx says so too).

## Mute review: does it explain itself?

The last check before a render is a person, or an agent, watching **with the sound off**. Copy
`templates/MUTE-REVIEW.md` into a fresh agent with the silent video's path; it extracts frames,
watches in order, and reports what it learned, where it did not know where to look, and what it
could not understand. Compare its list with the script's key points.

On the pilot (2026-10-09) the review found what no tool did: labels appearing in four corners in
turn, stamps pulling the eye away, pointers drawn to empty paper, a "?" and an unlabelled ring
of circles nobody could read, Latin left untranslated. A muted viewer learned nearly every point
from both the old and the sequenced version, but only the sequenced one stopped being faulted
for things happening at once.

Pass: every key point recovered, no moment of "did not know where to look" that lasts a beat,
nothing on screen the reviewer could not name.

## Score it

Score the 2-second sheet against `rubric.md`, with the numbers
above as evidence, and add any new failure to `mistakes.md`.

## Stills at beat ends (E01)

`node tools/stills.mjs <comp> <beats.json> <out> ends` renders each beat half a second before its
cut, with the picture fully built: the layout review that matters (midpoints show it half drawn,
and overlaps between early and late labels only exist at the end). `build-all.sh` makes
`sheet-ends.png`. On E01 it caught five overlapping label pairs that the midpoints missed.
