---
name: youtube-video-production
description: >-
  End-to-end runbook for a YouTube video, Short or longform, built in Remotion and narrated by a
  cloned TTS voice, in one of three modes: a screen tutorial with simulated app screens, an
  illustrated explainer with drawn pictures (medical and science teaching, Pathology Notes), or a
  hybrid. Covers the order of work: mode, claims, reference, script, voiceover, storyboard, build,
  sound, visual QA, render, publish; all drawing goes through remotion-whiteboard. Use when a
  YouTube video or Short starts or resumes ("make a video about X", "new Short", "what's next on
  that video", "build it"). Not for Manim animation or editing filmed footage.
license: MIT
metadata:
  author: Dr Atul Tiwari
  version: "3.0.0"
  measuredOn: "2026-10-10"
---

# Making a video, end to end

A runbook: "what do I do next", in order, with the failure behind each rule so you can argue
with it rather than obey it. The order is the same for every subject; the **mode** changes.

## 0 · Choose the mode

Decide before anything else, and record it as `mode:` in the video's `STATUS.md`. It changes
where reference comes from and what the picture is made of.

| | Screen tutorial `tutorial` | Illustrated explainer `illustrated` | Hybrid `hybrid` |
|---|---|---|---|
| Teaches | how to use an app or tool | a concept: pathology, physiology, any science | a concept, then the tool that applies it |
| Step 3 | reconnaissance capture of the app | reference research: atlases, micrographs, real objects | both, per beat |
| Step 9 | definitive capture | none | for the app beats only |
| Picture | app shots, built from captured reference | drawn pictures, through `remotion-whiteboard` | each beat in its own kind |

**Choose by what the viewer must see, not by habit.** If no beat needs a real interface, it is
illustrated. Without modes, a pathology baseline was sent to capture an app it never showed.

## The order, and why it is this order

```
 0  Choose the mode           tutorial, illustrated or hybrid; and the style
 1  Decide the piece          angle, audience, one idea
 2  Validate the claims       before a word is scripted
 3  Reference                 capture the app, or research what to draw
 4  Script                    then lint it
 5  ── GATE 1 ──              a human reads the script before a take is spent
 5a Storyboard                illustrated: one picture per beat, events on cue words
 5b Key frames ── GATE 2 ──   the owner approves the look, on stills
 6  Record the voiceover      sarvam-tts.py: the cloned voice, one take per beat
 7  Master                    to the delivery target
 8  Measure → grid → words    the takes decide every timing, to the word
 9  Definitive capture        tutorial and hybrid: the exact flows the script calls for
10  Build                     the kit (illustrated) or app shots (tutorial), on the grid
10b Sound                     effects from the picture, a bed, ducked under the voice
11  Visual QA                 probe, one focus, fill, event gaps, a 2-s sheet, a mute review
12  Render
13  Publish                   metadata, chapters, upload, schedule
```

**Voice before picture.** The take is the clock: every beat, animation and cut is placed from
the *measured* audio, then from each word's transcribed time. A word-count estimate was 25%
wrong on a whole script, and a median 1.3 s off per word. See `references/mistakes.md`.

**Capture twice** (tutorial, hybrid): reconnaissance before the script, so it promises only
what the app does; the definitive recording after, when the flow is known.

**One focus at a time.** One place drawn or written at a time, in reading order: the note, the
picture, its label, then the pointer. The video must teach with the sound off: `focus-check.py`
measures it, a fresh agent watching it muted tests it (09-motion.md, 11-visual-qa.md).

**Two human gates.** Gate 1, the script: cheap to change, takes are not. Gate 2, the look, on
key-frame stills before every beat is built: without it, v2 made type on an empty dark ground.

**Know where you are first**: `scripts/video-status.py` on the video's `STATUS.md`
(status-and-resuming.md); update the file last thing before stopping.

## Non-negotiables

1. **A claim gets a primary source before it gets a sentence.** Secondary sources are wrong
   often enough that this is not optional.
2. **Simulated interfaces are built from captured reference, never from memory** (tutorial,
   hybrid). Three rebuilds of one app's composer were wrong until the real thing was measured.
3. **Invented output is labelled on screen** (`Simulated — illustrative only`); schematics say
   `Simplified picture`.
4. **Nothing private appears in any frame**: not in a demo, a sidebar, live-account reference,
   or a slide label (12-pathology-visuals.md).
5. **Read written form fields back** before believing them. Typed values fail silently.
6. **Never hand-edit a timing file** (`beats.json`, `lines.json`). They are generated.

## Skills it orchestrates

| Skill or kit | Its job in a video |
|---|---|
| this skill's kit | `node <skill>/scripts/install-kit.mjs <project> --style paper-notes`: components, style, fonts, QA and build tools. Installs `remotion-whiteboard`'s toolkit first. |
| `remotion-whiteboard` | **Required for anything drawn or hand-written**: strokes, written text, the pen. |
| `motion-design` | easing and choreography for elements that are not drawn |
| `remotion-best-practices` | Remotion API usage |

**If `remotion-whiteboard` is not available, stop at the build step and say so**; never
improvise a drawing component. `install-kit.mjs` enforces it.

## Where the detail lives: read each file at its stage, not before

| File | Stage |
|---|---|
| `references/01-plan-and-validate.md` | 1–2 |
| `references/02-capture-reference.md` | 3 and 9: capture, or reference research when illustrated |
| `references/03-script.md` | 4–5, including the channel asks |
| `references/07-art-direction.md` | 0 (the style) and 5a–10: the house style, as data |
| `references/08-storyboard.md` | 5a–5b, Gate 2 |
| `references/04-voice.md` | 6–8 |
| `references/09-motion.md` | 8 (word timing) and 10: arrivals, events every 2–4 s |
| `references/05-build.md` | 10, tutorial shots and the whiteboard hand |
| `references/10-sound.md` | 10b |
| `references/11-visual-qa.md`, `references/rubric.md` | 11 |
| `references/12-pathology-visuals.md` | 3 and 10, for medical pictures |
| `references/13-longform.md` | videos over 12 minutes, chapters |
| `references/06-publish.md` | 12–13 |
| `references/status-and-resuming.md` | resuming a video, or recording a decision |
| `references/mistakes.md` | when something behaves oddly: read before debugging |

## Scripts that ship with it: each takes `--help`, and reads only the project it is given

| Stage | Scripts |
|---|---|
| status | `video-status.py` (which step a video is on, by mode) |
| 4–5a | `check-script.py` (TTS traps), `check-storyboard.py` (picture per beat, cue words, gaps) |
| 5b | `draft-takes.py` (a draft grid before the takes exist, for key frames only) |
| 6 | `sarvam-tts.py` (takes in the cloned voice through the API; key in `SARVAM_API_KEY`) |
| 7–8 | `master-audio.py`, `build-audio-grid.py`, `word-timestamps.py` (exact word times) |
| 10 | `install-kit.mjs <project>` (the kit, a style, fonts, tools), `make-paper.py` |
| 10b | `sound-design.py` |
| 11 | `focus-check.py`, `frame-fill.py`, `event-gaps.py`, `contact-sheet.py`; the kit's `tools/qa.mjs`, `tools/build-all.sh` |
| 13 | `chapters.py` (YouTube chapters from the grid) |

Templates: `STATUS.md`, `STORYBOARD.md`, `MUTE-REVIEW.md` in `templates/`. Styles: `styles/*.json`.

## Formats

**Short**: 1080×1920, delivered at 2160×3840 (`build-all.sh --deliver-4k`). 26–56 seconds, one
idea; the first line and the first frame decide everything. Bottom 360 px clear for the UI.

**Longform**: 1920×1080 at 30fps; seven to twelve minutes, or 15–30 for an illustrated lecture
built in 3–5 minute chapters (13-longform.md). Optional second language as an alternate track.

## What is dated

Prices, model names, tier boundaries and statute dates in the references were correct on the
`measuredOn` date above. Anything marked **VERIFY** is re-checked against its primary source
before it is said on camera. Never inherit a number from this skill into a script.
