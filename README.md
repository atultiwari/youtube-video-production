# youtube-video-production

An end-to-end runbook for producing a YouTube video — Short or longform — narrated by a cloned
TTS voice, built in Remotion, with simulated app screens and hand-drawn whiteboard sequences.

It answers *"what do I do next"*, in order, and names the failure behind each rule so you can
argue with it rather than obey it. Nothing in it is subject-specific: the same order works for a
software tutorial, a clinical explainer or a product walkthrough.

## The order

```
 1  Decide the piece          6  Record the voiceover      11  Stills review
 2  Validate the claims       7  Master                    12  Render
 3  Reconnaissance capture    8  Measure → grid            13  Publish
 4  Script                    9  Definitive capture
 5  ── APPROVAL GATE ──      10  Build
```

Two things about that order are deliberate and were learned the hard way. **Voice comes before
picture**, because the take is the clock — a word-count estimate was 25% wrong on a real script.
And **capture happens twice**: reconnaissance before the script, because you cannot write what an
app shows until you have seen it, and the definitive recording after, when you know the flow.

## What ships with it

Self-contained — the scripts read nothing from any project.

| | |
|---|---|
| `scripts/check-script.py` | lints narration for the traps that break TTS |
| `scripts/build-audio-grid.py` | joins per-beat takes, fits a second language, writes the frame grid |
| `scripts/master-audio.py` | gain and true-peak limiting, iterated to target |

## Reference files

Read one when you reach its stage, not before.

`01-plan-and-validate` · `02-capture-reference` · `03-script` · `04-voice` · `05-build` ·
`06-publish` · `mistakes`

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
