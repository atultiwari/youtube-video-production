/**
 * The object library on one frame (`kit-objects`, 1920 × 1080, 60 frames): every object fully
 * drawn, so a still shows whether each one reads as the real thing. Check it after editing
 * objects.tsx:  npx remotion still kit-objects out/objects.png --frame=59
 */
import { AbsoluteFill } from "remotion";

import { Paper } from "./Chrome";
import { Cell, Rbc } from "./cells";
import { Dots, Fills, Hatch, Ink, Label, Picture, Wash } from "./Picture";
import React from "react";

import { P } from "./shapes";
import { attentionArc, bookPile, clothBag, laptop, layerStack, magnifier, reportSheet, serverRack } from "./objects";
import { bell, blister, chip, cloud, coin, ctScanner, ehrScreen, errorLandscape, hospitalBed, tree, vial, wifi } from "./objects";
import { PPVBar, Slider, Table } from "./metrics";
import { AppleArt, CarArt, ColonTileArt, DogArt, KidneyArt, NetworkArt, NeuronArt } from "./art";
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

/** E05 objects (`kit-objects-5`): a ward bed, a forest of broad-leaved trees, a blister strip. */
export const ObjectsDemo5: React.FC = () => {
  const bd = hospitalBed(60, 120, 1.4);
  const trees = [0, 1, 2].map((i) => tree(760 + i * 170, 520 - (i % 2) * 30, 0.9 + (i % 2) * 0.15, `t${i}`));
  const bl = blister(120, 560, 420, 170, 5);
  return (
    <AbsoluteFill>
      <Paper chapter={C}>
        <Picture>
          <Wash shape={bd.mattress} color="#CFE3F0" at={0} id="bdm" alpha={0.9} />
          <Wash shape={bd.pillow} color="#FFFFFF" at={0} id="bdp" alpha={0.9} />
          <Ink strokes={[bd.headboard, bd.footboard, bd.mattress, bd.pillow, ...bd.frame, ...bd.rail, ...bd.legs, ...bd.castors]} from={0} durationInFrames={20} id="bd" />
          {trees.map((t, i) => <React.Fragment key={i}>
            <Wash shape={t.trunk} color="#8A5A3C" at={0} id={`tt${i}`} alpha={0.8} />
            <Ink strokes={[t.trunk]} from={0} durationInFrames={20} id={`tk${i}`} />
            <Wash shape={t.crown} color="#9CC59A" at={0} id={`tc${i}`} alpha={0.88} />
            <Ink strokes={[...t.branches, t.crown]} from={0} durationInFrames={20} id={`ti${i}`} />
          </React.Fragment>)}
          <Wash shape={bl.card} color="#D9DDE2" at={0} id="blw" alpha={0.9} />
          {bl.tablets.map((t, i) => <Wash key={i} shape={t} color="#F2EEE4" at={0} id={`blt${i}`} alpha={0.95} />)}
          <Ink strokes={[bl.card, ...bl.pockets, ...bl.tablets, ...bl.perforation]} from={0} durationInFrames={20} id="bl" />
        </Picture>
      </Paper>
    </AbsoluteFill>
  );
};

/**
 * Page 6 of the library (`kit-objects-6`): the E06 additions. Check after editing:
 *   npx remotion still kit-objects-6 out/objects-6.png --frame=59
 */
export const ObjectsDemo6: React.FC = () => {
  const land = errorLandscape(560, 560, 500, 220);
  const ball = land.at(0.86);
  return (
    <AbsoluteFill>
      <Paper chapter={C}>
        <Picture>
          <ColonTileArt x={10} y={10} w={340} h={300} at={0} id="ctn" dur={24} />
          <ColonTileArt x={370} y={10} w={340} h={300} kind="tumour" at={0} id="ctt" dur={24} />
          <NeuronArt x={10} y={330} s={0.6} at={0} id="nr" dur={24} />
          <NetworkArt x={740} y={40} w={320} h={240} at={0} id="nw" dur={24} />
          <KidneyArt x={20} y={520} s={0.9} at={0} id="kd" />
          <DogArt x={230} y={560} s={0.9} at={0} id="dg" />
          <CarArt x={240} y={780} s={0.7} at={0} id="cr" />
          <AppleArt x={560} y={330} s={0.8} at={0} id="ap" />
          <Wash shape={land.body} color="#CDE3C4" at={0} id="lw" alpha={0.8} />
          <Ink strokes={[land.ground]} from={0} durationInFrames={20} id="lg" width={5} />
          <Fills shapes={[P.ellipse(ball[0], ball[1] - 22, 22, 22)]} color="#C8423B" at={0} />
        </Picture>
      </Paper>
    </AbsoluteFill>
  );
};

