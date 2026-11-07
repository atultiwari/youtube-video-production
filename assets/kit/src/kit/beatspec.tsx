/**
 * Declare a beat as a list of steps instead of hand-wiring sequence(), NoteCard and Between.
 * Built for E01 (Nov 2026), where it carried 11 beats and about 200 steps.
 *
 *   export const B04 = makeBeat({
 *     chapter: "amber", heading: "Rules written by experts", kicker: "Who wrote the rules?",
 *     items: (b, C, w, h) => [
 *       { id: "n0", at: b.line(0), note: "Experts write the rules", ul: "rules" },
 *       { id: "film", at: b.word("standard", 1), dur: 40, where: [340, 400], until: "mycin",
 *         draw: (f) => <Ink strokes={[...]} from={f} durationInFrames={30} id="film" /> },
 *       { id: "cmeg", at: b.word("cardiomegaly", 1), dur: 24, where: [850, 300], draw: (f) => <>
 *           <HL x={850} y={300} w={200} h={44} at={f} id="cmegH" color={C.wash} />
 *           <Label text="cardiomegaly" x={850} y={312} at={f + 2} /> </> },
 *     ],
 *   });
 *
 * - Steps run in list order, each at its cue word or when the previous one ends (sequence()).
 *   List them in time order: a note listed after a later cue waits for it.
 * - `note` steps type on the card; every other step draws in the picture at its start frame.
 * - `until: "<id>"` hides a drawing when that step starts (a new picture in the same beat).
 * - The beat throws if its last step would end after the cut (fits()).
 * - A hook (a Short's frame-0 picture, drawn at negative frames) must not have `until`: an `until`
 *   item is wrapped in Between, which starts at the step's *sequenced* frame (after the pen-written
 *   heading, ~3.5 frames a character) and fades in, so the hook is missing at frame 0 (E03S3,
 *   Nov 2026). Put the hook in its own item with no `until`. An `until` item at frame ≤ 0 (usually a
 *   cue on the beat's first spoken word) is moved to frame 1 with a console warning (E05).
 * - Highlights that make a small arrival an event need area: under about 120 × 56 px (HL w ≥ 60,
 *   h ≥ 28) a table-cell highlight does not register in the quarter-scale measure render (E03:
 *   23% static until the cell highlights were enlarged).
 * - Labels alone are too small to count as events (36 px at a quarter-scale measure is under the
 *   detector's 0.25%-of-frame threshold): give a label step an `HL` highlight, or it leaves a
 *   static gap (E01's first build was 43% static for exactly this reason).
 */
import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";

import { useBeat, type BeatTiming } from "./beat";
import { SimplifiedTag } from "./Chrome";
import { Heading } from "./Heading";
import { NoteCard, type Note } from "./NoteCard";
import { Between, Picture, Wash } from "./Picture";
import { fits, FOCUS_GAP, sequence, type Sequence } from "./sequence";
import { P, type Pt } from "./shapes";
import { chapter, MOTION, useLayout, type Chapter } from "./style";

export interface Item {
  readonly id: string;
  /** Earliest local frame: usually `b.word("cue", line)` or `b.line(i)`. */
  readonly at: number;
  /** Frames the step occupies (default 20); notes compute their own from their length. */
  readonly dur?: number;
  /** Picture coordinates of the step, for eye-travel time between distant steps. */
  readonly where?: Pt;
  /** A note typed on the card, with an optional phrase underlined as it types. */
  readonly note?: string;
  readonly ul?: string;
  /** Picture content, given the step's start frame (and the whole sequence). */
  readonly draw?: (from: number, s: Sequence) => React.ReactNode;
  /** Hide this drawing when step `until` starts. */
  readonly until?: string;
}

export interface BeatSpec {
  readonly chapter: string;
  /** Pen-written heading at the top of the picture; "" for none (Shorts: first beat at most). */
  readonly heading: string;
  /** The card's question. */
  readonly kicker?: string;
  /** Show "Simplified picture" (default true; false for typeset-only beats). */
  readonly simplified?: boolean;
  readonly items: (b: BeatTiming, C: Chapter, w: number, h: number) => Item[];
}

export const makeBeat = (spec: BeatSpec): React.FC => {
  const Beat: React.FC = () => {
    const b = useBeat();
    const { fps } = useVideoConfig();
    const { picture } = useLayout();
    const C = chapter(spec.chapter);
    const items = useMemo(() => {
      return spec.items(b, C, picture.w, picture.h).map((it) => {
        if (!(it.until && it.at <= 0 && it.draw)) return it;
        // A cue on the beat's first spoken word lands on frame 0 (E05: "Boosting", "Naive"). Start
        // it on frame 1 instead of failing the build. A frame-0 hook with `until` would also land
        // here and be hidden at frame 0, so the warning says so; Shorts QA checks frame 0.
        console.warn(`beat ${b.id}: item "${it.id}" has until: "${it.until}" and starts at frame ${it.at}; moved to frame 1. `
          + "If it is a frame-0 hook, draw it in an item without `until`, or Between hides it at frame 0.");
        return { ...it, at: 1 };
      });
    }, [b, C, picture.w, picture.h]);
    const s = useMemo(() => {
      const steps = [
        ...(spec.heading ? [{ id: "heading", at: 0, dur: Math.round(spec.heading.length * MOTION.writeFramesPerChar) }] : []),
        ...items.map((it) => ({
          id: it.id,
          at: Math.max(0, it.at),
          dur: it.note ? Math.ceil((it.note.length / MOTION.typeCps) * fps) : it.dur ?? 20,
          ...(it.where ? { where: it.where } : {}),
        })),
      ];
      return fits(sequence(steps, FOCUS_GAP, [picture.w, picture.h]), b.durationInFrames, b.id);
    }, [items, fps, b, picture.w, picture.h]);
    const notes: Note[] = items.filter((it) => it.note).map((it) => ({
      at: s[it.id].from, text: it.note as string,
      ...(it.ul ? { underline: { phrase: it.ul, at: s[it.id].from } } : {}),
    }));
    return (
      <>
        {spec.heading ? <Heading text={spec.heading} at={s.heading.from} color={C.accent} /> : null}
        {spec.simplified === false ? null : <SimplifiedTag />}
        <Picture>
          {items.filter((it) => it.draw).map((it) => {
            const node = <React.Fragment key={it.id}>{it.draw!(s[it.id].from, s)}</React.Fragment>;
            return it.until ? <Between key={it.id} from={s[it.id].from} to={s[it.until].from}>{node}</Between> : node;
          })}
        </Picture>
        <NoteCard chapter={C} kicker={spec.kicker} kickerAt={notes[0]?.at ?? 0} notes={notes} />
      </>
    );
  };
  return Beat;
};

/**
 * A highlight wash multiplied onto the paper, so a label already under it stays legible. Use it
 * to make a label (or any small arrival) a real event: about w × h of visible change.
 */
export const HL: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string; color: string }> = ({ x, y, w, h, at, id, color }) => (
  <div style={{ position: "absolute", inset: 0, mixBlendMode: "multiply" }}>
    <Wash shape={P.blob(x, y, w, h, id, 0.06)} color={color} at={at} id={id} alpha={0.95} highlight />
  </div>
);
