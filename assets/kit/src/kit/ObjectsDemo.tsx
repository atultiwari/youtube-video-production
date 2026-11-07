/**
 * The object library on one frame (`kit-objects`, 1920 × 1080, 60 frames): every object fully
 * drawn, so a still shows whether each one reads as the real thing. Check it after editing
 * objects.tsx:  npx remotion still kit-objects out/objects.png --frame=59
 */
import { AbsoluteFill } from "remotion";

import { Paper } from "./Chrome";
import { Ink, Label, Picture, Wash } from "./Picture";
import { chestFilm, doctor, ecgStrip, finger, heart, oximeter } from "./objects";
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
