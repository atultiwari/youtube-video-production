/**
 * Composed drawings of the E06 objects (Nov 2026): each one draws an object from objects.tsx in
 * reading order (outline, identifying detail, colour), starting at `at`. Shared so later
 * episodes (E21 pathology) reuse the same H&E tile.
 */
import React from "react";

import { enclosure, pawPrint, toneScale, zooGate, zooMap } from "./objects";
import { endoView, mammogram, seeSaw } from "./objects";
import { papSmear, PAP, passport, scales, worldMap } from "./objects";
import { chestXray, headCT, skinProbe, uNet } from "./objects";
import { breastTile, coreSlide, filmToken, HEAT, heatSpot, modelCard, shapWaterfall, snowBank, superpixels } from "./objects";
import { apple, car, clipboard, colonTile, detective, dog, drLesions, forger, fundus, HE, heSlide, kidney, microscope, network, neuron, researchArticle, retinalCamera, squamousTile, thyroidTile } from "./objects";
import { Dots, Fills, Ink, Wash } from "./Picture";
import { INK, TISSUE } from "./style";
import { P } from "./shapes";

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

/* E14 (Nov 2026): the GAN pair, the microscope, an H&E slide, a DR fundus and two more H&E tiles. */

/** A colour fundus photograph (left eye) with disc, cup, macula and vessels; `dr` adds the
 * moderate NPDR lesions (microaneurysms, dot/blot haemorrhages, hard exudates near the macula). */
export const FundusArt: React.FC<{ cx: number; cy: number; r: number; at: number; id: string; dr?: number }> = ({ cx, cy, r, at, id, dr }) => {
  const f = fundus(cx, cy, r);
  const l = drLesions(cx, cy, r);
  return <>
    <Wash shape={f.field} color="#D9783A" at={at} id={`${id}w`} alpha={1} highlight />
    <Wash shape={f.disc} color="#F6E3A8" at={at + 4} id={`${id}d`} alpha={1} />
    <Wash shape={f.cup} color="#FFF8E0" at={at + 6} id={`${id}c`} alpha={1} />
    <Wash shape={f.macula} color="#9E4A22" at={at + 4} id={`${id}m`} alpha={0.8} />
    <Ink strokes={[f.field]} from={at} durationInFrames={8} id={id} width={3} />
    <Ink strokes={f.vessels} from={at + 4} durationInFrames={10} id={`${id}v`} color="#8E1F1A" width={Math.max(3, r / 45)} double={false} pen={false} />
    {dr !== undefined ? <>
      <Fills shapes={[...l.microaneurysms, ...l.haems]} color="#7A1414" at={dr} every={1} />
      <Fills shapes={l.exudates} color="#F7DC6F" at={dr + 8} every={1} stroke="#C9A227" />
    </> : null}
  </>;
};

/** The microscope, base first, then the arm, stage, nosepiece and head. */
export const MicroscopeArt: React.FC<{ x: number; y: number; s?: number; at: number; id: string; dur?: number }> = ({ x, y, s = 1, at, id, dur = 18 }) => {
  const m = microscope(x, y, s);
  return <>
    <Wash shape={m.base} color="#E8E2D2" at={at} id={`${id}b`} alpha={1} />
    <Wash shape={m.arm} color="#E8E2D2" at={at} id={`${id}a`} alpha={1} />
    <Wash shape={m.stage} color="#2B2F36" at={at + dur * 0.3} id={`${id}s`} alpha={1} />
    <Wash shape={m.condenser} color="#9AA0A6" at={at + dur * 0.3} id={`${id}c`} alpha={1} />
    {m.objectives.map((o, i) => <Wash key={i} shape={o} color="#C9CED4" at={at + dur * 0.5} id={`${id}o${i}`} alpha={1} />)}
    <Wash shape={m.coarse} color="#3A3F46" at={at + dur * 0.4} id={`${id}k`} alpha={1} />
    <Wash shape={m.lamp} color="#FFF3B0" at={at + dur * 0.4} id={`${id}l`} alpha={1} highlight />
    <Ink strokes={[m.base, m.arm, m.stage, m.clip, m.condenser, m.coarse, m.fine, m.lamp]} from={at} durationInFrames={dur * 0.6} id={id} width={3} />
    <Wash shape={m.head} color="#E8E2D2" at={at + dur * 0.5} id={`${id}hd`} alpha={1} />
    {m.eyepieces.map((e, i) => <Wash key={i} shape={e} color="#3A3F46" at={at + dur * 0.6} id={`${id}e${i}`} alpha={1} />)}
    <Ink strokes={[m.head, m.nosepiece, ...m.objectives, ...m.eyepieces]} from={at + dur * 0.5} durationInFrames={dur * 0.5} id={`${id}h`} width={3} />
  </>;
};

/** An H&E slide: glass, frosted end, coverslip, the pink section with its purple core. */
export const HeSlideArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string }> = ({ x, y, w, h, at, id }) => {
  const g = heSlide(x, y, w, h);
  return <>
    <Wash shape={g.glass} color="#EAF4F8" at={at} id={`${id}g`} alpha={1} />
    <Wash shape={g.frost} color="#FFFFFF" at={at} id={`${id}f`} alpha={1} />
    <Wash shape={g.tissue} color={HE.stroma} at={at + 4} id={`${id}t`} alpha={1} />
    <Wash shape={g.core} color={HE.nucleusLight} at={at + 6} id={`${id}c`} alpha={0.8} />
    <Ink strokes={[g.glass, g.frost, g.cover]} from={at} durationInFrames={8} id={id} width={3} />
  </>;
};

