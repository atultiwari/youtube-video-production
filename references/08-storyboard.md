# 5a–5b · Storyboard, key frames, and Gate 2 (illustrated and hybrid)

v2 went script → voice → build, and nothing in between decided what the viewer would see. The
build then defaulted to cards of text. The storyboard is where the picture is decided, while
it is still cheap to change.

## 5a · Storyboard

Copy `templates/STORYBOARD.md` next to the script. One block per beat:

- **picture** — the one central picture of the beat. It is built up across the beat, not
  replaced at every line: the pilot's forearm gains a red line, then a flare, then a wheal.
- **known thing** — what the picture borrows from the viewer's world (their own forearm, a
  splinter, a test tube). The same rule as v2's first line: open on something they own.
- **chapter** — a chapter name from the style (colour).
- **events** — `line N "cue word": what happens`. Each event lands on a word the narration
  says, so the picture moves when the voice names the thing.
- **notes** — `line N: text`, one per spoken line, short.

Rules, each from a measured failure:

| Rule | Why |
|---|---|
| Every beat has a picture; text is the caption, not the content | v2's Short had no picture in any beat; v2's longform had none in three of eight |
| One idea per frame: one note per spoken line | the note is read while the line is spoken |
| Every spoken line gets at least one **sizeable** picture event on a cue word | pilot: gaps sat exactly where a line's note had finished typing and nothing else moved |
| No stretch over 4 s without a visual event | the rubric's measure; v2 builds sat static for over half the runtime (52%, 53%) |
| An event is big (≥ about 70 × 70 px changed) and quick (≤ 6 frames to arrive) | a 42 px label, a thin arrow or an 18-frame fade does not register as an event (pilot F6, F7) |

Then lint it:

```
scripts/check-storyboard.py docs/A/STORYBOARD.md --lines public/A/lines.json
```

With `--lines` it checks every cue word is spoken in its line and computes the gaps. On the
pilot it flagged exactly the stretches the rendered video later measured as static, before
anything was built.

## 5b · Key-frame stills, then Gate 2

The look is approved on stills, before the whole video is built.

1. If the takes do not exist yet, make a draft grid: `scripts/draft-takes.py` writes silent
   takes sized at 179 wpm and the `lines.json` the kit reads; `build-audio-grid.py` makes the
   draft `beats.json`. Word-count timing is an estimate (25% wrong on one script), fine for a
   look, never for a release.
2. Build the **three hardest beats** (the most abstract idea, the busiest picture, the end
   card), then render a still at the midpoint of each and one every 2 s across them.
3. Run the QA probe on them (`node tools/qa.mjs <composition>`, see 11-visual-qa.md).
4. **Gate 2: the owner approves the look.** Show the stills and the phone sheet. Change the
   style, not the beats, if the look is wrong.

After Gate 2, build every beat the same way, against the real grid.

## Tutorial mode

A screen tutorial has no storyboard stage: its pictures are the app, captured. A hybrid
storyboards its concept beats only.