/**
 * Page 7 of the library (`kit-objects-7`): the E07 additions (2×2 table geometry, vial, rupee coin,
 * alarm bell) and metrics.tsx (frame-driven 2×2 table at 2% prevalence, PPV bar, prevalence
 * slider), with the phone and bed they appear beside. Check after editing:
 *   npx remotion still kit-objects-7 out/objects-7.png --frame=59
 */
export const ObjectsDemo7: React.FC = () => {
  const v = vial(640, 60, 1.2);
  const c = coin(940, 170, 110);
  const b = bell(180, 640, 0.9);
  const ph = phone(420, 470, 150, 280);
  const bd = hospitalBed(640, 560, 0.9);
  return (
    <AbsoluteFill>
      <Paper chapter={C}>
        <Picture>
          <Table x={20} y={20} w={560} h={380} at={0} id="mt" wash={{ tp: 0, fp: 0, fn: 0, tn: 0 }} count={{ p: () => 2, at: { tp: 0, fp: 0, fn: 0, tn: 0 } }} size={56} headSize={32} />
          <PPVBar x={700} y={380} w={340} h={40} at={0} id="mpb" p={() => 2} label={false} />
          <Slider x={700} y={510} w={360} at={0} id="msl" p={() => 2} color="#F6D8A8" size={34} />
          <Wash shape={v.glass} color="#E4F0F4" at={0} id="vg" alpha={0.9} />
          <Wash shape={v.powder} color="#FFFFFF" at={0} id="vp" alpha={1} />
          <Wash shape={v.label} color="#FFF4D6" at={0} id="vl" alpha={1} />
          <Wash shape={v.crimp} color="#C9CDD2" at={0} id="vc" alpha={1} />
          <Wash shape={v.cap} color="#3E7CC0" at={0} id="vk" alpha={1} />
          <Ink strokes={[v.glass, v.crimp, v.cap, v.capRidge, v.label, ...v.print, v.powder, v.shine]} from={0} durationInFrames={20} id="vi" width={3} />
          <Wash shape={c.face} color="#C9CCD1" at={0} id="cf" alpha={0.95} />
          <Ink strokes={[c.face, c.ring, ...c.reeds]} from={0} durationInFrames={20} id="ci" width={3} double={false} />
          <Ink strokes={c.rupee} from={0} durationInFrames={20} id="cr" width={6} />
          <Wash shape={b.body} color="#E9C46A" at={0} id="bw" alpha={0.95} />
          <Wash shape={b.clapper} color="#9C7A2A" at={0} id="bc" alpha={1} />
          <Ink strokes={[b.body, b.lip, b.knob, b.clapper, b.shine]} from={0} durationInFrames={20} id="bi" />
          <Ink strokes={b.arcs} from={0} durationInFrames={20} id="ba" color="#C8423B" width={4} double={false} />
          <Wash shape={ph.screen} color="#FDE2DE" at={0} id="ps" alpha={0.95} />
          <Ink strokes={[ph.body, ph.screen, ph.camera, ph.bar]} from={0} durationInFrames={20} id="pi" />
          <Label text="SEPSIS ALERT" x={495} y={600} at={0} size={22} italic={false} weight={700} color="#C8423B" />
          <Label text="Bed 12" x={495} y={640} at={0} size={26} italic={false} weight={700} />
          <Wash shape={bd.mattress} color="#DDE8F2" at={0} id="bm" alpha={0.9} />
          <Ink strokes={[bd.headboard, bd.footboard, bd.mattress, bd.pillow, ...bd.frame, ...bd.rail, ...bd.legs, ...bd.castors]} from={0} durationInFrames={20} id="bdi" />
        </Picture>
      </Paper>
    </AbsoluteFill>
  );
};

