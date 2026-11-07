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

## One focus at a time: the first rule

At any moment, **one place** on screen is being drawn, written or arriving. The note is typed;
then the pointer goes to the feature it names; then the feature is drawn; then its label is set;
then the next step begins. Nothing is drawn or written in two places at once.

Why it comes first: the first v3 builds never stood still, but they split attention. A picture
event landed on every line while the note typed beside it and a wash arrived somewhere else.
The owner watched one and said it plainly: drawing in several places at once distracts, and
the video should explain itself in sequence, even without the narration. `focus-check.py`
measured what they saw: the pilot spent 17% of its runtime, and the agent-built Short 27%,
with two to six places changing at once. Sequenced, the same pilot fell to 3% (all of it
handoffs of under half a second), still with no static stretch.

**How the kit enforces it.** Each beat lists its steps in reading order and `sequence()` (in
`src/kit/sequence.ts`) starts each one at its cue word, or when the previous step has finished,
whichever is later, with a 4-frame pause between:

```tsx
const s = fits(sequence([
  { id: "heading", at: 0, dur: 56 },
  noteStep("n0", b.line(0), NOTES[0], fps, MOTION.typeCps),
  { id: "red", at: b.word("red", 0), dur: 30, where: [250, 420] },  // stroke, then its label
  pointStep("p0", MOTION.pointerFrames, "red"),                       // lands on the red line
  ...
], FOCUS_GAP, [layout.picture.w, layout.picture.h]), b.durationInFrames, b.id);
<Ink from={s.red.from} … />  <Label at={s.red.from + 18} … />
```

Pass the picture's own size on 9:16 (the default is the 16:9 picture), and always wrap the
sequence in `fits()`: it throws when a beat is overfull and its last steps would land after the
cut, where nobody sees them. Without it, a label silently never appeared in brief B and every
other check passed; in the pilot, three rings did the same.

- **A step is one place.** A wash filling the shape just drawn, and its label, belong to that
  step. Things in two places are two steps, even if they are "the same idea" (three cells
  drifting to the wall are three steps).
- **A step's `dur` covers everything in it.** The last of 22 dots landing one frame apart, or a
  `Between` fading out, is still that step. Use `dotsFrames(count, every)` for a run of dots.
  `Between` fades out *after* its `to`, so the old drawing goes as part of the next step.
- **Reading order within a line:** the note first (the claim), then the picture that shows it,
  then its label. The underline grows as its phrase is typed (never on its own afterwards: it
  then lands while the next step draws elsewhere); the pointer after the picture.
- **A heading can be a line's note.** If a line only names the chapter, the pen-written heading
  says it; do not type the same words beside it.
- **The pointer lands on something.** A note's pointer is its own step,
  `pointStep(id, frames, target)`, where `target` is the step that draws what the note's
  `anchor` points at; `sequence()` throws if that step has not come first. Give the target a
  `where` and use `anchor: s.p0.where`, so the pointer ends exactly where its target is drawn.
  Target the step that *shows the idea*: the filled tube, the packed cells, not the empty
  outline drawn before them (mute round 3: "points at an empty tube"). Placed by hand it
  ended on blank paper four times in one video, then four more after a fix, each time because
  the anchor named a later step than the one the pointer followed (mute reviews, 2026-10-09).
- **Chrome arrives with the beat.** The "Simplified" tag, the chapter tag and the kicker show
  from the beat's first frame, as part of the cut. Faded in later, they land with the first note
  and are a second place to look (the pilot and brief B both measured it).
- **Give the eye time to travel.** One at a time is not enough when consecutive steps are far
  apart: four labels in four corners within two seconds lost a muted viewer. Steps carry
  `where` (picture coordinates) and `sequence()` adds up to 14 frames to cross the picture.
  Better still, order steps so each lands near the last. Inside one step, nothing lands in two
  far-apart places at once: two labels set on the same frame in opposite corners are two steps.
- **A list goes in one region.** Items set around a picture, each where it belongs (five
  signs in five corners), arrive one at a time and still send the eye around the frame: two
  muted reviewers in a row lost the thread there. Stack a list in one place, or draw each
  item's connector to the picture as the item arrives, so the eye has a path.
