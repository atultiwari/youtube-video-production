/**
 * The object library on one frame (`kit-objects`, 1920 × 1080, 60 frames): every object fully
 * drawn, so a still shows whether each one reads as the real thing. Check it after editing
 * objects.tsx:  npx remotion still kit-objects out/objects.png --frame=59
 */
import { AbsoluteFill } from "remotion";

import { Paper } from "./Chrome";
import { Cell, Rbc } from "./cells";
import { Dots, Hatch, Ink, Label, Picture, Wash } from "./Picture";
import React from "react";

import { P } from "./shapes";
import { dial, lesion, padlock, questionPaper, ruler, skinMarker } from "./objects";
import { blackboard, chestFilm, clock, database, doctor, ecgStrip, finger, foot, fundus, glassSlide, goBoard, headScan, heart, hospital, ivBag, monitor, monofilament, oximeter, phone, sheet, STAIN, syringe, testTube } from "./objects";
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

/**
 * Page 3 of the library (`kit-objects-3`): the E03 additions. Check after editing:
 *   npx remotion still kit-objects-3 out/objects-3.png --frame=59
 */
export const ObjectsDemo3: React.FC = () => {
  const sh = sheet(20, 40, [170, 120, 120], 5, 52);
  const db = database(20, 340, 160, 200);
  const ft = foot(260, 300, 0.85);
  const mf = monofilament(470, 330, 1);
  const ph = phone(640, 330, 150, 290);
  const ck = clock(940, 140, 100, 3, 0);
  const tt = testTube(1120, 50, 0.9);
  const hd = headScan(840, 420, 0.95);
  return (
    <AbsoluteFill>
      <Paper chapter={C}>
        <Picture>
          <Ink strokes={[sh.frame, ...sh.rules, ...sh.cols]} from={0} durationInFrames={20} id="sh" width={2} pen={false} />
          <Ink strokes={[sh.header]} from={0} durationInFrames={10} id="shh" />
          {["Name", "HbA1c", "Foot"].map((t, c) => <Label key={t} text={t} x={sh.cell(c, 0)[0]} y={sh.cell(c, 0)[1] + 10} at={30} size={26} italic={false} weight={700} />)}
          {[["Ramesh K", "7.8", "normal"], ["R Kumar", "7,8", ""], ["S Devi", "high", "not done"]].map((row, r) => row.map((t, c) => <Label key={`${r}${c}`} text={t} x={sh.cell(c, r + 1)[0]} y={sh.cell(c, r + 1)[1] + 9} at={30} size={24} />))}
          <Wash shape={db.body} color="#CFE3F0" at={0} id="dbw" alpha={0.6} />
          <Ink strokes={[db.top, ...db.sides, ...db.bands]} from={0} durationInFrames={20} id="db" />
          <Wash shape={ft.sole} color={skin} at={0} id="ftw" alpha={0.55} />
          {ft.toes.map((t, i) => <Wash key={i} shape={t} color={skin} at={0} id={`ftt${i}`} alpha={0.55} />)}
          <Ink strokes={[ft.sole, ...ft.toes, ...ft.creases]} from={0} durationInFrames={20} id="ft" />
          <Wash shape={ft.ulcer} color="#C4574A" at={0} id="ftu" alpha={0.8} />
          <Wash shape={ft.ulcerBed} color="#E9A49A" at={0} id="ftub" alpha={0.9} />
          <Ink strokes={[ft.ulcer]} from={0} durationInFrames={10} id="ftuo" color={TISSUE.blood} width={3} pen={false} />
          <Wash shape={mf.holder} color="#4A6FB5" at={0} id="mfw" alpha={0.5} />
          <Ink strokes={[mf.holder, ...mf.grip, mf.collar]} from={0} durationInFrames={20} id="mf" />
          <Ink strokes={[mf.filament]} from={0} durationInFrames={10} id="mff" width={4} pen={false} />
          <Wash shape={ph.screen} color="#DCE6EE" at={0} id="phw" alpha={0.8} />
          <Ink strokes={[ph.body, ph.screen, ph.camera, ph.bar]} from={0} durationInFrames={20} id="ph" />
          <Ink strokes={[ck.face, ...ck.ticks, ck.hour, ck.minute, ck.centre]} from={0} durationInFrames={20} id="ck" />
          <Wash shape={tt.cap} color="#9A8AC4" at={0} id="ttc" alpha={0.9} />
          <Wash shape={tt.blood} color={TISSUE.blood} at={0} id="ttb" alpha={0.75} />
          <Ink strokes={[tt.cap, tt.tube, tt.label, ...tt.labelLines]} from={0} durationInFrames={20} id="tt" />
          <Wash shape={hd.scan} color="#1E2426" at={0} id="hds" alpha={0.95} />
          <Ink strokes={[hd.profile]} from={0} durationInFrames={20} id="hdp" color="#E8E4DA" pen={false} />
          <Ink strokes={[hd.brain, hd.callosum, hd.cerebellum, hd.stem]} from={0} durationInFrames={20} id="hdb" color="#A9A397" pen={false} width={3} />
        </Picture>
      </Paper>
    </AbsoluteFill>
  );
};

