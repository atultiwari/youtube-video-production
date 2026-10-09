# 10–11 · Build, and review with stills

**Mode matters here.** The sections marked *(tutorial)* apply to tutorial videos and to the app
beats of a hybrid. An illustrated video, or a hybrid's concept beats, is built from the kit
(`scripts/install-kit.mjs`): one picture per beat built up on cue words, a note card, the house
style as data. Read 07-art-direction.md, 08-storyboard.md and 09-motion.md for it; this file
keeps what both modes share (timing, stills, gotchas) and the tutorial shots.

**The kit in one paragraph.** `Film` places beats on the grid, each on its chapter's paper with
the series tag. A beat calls `useBeat()` for `line(i)` and `word("cue", i)` frames, draws inside
`<Picture>` with `Ink`, `Wash`, `Hatch`, `Ring`, `Label`, `Dots`, `Drift`, and writes notes with
`<NoteCard>`. Wrap `Film` in your own component (composition props are serialised, so beats
cannot be passed as props). Copy the shape of `src/kit/KitDemo.tsx`.

## Timing comes from the takes

`beats.json` is generated from measured take durations. Beat components get no duration of their
own — they read their slot from the grid. A component that hardcodes a length is a component that
breaks when a take is re-recorded.

Both language variants are the **same composition** with a `language` prop selecting the audio.
That is what makes them one upload with an alternate track rather than two videos splitting the
same audience.

## Iterate with stills, never renders

A layout question is answered by one frame:

```
npx remotion still <composition-id> out.png --frame=N
```

Seconds instead of minutes, same answer.

**Before calling a build done, render one still at the midpoint of every beat**, then one every
2 s, and run the checks in 11-visual-qa.md. Midpoints caught two bugs spot-checking missed; the
2-second sheet caught every label collision the midpoints missed.

## Cut far more often than feels necessary (tutorial)

In an illustrated video the picture changes by being built, not by cutting: the v3 pilot held
one picture per beat for 20–40 s and still never went 4 s without a visual event. There, cut at
beat boundaries and plan events instead (09-motion.md). The rule below is for screen recordings.

Measured on a well-performing 8:28 reference: **103 distinct cuts — one every 4.9 seconds**,
median shot **4.1s**. Half the shots under four seconds, three quarters under six, only twice
holding past ten.

A first build averaged one cut every **16 seconds**. That alone was most of what "not engaging"
meant. Budget several shots per beat, not one.

## Never show a whole interface (tutorial)

The reference does not do it once. Every app shot is **pushed in on the region of interest**, so
type appears two to three times the size it is in the product. Complete, accurate, unreadable
screens are worth nothing on a laptop.

Where the whole screen matters, move the frame — do not ask the viewer's eye to hunt.

## Showing detail: magnify over a blur (tutorial)

The move that carries this genre: blur the app back to texture, darken it, and lay a **framed
card** over it — gradient border, a header strip naming what is being shown, near-black body,
text at forty-odd pixels, and a stroke underlining the exact phrase.

Backgrounds: **pure black for app shots.** A decorative gradient belongs to window-framed shots;
when the frame pushes into an interface the ground goes to black.

## What replaces a presenter (tutorial)

Most videos in this genre keep a circular talking head in a corner, and it is doing one job:
keeping something alive in frame so a static screen recording does not feel static. Without an
avatar, that job still needs doing:

- **Scale changes** between window-level and panel-level shots.
- **Animated underlines** aimed at one token, not a region. Required to arrive *on* the word being
  spoken — a stroke that is simply present has already missed its moment.
- **A progress spine** in the margin that fills as the video advances. It also tells a late viewer
  how much is left, which a corner face does not.
- **The whiteboard hand**, for anything theoretical.

## The whiteboard hand

**`remotion-whiteboard` is the drawing engine, and it is required.** Everything drawn or
hand-written in a video (strokes, written text, the pen, the hand) is built with its components.
Install its toolkit into the video project once, then set the house colours in its `tokens.ts`:

```
node ~/.claude/skills/remotion-whiteboard/scripts/install.mjs <project>
```

If that skill is not installed, **stop here and say so**; do not improvise a hand or a drawing
component. This file decides *when* to draw and with *which* pen; that skill decides *how*, and
its rules win on drawn elements.

Dry stretches — definitions, regulations, a list of principles — should be **written, not
typeset**. Watching a rule being written is a different experience from being shown one, and it
costs only the seconds the words were going to take anyway. It is also the thing a screen-recording
channel cannot copy.

**Hand or pen?**

| | |
|---|---|
| **Hand** — a photographed hand holding a marker | **Longform, 16:9.** There is room for a forearm. |
| **Pen** — the bare marker | **Shorts, 9:16.** A hand fills a vertical frame. |

The hand is the stronger choice wherever it fits: it is *"the single biggest produced-versus-amateur
tell"*.

**The forearm must run off the frame edge.** A forearm that stops mid-canvas with a crop line is
the first amateur tell on the list. Size the hand from the frame, not from the component's default
— one default left a cut-off sleeve floating when the nib sat halfway down a 1080 frame. The nib
sits near the asset's top, so roughly 93% of the hand hangs below the contact point; size from
that, then check a still. In `remotion-whiteboard` that is the `handSize` prop:
`(frameHeight - nibY) / 0.93`, plus a margin.

The engine already handles the rest: the nib measured in the asset, rotation about the nib, and
real type written along a single-line skeleton rather than plotter glyphs. Do not re-implement
any of them in a video project.

## Labelling

Every simulated output carries `Simulated — illustrative only`. Every invented case is fabricated
and the script says so aloud.

## Gotchas paid for

**An absolutely-positioned fill inside an unpositioned parent collapses.** Wrapping one in a plain
`<div>` to apply a filter rendered an empty background. Use the same fill component for the
wrapper.

**Hoist persistent overlays to the composition root.** A rule badge rendered by each beat was
forgotten by one beat — precisely the failure a persistent badge exists to prevent. A rule visible
in six demonstrations out of seven is not one a viewer can rely on.

**Ease-out on a process reads as progress.** An eased reveal at 39% through shows 77% done, which
made a training loop appear converged while the narration said it was still guessing. Linear for
processes; keep easing for arrivals.

**Set type must wait for the pen.** Anything appearing beside hand-written text needs an explicit
start frame, or it arrives before the heading it belongs to.

**A video element past its last frame is not reliably anything.** To hold on the end of a clip,
switch to a still image of that frame.