/** The forger at the easel; the painting on the canvas is the caller's (draw a tile in `canvasBox`). */
export const ForgerArt: React.FC<{ x: number; y: number; s?: number; at: number; id: string; dur?: number }> = ({ x, y, s = 1, at, id, dur = 20 }) => {
  const f = forger(x, y, s);
  return <>
    <Wash shape={f.canvas} color="#FFFDF6" at={at} id={`${id}cv`} alpha={1} />
    <Ink strokes={[...f.legs, f.mast, f.ledge, f.clamp, f.canvas]} from={at} durationInFrames={dur * 0.4} id={`${id}e`} color="#7A5530" width={4} />
    <Wash shape={f.smock} color="#9FB7CF" at={at + dur * 0.3} id={`${id}s`} alpha={1} />
    <Wash shape={f.head} color="#E8C3A0" at={at + dur * 0.3} id={`${id}h`} alpha={1} />
    <Wash shape={f.beret} color="#4A3B5C" at={at + dur * 0.3} id={`${id}b`} alpha={1} />
    <Ink strokes={[f.head, f.nose, f.beret, f.stalk, f.smock, ...f.arm, f.otherArm, ...f.trousers]} from={at + dur * 0.3} durationInFrames={dur * 0.4} id={`${id}p`} width={4} />
    <Ink strokes={[f.brush]} from={at + dur * 0.6} durationInFrames={dur * 0.15} id={`${id}r`} color="#5B3A1E" width={5} double={false} />
    <Wash shape={f.palette} color="#D9B48A" at={at + dur * 0.6} id={`${id}pl`} alpha={1} />
    <Fills shapes={f.blobs} color={HE.nucleusLight} at={at + dur * 0.7} every={1} />
    <Fills shapes={[f.blobs[0], f.blobs[2]]} color={HE.stroma} at={at + dur * 0.75} />
    <Wash shape={f.jar} color="#CFE3EA" at={at + dur * 0.6} id={`${id}j`} alpha={1} />
    <Ink strokes={[...f.table, f.palette, f.jar, ...f.jarBrushes]} from={at + dur * 0.6} durationInFrames={dur * 0.3} id={`${id}t`} width={3} />
  </>;
};

/** The detective with the magnifier raised. */
export const DetectiveArt: React.FC<{ x: number; y: number; s?: number; at: number; id: string; dur?: number }> = ({ x, y, s = 1, at, id, dur = 20 }) => {
  const d = detective(x, y, s);
  return <>
    <Wash shape={d.coat} color="#C9B27C" at={at} id={`${id}c`} alpha={1} />
    <Wash shape={d.head} color="#E8C3A0" at={at} id={`${id}h`} alpha={1} />
    <Wash shape={d.hat} color="#5A4632" at={at} id={`${id}ht`} alpha={1} />
    <Wash shape={d.brim} color="#5A4632" at={at} id={`${id}br`} alpha={1} />
    <Ink strokes={[d.head, d.nose, d.hat, d.brim, d.band, d.coat, ...d.collar, d.belt, d.buckle, ...d.buttons, d.otherArm]} from={at} durationInFrames={dur * 0.6} id={id} width={4} />
    <Wash shape={d.lens} color="#CFE6F5" at={at + dur * 0.5} id={`${id}l`} alpha={0.55} />
    <Ink strokes={[...d.arm, d.handle, d.rim, d.lens, d.glint]} from={at + dur * 0.5} durationInFrames={dur * 0.5} id={`${id}m`} width={4} />
  </>;
};

/** Keratinising squamous carcinoma tile: stroma, nests, keratin pearls with whorls, nuclei. */
export const SquamousTileArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string; dur?: number }> = ({ x, y, w, h, at, id, dur = 24 }) => {
  const t = squamousTile(x, y, w, h, id);
  return <>
    <Wash shape={t.field} color={HE.stroma} at={at} id={`${id}f`} alpha={0.95} amount={2} />
    {t.nests.map((n, i) => <Wash key={i} shape={n} color="#F2C3D8" at={at + dur * 0.2} id={`${id}n${i}`} alpha={1} amount={2} />)}
    {t.pearls.map((n, i) => <Wash key={i} shape={n} color="#F06FA0" at={at + dur * 0.4} id={`${id}p${i}`} alpha={1} amount={2} />)}
    <Ink strokes={t.whorls} from={at + dur * 0.5} durationInFrames={dur * 0.3} id={`${id}w`} color="#B23A72" width={1.6} double={false} pen={false} jitterAmount={0.4} />
    <Fills shapes={t.nuclei} color={HE.nucleus} at={at + dur * 0.6} alpha={0.95} />
    <Ink strokes={[t.field]} from={at} durationInFrames={dur * 0.3} id={`${id}o`} width={3} double={false} pen={false} />
  </>;
};

/** Thyroid tile: stroma, follicles, colloid, a ring of follicular nuclei. */
export const ThyroidTileArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string; dur?: number }> = ({ x, y, w, h, at, id, dur = 24 }) => {
  const t = thyroidTile(x, y, w, h, id);
  return <>
    <Wash shape={t.field} color={HE.stromaPale} at={at} id={`${id}f`} alpha={0.95} amount={2} />
    {t.follicles.map((n, i) => <Wash key={i} shape={n} color={HE.cyto} at={at + dur * 0.2} id={`${id}l${i}`} alpha={1} amount={2} />)}
    {t.colloid.map((n, i) => <Wash key={i} shape={n} color="#EE9CC0" at={at + dur * 0.4} id={`${id}c${i}`} alpha={1} amount={2} />)}
    <Fills shapes={t.nuclei} color={HE.nucleus} at={at + dur * 0.6} alpha={0.95} />
    <Ink strokes={[t.field]} from={at} durationInFrames={dur * 0.3} id={`${id}o`} width={3} double={false} pen={false} />
  </>;
};

/* B1 (Nov 2026): a research article's first page, a checklist clipboard and a retinal camera. */

/** The first page of a research article: sheet and masthead, title block, abstract box, methods
 * column, the flow figure and results. Text is the caller's (Labels in the returned slots). */
export const ArticleArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string; band?: string; dur?: number }> = ({ x, y, w, h, at, id, band = "#2F5E8E", dur = 20 }) => {
  const a = researchArticle(x, y, w, h);
  return <>
    <Wash shape={a.sheet} color="#FFFFFF" at={at} id={`${id}s`} alpha={1} highlight />
    <Wash shape={a.band} color={band} at={at + 1} id={`${id}b`} alpha={1} />
    <Ink strokes={[a.sheet, a.rule, a.footer]} from={at} durationInFrames={dur * 0.35} id={id} width={3} />
    <Ink strokes={a.titleLines} from={at + dur * 0.2} durationInFrames={dur * 0.15} id={`${id}t`} width={7} color="#3A3F46" double={false} pen={false} />
    <Ink strokes={a.aff} from={at + dur * 0.3} durationInFrames={dur * 0.1} id={`${id}a`} width={3} color="#B5BBC2" double={false} pen={false} />
    <Wash shape={a.abstract} color="#EAF1F8" at={at + dur * 0.35} id={`${id}ab`} alpha={1} />
    <Ink strokes={[a.abstract]} from={at + dur * 0.35} durationInFrames={dur * 0.15} id={`${id}abo`} width={2.5} />
    <Ink strokes={[...a.abstractLines, ...a.methodsLines, ...a.resultsLines]} from={at + dur * 0.45} durationInFrames={dur * 0.3} id={`${id}l`} width={3} color="#B5BBC2" double={false} pen={false} />
    {a.flow.map((f, i) => <Wash key={i} shape={f} color={i === 3 ? "#FBE3DF" : "#E4F0DF"} at={at + dur * 0.7} id={`${id}f${i}`} alpha={1} />)}
    <Ink strokes={[...a.flow, ...a.flowArrows]} from={at + dur * 0.7} durationInFrames={dur * 0.3} id={`${id}fl`} width={2.5} />
  </>;
};

