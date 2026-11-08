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

## Draw real objects, from the library (E01, Nov 2026)

The owner approved E01 but said the pulse-oximeter finger, a rounded bar, "is not at all looking
like any finger". A medical audience reads primitive anatomy as careless. So:

- **Recurring objects come from `src/kit/objects.tsx`**: `finger` (side view, nail, cuticle,
  knuckle creases) with `oximeter`, `ecgStrip`, `chestFilm` (with heart and chest spans for a
  CTR), `heart` (anatomical, great vessels), `doctor`, `person`, `page`, `stack`; and since E02
  `wbc` (neutrophil, band, lymphocyte, monocyte, eosinophil, basophil on a Romanowsky film, drawn
  with `Cell`/`Rbc` from `cells.tsx`), `rbc`, `glassSlide`, `fundus`, `ivBag`, `monitor` with
  `arterialTrace`, `syringe`, `goBoard`, `blackboard`, `hospital` (page 2: `kit-objects-2`); and since
  E03 `sheet` (spreadsheet with cell, column and row rectangles), `database`, `foot` (plantar view,
  neuropathic ulcer, monofilament sites), `monofilament`, `phone`, `clock`, `testTube`, `headScan`
  (sagittal MRI with the face profile) (page 3: `kit-objects-3`); and since E04 `lesion` (nevus or
  melanoma, with a marker `ring`), `ruler` (cm/mm ticks, `cm` label points), `skinMarker`,
  `questionPaper` (`q(i)` and `title` label points), `padlock`, `dial` (page 4: `kit-objects-4`); and
  since E05 `hospitalBed` (ward bed, side view), `tree` (broad-leaved, `key` varies the crown; draw
  the trunk, then the crown wash over it), `blister` (strip of tablets) (page 5: `kit-objects-5`); since E06 `neuron` (multipolar, myelinated
  axon), `colonTile` (H&E colon mucosa, crypts cut across; `"normal"`: round evenly spaced crypts,
  basal nuclei, goblet cells; `"tumour"`: crowded irregular glands, stratified pencil nuclei,
  cribriform lumens, dirty necrosis; colours in `HE`), `network` (feed-forward diagram),
  `errorLandscape` (side-on loss curve with `height`/`slope`/`at`, a local and a global minimum,
  for frame-driven gradient descent), `kidney` (coronal section), `dog`, `car`, `apple` (everyday
  photo subjects), drawn in reading order by `src/kit/art.tsx` (`ColonTileArt`, `NeuronArt`,
  `NetworkArt`, `KidneyArt`, `DogArt`, `CarArt`, `AppleArt`); `Fills` (Picture.tsx) fills a few
  hundred small shapes in one layer (page 6: `kit-objects-6`); since E07 `twoByTwo` (the diagnostic
  2×2 table's geometry: frame, dividers, header strips, `cells`, `centre`, `colHead`/`rowHead`),
  `vial` (antibiotic vial: crimp, flip-off cap, label, powder), `coin` (one rupee, ₹), `bell` (alarm
  bell, `arcs` for ringing), and `src/kit/metrics.tsx`: a frame-driven 2×2 `Table` whose counts
  follow a prevalence function of the frame (`prevAt` steps whole percents, so 1,000 patients at
  90%/90% always show integer cells), `Slider` (prevalence), `PPVBar` (the alert row as true vs
  false alarms), `Squares` ("7 of 10" grids), `Plot`/`curve`/`dashed`/`Under` for ROC, PR and
  calibration curves (page 7: `kit-objects-7`); since E08 `ctScanner` (three-quarter CT: a rounded
  gantry whose bore fills most of it, side depth, plinth, a slim panel *beside* the bore, the
  patient table on its pedestal, optional patient; a square housing with a display above a small
  bore read as a washing machine), `ehrScreen` (desktop monitor with title bar, patient sidebar,
  alert `banner`, rows and a trend chart), `cloud`, `chip` (edge device), `wifi` (with a `cross`
  for offline) and `ultrasoundFan` (curved-array sector with a long-axis kidney, `pelvis` dark when
  blocked) (page 8: `kit-objects-8`); since E09 `reportSheet` (a printed hospital report laid out
  as real ones are: letterhead band with logo and name, centred title, a two-column patient-details
  box, section headings over body lines, signature and stamp; write only the name, the title and a
  key word or two as labels, the rest stays ruled lines), `clothBag` (drawstring sack: bag of
  words), `magnifier` (keyword search), `bookPile` (training text), `layerStack` (a transformer as
  stacked layer blocks with attention bands) and `attentionArc` (page 9: `kit-objects-9`); since E10
  `laptop` (open, seen from the front and a little above: bezel, webcam, hinge, a keyboard deck that
  widens towards the viewer with five rows of keys, space bar, touchpad and front lip; `screenBox`
  for text) and `serverRack` (cabinet, rails with screw holes, rack servers with drive bays, vent
  slots and status `leds`, feet: "the cloud" or a hospital's own server) (page 10: `kit-objects-10`); since
  E11 `examDesk` (Indian exam-hall desk in three-quarter view: wooden top in perspective, front edge,
  book rack under the top, steel legs, foot bar; `onTop(u, v)` places things on it, `rack` holds a
  closed book), `closedBook` (hardback, spine band, page block showing its thickness, title panel),
  `openBook` (pages curving into the gutter, page stacks, heading bars, text lines; `line(side, i)` /
  `lineBox` to highlight "the passage") and `journalPage` (running head, two-column body, a
  "References" rule and numbered entry slots for typeset citations) (page 11: `kit-objects-11`).
  E12 `chatWindow` (a desktop chat-assistant window: title bar with the three window buttons, the
  assistant's avatar and name slot, a scroll bar, a rounded message box with a round send button;
  `body` is where bubbles go), `leaflet` (a patient information leaflet: band with a round hospital
  logo, a pictogram panel with a scored tablet and a glass of water, headed sections with bullet
  dots, a footer band with a phone handset or a warning line) and `mcqSheet` (a single-best-answer
  sheet: header and marks box, numbered stem, four options with OMR answer bubbles; fill
  `bubble(k)` to mark the answer) (page 12: `kit-objects-12`). At 36 px a leaflet holds three
  sections of two bullets; pass `pic = 0.1` (0.14 let headings overlap the bullets on E12's first
  stills) and put a fourth point ("Keep away from children") in the footer, as real leaflets do. Each
  returns named parts so a beat draws them one step at a time.
  E13 `opdDesk` (an OPD consultation desk in slight perspective: drawer pedestal, modesty panel, a
  prescription pad and pen, and a phone recording on a stand: red dot, waveform, mic glyph),
  `seatedPerson` (a patient on a round OPD stool, side view, facing the desk), `ehrNote` (an EHR
  clinic note: patient banner with grey placeholder bars, never a name; an "AI draft" ribbon; SOAP
  letter tabs with `rowBox(i, j)` for highlights; Edit and Sign buttons), `tumourBoard` (a wall
  screen with an axial CT slice, liver lesion and a histology field, a long table, five oncologists
  across it and two from behind) and `usbPlug` (a USB-C plug and cable, for MCP's "USB-C port for
  AI") (page 13: `kit-objects-13`). At 36 px an `ehrNote` row holds about 20 characters at w ≈ 490;
  write notes in clinic shorthand ("Cough for 2 weeks", "SpO2 98%, temp 37 °C"). In a 48 px Short,
  give it one row per section.
- **Text written on a drawn screen is a label too** (E08): an EHR banner or phone screen line
  must pass the same 36/48 px minimum, so keep it to about nine characters ("BLEED?", "HIGH RISK")
  and size the screen to fit; 24 px banner text failed QA on 25 frames.
- **A paper-coloured `Wash` does not clear the picture.** Washes are translucent and multiply: a
  "cover" wash over earlier drawings left them showing through (E08 beats 9, 10, 12). Clear with
  `until: "<step>"` instead.
- **Kickers: about 24 characters at most** (E09): "Where is “discharge” on the map?" and "Do the
  lines explain the answer?" failed QA as `wraps kicker` on every frame of their beats.
- **Cue a picture on the line's first words, not a late noun** (E09): a line whose first drawn cue
  came 3–4 s in left the picture empty after the previous picture's `until` cleared it (eight such
  gaps in the first stills pass). Put the first item of each line at `b.line(i)` or an early word.
- **Repeated cue words reorder a beat** (E09): `b.word("count", 0)` hit "the next step was to
  count" two seconds before "count each one", and the whole beat's sequence shifted. Pass the
  occurrence, `b.word("count", 0, 1)`, when lint-beats reports the cue as repeated.
- **Shorts headings: about 22 characters at most.** "The pandemic changed the AI" and "Ranked
  right, numbers wrong" failed QA as `outside heading ""` on every frame of beat 1.
- **No typeset text inside an object.** Objects return label *points* (ruler `cm`, paper `q(i)`);
  the beat writes the text there with `Label`/HL at a size that passes QA (36 px at 16:9, 48 px in
  Shorts). An episode component that adds its own text (E04's X-ray letter tag) takes a size prop
  so a Short can raise it: E04S2 failed QA at the 40 px default and passed at 56–64 px.
- **A new object goes into the library first**, built from a reference picture's proportions,
  and is checked on the `kit-objects` still (`npx remotion still kit-objects out/objects.png
  --frame=59`) before any beat uses it.
- **Show the owner the episode's key objects on one still early**, with the storyboard, not
  first in the finished video.

- **Review every picture, not just beat ends** (E12): `node tools/stills.mjs <comp> <beats.json>
  <outDir> lines:public/<key>/lines.json` renders a still just before each spoken line after the
  first (`beat-NN-L<i>`, the picture fully built before an `until` clears it) plus each beat end.
  E12's first pass caught a cramped leaflet, a sheet over the heading and labels running off a
  card, none of which the `ends` stills showed.
