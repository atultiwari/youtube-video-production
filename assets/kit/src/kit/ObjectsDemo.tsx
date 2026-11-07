/**
 * The object library on one frame (`kit-objects`, 1920 × 1080, 60 frames): every object fully
 * drawn, so a still shows whether each one reads as the real thing. Check it after editing
 * objects.tsx:  npx remotion still kit-objects out/objects.png --frame=59
 */
import { AbsoluteFill } from "remotion";

import { Paper } from "./Chrome";
import { Cell, Rbc } from "./cells";
import { Dots, Hatch, Ink, Label, Picture, Wash } from "./Picture";
import { blackboard, chestFilm, doctor, ecgStrip, finger, fundus, glassSlide, goBoard, heart, hospital, ivBag, monitor, oximeter, STAIN, syringe } from "./objects";
import { chapter, CHAPTERS, INK, TISSUE } from "./style";

const C = chapter(Object.keys(CHAPTERS)[0]);
const skin = TISSUE.skinTones[3];

export const ObjectsDemo: React.FC = () => {
  const f = finger(20, 120, 1);
  const o = oximeter(20, 120, 1);
  const e = ecgStrip(560, 60, 500, 230);
  const x = chestFilm(40, 420, 330, 380);
  const h = heart(460, 470, 1.2);
  const d = doctor(880, 560, 1);
  return (
    <AbsoluteFill>
      <Paper chapter={C}>
        <Picture>
          <Wash shape={f.outline} color={skin} at={0} id="fw" alpha={0.6} />
          <Ink strokes={[f.outline, f.nail, f.cuticle, ...f.creases]} from={0} durationInFrames={20} id="f" />
          <Wash shape={o.upper} color={INK.line} at={20} id="ou" alpha={0.7} />
          <Wash shape={o.lower} color={INK.line} at={20} id="ol" alpha={0.7} />
          <Ink strokes={[o.upper, o.lower, o.hinge, o.display]} from={20} durationInFrames={20} id="o" color={C.accent} />
          <Label text="98%" x={o.readout[0]} y={o.readout[1]} at={40} size={36} italic={false} />
          <Ink strokes={[e.paper]} from={0} durationInFrames={10} id="ep" />
          <Ink strokes={e.grid} from={10} durationInFrames={10} id="eg" color={C.wash} width={2} pen={false} />
          <Ink strokes={[e.trace]} from={20} durationInFrames={20} id="et" pen={false} />
          <Label text="Sinus rhythm · Normal ECG" x={e.reading[0]} y={e.reading[1] + 8} at={40} size={36} italic={false} />
          <Ink strokes={[x.frame, x.spine, ...x.ribs, ...x.lungs, ...x.dome]} from={0} durationInFrames={30} id="x" />
          <Ink strokes={[x.heart]} from={30} durationInFrames={10} id="xh" color={TISSUE.blood} />
          <Wash shape={h.body} color={TISSUE.bloodWash} at={0} id="hw" alpha={0.6} />
          <Ink strokes={[h.body, h.groove, h.aorta, ...h.vena, h.pulmonary]} from={0} durationInFrames={30} id="h" color={TISSUE.blood} />
          <Ink strokes={[d.head, d.coat, ...d.lapels, ...d.stethoscope, d.chestpiece]} from={0} durationInFrames={30} id="d" color={INK.line} />
        </Picture>
      </Paper>
    </AbsoluteFill>
  );
};

/**
 * Page 2 of the library (`kit-objects-2`): the E02 additions. Check after editing:
 *   npx remotion still kit-objects-2 out/objects-2.png --frame=59
 */