/** E08 objects: CT scanner with patient, EHR screen with an alert banner, cloud, chip, Wi-Fi. */
export const ObjectsDemo8: React.FC = () => {
  const ct = ctScanner(20, 60, 1.05);
  const e = ehrScreen(720, 40, 360, 250);
  const cl = cloud(180, 640, 260);
  const ch = chip(520, 660, 150);
  const wf = wifi(800, 720, 1);
  return (
    <AbsoluteFill>
      <Paper chapter={C}>
        <Picture>
          <Wash shape={ct.side} color="#D9DDE2" at={0} id="cts" alpha={1} />
          <Wash shape={ct.housing} color="#F3F4F6" at={0} id="cth" alpha={1} />
          <Wash shape={ct.ring} color="#BFD6EA" at={0} id="ctr" alpha={1} />
          <Wash shape={ct.bore} color="#5A6470" at={0} id="ctb" alpha={1} />
          <Wash shape={ct.rim} color="#3A424C" at={0} id="ctm" alpha={1} />
          <Wash shape={ct.plinth} color="#C9CDD2" at={0} id="ctpl" alpha={1} />
          <Wash shape={ct.pedestal} color="#C9CDD2" at={0} id="ctp" alpha={1} />
          <Wash shape={ct.table} color="#AEB4BB" at={0} id="ctt" alpha={1} />
          <Wash shape={ct.mattress} color="#7FA7D6" at={0} id="ctmt" alpha={1} />
          <Wash shape={ct.patientBody} color="#E8C9A8" at={0} id="ctpb" alpha={1} />
          <Wash shape={ct.patientHead} color="#E8C9A8" at={0} id="ctph" alpha={1} />
          <Wash shape={ct.display} color="#2F5E8E" at={0} id="ctd" alpha={1} />
          <Ink strokes={[ct.side, ct.plinth, ct.housing, ct.ring, ct.bore, ct.rim, ct.display, ...ct.leds, ct.pedestal, ct.foot, ct.table, ct.mattress, ct.patientBody, ct.patientHead]} from={0} durationInFrames={20} id="cti" />
          <Wash shape={e.screen} color="#F4F7FA" at={0} id="es" alpha={1} />
          <Wash shape={e.titleBar} color="#2F5E8E" at={0} id="et" alpha={1} />
          <Wash shape={e.sidebar} color="#DDE6EF" at={0} id="esb" alpha={1} />
          <Wash shape={e.banner} color="#F2B8B0" at={0} id="eb" alpha={1} />
          <Ink strokes={[e.case, e.screen, e.neck, e.foot, e.titleBar, e.sidebar, ...e.entries, e.banner, ...e.rows, e.chartBox]} from={0} durationInFrames={20} id="ei" width={3} />
          <Ink strokes={[e.chart]} from={0} durationInFrames={20} id="ec" width={3} color="#C8423B" double={false} />
          <Label text="SEPSIS RISK HIGH" x={e.bannerAt[0]} y={e.bannerAt[1] + 8} at={0} size={20} italic={false} weight={700} color="#8E2B25" />
          <Wash shape={cl} color="#DDE8F2" at={0} id="clw" alpha={1} />
          <Ink strokes={[cl]} from={0} durationInFrames={20} id="cli" />
          <Wash shape={ch.body} color="#3A424C" at={0} id="chb" alpha={1} />
          <Wash shape={ch.die} color="#9AA3AD" at={0} id="chd" alpha={1} />
          <Ink strokes={[ch.body, ch.die, ...ch.pins]} from={0} durationInFrames={20} id="chi" width={3} />
          <Ink strokes={[wf.dot, ...wf.arcs]} from={0} durationInFrames={20} id="wfi" width={6} double={false} />
          <Ink strokes={wf.cross} from={0} durationInFrames={20} id="wfx" width={6} color="#C8423B" double={false} />
        </Picture>
      </Paper>
    </AbsoluteFill>
  );
};