/** E04 objects (`kit-objects-4`): skin-lesion photos with a ruler and a marker ring, the marker, a question paper, a padlock, a dial. */
export const ObjectsDemo4: React.FC = () => {
  const n = lesion(170, 200, 46, "nevus", "a");
  const m = lesion(520, 200, 60, "melanoma", "b");
  const rl = ruler(390, 330, 5, 50 / 10 * 2.4);
  const mk = lesion(170, 560, 40, "nevus", "c");
  const pen = skinMarker(330, 640, 1);
  const qp = questionPaper(700, 40, 300, 380, 4);
  const lk = padlock(760, 520, 1.1);
  const dl = dial(1020, 640, 70, 0.7);
  const photo = (x: number, y: number, w: number, h: number, id: string) => <>
    <Wash shape={P.rect(x, y, w, h, 8)} color={skin} at={0} id={`${id}w`} alpha={0.5} />
    <Ink strokes={[P.rect(x, y, w, h, 8)]} from={0} durationInFrames={10} id={id} width={3} pen={false} />
  </>;
  return (
    <AbsoluteFill>
      <Paper chapter={C}>
        <Picture>
          {photo(40, 80, 260, 250, "p1")}
          {photo(340, 60, 330, 340, "p2")}
          {photo(40, 440, 260, 250, "p3")}
          {[n, m, mk].map((l, i) => <React.Fragment key={i}>
            <Wash shape={l.body} color="#8A5A3C" at={0} id={`lb${i}`} alpha={0.85} />
            <Wash shape={l.dark} color="#3B2418" at={0} id={`ld${i}`} alpha={0.8} />
            <Ink strokes={[l.body]} from={0} durationInFrames={10} id={`li${i}`} width={2} pen={false} color="#4A2E1E" />
          </React.Fragment>)}
          <Wash shape={rl.body} color="#F4F1E6" at={0} id="rlw" alpha={0.9} />
          <Ink strokes={[rl.body, ...rl.ticks]} from={0} durationInFrames={20} id="rl" width={2} pen={false} />
          {rl.cm.map(([x, y], i) => <Label key={i} text={String(i)} x={x} y={y} at={20} size={18} italic={false} />)}
          <Ink strokes={[mk.ring]} from={0} durationInFrames={10} id="mkr" color="#6A3FA0" width={6} pen={false} />
          <Wash shape={pen.barrel} color="#E8E4DA" at={0} id="pnb" alpha={0.9} />
          <Wash shape={pen.cap} color={pen.violet} at={0} id="pnc" alpha={0.85} />
          <Ink strokes={[pen.barrel, pen.cap, pen.clip, pen.taper]} from={0} durationInFrames={20} id="pn" />
          <Ink strokes={[pen.nib]} from={0} durationInFrames={10} id="pnn" color={pen.violet} width={6} pen={false} />
          <Wash shape={qp.sheet} color="#FFFDF6" at={0} id="qpw" alpha={0.9} />
          <Ink strokes={[qp.sheet, qp.ear, qp.header, ...qp.lines]} from={0} durationInFrames={20} id="qp" />
          <Label text="MBBS Final · 2016" x={qp.title[0]} y={qp.title[1]} at={20} size={24} italic={false} weight={700} />
          {[0, 1, 2, 3].map((i) => <Label key={i} text={`Q${i + 1}.`} x={qp.q(i)[0]} y={qp.q(i)[1]} at={20} size={24} italic={false} weight={700} />)}
          <Wash shape={lk.body} color="#C9A24A" at={0} id="lkw" alpha={0.7} />
          <Ink strokes={[lk.shackle, lk.body, ...lk.keyhole]} from={0} durationInFrames={20} id="lk" />
          <Wash shape={dl.face} color="#DCE6EE" at={0} id="dlw" alpha={0.7} />
          <Ink strokes={[dl.face, dl.grip, ...dl.ticks, dl.pointer]} from={0} durationInFrames={20} id="dl" />
        </Picture>
      </Paper>
    </AbsoluteFill>
  );
};