export const ObjectsDemo2: React.FC = () => {
  const kinds = ["neutrophil", "eosinophil", "basophil", "lymphocyte", "monocyte"] as const;
  const g = glassSlide(20, 300, 440, 130);
  const fu = fundus(700, 190, 150);
  const iv = ivBag(860, 10, 0.75);
  const mo = monitor(520, 400, 300, 190);
  const go = goBoard(860, 440, 220, 9);
  const bb = blackboard(30, 520, 380, 230);
  return (
    <AbsoluteFill>
      <Paper chapter={C}>
        <Picture>
          {kinds.map((k, i) => <Cell key={k} kind={k} cx={70 + i * 100} cy={90} r={40} at={0} id={`d${k}`} />)}
          {kinds.map((k, i) => <Label key={k} text={k} x={70 + i * 100} y={170} at={30} size={22} />)}
          {[0, 1, 2, 3].map((i) => <Rbc key={i} cx={60 + i * 40} cy={230} r={17} at={0} id={`r${i}`} />)}
          <Cell kind="band" cx={300} cy={230} r={38} at={0} id="nbig" />
          <Label text="band" x={380} y={240} at={30} size={22} />
          {(() => { const sy = syringe(1240, 300, 0.9); return <><Wash shape={sy.fluid} color="#F2B8B0" at={0} id="syw" alpha={0.8} /><Ink strokes={[sy.barrel, ...sy.marks, ...sy.plunger, sy.hub, sy.needle]} from={0} durationInFrames={20} id="sy" /></>; })()}
          {(() => { const hs = hospital(1250, 60, 200, 160); return <Ink strokes={[hs.block, hs.door, ...hs.cross, ...hs.windows]} from={0} durationInFrames={20} id="hs" />; })()}
          <Ink strokes={[g.glass]} from={0} durationInFrames={10} id="sg" />
          <Hatch shape={g.frost} at={0} id="sf" gap={8} alpha={0.4} />
          <Wash shape={g.smear} color={STAIN.rbc} at={0} id="ss" alpha={0.55} />
          <Wash shape={fu.field} color="#E58A4E" at={0} id="ff" alpha={0.8} />
          <Wash shape={fu.macula} color="#B8562E" at={0} id="fm" alpha={0.5} />
          <Wash shape={fu.disc} color="#F6E2A6" at={0} id="fd" alpha={1} />
          <Wash shape={fu.cup} color="#FFF6DA" at={0} id="fc" alpha={1} />
          <Ink strokes={fu.vessels} from={0} durationInFrames={20} id="fv" color="#A3271F" width={4} pen={false} />
          <Ink strokes={[fu.field]} from={0} durationInFrames={10} id="ffo" pen={false} />
          <Ink strokes={[iv.bag, iv.hole, iv.labelBox, iv.port, iv.chamber, iv.tube, iv.clamp]} from={0} durationInFrames={20} id="iv" />
          <Wash shape={iv.bag} color="#CFE3F0" at={0} id="ivw" alpha={0.6} />
          <Label text="0.9% NaCl" x={iv.labelAt[0]} y={iv.labelAt[1]} at={30} size={20} italic={false} />
          <Ink strokes={[mo.case, mo.screen, ...mo.stand, ...mo.buttons]} from={0} durationInFrames={20} id="mo" />
          <Wash shape={mo.screen} color="#2E3B3A" at={0} id="mow" alpha={0.9} />
          <Ink strokes={[mo.trace]} from={0} durationInFrames={20} id="mot" color="#E5574B" pen={false} />
          <Label text="MAP 65" x={mo.readout[0]} y={mo.readout[1]} at={30} size={30} italic={false} color="#F2C14E" />
          <Wash shape={go.board} color="#DDB36B" at={0} id="gow" alpha={0.8} />
          <Ink strokes={[go.board, ...go.lines]} from={0} durationInFrames={20} id="go" width={2} pen={false} />
          <Dots points={go.stars} r={4} color={INK.line} at={0} every={0} />
          <Dots points={[go.at(2, 2), go.at(3, 4), go.at(5, 3)]} r={go.cell * 0.45} color="#1E1E1E" at={0} every={0} />
          <Dots points={[go.at(6, 6), go.at(4, 5), go.at(6, 3)]} r={go.cell * 0.45} color="#F4F1EA" at={0} every={0} />
          <Wash shape={bb.board} color="#2F4A3A" at={0} id="bbw" alpha={0.95} />
          <Ink strokes={[bb.frame, bb.board, bb.ledge, bb.chalk]} from={0} durationInFrames={20} id="bb" color="#7A5230" />
          <Label text="Classroom 1" x={bb.centre[0]} y={bb.centre[1]} at={30} size={40} italic={false} color="#F4F1EA" />
        </Picture>
      </Paper>
    </AbsoluteFill>
  );
};
