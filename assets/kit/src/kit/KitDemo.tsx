/**
 * The kit's demo and still test: one beat that uses every component, at 16:9 and 9:16.
 * `node tools/qa.mjs kit-demo` and `kit-demo-vertical` must report no issues on a fresh install.
 */

import React from "react";

import { useBeat, type Grid, type Lines } from "./beat";
import { SimplifiedTag, Stamp } from "./Chrome";
import { Film } from "./Film";
import { Heading } from "./Heading";
import { NoteCard } from "./NoteCard";
import { Dots, Hatch, Ink, Label, Picture, Ring, Wash } from "./Picture";
import { arrow, P } from "./shapes";
import { CHAPTERS, chapter, TISSUE, useLayout } from "./style";

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

const DemoBeat: React.FC = () => {
  const b = useBeat();
  const { picture } = useLayout();
  // The style's first chapter, so the demo shows a real accent whichever style is installed.
  const C = chapter(FIRST);
  const w = picture.w;
  const y = picture.h * 0.42;
  const walls = [P.quad(0, y - 110, w / 2, y - 124, w, y - 110), P.quad(0, y + 110, w / 2, y + 124, w, y + 110)];
  const lumen = [...walls[0], ...[...walls[1]].reverse()];
  const tissue = P.rect(0, y + 150, w, picture.h - y - 170, 18);
  return (
    <>
      <Heading text="Kit demo" at={2} color={C.accent} />
      <SimplifiedTag at={8} />
      <Picture>
        <Wash shape={lumen} color={TISSUE.plasma} at={20} id="lumen" alpha={0.6} />
        <Ink strokes={walls} from={4} durationInFrames={30} id="walls" />
        <Ink strokes={[0.2, 0.45, 0.7].map((k) => P.blob(w * k, y, 34, 21, `r${k}`, 0.05, 36))} from={30} durationInFrames={24}
          id="rbc" color={TISSUE.blood} pen={false} />
        <Label text="vessel" x={w / 2} y={y - 150} at={40} />
        <Hatch shape={tissue} at={b.line(1)} id="tissue" gap={22} alpha={0.15} />
        <Ink strokes={arrow(w / 2, y + 60, w / 2 + 10, y + 230, 0.05, 18)} from={b.word("escapes", 1)} durationInFrames={14} id="leak" color={C.accent} />
        <Wash shape={P.blob(w / 2, y + 240, 160, 60, "hl", 0.08)} color={C.wash} at={b.word("escapes", 1)} id="hl" alpha={0.8} highlight />
        <Dots points={[[w / 2 - 60, y + 230], [w / 2, y + 250], [w / 2 + 60, y + 225]]} r={8} color={TISSUE.protein} at={b.word("protein", 1)} />
        <Ring cx={w / 2} cy={y + 240} rx={190} ry={80} at={b.word("tissue", 1)} id="ring" color={C.accent} />
      </Picture>
      <NoteCard chapter={C} kicker="What leaks?" notes={[
        { at: 10, text: "A vessel carries plasma and red cells", underline: { phrase: "red cells", at: b.word("red", 0) }, anchor: [w / 2, y] },
        { at: b.line(1), text: "Protein escapes into the tissue", underline: { phrase: "into the tissue", at: b.word("tissue", 1) }, anchor: [w / 2, y + 240] },
      ]} />
      <Stamp text="exudate" at={b.word("tissue", 1) + 8} color={C.accent} />
    </>
  );
};

const BEATS = [{ id: "01", chapter: FIRST, Component: DemoBeat }];

export const KitDemo: React.FC = () => <Film grid={GRID} lines={LINES} beats={BEATS} series="Kit demo" />;
export const KIT_DEMO_FRAMES = GRID.totalFrames;
