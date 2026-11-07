/**
 * Composed drawings of the E06 objects (Nov 2026): each one draws an object from objects.tsx in
 * reading order (outline, identifying detail, colour), starting at `at`. Shared so later
 * episodes (E21 pathology) reuse the same H&E tile.
 */
import React from "react";

import { apple, car, colonTile, dog, HE, kidney, network, neuron } from "./objects";
import { Dots, Fills, Ink, Wash } from "./Picture";
import { INK, TISSUE } from "./style";

/** The H&E colon tile: stroma wash, crypt cytoplasm, mucin, lumens, nuclei, then the outlines. */
export const ColonTileArt: React.FC<{ x: number; y: number; w: number; h: number; kind?: "normal" | "tumour"; at: number; id: string; dur?: number; outline?: boolean }> = ({
  x, y, w, h, kind = "normal", at, id, dur = 30, outline = true,
}) => {
  const t = colonTile(x, y, w, h, kind, id);
  const step = dur / 4;
  return <>
    <Wash shape={t.field} color={kind === "tumour" ? HE.stromaPale : HE.stroma} at={at} id={`${id}f`} alpha={0.95} amount={2} />
    {t.crypts.map((c, i) => <Wash key={i} shape={c.outline} color={HE.cyto} at={at + step * 0.5} id={`${id}c${i}`} alpha={0.95} amount={2} />)}
    <Fills shapes={t.crypts.flatMap((c) => c.goblets)} color={HE.mucin} at={at + step} alpha={0.95} />
    <Fills shapes={t.crypts.flatMap((c) => c.lumens)} color={HE.lumen} at={at + step} alpha={1} />
    {kind === "tumour" ? <>
      <Fills shapes={t.crypts.filter((c) => c.debris.length).flatMap((c) => c.lumens)} color={HE.necrosis} at={at + step * 1.5} alpha={0.5} />
      <Dots points={t.crypts.flatMap((c) => c.debris)} r={2.6} color={HE.nucleus} at={at + step * 1.5} every={0} />
    </> : null}
    <Fills shapes={t.stromaNuclei} color={HE.lymph} at={at + step * 2} alpha={0.9} />
    <Fills shapes={t.crypts.flatMap((c) => c.nuclei)} color={HE.nucleus} at={at + step * 2} alpha={0.95} />
    {outline ? <Ink strokes={[t.field]} from={at} durationInFrames={step} id={`${id}o`} width={3} double={false} pen={false} /> : null}
    <Ink strokes={t.crypts.map((c) => c.outline)} from={at + step * 2.5} durationInFrames={step} id={`${id}bm`} color="#B36A93" width={1.5} double={false} pen={false} jitterAmount={0.5} />
    <Ink strokes={t.crypts.flatMap((c) => c.walls)} from={at + step * 2.5} durationInFrames={step} id={`${id}w`} color="#C77FA5" width={1.2} double={false} pen={false} jitterAmount={0.4} />
  </>;
};

export const NeuronArt: React.FC<{ x: number; y: number; s?: number; at: number; id: string; dur?: number; color?: string }> = ({ x, y, s = 1, at, id, dur = 30, color = "#7A4E9E" }) => {
  const n = neuron(x, y, s);
  return <>
    <Wash shape={n.soma} color="#D9C3EA" at={at} id={`${id}sw`} alpha={0.9} />
    <Ink strokes={[n.soma, n.hillock]} from={at} durationInFrames={dur * 0.2} id={`${id}s`} color={color} />
    <Fills shapes={[n.nucleus]} color="#B9A0D8" at={at + dur * 0.15} />
    <Fills shapes={[n.nucleolus]} color="#4B3F8F" at={at + dur * 0.2} />
    <Ink strokes={n.dendrites} from={at + dur * 0.2} durationInFrames={dur * 0.35} id={`${id}d`} color={color} width={4} double={false} />
    <Ink strokes={[n.axon]} from={at + dur * 0.55} durationInFrames={dur * 0.2} id={`${id}a`} color={color} width={4} double={false} />
    {n.myelin.map((m, i) => <Wash key={i} shape={m} color="#F3E6B0" at={at + dur * 0.65} id={`${id}m${i}`} alpha={0.95} />)}
    <Ink strokes={n.myelin} from={at + dur * 0.65} durationInFrames={dur * 0.2} id={`${id}mi`} color={color} width={3} double={false} />
    <Ink strokes={n.terminals} from={at + dur * 0.8} durationInFrames={dur * 0.12} id={`${id}t`} color={color} width={4} double={false} />
    <Fills shapes={n.boutons} color={color} at={at + dur * 0.92} />
  </>;
};

