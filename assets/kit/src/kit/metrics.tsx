/**
 * Diagnostic-accuracy pictures for teaching episodes (E07, Nov 2026): a frame-driven 2×2 table
 * whose counts follow a prevalence function of the frame, a prevalence slider, the alert row as
 * a PPV bar, square grids ("7 of 10"), and plot helpers for ROC / PR / calibration curves.
 *
 * Counts are 1,000 patients at sensitivity and specificity 90%: at a whole-percent prevalence p
 * every cell is an integer (TP 9p, FN p, FP 100 − p, TN 900 − 9p), so stepping p with `prevAt`
 * never shows a fraction on screen. For other test characteristics, pass your own `p` function
 * and adapt `counts` (keep the cells integers; show the working in validation.md).
 *
 *   const p = (fr: number) => prevAt(fr, b.word("Watch", 0), b.line(1), 20, 2);
 *   <Table x={30} y={150} w={640} h={440} at={f} id="t" wash={{ tp: f, fp: f, fn: f, tn: f }}
 *     count={{ p, at: { tp: f + 6, fp: f + 6, fn: f + 6, tn: f + 6 } }} />
 *   <Slider x={110} y={720} w={520} at={f} id="sl" p={p} color="#F6D8A8" />
 *   <PPVBar x={730} y={290} w={320} at={f} id="pb" p={p} />
 *
 * Event note: a `Glow` at alpha ≤ 0.3 often does not register in the quarter-scale static
 * measure; give the step an HL label too, or raise alpha to ≥ 0.45 on a strong colour.
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { Fills, Hatch, Ink, Label, Wash } from "./Picture";
import { twoByTwo } from "./objects";
import { arrow, P, type Pt, type Pts } from "./shapes";
import { INK, TISSUE } from "./style";

export const CELL = { tp: "#B9DDB4", fp: "#F2B8B0", fn: "#F6D8A8", tn: "#C8DCEF" } as const;
export const GREEN = "#3C8D4F";
export type Cell = "tp" | "fp" | "fn" | "tn";

export const counts = (p: number) => ({ tp: 9 * p, fn: p, fp: 100 - p, tn: 900 - 9 * p });
export const ppv = (p: number) => { const c = counts(p); return c.tp / (c.tp + c.fp); };
export const npv = (p: number) => { const c = counts(p); return c.tn / (c.tn + c.fn); };
export const prevAt = (frame: number, a: number, b: number, p0: number, p1: number) =>
  Math.round(interpolate(frame, [a, b], [p0, p1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

export const Glow: React.FC<{ shape: Pts; at: number; id: string; color: string; alpha?: number }> = ({ shape, at, id, color, alpha = 0.4 }) => (
  <div style={{ position: "absolute", inset: 0, mixBlendMode: "multiply" }}>
    <Wash shape={shape} color={color} at={at} id={id} alpha={alpha} highlight />
  </div>
);

export interface TableProps {
  x: number; y: number; w: number; h: number; at: number; id: string;
  hw?: number; hh?: number;
  /** Frame the column and row headers appear (default at + 8). */
  heads?: number;
  /** Header words. */
  cols?: [string, string]; rows?: [string, string];
  /** Frame each cell's wash arrives. */
  wash?: Partial<Record<Cell, number>>;
  /** Frame each cell's name arrives (small, top of the cell). */
  names?: Partial<Record<Cell, number>>;
  nameText?: Partial<Record<Cell, string>>;
  /** Counts: from frame per cell, and a prevalence function of the frame. */
  count?: { at: Partial<Record<Cell, number>>; p: (frame: number) => number };
  size?: number; headSize?: number;
}

export const Table: React.FC<TableProps> = ({
  x, y, w, h, at, id, hw = 170, hh = 70, heads, cols = ["sepsis", "no sepsis"], rows = ["alert", "quiet"], wash = {}, names = {},
  nameText = { tp: "true positive", fp: "false positive", fn: "false negative", tn: "true negative" }, count, size = 64, headSize = 38,
}) => {
  const frame = useCurrentFrame();
  const t = twoByTwo(x, y, w, h, hw, hh);
  const hf = heads ?? at + 8;
  const p = count ? count.p(frame) : 0;
  const c = counts(p);
  const cells: Cell[] = ["tp", "fp", "fn", "tn"];
  return <>
    {cells.map((k) => wash[k] !== undefined ? <Wash key={k} shape={t.cells[k]} color={CELL[k]} at={wash[k]!} id={`${id}w${k}`} alpha={0.95} highlight /> : null)}
    <Ink strokes={[t.frame, ...t.dividers, ...t.headerLines]} from={at} durationInFrames={10} id={id} width={4} double={false} />
    <Label text={cols[0]} x={t.colHead[0][0]} y={t.colHead[0][1] + 13} at={hf} size={headSize} />
    <Label text={cols[1]} x={t.colHead[1][0]} y={t.colHead[1][1] + 13} at={hf + 2} size={headSize} />
    <Label text={rows[0]} x={t.rowHead[0][0]} y={t.rowHead[0][1] + 13} at={hf + 4} size={headSize} />
    <Label text={rows[1]} x={t.rowHead[1][0]} y={t.rowHead[1][1] + 13} at={hf + 6} size={headSize} />
    {cells.map((k) => names[k] !== undefined ? <Label key={`n${k}`} text={nameText[k] ?? ""} x={t.centre[k][0]} y={t.centre[k][1] - t.cellH * 0.5 + 46} at={names[k]!} size={36} /> : null)}
    {count ? cells.map((k) => count.at[k] !== undefined ? <Label key={`c${k}`} text={String(c[k])} x={t.centre[k][0]} y={t.centre[k][1] + size * 0.55} at={count.at[k]!} size={size} italic={false} weight={700} /> : null) : null}
  </>;
};

