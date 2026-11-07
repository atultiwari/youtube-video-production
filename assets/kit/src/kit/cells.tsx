/**
 * Renders the blood-film objects of objects.tsx (wbc, rbc) in house style: cytoplasm wash,
 * membrane, nucleus wash and outline, then granules popping in. One component per cell so a
 * beat can place a whole film in a few lines. Added for E02 (Nov 2026).
 */
import React from "react";

import { Dots, Ink, Wash } from "./Picture";
import { rbc, STAIN, wbc, type CellKind } from "./objects";

/** Frames a `Cell` takes to finish drawing. */
export const CELL_FRAMES = 22;

export const Cell: React.FC<{ kind: CellKind; cx: number; cy: number; r: number; at: number; id: string; dur?: number }> = ({
  kind, cx, cy, r, at, id, dur = CELL_FRAMES,
}) => {
  const c = wbc(kind, cx, cy, r);
  const d = Math.max(8, Math.round(dur * 0.45));
  return (
    <>
      <Wash shape={c.membrane} color={c.cyto} at={at} id={`${id}c`} alpha={0.85} />
      <Ink strokes={[c.membrane]} from={at} durationInFrames={d} id={`${id}m`} width={3} pen={false} color="#6E5A7E" />
      {c.nucleus.map((n, i) => <Wash key={i} shape={n} color={STAIN.nucleusWash} at={at + d} id={`${id}n${i}`} alpha={0.95} />)}
      <Ink strokes={[...c.nucleus, ...c.bridges]} from={at + d} durationInFrames={Math.max(6, dur - d - 4)} id={`${id}nu`} width={4} color={STAIN.nucleus} pen={false} />
      {c.vacuoles.length ? <Ink strokes={c.vacuoles} from={at + d} durationInFrames={4} id={`${id}v`} width={2} color="#8A8FA8" pen={false} double={false} /> : null}
      {c.granules.length ? <Dots points={c.granules} r={c.granuleR} color={c.granule} at={at + d} every={0} /> : null}
    </>
  );
};

/** A red cell with its central pallor. */
export const Rbc: React.FC<{ cx: number; cy: number; r: number; at: number; id: string }> = ({ cx, cy, r, at, id }) => {
  const c = rbc(cx, cy, r, id);
  return (
    <>
      <Wash shape={c.rim} color={STAIN.rbc} at={at} id={`${id}w`} alpha={0.7} />
      <Wash shape={c.pallor} color={STAIN.rbcPale} at={at} id={`${id}p`} alpha={0.9} />
      <Ink strokes={[c.rim]} from={at} durationInFrames={8} id={`${id}i`} width={2.5} color="#B5655C" pen={false} double={false} />
    </>
  );
};