/** E09 objects: report sheet, cloth bag, magnifier, book pile, layer stack, attention arcs. */
export const ObjectsDemo9: React.FC = () => {
  const r = reportSheet(20, 20, 420, 560, 3);
  const g = clothBag(500, 40, 1);
  const m = magnifier(900, 160, 90);
  const bk = bookPile(480, 420, 1);
  const st = layerStack(840, 380, 220, 420, 6);
  const xs = [80, 230, 400, 560];
  return (
    <AbsoluteFill>
      <Paper chapter={C}>
        <Picture>
          <Wash shape={r.sheet} color="#FFFFFF" at={0} id="rs" alpha={1} />
          <Wash shape={r.band} color="#2F5E8E" at={0} id="rb" alpha={1} />
          <Wash shape={r.logo} color="#FFFFFF" at={0} id="rl" alpha={1} />
          <Wash shape={r.details} color="#EEF2F6" at={0} id="rd" alpha={1} />
          <Ink strokes={[r.sheet, r.band, r.logo, ...r.logoCross, r.titleRule, r.details, r.detailsMid]} from={0} durationInFrames={20} id="ri" width={3} />
          <Ink strokes={r.fields} from={0} durationInFrames={20} id="rf" width={4} color="#7A8794" double={false} pen={false} />
          <Ink strokes={r.sectionHeads} from={0} durationInFrames={20} id="rh" width={7} color="#2B2B2B" double={false} pen={false} />
          <Ink strokes={r.sectionBodies} from={0} durationInFrames={20} id="rbd" width={3} color="#9AA3AD" double={false} pen={false} />
          <Ink strokes={[r.signature, r.signRule, r.stamp]} from={0} durationInFrames={20} id="rsg" width={3} color="#2F5E8E" double={false} />
          <Label text="CITY HOSPITAL" x={r.nameAt[0]} y={r.nameAt[1]} at={0} size={36} italic={false} weight={700} color="#FFFFFF" anchor="start" />
          <Label text="DISCHARGE SUMMARY" x={r.titleAt[0]} y={r.titleAt[1]} at={0} size={36} italic={false} weight={700} />
          <Wash shape={g.sack} color="#D8C29A" at={0} id="gs" alpha={1} />
          <Wash shape={g.neck} color="#C9B083" at={0} id="gn" alpha={1} />
          <Ink strokes={[g.sack, g.neck, ...g.folds]} from={0} durationInFrames={20} id="gi" />
          <Ink strokes={g.cord} from={0} durationInFrames={20} id="gc" color="#8A5A2B" width={5} double={false} />
          <Wash shape={m.lens} color="#DDE8F2" at={0} id="ml" alpha={0.6} />
          <Wash shape={m.handle} color="#3A424C" at={0} id="mh" alpha={1} />
          <Ink strokes={[m.rim, m.lens, m.handle]} from={0} durationInFrames={20} id="mi" width={5} />
          <Ink strokes={[m.glint]} from={0} durationInFrames={20} id="mg" width={5} color="#FFFFFF" double={false} />
          {bk.covers.map((c, i) => <Wash key={i} shape={c} color={["#2F5E8E", "#B5523B", "#4E8A5C"][i]} at={0} id={`bc${i}`} alpha={1} />)}
          {bk.pages.map((c, i) => <Wash key={i} shape={c} color="#FBF6EA" at={0} id={`bp${i}`} alpha={1} />)}
          <Ink strokes={[...bk.covers, ...bk.pages, ...bk.spines]} from={0} durationInFrames={20} id="bki" width={3} />
          <Ink strokes={bk.leaves} from={0} durationInFrames={20} id="bkl" width={2} color="#B8B0A0" double={false} pen={false} />
          {st.blocks.map((b, i) => <Wash key={i} shape={b} color="#EFE6D2" at={0} id={`sb${i}`} alpha={1} />)}
          {st.attn.map((b, i) => <Wash key={i} shape={b} color="#F2C28B" at={0} id={`sa${i}`} alpha={1} />)}
          <Ink strokes={[...st.blocks, ...st.splits, ...st.links]} from={0} durationInFrames={20} id="sti" width={3} />
          {xs.map((x, i) => <Label key={i} text={["The", "tumour", "...", "it"][i]} x={x} y={800} at={0} size={40} italic={false} weight={600} />)}
          <Ink strokes={[attentionArc(560, 230, 760, 70), attentionArc(560, 400, 760, 30)]} from={0} durationInFrames={20} id="aa" width={6} color="#C8423B" double={false} />
        </Picture>
      </Paper>
    </AbsoluteFill>
  );
};

