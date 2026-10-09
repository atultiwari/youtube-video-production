# Art direction: the house style (illustrated and hybrid)

v2 had a production process and almost no design layer: every frame was a dark card on a dark
ground, a sixth of the frame used, no picture. This file is the design layer. Every number
here was measured in the v3 pilot (an 8-beat longform built and watched muted three times),
not chosen by taste; the reason for each rule is the failure that produced it.

## The style is data

A style is a JSON file in `styles/`, copied into the project as `src/kit/style.json` by
`scripts/install-kit.mjs`. Components read colours, type sizes, layout and motion from it. To
change the look, change the JSON; never put a colour or size literal in a beat.

| Style | Status | Use for |
|---|---|---|
| `paper-notes` | 16:9 piloted; 9:16 derived, checked on the kit demo | the default: medical and science explainers, Pathology Notes |
| `sketchbook` | not piloted (numbers from the biopsy build's source) | short, informal pieces; pilot it before relying on it |

Choose at step 0, with the mode. Record the choice in `STATUS.md` and the storyboard.

## paper-notes, in words

After two references: the Millennium Prize Problems video (layout, notes, chapter colours) and
the biopsy sketchbook build (the drawing).

- **Paper, one tint per chapter.** Grain and sparse specks over a ground colour; each chapter
  has an accent, a ground and a wash colour, sampled from the reference with
  `magick -colors 6` (accents) and a 1 × 1 resize of an empty corner (grounds). Never eyeball.
- **Picture left, note right (16:9); picture above, note below (9:16).** The picture zone is
  the content; the note is its caption.
- **A note card**: serif, typed in at 32 characters a second, the key phrase underlined in the
  chapter accent as it is typed, joined by a pointer line to the feature, once that is drawn.
- **Ink with a hand in it**: a jittered stroke plus a faint second pass, drawn on by a marker
  pen; held frames re-jitter 8 times a second (line boil) so nothing is ever frozen.
- **Watercolour washes** under the ink, **hatching** for shade and tissue.
- **A pen-written heading** carries the chapter ("1 · Vasodilation"); one constant **series
  tag** top right carries the video. Repeating the chapter in the tag put the same words twice
  in one frame (pilot D5).
- **A verdict or a name is a label on the thing it marks**, not a stamp in a corner: muted
  viewers lost the drawing every time a stamp pulled the eye away, and could not say who
  "Lewis · 1927" was (pilot, rounds 1–2). **"Simplified picture"** on every schematic, from the
  beat's first frame, so no still can pass for a micrograph.
- **Skin in more than one tone.** `tissue.skinTones` is a six-step ramp, light to dark; when
  people or patients are drawn, use several. Brief B needed the darkest tones for its point
  (models trained on light skin) and the style had one.

## Numbers that matter

| | 16:9 (1920 × 1080) | 9:16 (1080 × 1920) | Why |
|---|---|---|---|
| Minimum text | 36 px | 48 px | rubric; v2 card headers were 23 px |
| Note text | 54 px serif | 60 px serif | Millennium sets 42 px; phone test |
| Note length | ≤ 55 characters | ≤ 48 | must be read while the line is spoken |
| Picture zone | x 96–1186, y 150–1010 | x 72–1008, y 300–1040 | fill ≥ 50% of the frame |
| Bottom clear | — | 360 px (Shorts UI) | YouTube's overlay sits there |

Measured result on the pilot: median content box **94%** of the frame, against 21% for the v2
build of the same script and about 40% in the Millennium reference.

## Never

From the `never` list in each style, each one a failure seen:

- dark mock-UI or app chrome in an illustrated video;
- a frame of text with no picture (the v2 Short: type on a dark ground, nothing drawn);
- a micrograph or schematic without its label (stain and magnification, or "Simplified");
- text under the layout's minimum;
- a number the viewer might act on drawn by hand: numbers are typeset (remotion-whiteboard);
- a picture event that is small or slow, counted as the line's event (see 09-motion.md).
- a symbol with no words: a "?" or an unlabelled circle is the one mark a muted viewer cannot read;
- a Latin or technical term without its meaning beside it ("functio laesa · loss of function");
- a number before its measure is named (define SG before "SG > 1.020");
- a stamp or label in a fixed corner, away from the thing it marks;
- a channel ask in the middle of a chapter: asks go at a beat boundary or on the end card.

The last five came from watching the pilot with the sound off (`templates/MUTE-REVIEW.md`).

## Fonts

Loaded from local files, never fetched at render time: `install-kit.mjs` copies the style's
faces from Fontsource (OFL) into `public/fonts`. Fetching from Google during a render timed out
intermittently and stalled the whole composition (pilot F13). Record each font and its licence
in the validation file, with the other assets.
