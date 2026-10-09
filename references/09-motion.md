# Motion: arrivals, events and word timing (illustrated and hybrid)

How things arrive, how often, and exactly when. Easing and choreography for elements that are
not drawn belong to `motion-design`; drawing mechanics to `remotion-whiteboard`. This file
holds only what the pilot measured.

## Arrivals, with their default durations

All are constants in the style's `motion` block (`style.json`), read by the kit.

| Arrival | Default | Note |
|---|---|---|
| Ink drawn on | 0.6–1.5 s, scaled by path length | `Ink` / remotion-whiteboard `planStrokes`; linear overall on purpose |
| Pen-written heading | 3.5 frames per character | remotion-whiteboard's rate |
| Note typed | 32 characters a second | plan range 25–35; never reflows (untyped characters keep their space) |
| Pointer line | 12 frames | drawn from the card to the exact feature |
| Underline | 9 frames, on the spoken word | never before the phrase is typed |
| Highlight wash | 6 frames | must read as an event |
| Ground wash | 18 frames | reads as ambient, on purpose |
| Callout ring | 14 frames | 1.2 turns of a jittered ellipse |
| Stamp | 0.3 s, spring overshoot from 1.7× | `Stamp` |
| Beat change | 10-frame dissolve | |
| Hold | at least the time to read the note | the note stays until the next line |

## A visual event every 2–4 seconds

The rubric's criterion 5, and the most common way an otherwise good frame dies. Measured:

- v2 builds sat static (no event for 4 s or more) for **52%** (longform) and **53%** (Short)
  of their runtime, even with a cut on every line.
- The pilot's first build, with drawings and notes but no rule, still sat static for **35%**
  (measured with ffmpeg freezedetect, which undercounts; the true share was higher).
  The gaps were always the same place: after a line's note finished typing, until the next line.
- With one sizeable picture event per line, and a second on long lines, it reached **0%**.

What counts as an event, from the same measurement:

| Counts | Does not count |
|---|---|
| a drawn stroke of real size, a wash, a callout ring paired with a highlight, a stamp, a note retyping, a drift of a cell group, a cut | a slow push-in, line boil, a 42 px label alone, a thin arrow alone, any fade slower than about 6 frames |

So: **events are big and quick.** About a 70 × 70 px patch must visibly change within 0.5 s.
Plan them in the storyboard (`08-storyboard.md`), check them with `check-storyboard.py`, and
measure the render with `scripts/event-gaps.py` (11-visual-qa.md).

## The cut rule is a tutorial rule

v2's "cut every 4.9 seconds" was measured on a screen-recording video, where a cut is the only
way to change the picture. An illustrated video changes the picture by building it: the pilot
holds one picture per beat for 20–40 s and still never goes 4 s without an event. Cuts in an
illustrated video happen at beat boundaries.

## Word-level timing: land on the word, not near it

Draft timing (word share of a line at 179 wpm) is an estimate. Measured against a real take
(S-107, 157 words): a word lands a median **1.3 s** from where it is spoken, 2.6 s at the 90th
percentile, 3.1 s at worst. An underline that arrives a second after its word is a visible
miss.

After the takes are recorded and the grid is built, generate exact timing:

```
scripts/word-timestamps.py docs/A/script.md out/A/takes --lines public/A/lines.json
```

It transcribes each beat's take with `mlx_whisper` (word timestamps), aligns the transcript to
the script word by word, and rewrites `lines.json` with every line's start and every word's
time. The kit's `useBeat().word("…", line)` then returns the exact frame. It reports the share
of script words matched; under 85% means the wrong take or a script that drifted from the
recording. Treat `lines.json` like `beats.json`: generated, never hand-edited.

## Measuring held still

`--props='{"measure":true}'` turns off line boil and push-ins, so a detector sees only real
events. The kit's `useMeasuring()` and `useBoil()` handle it; any custom decorative motion must
check it too.
