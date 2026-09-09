# 3 and 9 · Capturing reference and footage

Two passes, and the split matters.

## Pass 1 — reconnaissance, before the script

Open every screen the video intends to show and look at it. You are answering:

- Does the app actually do what the script wants to claim?
- What is on screen that the audience will recognise?
- Which parts are legible when scaled to fit a frame, and which need magnifying?

Scripts written without this promise things the product does not do.

## Pass 2 — the definitive capture, after the script

Now you know the exact flow. Record it deliberately: start settled, do one thing, end settled.
Leave a still second at each end so the editor has somewhere to cut.

## Build interfaces from reference, never from memory

This is the single biggest quality lever and the one most often skipped.

One app's prompt box was rebuilt three times. The first two were invented from memory and both
looked like a generic dark form. What was actually true, once measured:

- It is a **pill** — radius half its height — not a rounded rectangle with a tool row beneath.
- Everything sits on **one line**.
- The send button is a **brand colour**, not white, and changes glyph when there is text.
- The reading column is exactly **768 CSS pixels**.

None of these are things a viewer could name. All of them are why the earlier versions read as
mock-ups. **Go and look. It takes ten minutes and nothing else fixes it.**

Measure, don't eyeball. In the browser console, `getBoundingClientRect()` and
`getComputedStyle()` give exact sizes, radii and colours. Record them in a comment beside the
component.

## Screenshot or recording?

**Recording** when the content does not fit one screen — a pricing page whose plan columns and
feature lists never share a viewport, a multi-step flow. One screenshot cannot hold it.

**Screenshot** when the state is static and the point is a single moment.

For a recording used as evidence, find the still stretches before cutting: sample every 0.25s,
crop to the content area, and diff consecutive frames. Cut a clip that *ends* on a still stretch,
then hold on a frozen frame of its last frame — a video element past its last frame is not
reliably anything.

## Capturing from a live, signed-in account

Sometimes the only accurate reference is the real account. Then:

- **Reference only — no pixels from it ship.** Rebuild from what you saw. This also removes the
  blurring step, which is a step that can fail.
- **Capture the region, not the window**, so sidebars of real history stay out of frame.
- **Change nothing.** Do not send messages, accept upsells, or alter settings. If a dialog offers
  "Turn on" or "Upgrade", dismiss it with the close control.
- **Clear anything typed** into a live field afterwards, and verify it is clear.
- **Do not transcribe or reproduce** what you saw.

Say plainly, afterwards, what was seen and what was changed.

## Pages that cannot be captured headlessly

Some sites serve a bot-check interstitial to headless browsers. Working around a bot check is off
limits — ask a person to capture that page instead. Automating past it is not a fallback.

## Analysing a reference video locally

Ask for an offline copy; `yt-dlp` is frequently blocked and embeds are often disabled. Local
ffmpeg analysis beats browser screenshots.

- **Cut rhythm:** `select='gt(scene,0.12)'` with `metadata=print`, then cluster hits within 0.5s —
  one transition fires the detector over several frames and the raw count triples.
- **Window bounds** in a screen recording: scan rows and columns for the dark region's edges, then
  `crop=w:h:x:y` to drop the desktop surround.
