# youtube-video-production

An end-to-end runbook for producing a YouTube video, Short or longform, narrated by a cloned TTS
voice and built in Remotion. It works in three modes: a **screen tutorial** with simulated app
screens, an **illustrated explainer** with drawn pictures, or a **hybrid** of the two.

It answers *"what do I do next"*, in order, and names the failure behind each rule so you can
argue with it rather than obey it. The order is the same for every subject; the mode, chosen
first, changes where reference comes from and what the picture is made of.

## The order

```
 0  Choose the mode (and style)   5a Storyboard                 10  Build
 1  Decide the piece              5b Key frames ── GATE 2 ──    10b Sound
 2  Validate the claims           6  Record the voiceover       11  Visual QA
 3  Reference                     7  Master                     12  Render
 4  Script                        8  Measure → grid → words     13  Publish
 5  ── GATE 1 ──                  9  Definitive capture
```

**Voice before picture**: the take is the clock, down to each transcribed word. **Two gates**:
the script, then the look. In a tutorial **capture happens twice**, before and after the
script; an illustrated explainer does reference research at step 3 and has no step 9.

## v3: the design layer

v2 made videos that were correct and well timed, and looked like type on an empty dark ground.
v3 adds the layer that was missing, every number measured in a hand-built pilot
(`pathology-notes/pilot-01-acute-inflammation`), not chosen by taste:

- **a house style as data** (`styles/*.json`): paper, chapter colours sampled from a reference,
  a type scale with minimums, layout grids for 16:9 and 9:16;
- **a storyboard stage** with a second gate: one picture per beat, events on cue words;
- **a component kit** (`assets/kit`, installed by `scripts/install-kit.mjs`) on top of
  `remotion-whiteboard`;
- **word-level timing** from the real takes;
- **sound design** from the picture, levelled under the voice;
- **visual QA with numbers**: a layout probe, frame fill, event gaps, a phone test.

Same script, before and after (scored on the rubric in the skills repo's `docs/v3-rubric.md`):
frame fill 21% → 94%, static runtime 61% → 0%, picture in 5 of 8 beats → 8 of 8, sound none →
effects and a bed at −1 dBTP.

## Skills it works with

It decides what happens and when; other skills do the making. **`remotion-whiteboard` is
required** for anything drawn or hand-written; `install-kit.mjs` installs its toolkit and stops
if the skill is missing. `motion-design` covers easing for non-drawn elements, and
`remotion-best-practices` covers the Remotion API.

## What ships with it

Self-contained: the scripts read nothing from a project they are not pointed at.

| | |
|---|---|
| `scripts/` | status, script and storyboard lints, draft grid, audio grid, mastering, word timing, kit install, sound design, frame fill, event gaps, contact sheets, YouTube chapters |
| `assets/kit/` | Remotion components and build/QA tools, copied into a project by `install-kit.mjs` |
| `styles/` | `paper-notes` (piloted) and `sketchbook` (not yet piloted) |
| `templates/` | `STATUS.md`, `STORYBOARD.md` |

## Reference files

Read one when you reach its stage, not before.

`01-plan-and-validate` · `02-capture-reference` · `03-script` · `04-voice` · `05-build` ·
`06-publish` · `07-art-direction` · `08-storyboard` · `09-motion` · `10-sound` · `11-visual-qa` ·
`12-pathology-visuals` · `13-longform` · `status-and-resuming` · `mistakes`

Each video keeps a `STATUS.md` (copy `templates/STATUS.md`). The completed steps are *derived*
from the filesystem rather than ticked by hand — a checklist drifts within a day — so the file
carries only what cannot be derived: the angle and why, what was rejected and why, what is
blocked, and what the owner has not decided.

`mistakes.md` is the catalogue: what went wrong, how it was found, what it cost. Several entries
look like other problems, so it is worth reading *before* debugging rather than after.

## Dated material

Prices, model names, tier boundaries and statute dates were correct on the `measuredOn` date in
`SKILL.md`. Anything marked **VERIFY** is re-checked against a primary source before it is said
on camera. Never inherit a number from this skill into a script.

## Installing

Symlink into `~/.claude/skills/` for every project, or a project's `.claude/skills/` for one:

```bash
ln -s "$PWD/youtube-video-production" ~/.claude/skills/youtube-video-production
```

Skills are discovered at session start, so it becomes available in the next session.

## Licence

MIT.