- **Say it where it applies.** A stamp in a fixed corner pulled the eye away from the drawing
  every time; a verdict or a name is a label (with a highlight) on the thing it names.
- **Lateness is the price.** A step may start after its cue word. With word-timed narration,
  keep it under about a second: shorten notes, merge steps, or cut decorative ones. An event
  added only to fill time is the first to go.

## A visual event every 2–4 seconds

The rubric's criterion 5, and the most common way an otherwise good frame dies. Measured:

- v2 builds sat static (no event for 4 s or more) for **52%** (longform) and **53%** (Short)
  of their runtime, even with a cut on every line.
- The pilot's first build, with drawings and notes but no rule, still sat static for **35%**
  (measured with ffmpeg freezedetect, which undercounts; the true share was higher).
  The gaps were always the same place: after a line's note finished typing, until the next line.
- With one sizeable picture event per line, and a second on long lines, it reached **0%**,
  and it stayed at 0% after sequencing: events in turn are still events.

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

## Labels are not events (E01, Nov 2026)

E01's first full build was **43% static** although every line had a cue-word step: most steps
were 36–42 px labels, small dots and thin rings. At the measure render's quarter scale a label is
about 9 px of text, under the detector's 0.25%-of-frame threshold, and a viewer reads it the
same way: nothing happened. Two rounds of fixes brought it to 2%:

- **Every label arrives with a highlight** (`HL` in `src/kit/beatspec.tsx`, a wash multiplied
  onto the paper so the text stays legible). A label alone is never a line's event.
- **Long lines get a second note.** A note retyping is a big event; a 20-second line with one
  note and three labels goes static.
- **Find gaps before the full render.** `tools/build-all.sh` now stops when more than
  `--max-static` (10%) is static and runs `gap-words.py`, which lists the words spoken in each
  gap, so the fix lands on a cue word. A gap that already contains a cue word means that step's
  event is too small, not missing.
- **Rings, ticks, crosses and small moving objects are not events either** (E06, Nov 2026: 26%
  static on the first measure with a cue word in almost every gap). A `Ring` round a nucleus, a
  `Tick`, a 22 px ball rolling down a landscape: each is too small at quarter scale. Give the step
  an `HL` label or a highlight `Wash` with area (a multiplied wash over the region the ring points
  at). 30 such additions took E06 to 4%.
- **A white `HL` is invisible on a washed shape** (a label inside a filled node): highlight in the
  chapter accent and ink the text white.

## Declaring beats (`src/kit/beatspec.tsx`)

`makeBeat({ chapter, heading, kicker, items })` turns a list of steps into a beat: each step has
an `id`, an `at` (cue word or line start), and either a `note` (typed on the card) or a
`draw(from)` (in the picture), plus `until` to hide a drawing when a later step starts. It wraps
`sequence()`, `fits()`, `NoteCard`, `Between`, the heading and the Simplified tag. E01's 11 beats
were written this way; start a new episode from it rather than wiring each beat by hand. List
steps in time order: a note listed after a later cue waits for it. Step ids must be unique
within a beat: makeBeat throws naming the beat and id, and `tools/lint-beats.mjs` (run first by
`build-all.sh`) catches literal duplicates before the QA pass (E06 lost a 10-minute QA run to one).

## Shorts with the kit (E01 Shorts, Nov 2026: four Shorts, 35–56 s, all 0% static on the first build)

- **Frame 0 shows the hook**: draw the hook object at negative frames (`from={-60}`), not from the
  step's start. `makeBeat` starts every step after the heading, so a hook drawn "at 0" was still
  being drawn on frame 0.
- **No heading after the first beat**: `heading: ""` in `makeBeat` (the note carries the beat).
- **Labels are 48 px minimum on 9:16** (the QA probe flags 44 px); every label gets an `HL`.
- **Burned-in captions**: `<Captions grid lines />` (src/kit/Captions.tsx) over the `Film`, one
  line of ≤ 5 words above the 360 px the platforms cover, current word highlighted.
- **End frame**: a highlighted "Full episode: <title>" label as the last step, with
  `build-audio-grid.py --end-hold 1.5`. The channel asks go in the pinned comment, not the narration.
- **Re-recording**: a possessive of a respelled name ("MYCIN's") came back as "myscience" twice;
  rewording to "the choices MYCIN made" fixed it on the first try.