/** The checklist clipboard: board, sheet, clip with lever and rivets, tick boxes and row rules.
 * `ticks` lists the rows already ticked at `at`; tick a row later with the kit's `Ink` on `tick(i)`. */
export const ClipboardArt: React.FC<{ x: number; y: number; w: number; h: number; n?: number; at: number; id: string; dur?: number }> = ({ x, y, w, h, n = 10, at, id, dur = 20 }) => {
  const c = clipboard(x, y, w, h, n);
  return <>
    <Wash shape={c.board} color="#B98A5E" at={at} id={`${id}bd`} alpha={1} />
    <Wash shape={c.sheet} color="#FFFFFF" at={at + 2} id={`${id}sh`} alpha={1} />
    <Ink strokes={[c.board, c.hole, c.sheet]} from={at} durationInFrames={dur * 0.4} id={id} width={3} />
    <Wash shape={c.clip} color="#C9CED4" at={at + dur * 0.3} id={`${id}cl`} alpha={1} />
    <Ink strokes={[c.clip, c.lever, ...c.rivets]} from={at + dur * 0.3} durationInFrames={dur * 0.3} id={`${id}c`} width={3} />
    <Ink strokes={[...c.boxes]} from={at + dur * 0.5} durationInFrames={dur * 0.3} id={`${id}x`} width={2.5} double={false} pen={false} />
    <Ink strokes={c.rules} from={at + dur * 0.6} durationInFrames={dur * 0.4} id={`${id}r`} width={2} color="#C9CED4" double={false} pen={false} />
  </>;
};

/** The retinal camera: table, base and joystick, chin-and-forehead rest, camera head, lens and monitor. */
export const RetinalCameraArt: React.FC<{ x: number; y: number; s?: number; at: number; id: string; dur?: number }> = ({ x, y, s = 1, at, id, dur = 20 }) => {
  const r = retinalCamera(x, y, s);
  return <>
    <Wash shape={r.table} color="#D9B48A" at={at} id={`${id}t`} alpha={1} />
    <Wash shape={r.base} color="#C9CED4" at={at + 1} id={`${id}b`} alpha={1} />
    <Ink strokes={[r.table, ...r.tableLegs, r.base, r.rail]} from={at} durationInFrames={dur * 0.3} id={id} width={3} />
    <Wash shape={r.body} color="#F2F0EA" at={at + dur * 0.25} id={`${id}y`} alpha={1} />
    <Wash shape={r.barrel} color="#3A3F46" at={at + dur * 0.3} id={`${id}r`} alpha={1} />
    <Wash shape={r.lens} color="#5C7FA3" at={at + dur * 0.35} id={`${id}l`} alpha={1} />
    <Ink strokes={[r.body, r.barrel, r.lens, r.knob, ...r.joystick]} from={at + dur * 0.25} durationInFrames={dur * 0.35} id={`${id}h`} width={3} />
    <Wash shape={r.post} color="#9AA0A6" at={at + dur * 0.5} id={`${id}p`} alpha={1} />
    <Ink strokes={[r.post, r.forehead, r.chin]} from={at + dur * 0.5} durationInFrames={dur * 0.25} id={`${id}c`} width={4} />
    <Wash shape={r.monitor} color="#3A3F46" at={at + dur * 0.7} id={`${id}m`} alpha={1} />
    <Wash shape={r.screen} color="#14161A" at={at + dur * 0.72} id={`${id}sc`} alpha={1} />
    <Ink strokes={[r.arm, r.monitor, r.screen]} from={at + dur * 0.7} durationInFrames={dur * 0.3} id={`${id}mo`} width={3} />
  </>;
};

/* ---- Page 16 (E15): the bias zoo ---- */
export const GRASS = "#B9D7A0", SAND = "#EBD9B0", TIMBER = "#9B6B43", BRICK = "#C77B5A", CREAM = "#FBF3DC";

/** The zoo map from above: wall, gate, path and plaza, then each pen (grass, fence posts, sign board). Pens appear at `pens[i]` (default all at `at`). */
export const ZooMapArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string; pens?: number[]; dur?: number }> = ({ x, y, w, h, at, id, pens, dur = 24 }) => {
  const z = zooMap(x, y, w, h);
  return <>
    <Wash shape={z.path} color={SAND} at={at + dur * 0.3} id={`${id}pw`} alpha={0.9} />
    <Wash shape={z.crossPath} color={SAND} at={at + dur * 0.3} id={`${id}cw`} alpha={0.9} />
    <Wash shape={z.plaza} color={SAND} at={at + dur * 0.3} id={`${id}zw`} alpha={0.9} />
    <Ink strokes={[z.wall]} from={at} durationInFrames={dur * 0.4} id={`${id}wl`} width={6} double={false} />
    <Wash shape={z.pillars[0]} color={BRICK} at={at + dur * 0.35} id={`${id}p0`} alpha={1} />
    <Wash shape={z.pillars[1]} color={BRICK} at={at + dur * 0.35} id={`${id}p1`} alpha={1} />
    <Ink strokes={[...z.pillars, z.arch]} from={at + dur * 0.35} durationInFrames={dur * 0.2} id={`${id}gt`} width={4} double={false} />
    <Ink strokes={[z.plaza]} from={at + dur * 0.45} durationInFrames={dur * 0.25} id={`${id}pa`} width={3} double={false} color={TIMBER} />
    {z.pens.map((p, i) => {
      const a = pens?.[i] ?? at + dur * 0.6;
      return <React.Fragment key={i}>
        <Wash shape={p.outline} color={GRASS} at={a} id={`${id}g${i}`} alpha={0.85} />
        <Ink strokes={[p.outline]} from={a} durationInFrames={8} id={`${id}o${i}`} width={4} double={false} color={TIMBER} />
        <Ink strokes={p.posts} from={a + 4} durationInFrames={6} id={`${id}fp${i}`} width={3} double={false} pen={false} color={TIMBER} />
        <Wash shape={p.board} color={CREAM} at={a + 6} id={`${id}b${i}`} alpha={1} />
        <Ink strokes={[p.board, p.post]} from={a + 6} durationInFrames={6} id={`${id}bo${i}`} width={3} double={false} pen={false} />
      </React.Fragment>;
    })}
  </>;
};

