---
name: youtube-video-production
description: >-
  End-to-end runbook for producing a YouTube video — Short or longform — narrated by a cloned
  TTS voice, built in Remotion, with simulated app screens and hand-drawn whiteboard sequences.
  Covers the whole order of work: plan, validate claims, capture reference, script, record the
  voiceover in the browser, master, time, build, render, publish. Use whenever a new video
  starts ("make a video about X", "new Short", "start the longform"), whenever one resumes
  ("what's next on that video", "record the voiceover", "build it"), and whenever a video needs
  screen recordings, simulated interfaces, a whiteboard hand, or a YouTube upload. Self-contained:
  the scripts it needs ship with it.
license: MIT
metadata:
  author: Dr Atul Tiwari
  version: "2.0.0"
  measuredOn: "2026-09-09"
---

# Making a video, end to end

A runbook. It answers "what do I do next", in order, and names the failure behind each rule so
you can argue with it rather than obey it.

Everything here was learned making explainer videos with a cloned voice and a Remotion build.
None of it is subject-specific — the same order works for a software tutorial, a clinical
explainer or a product walkthrough.

## The order, and why it is this order

```
 1  Decide the piece          angle, audience, one idea
 2  Validate the claims       before a word is scripted
 3  Reconnaissance capture    look at every screen you intend to show
 4  Script                    then lint it
 5  ── APPROVAL GATE ──       a human reads the script before a take is spent
 6  Record the voiceover      browser TTS, one take per beat
 7  Master                    to the delivery target
 8  Measure → grid            the takes decide every timing
 9  Definitive capture        record the exact flows the script now calls for
10  Build                     Remotion, against the measured grid
11  Stills review             one frame per beat, before any render
12  Render
13  Publish                   metadata, upload, schedule
```

**Voice before picture.** The take is the clock. Every beat boundary, animation and cut is
placed from the *measured* duration of real audio. Never from an estimate — a word-count
estimate was 25% wrong on a real script, and 89 words were cut to fix a runtime that was never
over. See `references/mistakes.md`.

**Capture twice, deliberately.** Reconnaissance capture (step 3) comes *before* the script,
because you cannot write "and it shows you the tier beside each plan" until you have seen
whether it does. Definitive capture (step 9) comes *after*, when you know the exact flow to
record. Doing it once, in the middle, produces both a script that promises things the app does
not do and footage that misses what the script needs.

**One human gate.** Step 5. Scripts are cheap to change and takes are not.

## Non-negotiables

1. **A claim gets a primary source before it gets a sentence.** Secondary sources are wrong
   often enough that this is not optional.
2. **Simulated interfaces are built from captured reference, never from memory.** Three rebuilds
   of one app's composer were wrong until the real thing was measured.
3. **Invented output is labelled on screen** — `Simulated — illustrative only`.
4. **Nothing private appears in any frame** — not in a demo, not in a sidebar, not in reference
   captured from a live account.
5. **Read written form fields back** before believing them. Typed values fail silently.
6. **Never hand-edit a timing file.** It is generated from the takes.

## Where the detail lives

Read a file when you reach its stage, not before.

| File | Stage |
|---|---|
| `references/01-plan-and-validate.md` | 1–2 |
| `references/02-capture-reference.md` | 3 and 9 |
| `references/03-script.md` | 4–5, including the channel asks |
| `references/04-voice.md` | 6–8 |
| `references/05-build.md` | 10–11, including the whiteboard hand |
| `references/06-publish.md` | 12–13 |
| `references/mistakes.md` | when something behaves oddly — read before debugging |

## Scripts that ship with this skill

Self-contained; they do not read anything from a project.

| | |
|---|---|
| `scripts/check-script.py` | lints narration for the delivery traps that break TTS |
| `scripts/build-audio-grid.py` | joins per-beat takes, fits languages, writes the frame grid |
| `scripts/master-audio.py` | gain plus true-peak limiting, iterated to target |

Run any of them with `--help`.

## Formats

**Short** — 1080×1920, delivered at 2160×3840 (both platforms give a 4K upload more bitrate, and
type-heavy content starves first). 26–56 seconds. One idea. The opening line decides everything.

**Longform** — 1920×1080 at 30fps, seven to twelve minutes. Optional second audio language as an
alternate track on the same upload, fitted to one shared frame grid.

## What is dated

Prices, model names, tier boundaries and statute dates in the references were correct on the
`measuredOn` date above. Anything marked **VERIFY** is re-checked against its primary source
before it is said on camera. Never inherit a number from this skill into a script.
