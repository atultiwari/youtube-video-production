/**
 * The youtube-video-production component kit (v3). Installed by the skill's
 * `scripts/install-kit.mjs`; the style is `style.json`, copied from `styles/<name>.json`.
 * Drawing sits on remotion-whiteboard (`../whiteboard`), which must be installed first.
 */

export { BeatContext, beatTiming, useBeat, useBoil, useMeasuring, type BeatTiming, type Grid, type LineTiming, type Lines } from "./beat";
export { Kicker, Paper, SeriesTag, SimplifiedTag, Stamp } from "./Chrome";
export { Film, type BeatEntry } from "./Film";
export { Heading } from "./Heading";
export { NoteCard, typeFrames, type Note } from "./NoteCard";
export { Between, Dots, dotsFrames, Drift, Fills, Hatch, Ink, Label, Picture, Ring, Wash, type InkProps } from "./Picture";
export { QAProbe } from "./QAProbe";
export { EYE_TRAVEL, fits, FOCUS_GAP, maxLate, noteStep, pointStep, sequence, type Sequence, type Slot, type Step } from "./sequence";
export { arrow, densify, jitter, P, rng, toPath, type Pt, type Pts } from "./shapes";
export { CHAPTERS, chapter, FONTS, INK, layoutFor, MOTION, STROKE, STYLE, TISSUE, useLayout, type Chapter, type Layout } from "./style";
export { HL, makeBeat, type BeatSpec, type Item } from "./beatspec";
export {
  arterialTrace, blackboard, box, chestFilm, circle, cubic, doctor, ecgStrip, ecgTrace, finger, fundus, glassSlide, goBoard,
  granules, heart, hospital, ivBag, monitor, oximeter, page, person, rbc, stack, STAIN, syringe, wbc, type CellKind,
  clock, database, foot, headScan, monofilament, phone, sheet, testTube,
  dial, lesion, padlock, questionPaper, ruler, skinMarker,
  blister, hospitalBed, tree,
  apple, car, colonTile, dog, errorLandscape, HE, kidney, network, neuron, type Crypt,
  bell, coin, twoByTwo, vial,
} from "./objects";
export { Cell, CELL_FRAMES, Rbc } from "./cells";
export { CELL, counts, curve, dashed, Glow, GREEN, npv, Plot, ppv, PPVBar, prevAt, Slider, Squares, Table, tableGeom, Under, type TableProps } from "./metrics";
export { Captions } from "./Captions";