/** The zoo entrance: pillars (brick), caps, the curved name board, the open gates. Name goes at `zooGate(...).signAt`. */
export const ZooGateArt: React.FC<{ x: number; y: number; s?: number; at: number; id: string; dur?: number }> = ({ x, y, s = 1, at, id, dur = 20 }) => {
  const g = zooGate(x, y, s);
  return <>
    {g.pillars.map((p, i) => <Wash key={i} shape={p} color={BRICK} at={at} id={`${id}p${i}`} alpha={0.95} />)}
    <Ink strokes={[...g.pillars, ...g.caps, g.ground]} from={at} durationInFrames={dur * 0.35} id={`${id}o`} width={4} double={false} />
    <Ink strokes={g.bricks} from={at + dur * 0.3} durationInFrames={dur * 0.15} id={`${id}br`} width={2} double={false} pen={false} color="#8A4B33" />
    <Wash shape={g.board} color={CREAM} at={at + dur * 0.4} id={`${id}bw`} alpha={1} />
    <Ink strokes={[g.board]} from={at + dur * 0.4} durationInFrames={dur * 0.25} id={`${id}b`} width={4} double={false} />
    <Ink strokes={g.leaves} from={at + dur * 0.65} durationInFrames={dur * 0.35} id={`${id}l`} width={3} double={false} pen={false} color="#3E3A36" />
  </>;
};

/** A fenced enclosure, front view: grass strip, posts and rails (timber), the name board. Name at `enclosure(...).signAt`; exhibit in `.inside`. */
export const EnclosureArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string; dur?: number; board?: string }> = ({ x, y, w, h, at, id, dur = 18, board = CREAM }) => {
  const e = enclosure(x, y, w, h);
  return <>
    <Wash shape={e.grass} color={GRASS} at={at} id={`${id}g`} alpha={0.8} />
    <Ink strokes={[e.ground]} from={at} durationInFrames={dur * 0.2} id={`${id}gr`} width={3} double={false} pen={false} />
    {e.railBands.map((r, i) => <Wash key={i} shape={r} color={TIMBER} at={at + dur * 0.2} id={`${id}rb${i}`} alpha={0.75} />)}
    {e.posts.map((p, i) => <Wash key={i} shape={p} color={TIMBER} at={at + dur * 0.3} id={`${id}pw${i}`} alpha={0.9} />)}
    <Ink strokes={[...e.posts, ...e.railBands]} from={at + dur * 0.2} durationInFrames={dur * 0.4} id={`${id}f`} width={3} double={false} color="#5E3F27" />
    <Wash shape={e.board} color={board} at={at + dur * 0.6} id={`${id}bw`} alpha={1} />
    <Ink strokes={[e.board, ...e.boardPosts]} from={at + dur * 0.6} durationInFrames={dur * 0.4} id={`${id}b`} width={4} double={false} />
  </>;
};

/** The Fitzpatrick scale: six swatches washed with TISSUE.skinTones, outlined. Numerals are the caller's (Labels at labelAt). */
export const ToneScaleArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string; dur?: number }> = ({ x, y, w, h, at, id, dur = 12 }) => {
  const t = toneScale(x, y, w, h);
  return <>
    {t.swatches.map((s, i) => <Wash key={i} shape={s} color={TISSUE.skinTones[i]} at={at + (dur * i) / 6} id={`${id}w${i}`} alpha={1} />)}
    <Ink strokes={t.swatches} from={at} durationInFrames={dur} id={`${id}o`} width={3} double={false} pen={false} />
  </>;
};

/** A paw print, filled. */
export const PawArt: React.FC<{ cx: number; cy: number; s?: number; at: number; id: string; color?: string }> = ({ cx, cy, s = 1, at, id, color = "#6B4A33" }) => {
  const p = pawPrint(cx, cy, s);
  return <Fills shapes={[p.pad, ...p.toes]} color={color} at={at} alpha={0.9} />;
};

/* ---- Page 17 (E16): see-saw, mammogram, colonoscopy view ---- */

/** A see-saw: fulcrum (grey) and ground, then the plank (timber), handles and seats. Labels go at `seeSaw(...).seatL/seatR`. */
export const SeeSawArt: React.FC<{ cx: number; cy: number; w: number; tilt?: number; at: number; id: string; dur?: number; fulcrum?: string }> = ({ cx, cy, w, tilt = 0, at, id, dur = 16, fulcrum = "#B9B4AC" }) => {
  const s = seeSaw(cx, cy, w, tilt);
  return <>
    <Wash shape={s.fulcrum} color={fulcrum} at={at} id={`${id}fw`} alpha={1} />
    <Ink strokes={[s.fulcrum, s.ground]} from={at} durationInFrames={dur * 0.35} id={`${id}f`} width={4} double={false} />
    <Wash shape={s.plank} color={TIMBER} at={at + dur * 0.3} id={`${id}pw`} alpha={0.9} />
    <Ink strokes={[s.plank]} from={at + dur * 0.3} durationInFrames={dur * 0.4} id={`${id}p`} width={4} double={false} color="#5E3F27" />
    {s.seats.map((q, i) => <Wash key={i} shape={q} color="#5E3F27" at={at + dur * 0.7} id={`${id}sw${i}`} alpha={1} />)}
    <Ink strokes={[...s.handles, ...s.seats, s.bolt]} from={at + dur * 0.7} durationInFrames={dur * 0.3} id={`${id}h`} width={4} double={false} pen={false} color="#3E3A36" />
  </>;
};

/** A CC mammogram: black film, breast washed grey-white, strands, then the spiculated mass. Marker text is the caller's (at `markerAt`). */
export const MammogramArt: React.FC<{ x: number; y: number; w: number; h: number; mass?: boolean; at: number; id: string; dur?: number }> = ({ x, y, w, h, mass = true, at, id, dur = 18 }) => {
  const m = mammogram(x, y, w, h, mass);
  return <>
    <Wash shape={m.film} color="#1F2328" at={at} id={`${id}fw`} alpha={1} highlight />
    <Ink strokes={[m.film]} from={at} durationInFrames={dur * 0.2} id={`${id}fo`} width={3} double={false} pen={false} />
    <Wash shape={m.breast} color="#8E949B" at={at + dur * 0.2} id={`${id}bw`} alpha={0.95} />
    <Ink strokes={[m.breast, m.nipple]} from={at + dur * 0.2} durationInFrames={dur * 0.3} id={`${id}b`} width={3} double={false} color="#E6E8EA" />
    <Ink strokes={m.strands} from={at + dur * 0.5} durationInFrames={dur * 0.3} id={`${id}s`} width={2} double={false} pen={false} color="#D5D9DD" />
    {mass ? <>
      <Wash shape={m.mass} color="#F2F4F5" at={at + dur * 0.8} id={`${id}mw`} alpha={1} />
      <Ink strokes={m.spicules} from={at + dur * 0.8} durationInFrames={dur * 0.2} id={`${id}sp`} width={2} double={false} pen={false} color="#F2F4F5" />
    </> : null}
  </>;
};

