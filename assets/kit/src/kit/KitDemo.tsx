/**
 * The kit's demo and still test: one beat that uses every component, at 16:9 and 9:16.
 * `node tools/qa.mjs kit-demo` and `kit-demo-vertical` must report no issues on a fresh install.
 */

import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";

import { useBeat, type Grid, type Lines } from "./beat";
import { SimplifiedTag, Stamp } from "./Chrome";
import { Film } from "./Film";
import { Heading } from "./Heading";
import { NoteCard } from "./NoteCard";
import { Dots, Hatch, Ink, Label, Picture, Ring, Wash } from "./Picture";
import { noteStep, pointStep, sequence } from "./sequence";
import { arrow, P } from "./shapes";
import { CHAPTERS, chapter, MOTION, TISSUE, useLayout } from "./style";

const FIRST = Object.keys(CHAPTERS)[0];

const GRID: Grid = { fps: 30, totalFrames: 300, beats: [{ beat: "01", startFrame: 0, durationFrames: 300 }] };
const LINES: Lines = {
  wpm: 179,
  beats: [{
    beat: "01", title: "Demo",
    lines: [
      { text: "A vessel carries plasma and red cells.", start: 0, duration: 4 },
      { text: "When the wall leaks, protein escapes into the tissue.", start: 4, duration: 6 },
    ],
  }],
};

const NOTES = ["A vessel carries plasma and red cells", "Protein escapes into the tissue"];

/**
 * The shape every beat follows: list the steps in reading order, let `sequence()` start each
 * one when the last has finished, and read every start frame from it. Nothing here is drawn or
 * written in two places at once (09-motion.md, "One focus at a time").
 */
const DemoBeat: React.FC = () => {
  const b = useBeat();
  const { fps } = useVideoConfig();
  const { picture } = useLayout();
  // The style's first chapter, so the demo shows a real accent whichever style is installed.
  const C = chapter(FIRST);
  const w = picture.w;
  const y = picture.h * 0.42;
  const walls = [P.quad(0, y - 110, w / 2, y - 124, w, y - 110), P.quad(0, y + 110, w / 2, y + 124, w, y + 110)];
  const lumen = [...walls[0], ...[...walls[1]].reverse()];
  const tissue = P.rect(0, y + 150, w, picture.h - y - 170, 18);
  const s = useMemo(() => {
    const note = (i: number) => noteStep(`n${i}`, b.line(i), NOTES[i], fps, MOTION.typeCps);
    return sequence([
      { id: "heading", at: 0, dur: Math.round("Kit demo".length * MOTION.writeFramesPerChar) },
      { id: "vessel", at: 0, dur: 30 },        // walls, then the lumen fills: one place
      note(0),
      { id: "cells", at: b.word("red", 0), dur: 26, where: [w / 2, y] },
      pointStep("p0", MOTION.pointerFrames),  // after the cells, so it lands on them
      note(1),
      { id: "tissue", at: b.word("wall", 1), dur: 18, where: [w / 2, y + 300] },
      { id: "leak", at: b.word("escapes", 1), dur: 26, where: [w / 2, y + 200] },
      pointStep("p1", MOTION.pointerFrames),
      { id: "ring", at: b.word("tissue", 1), dur: MOTION.ringFrames, where: [w / 2, y + 240] },
      { id: "stamp", at: 0, dur: 14, where: [w / 2, y + 240] },
    ]);
  }, [b, fps, w, y]);
  return (
    <>
      <Heading text="Kit demo" at={s.heading.from} color={C.accent} />
      <SimplifiedTag at={s.vessel.to} />
      <Picture>
        <Ink strokes={walls} from={s.vessel.from} durationInFrames={20} id="walls" />
        <Wash shape={lumen} color={TISSUE.plasma} at={s.vessel.from + 18} id="lumen" alpha={0.6} />
        <Ink strokes={[0.2, 0.45, 0.7].map((k) => P.blob(w * k, y, 34, 21, `r${k}`, 0.05, 36))} from={s.cells.from}
          durationInFrames={16} id="rbc" color={TISSUE.blood} pen={false} />
        <Label text="vessel" x={w / 2} y={y - 150} at={s.cells.from + 16} />
        <Hatch shape={tissue} at={s.tissue.from} id="tissue" gap={22} alpha={0.15} />
        <Ink strokes={arrow(w / 2, y + 60, w / 2 + 10, y + 230, 0.05, 18)} from={s.leak.from} durationInFrames={12} id="leak" color={C.accent} />
        <Wash shape={P.blob(w / 2, y + 240, 160, 60, "hl", 0.08)} color={C.wash} at={s.leak.from + 12} id="hl" alpha={0.8} highlight />
        <Dots points={[[w / 2 - 60, y + 230], [w / 2, y + 250], [w / 2 + 60, y + 225]]} r={8} color={TISSUE.protein} at={s.leak.from + 16} />
        <Ring cx={w / 2} cy={y + 240} rx={190} ry={80} at={s.ring.from} id="ring" color={C.accent} />
      </Picture>
      <NoteCard chapter={C} kicker="What leaks?" kickerAt={s.n0.from} notes={[
        { at: s.n0.from, pointAt: s.p0.from, text: NOTES[0], underline: { phrase: "red cells", at: s.n0.from }, anchor: [w / 2, y] },
        { at: s.n1.from, pointAt: s.p1.from, text: NOTES[1], underline: { phrase: "into the tissue", at: s.n1.from }, anchor: [w / 2, y + 240] },
      ]} />
      <Stamp text="exudate" at={s.stamp.from} color={C.accent} x={picture.x + w / 2 + 230} y={picture.y + y + 300} />
    </>
  );
};

const BEATS = [{ id: "01", chapter: FIRST, Component: DemoBeat }];

export const KitDemo: React.FC = () => <Film grid={GRID} lines={LINES} beats={BEATS} series="Kit demo" />;
export const KIT_DEMO_FRAMES = GRID.totalFrames;