export const tableGeom = (x: number, y: number, w: number, h: number, hw = 170, hh = 70) => {
  const t = twoByTwo(x, y, w, h, hw, hh);
  const cx0 = x + hw, cy0 = y + hh;
  return {
    ...t,
    col: (i: number) => P.rect(cx0 + i * t.cellW - 4, cy0 - 4, t.cellW + 8, t.cellH * 2 + 8, 14),
    row: (j: number) => P.rect(cx0 - 4, cy0 + j * t.cellH - 4, t.cellW * 2 + 8, t.cellH + 8, 14),
    cellBox: (k: Cell) => { const [cx, cy] = t.centre[k]; return P.rect(cx - t.cellW / 2 + 2, cy - t.cellH / 2 + 2, t.cellW - 4, t.cellH - 4, 10); },
  };
};

export const Slider: React.FC<{ x: number; y: number; w: number; at: number; id: string; p: (frame: number) => number; color: string; size?: number; tick?: number }> = ({ x, y, w, at, id, p, color, size = 42, tick = 36 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const v = p(frame);
  const px = x + (v / 25) * w;
  return <>
    <Ink strokes={[P.line(x, y, x + w, y, 20)]} from={at} durationInFrames={8} id={`${id}t`} width={6} double={false} color={INK.line} />
    <Ink strokes={[2, 20].map((q) => P.line(x + (q / 25) * w, y - 16, x + (q / 25) * w, y + 16, 4))} from={at + 4} durationInFrames={6} id={`${id}k`} width={3} double={false} />
    <Label text="2%" x={x + (2 / 25) * w} y={y + 52} at={at + 4} size={tick} />
    <Label text="20%" x={x + (20 / 25) * w} y={y + 52} at={at + 4} size={tick} />
    <Fills shapes={[P.rect(x, y - 7, px - x, 14, 6)]} color={color} at={at} alpha={0.9} />
    <Fills shapes={[P.ellipse(px, y, 24, 24)]} color={TISSUE.blood} at={at} alpha={1} />
    <Label text={`prevalence ${v}%`} x={px} y={y - 40} at={at + 2} size={size} italic={false} weight={700} />
  </>;
};

export const PPVBar: React.FC<{ x: number; y: number; w: number; h?: number; at: number; id: string; p: (frame: number) => number; label?: boolean; labelSize?: number }> = ({ x, y, w, h = 56, at, id, p, label = true, labelSize = 40 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const v = p(frame);
  const c = counts(v);
  const k = w / 260;
  const a = c.tp * k, b = c.fp * k;
  return <>
    <Fills shapes={[P.rect(x, y, Math.max(4, a), h, 6)]} color={GREEN} at={at} alpha={0.85} />
    <Fills shapes={[P.rect(x + a, y, Math.max(4, b), h, 6)]} color={TISSUE.blood} at={at} alpha={0.75} />
    <Ink strokes={[P.rect(x, y, a + b, h, 6)]} from={at} durationInFrames={1} id={`${id}o`} width={3} double={false} pen={false} jitterAmount={0} />
    {label ? <Label text={`PPV ${c.tp}/${c.tp + c.fp} = ${(100 * ppv(v)).toFixed(1)}%`} x={x} y={y + h + 50} at={at + 2} size={labelSize} italic={false} weight={700} anchor="start" /> : null}
  </>;
};

export const Squares: React.FC<{ x: number; y: number; n: number; hit: number; cols: number; s: number; gap?: number; at: number; every?: number; hitColor: string; missColor: string }> = ({
  x, y, n, hit, cols, s, gap = 8, at, every = 1, hitColor, missColor,
}) => {
  const sq = (i: number) => P.rect(x + (i % cols) * (s + gap), y + Math.floor(i / cols) * (s + gap), s, s, 4);
  const all = Array.from({ length: n }, (_, i) => i);
  return <>
    <Fills shapes={all.filter((i) => i < hit).map(sq)} color={hitColor} at={at} every={every} alpha={0.9} />
    <Fills shapes={all.filter((i) => i >= hit).map(sq)} color={missColor} at={at + hit * every} every={every} alpha={0.75} />
  </>;
};

export const Plot: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string }> = ({ x, y, w, h, at, id }) => (
  <Ink strokes={[...arrow(x, y + h, x + w + 20, y + h, 0, 16), ...arrow(x, y + h, x, y - 20, 0, 16)]} from={at} durationInFrames={10} id={id} width={4} double={false} />
);

export const curve = (x: number, y: number, w: number, h: number, f: (u: number) => number, n = 40): Pts =>
  Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return [x + u * w, y + h - f(u) * h] as Pt; });
export const dashed = (a: Pt, b: Pt, n = 12): Pts[] =>
  Array.from({ length: n }, (_, i) => {
    const t0 = i / n, t1 = (i + 0.55) / n;
    return P.line(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1, 2);
  });

export const Under: React.FC<{ x: number; y: number; w: number; h: number; f: (u: number) => number; at: number; id: string; color?: string }> = ({ x, y, w, h, f, at, id, color }) => {
  const top = curve(x, y, w, h, f);
  const shape: Pts = [...top, [x + w, y + h], [x, y + h], top[0]];
  return <>
    <Wash shape={shape} color={color ?? "#E9D8A6"} at={at} id={`${id}w`} alpha={0.7} highlight />
    <Hatch shape={shape} at={at} id={id} durationInFrames={14} gap={22} />
  </>;
};