/** A colonoscopy view: monitor frame, pink mucosa, dark lumen, folds, vessels, the polyp; `box` adds the AI's green detection box. */
export const EndoViewArt: React.FC<{ cx: number; cy: number; r: number; at: number; id: string; dur?: number; box?: boolean; boxAt?: number }> = ({ cx, cy, r, at, id, dur = 18, box = true, boxAt }) => {
  const e = endoView(cx, cy, r);
  return <>
    <Wash shape={e.frame} color="#2A2D31" at={at} id={`${id}fr`} alpha={1} highlight />
    <Wash shape={e.field} color="#E9A79A" at={at + dur * 0.15} id={`${id}fw`} alpha={1} />
    <Wash shape={e.lumen} color="#5A2420" at={at + dur * 0.3} id={`${id}lw`} alpha={1} />
    <Ink strokes={[e.field]} from={at + dur * 0.15} durationInFrames={dur * 0.2} id={`${id}fo`} width={3} double={false} pen={false} color="#7A3A33" />
    <Ink strokes={e.folds} from={at + dur * 0.35} durationInFrames={dur * 0.3} id={`${id}fd`} width={4} double={false} color="#B5655A" />
    <Ink strokes={e.vessels} from={at + dur * 0.6} durationInFrames={dur * 0.15} id={`${id}v`} width={2} double={false} pen={false} color="#B0413A" />
    <Wash shape={e.polyp} color="#D9786A" at={at + dur * 0.7} id={`${id}pw`} alpha={1} />
    <Ink strokes={[e.polyp]} from={at + dur * 0.7} durationInFrames={dur * 0.2} id={`${id}p`} width={3} double={false} color="#8A3A33" />
    {box ? <Ink strokes={e.aiBox} from={boxAt ?? at + dur} durationInFrames={6} id={`${id}ai`} width={5} double={false} pen={false} color="#2FD16A" /> : null}
  </>;
};

/* E17 (Nov 2026) */

/** The breast core-biopsy slide: glass, frosted label with barcode and handwriting, coverslip, three cores (tumour denser). */
export const CoreSlideArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string; dur?: number }> = ({ x, y, w, h, at, id, dur = 20 }) => {
  const c = coreSlide(x, y, w, h);
  return <>
    <Wash shape={c.glass} color="#EEF4F6" at={at} id={`${id}g`} alpha={0.95} highlight />
    <Ink strokes={[c.glass]} from={at} durationInFrames={dur * 0.2} id={`${id}go`} width={3} double={false} pen={false} />
    <Wash shape={c.frost} color="#FBFBF8" at={at + dur * 0.15} id={`${id}f`} alpha={1} highlight />
    <Ink strokes={[c.frost, c.cover]} from={at + dur * 0.15} durationInFrames={dur * 0.2} id={`${id}fo`} width={2} double={false} pen={false} color="#8A8F94" />
    <Fills shapes={c.barcode} color="#2B2B2B" at={at + dur * 0.35} alpha={1} />
    <Ink strokes={c.writing} from={at + dur * 0.4} durationInFrames={dur * 0.25} id={`${id}w`} width={2.5} double={false} color="#1F3A8A" />
    {c.cores.map((k, i) => <Wash key={i} shape={k} color={HE.stroma} at={at + dur * 0.5 + i} id={`${id}c${i}`} alpha={1} />)}
    <Ink strokes={c.cores} from={at + dur * 0.5} durationInFrames={dur * 0.3} id={`${id}co`} width={1.5} double={false} pen={false} color="#B36A93" />
    <Wash shape={c.tumour} color={HE.nucleusLight} at={at + dur * 0.8} id={`${id}t`} alpha={0.85} />
  </>;
};

/** The H&E breast tile (invasive carcinoma NST or a normal lobule). */
export const BreastTileArt: React.FC<{ x: number; y: number; w: number; h: number; kind?: "idc" | "normal"; at: number; id: string; dur?: number; outline?: boolean }> = ({
  x, y, w, h, kind = "idc", at, id, dur = 30, outline = true,
}) => {
  const t = breastTile(x, y, w, h, kind, id);
  const step = dur / 4;
  const idc = kind === "idc";
  return <>
    <Wash shape={t.field} color={idc ? HE.stromaPale : HE.stroma} at={at} id={`${id}f`} alpha={0.95} amount={2} />
    {t.loose.map((l, i) => <Wash key={i} shape={l} color="#F5D9E4" at={at + step * 0.3} id={`${id}lo${i}`} alpha={1} amount={2} />)}
    <Ink strokes={t.fibres} from={at + step * 0.3} durationInFrames={step} id={`${id}fb`} color="#D17FA6" width={2} double={false} pen={false} jitterAmount={0.5} />
    <Fills shapes={t.fat} color="#FFFFFF" at={at + step * 0.6} alpha={1} stroke="#D9A6BE" />
    {t.groups.map((g, i) => <Wash key={i} shape={g} color={idc ? "#E39AC0" : HE.cyto} at={at + step * 0.8} id={`${id}g${i}`} alpha={0.95} amount={2} />)}
    <Fills shapes={t.lumens} color={HE.lumen} at={at + step * 1.2} alpha={1} />
    <Fills shapes={t.spindles} color={HE.nucleus} at={at + step * 1.6} alpha={0.8} />
    <Fills shapes={t.lymphs} color={HE.lymph} at={at + step * 1.6} alpha={0.9} />
    <Fills shapes={t.flat} color={HE.nucleus} at={at + step * 2} alpha={0.9} />
    <Fills shapes={t.nuclei} color={idc ? HE.nucleusLight : HE.nucleus} at={at + step * 2} alpha={0.95} stroke={idc ? HE.nucleus : undefined} />
    {idc ? <Dots points={t.nucleoli} r={2.2} color="#2A1F5C" at={at + step * 2.5} every={0} /> : null}
    {outline ? <Ink strokes={[t.field]} from={at} durationInFrames={step} id={`${id}o`} width={3} double={false} pen={false} /> : null}
    <Ink strokes={t.groups} from={at + step * 2.5} durationInFrames={step} id={`${id}bm`} color="#B36A93" width={1.4} double={false} pen={false} jitterAmount={0.5} />
  </>;
};