/** Page 10 (E10): laptop, server rack, with the phone, cloud and dial they appear beside. */
export const ObjectsDemo10: React.FC = () => {
  const l = laptop(40, 120, 760, 560);
  const s = serverRack(900, 60, 360, 760, 6);
  const p = phone(1300, 160, 180, 400);
  const c = cloud(1650, 220, 200);
  const d = dial(1650, 640, 80, 0.7);
  return (
    <AbsoluteFill>
      <Paper chapter={C}>
        <Picture>
          <Wash shape={l.lid} color="#3A424C" at={0} id="ll" alpha={1} />
          <Wash shape={l.screen} color="#EAF2FA" at={0} id="ls" alpha={1} />
          <Wash shape={l.deck} color="#C9CED4" at={0} id="ld" alpha={1} />
          {l.keys.map((k, i) => <Wash key={i} shape={k} color="#3A424C" at={0} id={`lk${i}`} alpha={0.85} />)}
          <Wash shape={l.space} color="#3A424C" at={0} id="lsp" alpha={0.85} />
          <Wash shape={l.touchpad} color="#B5BBC2" at={0} id="ltp" alpha={1} />
          <Ink strokes={[l.lid, l.screen, l.webcam, l.hinge, l.deck, l.touchpad, l.lip, ...l.lipSides]} from={0} durationInFrames={20} id="li" width={3} />
          <Ink strokes={[...l.keys, l.space]} from={0} durationInFrames={20} id="lki" width={1.5} color="#2B2B2B" double={false} pen={false} />
          <Wash shape={s.cabinet} color="#2B3036" at={0} id="sc" alpha={1} />
          {s.servers.map((k, i) => <Wash key={i} shape={k} color="#8C949C" at={0} id={`ss${i}`} alpha={1} />)}
          {s.bays.map((k, i) => <Wash key={i} shape={k} color="#4A5158" at={0} id={`sb${i}`} alpha={1} />)}
          {s.leds.map((k, i) => <Wash key={i} shape={k} color={i % 2 ? "#7BD389" : "#F5B342"} at={0} id={`sl${i}`} alpha={1} />)}
          {s.feet.map((k, i) => <Wash key={i} shape={k} color="#2B3036" at={0} id={`sf${i}`} alpha={1} />)}
          <Ink strokes={[s.cabinet, ...s.servers, ...s.feet, ...s.rails]} from={0} durationInFrames={20} id="si" width={3} />
          <Ink strokes={[...s.bays, ...s.vents, ...s.topVent, ...s.holes]} from={0} durationInFrames={20} id="sv" width={2} color="#1E2226" double={false} pen={false} />
          <Wash shape={p.body} color="#2B3036" at={0} id="pb" alpha={1} />
          <Wash shape={p.screen} color="#EAF2FA" at={0} id="ps" alpha={1} />
          <Ink strokes={[p.body, p.screen, p.camera, p.bar]} from={0} durationInFrames={20} id="pi" width={3} />
          <Wash shape={c} color="#DDE8F2" at={0} id="cw" alpha={1} />
          <Ink strokes={[c]} from={0} durationInFrames={20} id="ci" width={4} />
          <Ink strokes={[d.face, d.grip, ...d.ticks, d.pointer]} from={0} durationInFrames={20} id="di" width={4} />
          <Label text="laptop" x={420} y={900} at={0} size={40} italic={false} weight={600} />
          <Label text="server rack" x={1080} y={900} at={0} size={40} italic={false} weight={600} />
        </Picture>
      </Paper>
    </AbsoluteFill>
  );
};
