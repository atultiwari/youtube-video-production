---
name: youtube-video-production
description: >-
  End-to-end runbook for producing a YouTube video, Short or longform, narrated by a cloned TTS
  voice and built in Remotion, in one of three modes: a screen tutorial with simulated app
  screens, an illustrated explainer with drawn pictures (medical and science teaching, Pathology
  Notes), or a hybrid of the two. Covers the whole order of work: choose the mode, plan, validate
  claims, gather reference, script, record the voiceover, master, time, build, render, publish.
  Orchestrates remotion-whiteboard, which does all drawing and hand-writing. Use whenever a new
  video starts ("make a video about X", "new Short", "start the longform"), whenever one resumes
  ("what's next on that video", "record the voiceover", "build it"), for any explainer, lecture,
  whiteboard, infographic, medical or science explainer, or Pathology Notes episode, and whenever
  a video needs screen recordings, simulated interfaces, a whiteboard hand, or a YouTube upload.
  Self-contained: the scripts it needs ship with it.
license: MIT
metadata:
  author: Dr Atul Tiwari
  version: "2.0.0"
  measuredOn: "2026-09-09"
---

# Making a video, end to end

A runbook. It answers "what do I do next", in order, and names the failure behind each rule so
you can argue with it rather than obey it.

Everything here was learned making videos with a cloned voice and a Remotion build. The order
is the same for every subject; what changes is the **mode**, chosen first.

## 0 · Choose the mode

Decide before anything else, and record it as `mode:` in the video's `STATUS.md`. It changes
where reference comes from and what the picture is made of.

| | Screen tutorial `tutorial` | Illustrated explainer `illustrated` | Hybrid `hybrid` |
|---|---|---|---|
| Teaches | how to use an app or tool | a concept: pathology, physiology, any science | a concept, then the tool that applies it |
| Step 3 | reconnaissance capture of the app | reference research: atlases, micrographs, real objects | both, per beat |
| Step 9 | definitive capture | none | for the app beats only |
| Picture | app shots, built from captured reference | drawn pictures, through `remotion-whiteboard` | each beat in its own kind |

**Choose by what the viewer must see, not by habit.** If no beat needs a real interface, the
video is illustrated. Before modes existed, every video was steered toward mock app screens:
an illustrated pathology baseline was sent to "reconnaissance capture" for an app it never
showed, and a Short on an abstract idea came out as type on a dark ground with no picture at all.

## The order, and why it is this order

```
 0  Choose the mode           tutorial, illustrated or hybrid
 1  Decide the piece          angle, audience, one idea
 2  Validate the claims       before a word is scripted
 3  Reference                 capture the app, or research what to draw
 4  Script                    then lint it
 5  ── APPROVAL GATE ──       a human reads the script before a take is spent
 6  Record the voiceover      browser TTS, one take per beat
 7  Master                    to the delivery target
 8  Measure → grid            the takes decide every timing
 9  Definitive capture        tutorial and hybrid: the exact flows the script calls for
10  Build                     Remotion, against the measured grid
11  Stills review             one frame per beat, before any render
12  Render
13  Publish                   metadata, upload, schedule
```

**Voice before picture.** The take is the clock. Every beat boundary, animation and cut is
placed from the *measured* duration of real audio. Never from an estimate — a word-count
estimate was 25% wrong on a real script, and 89 words were cut to fix a runtime that was never
over. See `references/mistakes.md`.

**Capture twice, deliberately** (tutorial and hybrid). Reconnaissance capture (step 3) comes
*before* the script, because you cannot write "and it shows you the tier beside each plan" until
you have seen whether it does. Definitive capture (step 9) comes *after*, when you know the exact
flow. Doing it once, in the middle, produces a script that promises things the app does not do
and footage that misses what the script needs.

**One human gate.** Step 5. Scripts are cheap to change and takes are not.

**Know where you are before doing anything.** A video spans days and several sittings. Each one
keeps a `STATUS.md`; start by running `scripts/video-status.py` against it, which derives the
completed steps from the filesystem and surfaces the decisions a person wrote down. Read
`references/status-and-resuming.md` once, then keep the file current — updating it is the last
thing you do before stopping, never something reconstructed later.

## Non-negotiables

1. **A claim gets a primary source before it gets a sentence.** Secondary sources are wrong
   often enough that this is not optional.
2. **Simulated interfaces are built from captured reference, never from memory** (tutorial,
   hybrid). Three rebuilds of one app's composer were wrong until the real thing was measured.
3. **Invented output is labelled on screen** — `Simulated — illustrative only`.
4. **Nothing private appears in any frame** — not in a demo, not in a sidebar, not in reference
   captured from a live account.
5. **Read written form fields back** before believing them. Typed values fail silently.
6. **Never hand-edit a timing file.** It is generated from the takes.

## Skills it orchestrates

This skill decides what happens, and when. The making belongs to other skills; do not repeat
their content here.

| Skill | Its job in a video |
|---|---|
| `remotion-whiteboard` | **Required for anything drawn or hand-written:** strokes, written text, the pen and the hand. Install its toolkit into the video project once: `node ~/.claude/skills/remotion-whiteboard/scripts/install.mjs <project>` |
| `motion-design` | easing and choreography for elements that are not drawn |
| `remotion-best-practices` | Remotion API usage |

**If `remotion-whiteboard` is not available, stop at the build step and say so.** Do not
improvise a hand or a drawing component. In v2 the hand worked only because one project
happened to hold a copy of the whiteboard skill; outside it there was no engine.

## Where the detail lives

Read a file when you reach its stage, not before.

| File | Stage |
|---|---|
| `references/01-plan-and-validate.md` | 1–2 |
| `references/02-capture-reference.md` | 3 and 9: capture, or reference research when illustrated |
| `references/03-script.md` | 4–5, including the channel asks |
| `references/04-voice.md` | 6–8 |
| `references/05-build.md` | 10–11, including the whiteboard hand |
| `references/06-publish.md` | 12–13 |
| `references/status-and-resuming.md` | resuming a video, or recording a decision |
| `references/mistakes.md` | when something behaves oddly — read before debugging |

## Scripts that ship with this skill

Self-contained; they do not read anything from a project.

| | |
|---|---|
| `scripts/video-status.py` | says which step a video is on, derived from what is on disk |
| `scripts/check-script.py` | lints narration for the delivery traps that break TTS |
| `scripts/build-audio-grid.py` | joins per-beat takes, fits languages, writes the frame grid |
| `scripts/master-audio.py` | gain plus true-peak limiting, iterated to target |

Run any of them with `--help`. `templates/STATUS.md` is the per-video status file to copy.

## Formats

**Short** — 1080×1920, delivered at 2160×3840 (both platforms give a 4K upload more bitrate, and
type-heavy content starves first). 26–56 seconds. One idea. The opening line decides everything.

**Longform** — 1920×1080 at 30fps, seven to twelve minutes. Optional second audio language as an
alternate track on the same upload, fitted to one shared frame grid.

## What is dated

Prices, model names, tier boundaries and statute dates in the references were correct on the
`measuredOn` date above. Anything marked **VERIFY** is re-checked against its primary source
before it is said on camera. Never inherit a number from this skill into a script.