/** A Grad-CAM heat spot: blue, green, yellow, red contours, translucent so the image shows through. */
export const HeatSpotArt: React.FC<{ cx: number; cy: number; rx: number; ry: number; at: number; id: string; alpha?: number; dur?: number }> = ({ cx, cy, rx, ry, at, id, alpha = 0.55, dur = 12 }) => {
  const rings = heatSpot(cx, cy, rx, ry, id);
  return <>{rings.map((rg, i) => <Wash key={i} shape={rg} color={HEAT[i]} at={at + (i * dur) / 4} id={`${id}h${i}`} alpha={alpha} highlight />)}</>;
};

/** The SHAP waterfall's marks: axis, ticks, base and final dashes, red (up) and blue (down) bars, connectors. Labels are typeset by the beat. */
export const WaterfallArt: React.FC<{ x: number; y: number; w: number; h: number; base: number; steps: number[]; max?: number; labelW?: number; at: number; id: string; rowsAt?: number[]; finalAt?: number }> = ({
  x, y, w, h, base, steps, max = 30, labelW = 0.34, at, id, rowsAt, finalAt,
}) => {
  const wf = shapWaterfall(x, y, w, h, base, steps, max, labelW);
  return <>
    <Ink strokes={[wf.axis, ...wf.ticks.map((t) => t.tick)]} from={at} durationInFrames={8} id={`${id}ax`} width={3} double={false} pen={false} />
    <Ink strokes={wf.baseLine} from={at + 4} durationInFrames={8} id={`${id}bl`} width={2} double={false} pen={false} color="#6B6B6B" />
    {wf.rows.map((r, i) => {
      const f = rowsAt?.[i] ?? at + 10 + i * 8;
      return <React.Fragment key={i}>
        <Wash shape={r.rect} color={r.up ? "#E5534B" : "#4A86D8"} at={f} id={`${id}r${i}`} alpha={0.95} highlight />
        <Ink strokes={[r.rect]} from={f} durationInFrames={6} id={`${id}ro${i}`} width={2} double={false} pen={false} />
        {i > 0 ? <Ink strokes={[wf.connectors[i - 1]]} from={f} durationInFrames={4} id={`${id}cn${i}`} width={2} double={false} pen={false} color="#6B6B6B" /> : null}
      </React.Fragment>;
    })}
    <Ink strokes={wf.finalLine} from={finalAt ?? at + 10 + steps.length * 8} durationInFrames={8} id={`${id}fl`} width={3} double={false} pen={false} color="#2B2B2B" />
  </>;
};

/** LIME superpixels over a tile: thin outlines, and grey veils over the hidden patches (`hidden` indices) from `hideAt`. */
export const SuperpixelArt: React.FC<{ x: number; y: number; w: number; h: number; cols?: number; rows?: number; at: number; id: string; hidden?: number[]; hideAt?: number; keep?: number[]; keepAt?: number }> = ({
  x, y, w, h, cols = 5, rows = 5, at, id, hidden = [], hideAt, keep = [], keepAt,
}) => {
  const sp = superpixels(x, y, w, h, cols, rows, id);
  return <>
    <Ink strokes={sp.cells} from={at} durationInFrames={10} id={`${id}o`} width={2} double={false} pen={false} color="#FFFFFF" />
    {hidden.map((k) => <Wash key={k} shape={sp.cells[k]} color="#8C8C8C" at={hideAt ?? at + 10} id={`${id}h${k}`} alpha={0.85} highlight />)}
    {keep.map((k) => <Ink key={k} strokes={[sp.cells[k]]} from={keepAt ?? at + 14} durationInFrames={6} id={`${id}k${k}`} width={5} double={false} pen={false} color="#2FD16A" />)}
  </>;
};

/** A lead side marker on a film (letter typeset by the caller at filmToken().letterAt). */
export const FilmTokenArt: React.FC<{ x: number; y: number; s?: number; at: number; id: string }> = ({ x, y, s = 60, at, id }) => {
  const t = filmToken(x, y, s);
  return <>
    <Wash shape={t.plate} color="#F4F4F2" at={at} id={`${id}w`} alpha={1} highlight />
    <Ink strokes={[t.plate, ...t.rivets]} from={at} durationInFrames={6} id={id} width={2} double={false} pen={false} color="#9A9A9A" />
  </>;
};

/** A model card: card, fold, coloured band, bullets and text lines. */
export const ModelCardArt: React.FC<{ x: number; y: number; w: number; h: number; n?: number; color?: string; at: number; id: string; dur?: number }> = ({ x, y, w, h, n = 5, color = "#7FA7CF", at, id, dur = 18 }) => {
  const m = modelCard(x, y, w, h, n);
  return <>
    <Wash shape={m.card} color="#FFFDF7" at={at} id={`${id}c`} alpha={1} highlight />
    <Ink strokes={[m.card, m.fold]} from={at} durationInFrames={dur * 0.3} id={`${id}o`} width={3} double={false} />
    <Wash shape={m.band} color={color} at={at + dur * 0.3} id={`${id}b`} alpha={1} highlight />
    <Fills shapes={m.bullets} color={color} at={at + dur * 0.5} every={1} alpha={1} />
    <Ink strokes={m.lines} from={at + dur * 0.6} durationInFrames={dur * 0.4} id={`${id}l`} width={2} double={false} pen={false} color="#B9B2A6" />
  </>;
};

/** A snow bank and flakes. */
export const SnowArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string }> = ({ x, y, w, h, at, id }) => {
  const s = snowBank(x, y, w, h, id);
  return <>
    <Wash shape={s.mound} color="#FFFFFF" at={at} id={`${id}m`} alpha={1} highlight />
    <Ink strokes={[s.mound]} from={at} durationInFrames={8} id={`${id}o`} width={2} double={false} pen={false} color="#A9B8C6" />
    <Dots points={s.flakes} r={5} color="#C9D6E2" at={at + 4} every={0} />
  </>;
};

/** World map: sea frame, land washed pale, coastlines inked continent by continent. */
export const WorldMapArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string; dur?: number; land?: string; sea?: string }> = ({ x, y, w, h, at, id, dur = 24, land = "#E9DFC6", sea = "#DCEAF2" }) => {
  const m = worldMap(x, y, w, h);
  return <>
    <Wash shape={m.frame} color={sea} at={at} id={`${id}s`} alpha={0.9} amount={2} />
    {m.lands.map((l, i) => <Wash key={i} shape={l} color={land} at={at + dur * 0.4} id={`${id}w${i}`} alpha={1} amount={2} />)}
    <Ink strokes={m.lands} from={at} durationInFrames={dur * 0.7} id={`${id}o`} width={2.4} double={false} pen={false} color="#7C6F58" />
    <Ink strokes={[m.frame]} from={at} durationInFrames={dur * 0.3} id={`${id}f`} width={3} double={false} pen={false} />
  </>;
};