/** A network diagram: edges first (light), then the nodes, washed by layer. */
export const NetworkArt: React.FC<{ x: number; y: number; w: number; h: number; layers?: number[]; r?: number; at: number; id: string; dur?: number; colors?: string[]; edgeColor?: string }> = ({
  x, y, w, h, layers = [3, 4, 4, 2], r = 26, at, id, dur = 24, colors = ["#A9C8EA", "#E3C27A", "#E3C27A", "#9CC59A"], edgeColor = "#8C8478",
}) => {
  const n = network(x, y, w, h, layers, r);
  const per = dur / layers.length;
  return <>
    {n.nodes.map((col, li) => <React.Fragment key={li}>
      {col.map((c, i) => <Wash key={i} shape={c} color={colors[Math.min(li, colors.length - 1)]} at={at + li * per} id={`${id}w${li}_${i}`} alpha={0.9} amount={2} />)}
      <Ink strokes={col} from={at + li * per} durationInFrames={per * 0.6} id={`${id}n${li}`} width={4} double={false} />
      {li < n.edges.length ? <Ink strokes={n.edges[li]} from={at + li * per + per * 0.5} durationInFrames={per * 0.6} id={`${id}e${li}`} color={edgeColor} width={2} double={false} pen={false} /> : null}
    </React.Fragment>)}
  </>;
};

export const KidneyArt: React.FC<{ x: number; y: number; s?: number; at: number; id: string; dur?: number }> = ({ x, y, s = 1, at, id, dur = 20 }) => {
  const k = kidney(x, y, s);
  return <>
    <Wash shape={k.capsule} color="#C9716A" at={at} id={`${id}w`} alpha={0.75} />
    {k.pyramids.map((p, i) => <Wash key={i} shape={p} color="#9E3F3A" at={at + dur * 0.4} id={`${id}p${i}`} alpha={0.6} />)}
    <Wash shape={k.pelvis} color="#F1E2C6" at={at + dur * 0.5} id={`${id}pv`} alpha={0.95} />
    <Ink strokes={[k.capsule, k.cortex, ...k.pyramids, k.pelvis, k.ureter]} from={at} durationInFrames={dur} id={id} color="#6E2A26" />
  </>;
};

/** Everyday photo subjects (ImageNet-style): a dog, a car, an apple. */
export const DogArt: React.FC<{ x: number; y: number; s?: number; at: number; id: string; dur?: number }> = ({ x, y, s = 1, at, id, dur = 16 }) => {
  const d = dog(x, y, s);
  return <>
    <Wash shape={d.body} color="#D9A55B" at={at} id={`${id}w`} alpha={0.85} />
    <Ink strokes={[d.body, ...d.farLegs, d.ear, d.mouth, d.collar, d.tail]} from={at} durationInFrames={dur} id={id} color="#5A3A1E" />
    <Fills shapes={[d.nose, d.eye]} color="#2A1A10" at={at + dur * 0.8} />
    <Ink strokes={[d.collar]} from={at + dur * 0.8} durationInFrames={4} id={`${id}c`} color={TISSUE.blood} width={6} double={false} pen={false} />
  </>;
};
export const CarArt: React.FC<{ x: number; y: number; s?: number; at: number; id: string; dur?: number; paint?: string }> = ({ x, y, s = 1, at, id, dur = 16, paint = "#7FA7D6" }) => {
  const c = car(x, y, s);
  return <>
    <Wash shape={c.body} color={paint} at={at} id={`${id}w`} alpha={0.85} />
    {c.windows.map((w, i) => <Wash key={i} shape={w} color="#E8F1F8" at={at + 3} id={`${id}g${i}`} alpha={0.95} />)}
    <Fills shapes={c.wheels} color="#2B2B2B" at={at + dur * 0.6} />
    <Fills shapes={c.hubs} color="#C9C9C9" at={at + dur * 0.7} />
    <Ink strokes={[c.body, ...c.windows, c.door, c.handle, c.lamp, ...c.wheels]} from={at} durationInFrames={dur} id={id} color={INK.line} />
  </>;
};
export const AppleArt: React.FC<{ x: number; y: number; s?: number; at: number; id: string; dur?: number }> = ({ x, y, s = 1, at, id, dur = 12 }) => {
  const a = apple(x, y, s);
  return <>
    <Wash shape={a.body} color="#D8453B" at={at} id={`${id}w`} alpha={0.9} />
    <Wash shape={a.leaf} color="#6FAE5A" at={at + 3} id={`${id}l`} alpha={0.95} />
    <Ink strokes={[a.body, a.stem, a.leaf]} from={at} durationInFrames={dur} id={id} color="#5A1E18" />
    <Ink strokes={[a.shine]} from={at + dur} durationInFrames={4} id={`${id}s`} color="#FFFFFF" width={6} double={false} pen={false} />
  </>;
};