/** Pap smear field: pale background, pink and blue-green squamous cells, small nuclei, then the abnormal cells' dark nuclei. */
export const PapSmearArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string; dur?: number; abnormal?: number }> = ({ x, y, w, h, at, id, dur = 24, abnormal = 2 }) => {
  const s = papSmear(x, y, w, h, id, abnormal);
  return <>
    <Wash shape={s.field} color={PAP.bg} at={at} id={`${id}f`} alpha={1} amount={2} />
    {s.cells.map((c, i) => <Wash key={i} shape={c.cyto} color={c.color} at={at + dur * 0.2 + (i % 4)} id={`${id}c${i}`} alpha={0.82} amount={2} />)}
    <Ink strokes={s.cells.map((c) => c.cyto)} from={at + dur * 0.3} durationInFrames={dur * 0.3} id={`${id}r`} width={1.6} double={false} pen={false} color={PAP.rim} jitterAmount={0.4} />
    <Fills shapes={s.cells.slice(0, s.nNormal).map((c) => c.nucleus)} color={PAP.nucleus} at={at + dur * 0.6} alpha={0.95} />
    <Fills shapes={s.cells.slice(s.nNormal).map((c) => c.nucleus)} color={PAP.hsil} at={at + dur * 0.75} alpha={0.95} />
    <Ink strokes={[s.field]} from={at} durationInFrames={dur * 0.3} id={`${id}o`} width={3} double={false} pen={false} />
  </>;
};

/** Scales of justice: post and base, beam, chains, pans (brass). */
export const ScalesArt: React.FC<{ cx: number; y: number; s?: number; tilt?: number; at: number; id: string; dur?: number }> = ({ cx, y, s = 1, tilt = 0, at, id, dur = 18 }) => {
  const k = scales(cx, y, s, tilt);
  return <>
    <Wash shape={k.base} color="#D9B45A" at={at + dur * 0.2} id={`${id}b`} alpha={1} highlight />
    {k.pans.map((p, i) => <Wash key={i} shape={p} color="#E2C06A" at={at + dur * 0.7} id={`${id}p${i}`} alpha={1} highlight />)}
    <Ink strokes={[k.post, k.base, k.knob]} from={at} durationInFrames={dur * 0.35} id={`${id}o`} width={5} double={false} color="#6B5320" />
    <Ink strokes={[k.beam]} from={at + dur * 0.35} durationInFrames={dur * 0.2} id={`${id}m`} width={6} double={false} color="#6B5320" />
    <Ink strokes={[...k.chains, ...k.pans]} from={at + dur * 0.55} durationInFrames={dur * 0.45} id={`${id}c`} width={3} double={false} pen={false} color="#6B5320" />
  </>;
};

/** Passport: coloured cover, spine, gold emblem, title line, chip mark. */
export const PassportArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string; color?: string; dur?: number }> = ({ x, y, w, h, at, id, color = "#2F4E7A", dur = 16 }) => {
  const p = passport(x, y, w, h);
  return <>
    <Wash shape={p.cover} color={color} at={at} id={`${id}c`} alpha={1} highlight />
    <Ink strokes={[p.cover, p.spine]} from={at} durationInFrames={dur * 0.4} id={`${id}o`} width={3} double={false} />
    <Ink strokes={[...p.emblem, p.titleLine, p.chip]} from={at + dur * 0.4} durationInFrames={dur * 0.6} id={`${id}e`} width={3} double={false} pen={false} color="#E8C766" />
  </>;
};

/* ---- E20 (Nov 2026) ---- */

/** Chest radiograph: black film, grey torso, dark lungs, white mediastinum and spine, ribs and clavicles, then the nodule. `box`/`seg` add the detection brackets (green) and the segmentation (orange outline and fill) from their frames. */
export const ChestXrayArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string; dur?: number; nodule?: boolean; boxAt?: number; segAt?: number }> = ({ x, y, w, h, at, id, dur = 20, nodule = true, boxAt, segAt }) => {
  const c = chestXray(x, y, w, h, nodule);
  return <>
    <Wash shape={c.film} color="#15181C" at={at} id={`${id}f`} alpha={1} amount={2} highlight />
    <Wash shape={c.body} color="#868C93" at={at + dur * 0.15} id={`${id}b`} alpha={1} amount={2} />
    {c.lungs.map((l, i) => <Wash key={i} shape={l} color="#2C3137" at={at + dur * 0.3} id={`${id}l${i}`} alpha={1} amount={2} />)}
    <Wash shape={c.spine} color="#8E949B" at={at + dur * 0.35} id={`${id}sp`} alpha={0.9} amount={2} />
    <Wash shape={c.mediastinum} color="#C3C8CD" at={at + dur * 0.4} id={`${id}m`} alpha={1} amount={2} />
    <Ink strokes={c.vessels} from={at + dur * 0.4} durationInFrames={dur * 0.2} id={`${id}vs`} width={2.5} double={false} pen={false} color="#5E656D" />
    <Ink strokes={c.ribs} from={at + dur * 0.45} durationInFrames={dur * 0.35} id={`${id}r`} width={4} double={false} pen={false} color="#9CA2A8" />
    <Ink strokes={c.clavicles} from={at + dur * 0.45} durationInFrames={dur * 0.2} id={`${id}c`} width={6} double={false} pen={false} color="#C9CED3" />
    <Ink strokes={[c.film]} from={at} durationInFrames={dur * 0.2} id={`${id}o`} width={3} double={false} pen={false} />
    {nodule ? <Wash shape={c.nodule} color="#D3D7DB" at={at + dur * 0.85} id={`${id}n`} alpha={0.95} amount={1} /> : null}
    {boxAt !== undefined ? <Ink strokes={c.boxCorners} from={boxAt} durationInFrames={6} id={`${id}bx`} width={5} double={false} pen={false} color="#2FD16A" /> : null}
    {segAt !== undefined ? <>
      <Wash shape={c.nodule} color="#F08A24" at={segAt + 4} id={`${id}sg`} alpha={0.75} amount={1} highlight />
      <Ink strokes={[c.nodule]} from={segAt} durationInFrames={8} id={`${id}so`} width={4} double={false} pen={false} color="#F08A24" />
    </> : null}
  </>;
};

/** Axial head CT: black square, grey brain, CSF sulci and ventricles, falx, white skull, then the bleed (white) with its dark oedema rim; `boxAt` adds green detection brackets. */
export const HeadCTArt: React.FC<{ cx: number; cy: number; r: number; at: number; id: string; dur?: number; bleed?: boolean; boxAt?: number }> = ({ cx, cy, r, at, id, dur = 20, bleed = true, boxAt }) => {
  const c = headCT(cx, cy, r, bleed);
  return <>
    <Wash shape={c.frame} color="#0F1114" at={at} id={`${id}f`} alpha={1} amount={2} highlight />
    <Wash shape={c.skull} color="#EEF0F2" at={at + dur * 0.15} id={`${id}s`} alpha={1} amount={1} />
    <Wash shape={c.brain} color="#7D838A" at={at + dur * 0.3} id={`${id}b`} alpha={1} amount={1} />
    <Ink strokes={c.sulci} from={at + dur * 0.4} durationInFrames={dur * 0.2} id={`${id}su`} width={3} double={false} pen={false} color="#3E4349" />
    <Ink strokes={[c.falx]} from={at + dur * 0.45} durationInFrames={dur * 0.15} id={`${id}fx`} width={3} double={false} pen={false} color="#B9BEC3" />
    {c.ventricles.map((v, i) => <Wash key={i} shape={v} color="#2E3237" at={at + dur * 0.5} id={`${id}v${i}`} alpha={1} amount={1} />)}
    <Ink strokes={[c.frame]} from={at} durationInFrames={dur * 0.2} id={`${id}o`} width={3} double={false} pen={false} />
    {bleed ? <>
      <Wash shape={c.oedema} color="#575D63" at={at + dur * 0.7} id={`${id}e`} alpha={1} amount={1} />
      <Wash shape={c.bleed} color="#F1F3F4" at={at + dur * 0.8} id={`${id}h`} alpha={1} amount={1} />
    </> : null}
    {boxAt !== undefined ? <Ink strokes={c.boxCorners} from={boxAt} durationInFrames={6} id={`${id}bx`} width={5} double={false} pen={false} color="#2FD16A" /> : null}
  </>;
};

/** U-Net: the left arm (blue blocks, red down-arrows), bottom, right arm (green, green up-arrows), then the grey bridges; input tile and output mask. Stages from `downAt`, `upAt`, `bridgeAt` (default: in order over `dur`). */
export const UNetArt: React.FC<{ x: number; y: number; w: number; h: number; at: number; id: string; dur?: number; upAt?: number; bridgeAt?: number }> = ({ x, y, w, h, at, id, dur = 30, upAt, bridgeAt }) => {
  const u = uNet(x, y, w, h);
  const ua = upAt ?? at + dur * 0.45, ba = bridgeAt ?? at + dur * 0.8;
  return <>
    <Wash shape={u.inTile} color="#6E747B" at={at} id={`${id}it`} alpha={1} amount={1} highlight />
    {u.left.flat().map((b, i) => <Wash key={i} shape={b} color="#9EC1E3" at={at + (i >> 1) * dur * 0.08} id={`${id}l${i}`} alpha={1} amount={1} />)}
    <Ink strokes={[u.inTile, ...u.left.flat()]} from={at} durationInFrames={dur * 0.35} id={`${id}lo`} width={2.5} double={false} pen={false} />
    <Ink strokes={u.downs} from={at + dur * 0.1} durationInFrames={dur * 0.3} id={`${id}d`} width={4} double={false} pen={false} color="#C8423B" />
    {u.bottom.map((b, i) => <Wash key={i} shape={b} color="#C9B2E3" at={at + dur * 0.38} id={`${id}bt${i}`} alpha={1} amount={1} />)}
    <Ink strokes={u.bottom} from={at + dur * 0.38} durationInFrames={dur * 0.06} id={`${id}bo`} width={2.5} double={false} pen={false} />
    {u.right.flat().map((b, i) => <Wash key={i} shape={b} color="#A9D9B0" at={ua + (3 - (i >> 1)) * dur * 0.06} id={`${id}r${i}`} alpha={1} amount={1} />)}
    <Ink strokes={u.right.flat()} from={ua} durationInFrames={dur * 0.25} id={`${id}ro`} width={2.5} double={false} pen={false} />
    <Ink strokes={u.ups} from={ua} durationInFrames={dur * 0.25} id={`${id}u`} width={4} double={false} pen={false} color="#2E8B57" />
    <Wash shape={u.outTile} color="#F08A24" at={ua + dur * 0.3} id={`${id}ot`} alpha={0.9} amount={1} highlight />
    <Ink strokes={[u.outTile]} from={ua + dur * 0.3} durationInFrames={dur * 0.06} id={`${id}oo`} width={2.5} double={false} pen={false} />
    <Ink strokes={u.bridges} from={ba} durationInFrames={dur * 0.2} id={`${id}br`} width={3.5} double={false} pen={false} color="#6B7178" />
  </>;
};

/** Handheld skin probe over a lesion: skin patch, lesion, probe body, nose, screen, grip, then light in (amber) and scattered light out (sky blue) from `lightAt`. */
export const SkinProbeArt: React.FC<{ x: number; y: number; s?: number; at: number; id: string; dur?: number; lightAt?: number; skin?: string }> = ({ x, y, s = 1, at, id, dur = 20, lightAt, skin = "#D9A77E" }) => {
  const p = skinProbe(x, y, s);
  return <>
    <Wash shape={p.skin} color={skin} at={at} id={`${id}sk`} alpha={1} amount={2} />
    <Fills shapes={[P.blob(p.lesionAt[0], p.lesionAt[1], 34 * s, 16 * s, `${id}les`, 0.18, 32)]} color="#5A3A24" at={at + dur * 0.2} alpha={1} />
    <Wash shape={p.body} color="#F2F2EE" at={at + dur * 0.3} id={`${id}b`} alpha={1} amount={1} highlight />
    <Wash shape={p.nose} color="#D9DCE0" at={at + dur * 0.3} id={`${id}n`} alpha={1} amount={1} />
    <Wash shape={p.grip} color="#3E7CB1" at={at + dur * 0.5} id={`${id}g`} alpha={1} amount={1} />
    <Wash shape={p.screen} color="#24323F" at={at + dur * 0.5} id={`${id}sc`} alpha={1} amount={1} />
    <Ink strokes={[p.body, p.nose, p.grip, p.screen, p.window]} from={at + dur * 0.3} durationInFrames={dur * 0.5} id={`${id}o`} width={3} double={false} />
    {lightAt !== undefined ? <>
      <Ink strokes={p.raysIn} from={lightAt} durationInFrames={8} id={`${id}ri`} width={4} double={false} pen={false} color="#E8A93B" />
      <Ink strokes={p.raysOut} from={lightAt + 8} durationInFrames={8} id={`${id}ro`} width={4} double={false} pen={false} color="#5BA7D9" />
    </> : null}
  </>;
};
