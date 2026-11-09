/**
 * The object library on one frame (`kit-objects`, 1920 × 1080, 60 frames): every object fully
 * drawn, so a still shows whether each one reads as the real thing. Check it after editing
 * objects.tsx:  npx remotion still kit-objects out/objects.png --frame=59
 */
import { AbsoluteFill } from "remotion";
import { DuctArt, ParaffinBlockArt, DnaHelixArt, ExprHeatmapArt, Her2TileArt, KnowledgeGraphArt } from "./art";
import { Ki67TileArt, LymphNodeArt, NodeMetTileArt, NodeSlideArt, TilePyramidArt, WsiScannerArt } from "./art";

import { Paper } from "./Chrome";
import { Cell, Rbc } from "./cells";
import { Dots, Fills, Hatch, Ink, Label, Picture, Wash } from "./Picture";
import React from "react";

import { P } from "./shapes";
import { chatWindow, leaflet, mcqSheet } from "./objects";
import { doctor as doctorBust, ehrNote, opdDesk, seatedPerson, tumourBoard, usbPlug } from "./objects";
import { attentionArc, bookPile, closedBook, clothBag, examDesk, journalPage, laptop, layerStack, magnifier, openBook, reportSheet, serverRack } from "./objects";
import { bell, blister, chip, cloud, coin, ctScanner, ehrScreen, errorLandscape, hospitalBed, tree, vial, wifi } from "./objects";
import { PPVBar, Slider, Table } from "./metrics";
import { EndoViewArt, MammogramArt, SeeSawArt } from "./art";
import { BreastTileArt, CoreSlideArt, FilmTokenArt, HeatSpotArt, ModelCardArt, SnowArt, SuperpixelArt, WaterfallArt } from "./art";
import { coreSlide, filmToken, modelCard, shapWaterfall } from "./objects";
import { endoView, mammogram, seeSaw } from "./objects";
import { ArticleArt, ClipboardArt, EnclosureArt, PawArt, RetinalCameraArt, ToneScaleArt, ZooGateArt, ZooMapArt } from "./art";
import { enclosure, toneScale, zooGate, zooMap } from "./objects";
import { clipboard, researchArticle, retinalCamera } from "./objects";
import { AppleArt, CarArt, ColonTileArt, DetectiveArt, DogArt, ForgerArt, FundusArt, HeSlideArt, KidneyArt, MicroscopeArt, NetworkArt, NeuronArt, SquamousTileArt, ThyroidTileArt } from "./art";
import { dial, lesion, padlock, questionPaper, ruler, skinMarker } from "./objects";
import { blackboard, chestFilm, clock, database, doctor, ecgStrip, finger, foot, fundus, glassSlide, goBoard, headScan, heart, hospital, ivBag, monitor, monofilament, oximeter, phone, sheet, STAIN, syringe, testTube } from "./objects";
import { PapSmearArt, PassportArt, ScalesArt, WorldMapArt } from "./art";
import { passport, worldMap } from "./objects";
import { ChestXrayArt, HeadCTArt, SkinProbeArt, UNetArt } from "./art";
import { uNet } from "./objects";
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

/** Page 11 (E11): exam-hall desk with a closed book in its rack, an open textbook, a closed textbook, a journal reference list. */
export const ObjectsDemo11: React.FC = () => {
  const d = examDesk(40, 300, 620, 560);
  const [rx, ry, rw, rh] = d.rack;
  const cb = closedBook(rx + rw * 0.2, ry + rh * 0.18, rw * 0.36, rh * 0.62);
  const sheetQ = [d.onTop(0.3, 0.2), d.onTop(0.62, 0.2), d.onTop(0.64, 0.85), d.onTop(0.28, 0.85)];
  const ob = openBook(720, 120, 640, 420);
  const c2 = closedBook(760, 640, 260, 340);
  const j = journalPage(1420, 80, 460, 900, 3);
  return (
    <AbsoluteFill>
      <Paper chapter={C}>
        <Picture>
          <Wash shape={d.top} color="#D9B98A" at={0} id="dt" alpha={1} />
          <Wash shape={d.edge} color="#A9844F" at={0} id="de" alpha={1} />
          <Wash shape={d.rackBack} color="#5A4630" at={0} id="drb" alpha={1} />
          {d.legs.map((l, i) => <Wash key={i} shape={l} color="#7D858D" at={0} id={`dl${i}`} alpha={1} />)}
          <Ink strokes={[d.top, d.edge, d.rackBox, d.rackBack, ...d.legs, d.footBar, ...d.feet]} from={0} durationInFrames={20} id="di" width={3} />
          <Ink strokes={d.grain} from={0} durationInFrames={20} id="dg" width={2} color="#A9844F" double={false} pen={false} />
          <Wash shape={P.polyline([...sheetQ, sheetQ[0]], 6)} color="#FFFFFF" at={0} id="ds" alpha={1} />
          <Ink strokes={[P.polyline([...sheetQ, sheetQ[0]], 6)]} from={0} durationInFrames={20} id="dsi" width={2} />
          <Wash shape={cb.pageBlock} color="#FBF6EA" at={0} id="cbp" alpha={1} />
          <Wash shape={cb.cover} color="#2F5E8E" at={0} id="cbc" alpha={1} />
          <Wash shape={cb.spine} color="#21456B" at={0} id="cbs" alpha={1} />
          <Ink strokes={[cb.pageBlock, cb.cover, cb.spine, ...cb.pageLines]} from={0} durationInFrames={20} id="cbi" width={2} />
          <Wash shape={ob.cover} color="#8B3A2E" at={0} id="obc" alpha={1} />
          <Wash shape={ob.left} color="#FBF6EA" at={0} id="obl" alpha={1} />
          <Wash shape={ob.right} color="#FBF6EA" at={0} id="obr" alpha={1} />
          {ob.heads.map((s, i) => <Wash key={i} shape={s} color="#8B3A2E" at={0} id={`obh${i}`} alpha={0.85} />)}
          <Wash shape={ob.figure} color="#DDE8F2" at={0} id="obf" alpha={1} />
          <Ink strokes={[ob.cover, ob.left, ob.right, ob.gutter, ob.figure, ...ob.stacks]} from={0} durationInFrames={20} id="obi" width={3} />
          <Ink strokes={ob.lines} from={0} durationInFrames={20} id="obt" width={3} color="#9AA3AD" double={false} pen={false} />
          <Ink strokes={[ob.line(1, 4)]} from={0} durationInFrames={20} id="obhl" width={22} color="#F6E7B0" double={false} pen={false} />
          <Wash shape={c2.pageBlock} color="#FBF6EA" at={0} id="c2p" alpha={1} />
          <Wash shape={c2.cover} color="#4E8A5C" at={0} id="c2c" alpha={1} />
          <Wash shape={c2.spine} color="#3A6B46" at={0} id="c2s" alpha={1} />
          <Wash shape={c2.panel} color="#F3EEE2" at={0} id="c2pn" alpha={1} />
          <Ink strokes={[c2.pageBlock, c2.cover, c2.spine, c2.panel, ...c2.rules, ...c2.spineBands, ...c2.pageLines]} from={0} durationInFrames={20} id="c2i" width={3} />
          <Label text="PHARMACOLOGY" x={c2.titleAt[0]} y={c2.titleAt[1] + 8} at={0} size={22} italic={false} weight={700} />
          <Wash shape={j.sheet} color="#FFFFFF" at={0} id="js" alpha={1} />
          <Wash shape={j.head} color="#2F5E8E" at={0} id="jh" alpha={1} />
          <Ink strokes={[j.sheet, j.headRule, j.refRule]} from={0} durationInFrames={20} id="ji" width={3} />
          <Ink strokes={j.body} from={0} durationInFrames={20} id="jb" width={3} color="#9AA3AD" double={false} pen={false} />
          <Label text="References" x={j.refHeadAt[0]} y={j.refHeadAt[1]} at={0} size={30} italic={false} weight={700} anchor="start" />
          {[0, 1, 2].map((i) => <React.Fragment key={i}>
            <Label text={`${i + 1}.`} x={j.number(i)[0]} y={j.number(i)[1]} at={0} size={22} italic={false} weight={600} anchor="start" />
            <Label text="Bhattacharyya M, Miller VM, et al." x={j.entry(i)[0]} y={j.entry(i)[1]} at={0} size={22} italic={false} anchor="start" />
            <Label text="Cureus. 2023;15(5):e39238." x={j.entry(i)[0]} y={j.entry(i)[1] + 30} at={0} size={22} italic anchor="start" />
          </React.Fragment>)}
          <Label text="exam desk, book in the rack" x={350} y={960} at={0} size={36} italic={false} weight={600} />
          <Label text="open textbook" x={1040} y={600} at={0} size={36} italic={false} weight={600} />
        </Picture>
      </Paper>
    </AbsoluteFill>
  );
};

/** Page 12 (E12): chat window with a user and an assistant bubble, a patient leaflet, an MCQ sheet with the answer bubble filled. */
export const ObjectsDemo12: React.FC = () => {
  const cw = chatWindow(40, 80, 700, 820);
  const [bx, by, bw] = cw.body;
  const lf = leaflet(800, 60, 520, 900, 3, 2);
  const mq = mcqSheet(1380, 80, 500, 880, 3);
  const bub = (x0: number, y0: number, w0: number, h0: number) => P.rect(x0, y0, w0, h0, 22);
  return (
    <AbsoluteFill>
      <Paper chapter={C}>
        <Picture>
          <Wash shape={cw.frame} color="#FFFFFF" at={0} id="cwf" alpha={1} />
          <Wash shape={cw.titleBar} color="#E6E9EE" at={0} id="cwt" alpha={1} />
          {cw.buttons.map((b, i) => <Wash key={i} shape={b} color={["#E0605A", "#E9B949", "#6DBE5A"][i]} at={0} id={`cwb${i}`} alpha={1} />)}
          <Wash shape={cw.avatar} color="#C9643D" at={0} id="cwa" alpha={1} />
          <Wash shape={cw.input} color="#F4F5F7" at={0} id="cwi" alpha={1} />
          <Wash shape={cw.send} color="#2F5E8E" at={0} id="cws" alpha={1} />
          <Wash shape={bub(bx + bw * 0.3, by + 20, bw * 0.7, 120)} color="#DDE8F2" at={0} id="ub" alpha={1} />
          <Wash shape={bub(bx, by + 180, bw * 0.85, 220)} color="#F7F7F2" at={0} id="ab" alpha={1} />
          <Ink strokes={[cw.frame, cw.titleRule, ...cw.buttons, cw.avatar, cw.scroll, cw.input, cw.send, bub(bx + bw * 0.3, by + 20, bw * 0.7, 120), bub(bx, by + 180, bw * 0.85, 220)]} from={0} durationInFrames={20} id="cwI" width={3} />
          <Ink strokes={[...cw.spark, ...cw.sendArrow]} from={0} durationInFrames={20} id="cwS" width={3} color="#FFFFFF" double={false} pen={false} />
          <Label text="Assistant" x={cw.nameAt[0]} y={cw.nameAt[1]} at={0} size={28} italic={false} weight={700} anchor="start" />
          <Label text="Write about iron tablets" x={bx + bw * 0.34} y={by + 92} at={0} size={30} italic={false} anchor="start" />
          <Label text="Iron is absorbed in the" x={bx + 24} y={by + 240} at={0} size={30} italic={false} anchor="start" />
          <Label text="duodenum, bound to ferritin…" x={bx + 24} y={by + 285} at={0} size={30} italic={false} anchor="start" />
          <Label text="Message…" x={cw.inputAt[0]} y={cw.inputAt[1]} at={0} size={28} italic={false} color="#8A929B" anchor="start" />

          <Wash shape={lf.sheet} color="#FFFFFF" at={0} id="lfs" alpha={1} />
          <Wash shape={lf.band} color="#2F7F8E" at={0} id="lfb" alpha={1} />
          <Wash shape={lf.footer} color="#2F7F8E" at={0} id="lff" alpha={1} />
          <Wash shape={lf.logo} color="#FFFFFF" at={0} id="lfl" alpha={1} />
          <Wash shape={lf.picture} color="#EEF5F6" at={0} id="lfp" alpha={1} />
          <Wash shape={lf.pill} color="#C8423B" at={0} id="lfpi" alpha={1} />
          <Wash shape={lf.water} color="#BFDDF0" at={0} id="lfw" alpha={1} />
          {lf.heads.map((s, i) => <Wash key={i} shape={s} color="#D8ECEF" at={0} id={`lfh${i}`} alpha={1} />)}
          {lf.dots.map((s, i) => <Wash key={i} shape={s} color="#2F7F8E" at={0} id={`lfd${i}`} alpha={1} />)}
          <Ink strokes={[lf.sheet, lf.band, lf.footer, lf.logo, lf.picture, lf.pill, lf.glass, ...lf.heads, lf.phone]} from={0} durationInFrames={20} id="lfI" width={3} />
          <Ink strokes={[lf.pillScore, ...lf.logoCross]} from={0} durationInFrames={20} id="lfC" width={2} color="#9AA3AD" double={false} pen={false} />
          <Label text="Taking iron tablets" x={lf.titleAt[0]} y={lf.titleAt[1]} at={0} size={36} italic={false} weight={700} color="#FFFFFF" />
          {["When to take it", "Avoid with it", "Call us if"].map((t, i) => <Label key={i} text={t} x={lf.headAt(i)[0]} y={lf.headAt(i)[1] + 11} at={0} size={30} italic={false} weight={700} anchor="start" />)}
          {["30 min before breakfast", "with water or orange juice", "tea, coffee, milk, eggs", "leave a 2-hour gap", "stools black and tarry", "you see blood"].map((t, k) => <Label key={k} text={t} x={lf.bulletAt(Math.floor(k / 2), k % 2)[0]} y={lf.bulletAt(Math.floor(k / 2), k % 2)[1]} at={0} size={28} italic={false} anchor="start" />)}
          <Label text="Questions? Call the pharmacy" x={lf.footAt[0]} y={lf.footAt[1]} at={0} size={26} italic={false} color="#FFFFFF" anchor="start" />

          <Wash shape={mq.sheet} color="#FFFFFF" at={0} id="mqs" alpha={1} />
          <Wash shape={mq.header} color="#E1D6F0" at={0} id="mqh" alpha={1} />
          <Wash shape={mq.qCircle} color="#2F5E8E" at={0} id="mqq" alpha={1} />
          <Wash shape={mq.bubble(1)} color="#22272E" at={0} id="mqa" alpha={1} />
          <Ink strokes={[mq.sheet, mq.ear, mq.header, mq.marks, mq.qCircle, ...mq.bubbles]} from={0} durationInFrames={20} id="mqI" width={3} />
          <Label text="Haematology · SBA" x={mq.titleAt[0]} y={mq.titleAt[1]} at={0} size={28} italic={false} weight={700} />
          <Label text="1" x={mq.marksAt[0]} y={mq.marksAt[1]} at={0} size={28} italic={false} weight={700} />
          <Label text="1" x={mq.qAt[0]} y={mq.qAt[1] + 10} at={0} size={28} italic={false} weight={800} color="#FFFFFF" />
          {["24-year-old woman, Hb 10.1,", "MCV 63, RBC 6.1 million,", "ferritin normal. Next test?"].map((t, i) => <Label key={i} text={t} x={mq.stemAt(i)[0]} y={mq.stemAt(i)[1]} at={0} size={26} italic={false} anchor="start" />)}
          {["A  Marrow aspiration", "B  Hb HPLC", "C  Vitamin B12", "D  Direct Coombs"].map((t, k) => <Label key={k} text={t} x={mq.opt(k).textAt[0]} y={mq.opt(k).textAt[1]} at={0} size={28} italic={false} anchor="start" />)}
        </Picture>
      </Paper>
    </AbsoluteFill>
  );
};

/** Page 13 (E13): OPD desk with a recording phone, a seated patient, the EHR clinic note (AI draft), a tumour board, a USB-C plug. */
export const ObjectsDemo13: React.FC = () => {
  const dk = opdDesk(60, 300, 640, 520);
  const dr = doctorBust(300, 260, 0.9);
  const pt = seatedPerson(820, 820, 1, 1);
  const nt = ehrNote(980, 30, 520, 520, 4, 2);
  const tb = tumourBoard(980, 600, 800, 360);
  const pl = usbPlug(1800, 120, 0.8);
  return (
    <AbsoluteFill>
      <Paper chapter={C}>
        <Picture>
          <Wash shape={dr.head} color="#F1D3B6" at={0} id="drh" alpha={1} />
          <Wash shape={dr.coat} color="#FFFFFF" at={0} id="drc" alpha={1} />
          <Ink strokes={[dr.head, dr.coat, ...dr.lapels, ...dr.stethoscope, dr.chestpiece]} from={0} durationInFrames={20} id="drI" width={3} />
          <Wash shape={dk.top} color="#D9B48A" at={0} id="dkt" alpha={1} />
          <Wash shape={dk.edge} color="#B98A5E" at={0} id="dke" alpha={1} />
          <Wash shape={dk.panel} color="#C99E72" at={0} id="dkp" alpha={1} />
          <Wash shape={dk.pedestal} color="#C99E72" at={0} id="dkd" alpha={1} />
          <Wash shape={dk.leg} color="#B98A5E" at={0} id="dkl" alpha={1} />
          <Wash shape={dk.pad} color="#FFFFFF" at={0} id="dkpd" alpha={1} />
          <Wash shape={dk.phone} color="#2B2F36" at={0} id="dkph" alpha={1} />
          <Wash shape={dk.screen} color="#1B2433" at={0} id="dks" alpha={1} />
          <Wash shape={dk.rec} color="#E0473C" at={0} id="dkr" alpha={1} />
          <Ink strokes={[dk.top, dk.edge, dk.panel, dk.pedestal, ...dk.drawers, ...dk.handles, dk.leg, dk.stand, dk.phone, dk.pad, ...dk.padLines, dk.pen]} from={0} durationInFrames={20} id="dkI" width={3} />
          <Ink strokes={[...dk.wave, ...dk.mic]} from={0} durationInFrames={20} id="dkW" width={3} color="#7FD3A8" double={false} pen={false} />
          <Wash shape={pt.head} color="#E8C3A0" at={0} id="pth" alpha={1} />
          <Wash shape={pt.seat} color="#8A6A4A" at={0} id="pts" alpha={1} />
          <Ink strokes={[pt.head, ...pt.body, ...pt.arm, ...pt.leg, pt.seat, ...pt.stoolLegs]} from={0} durationInFrames={20} id="ptI" width={4} />

          <Wash shape={nt.frame} color="#FFFFFF" at={0} id="ntf" alpha={1} />
          <Wash shape={nt.titleBar} color="#2F5E8E" at={0} id="ntt" alpha={1} />
          <Wash shape={nt.banner} color="#EEF2F6" at={0} id="ntb" alpha={1} />
          <Wash shape={nt.photo} color="#C9D3DD" at={0} id="ntp" alpha={1} />
          {nt.idBars.map((s, i) => <Wash key={i} shape={s} color="#9AA6B2" at={0} id={`nti${i}`} alpha={1} />)}
          <Wash shape={nt.ribbon} color="#E9B949" at={0} id="ntr" alpha={1} />
          {nt.tabs.map((s, i) => <Wash key={i} shape={s} color={["#E58A7E", "#7FA7CF", "#E9B949", "#8FC27F"][i]} at={0} id={`ntT${i}`} alpha={1} />)}
          <Wash shape={nt.edit} color="#EEF2F6" at={0} id="nte" alpha={1} />
          <Wash shape={nt.sign} color="#2E8B57" at={0} id="nts" alpha={1} />
          <Ink strokes={[nt.frame, nt.titleRule, nt.banner, nt.photo, nt.photoHead, nt.photoBody, nt.ribbon, ...nt.tabs, ...nt.rules, nt.edit, nt.sign]} from={0} durationInFrames={20} id="ntI" width={3} />
          <Label text="Clinic note" x={nt.titleAt[0]} y={nt.titleAt[1]} at={0} size={28} italic={false} weight={700} color="#FFFFFF" anchor="start" />
          <Label text="AI draft" x={nt.ribbonAt[0]} y={nt.ribbonAt[1] + 10} at={0} size={28} italic={false} weight={700} />
          {["S", "O", "A", "P"].map((t, i) => <Label key={i} text={t} x={nt.tabAt(i)[0]} y={nt.tabAt(i)[1] + 11} at={0} size={32} italic={false} weight={800} />)}
          {["Cough 2 weeks, no fever", "Non-smoker", "Chest clear, SpO2 98%", "Temp 37.0 °C", "Likely post-viral cough", "", "Review in 2 weeks", "X-ray if not better"].map((t, k) => <Label key={k} text={t} x={nt.rowAt(Math.floor(k / 2), k % 2)[0]} y={nt.rowAt(Math.floor(k / 2), k % 2)[1]} at={0} size={26} italic={false} anchor="start" />)}
          <Label text="Edit" x={nt.editAt[0]} y={nt.editAt[1] + 10} at={0} size={28} italic={false} weight={700} />
          <Label text="Sign" x={nt.signAt[0]} y={nt.signAt[1] + 10} at={0} size={28} italic={false} weight={700} color="#FFFFFF" />

          <Wash shape={tb.bezel} color="#3A3F46" at={0} id="tbz" alpha={1} />
          <Wash shape={tb.ctField} color="#14161A" at={0} id="tbc" alpha={1} />
          <Wash shape={tb.body} color="#8E949B" at={0} id="tbb" alpha={1} />
          <Wash shape={tb.liver} color="#B9BEC4" at={0} id="tbl" alpha={1} />
          <Wash shape={tb.lesion} color="#5B6168" at={0} id="tble" alpha={1} />
          <Wash shape={tb.vertebra} color="#EDEDED" at={0} id="tbv" alpha={1} />
          <Wash shape={tb.histoField} color="#FFFFFF" at={0} id="tbhf" alpha={1} />
          <Wash shape={tb.histo} color="#F2C6D6" at={0} id="tbh" alpha={1} />
          {tb.glands.map((s, i) => <Wash key={i} shape={s} color="#8E5BA8" at={0} id={`tbg${i}`} alpha={1} />)}
          {tb.lumens.map((s, i) => <Wash key={i} shape={s} color="#FFFFFF" at={0} id={`tbu${i}`} alpha={1} />)}
          <Wash shape={tb.table} color="#D9B48A" at={0} id="tbt" alpha={1} />
          <Wash shape={tb.tableEdge} color="#B98A5E" at={0} id="tbe" alpha={1} />
          {tb.farHeads.map((s, i) => <Wash key={i} shape={s} color="#E8C3A0" at={0} id={`tbf${i}`} alpha={1} />)}
          {tb.nearHeads.map((s, i) => <Wash key={i} shape={s} color="#3A3027" at={0} id={`tbn${i}`} alpha={1} />)}
          <Wash shape={tb.papers[0]} color="#FFFFFF" at={0} id="tbp0" alpha={1} />
          <Wash shape={tb.papers[1]} color="#FFFFFF" at={0} id="tbp1" alpha={1} />
          <Ink strokes={[tb.bezel, tb.ctField, tb.histoField, tb.body, tb.liver, tb.lesion, tb.vertebra, tb.histo, ...tb.glands, tb.table, tb.tableEdge, ...tb.far, ...tb.near, ...tb.papers]} from={0} durationInFrames={20} id="tbI" width={3} />

          <Wash shape={pl.body} color="#3A3F46" at={0} id="plb" alpha={1} />
          <Wash shape={pl.shell} color="#C9CED4" at={0} id="pls" alpha={1} />
          <Wash shape={pl.collar} color="#3A3F46" at={0} id="plc" alpha={1} />
          <Ink strokes={[pl.body, pl.shell, pl.slot, pl.collar, pl.cable]} from={0} durationInFrames={20} id="plI" width={3} />
        </Picture>
      </Paper>
    </AbsoluteFill>
  );
};

/** Page 14 (E14): microscope, H&E slide, the forger at the easel, the detective, a DR fundus (left eye), squamous and thyroid tiles. */
export const ObjectsDemo14: React.FC = () => (
  <AbsoluteFill>
    <Paper chapter={C}>
      <Picture>
        <MicroscopeArt x={20} y={40} s={0.9} at={0} id="mi" />
        <HeSlideArt x={30} y={600} w={380} h={130} at={0} id="hs" />
        <ForgerArt x={420} y={20} s={0.8} at={0} id="fg" />
        <ColonTileArt x={420 + 360 * 0.8} y={20 + 90 * 0.8} w={300 * 0.8} h={300 * 0.8} kind="tumour" at={0} id="fgT" />
        <DetectiveArt x={1060} y={20} s={0.8} at={0} id="dt" />
        <FundusArt cx={1620} cy={250} r={220} at={0} id="fu" dr={0} />
        <SquamousTileArt x={440} y={600} w={300} h={300} at={0} id="sq" />
        <ThyroidTileArt x={780} y={600} w={300} h={300} at={0} id="th" />
        <ColonTileArt x={1120} y={600} w={300} h={300} kind="normal" at={0} id="cn" />
        <Label text="squamous (keratin pearls)" x={590} y={940} at={0} size={26} italic={false} />
        <Label text="thyroid follicles" x={930} y={940} at={0} size={26} italic={false} />
        <Label text="left eye, NPDR with exudates" x={1620} y={520} at={0} size={26} italic={false} />
      </Picture>
    </Paper>
  </AbsoluteFill>
);

/** Page 15 (B1): the first page of a research article, a checklist clipboard, a retinal camera with a fundus on its monitor. */
const ART = researchArticle(20, 20, 640, 860);
const CB = clipboard(700, 20, 520, 860, 10);
const RC = retinalCamera(1250, 300, 1.1);
const Q10 = ["What is it for?", "Who were the patients?", "What was the truth?", "Kept separate?", "Which numbers?", "PPV in my clinic?", "Who got no answer?", "What can't it see?", "Lab or real world?", "Who paid?"];
export const ObjectsDemo15: React.FC = () => (
  <AbsoluteFill>
    <Paper chapter={C}>
      <Picture>
        <ArticleArt x={20} y={20} w={640} h={860} at={0} id="ar" />
        <Label text="npj Digital Medicine" x={ART.journalAt[0]} y={ART.journalAt[1]} at={0} size={36} italic={false} weight={700} color="#FFFFFF" anchor="start" />
        <Label text="Abstract" x={ART.abstractHeadAt[0]} y={ART.abstractHeadAt[1] + 6} at={0} size={36} italic={false} weight={700} anchor="start" />
        <Label text="Methods" x={ART.methodsHeadAt[0]} y={ART.methodsHeadAt[1] + 6} at={0} size={36} italic={false} weight={700} anchor="start" />
        <Label text="Results" x={ART.resultsHeadAt[0]} y={ART.resultsHeadAt[1] + 6} at={0} size={36} italic={false} weight={700} anchor="start" />
        <ClipboardArt x={700} y={20} w={520} h={860} at={0} id="cb" />
        <Label text="10 questions" x={CB.titleAt[0]} y={CB.titleAt[1] + 12} at={0} size={36} italic={false} weight={700} />
        {Q10.map((q, i) => <Label key={i} text={q} x={CB.rowAt(i)[0]} y={CB.rowAt(i)[1]} at={0} size={36} italic={false} anchor="start" />)}
        {[0, 1, 2].map((i) => <Ink key={i} strokes={[CB.tick(i)]} from={0} durationInFrames={4} id={`tk${i}`} color="#3C8D4F" width={5} double={false} pen={false} />)}
        <RetinalCameraArt x={1250} y={300} s={1.1} at={0} id="rc" />
        <FundusArt cx={RC.screenBox[0] + RC.screenBox[2] / 2} cy={RC.screenBox[1] + RC.screenBox[3] / 2} r={RC.screenBox[3] * 0.42} at={0} id="rcf" />
      </Picture>
    </Paper>
  </AbsoluteFill>
);

/* Page 16 (E15, bias zoo): zoo map, gate, enclosure with an exhibit, Fitzpatrick scale, paw prints, oximeter. */
const ZM = zooMap(20, 30, 760, 820);
const ZG = zooGate(840, 40, 0.86);
const EN = enclosure(1380, 40, 520, 420);
const TS = toneScale(840, 600, 560, 120);
const ZOO_NAMES = ["Who is in the data?", "How was it measured?", "When was it collected?", "What is hidden?"];
export const ObjectsDemo16: React.FC = () => (
  <AbsoluteFill>
    <Paper chapter={C}>
      <Picture>
        <ZooMapArt x={20} y={30} w={760} h={820} at={0} id="zm" />
        {ZM.pens.map((p, i) => <Label key={i} text={ZOO_NAMES[i]} x={p.signAt[0]} y={p.signAt[1] + 12} at={0} size={30} italic={false} weight={700} />)}
        {ZM.pens.map((p, i) => <PawArt key={i} cx={p.centre[0]} cy={p.centre[1] + 20} s={0.9} at={0} id={`pw${i}`} />)}
        <ZooGateArt x={840} y={40} s={0.86} at={0} id="zg" />
        <Label text="THE BIAS ZOO" x={ZG.signAt[0]} y={ZG.signAt[1]} at={0} size={44} italic={false} weight={800} />
        <EnclosureArt x={1380} y={40} w={520} h={420} at={0} id="en" />
        <Label text="SAMPLING BIAS" x={EN.signAt[0]} y={EN.signAt[1]} at={0} size={36} italic={false} weight={800} />
        <Wash shape={P.rect(EN.inside[0] + 40, EN.inside[1] + 10, 180, EN.inside[3] - 20, 8)} color={TISSUE.skinTones[0]} at={0} id="ex1" alpha={1} />
        <Wash shape={P.rect(EN.inside[0] + 260, EN.inside[1] + 10, 180, EN.inside[3] - 20, 8)} color={TISSUE.skinTones[1]} at={0} id="ex2" alpha={1} />
        <ToneScaleArt x={840} y={600} w={560} h={120} at={0} id="ts" />
        {["I", "II", "III", "IV", "V", "VI"].map((t, i) => <Label key={t} text={t} x={TS.labelAt(i)[0]} y={TS.labelAt(i)[1]} at={0} size={36} italic={false} weight={700} />)}
        <Ink strokes={[TS.span(4, 5)]} from={0} durationInFrames={4} id="tsb" width={3} double={false} pen={false} />
        <Label text="dark skin: few images" x={TS.spanAt(4, 5)[0] - 40} y={TS.spanAt(4, 5)[1]} at={0} size={36} italic={false} />
        <Wash shape={finger(1460, 640, 0.9).outline} color={TISSUE.skinTones[4]} at={0} id="fg" alpha={0.8} />
        <Ink strokes={[finger(1460, 640, 0.9).outline, finger(1460, 640, 0.9).nail]} from={0} durationInFrames={4} id="fgi" />
        <Ink strokes={[oximeter(1460, 640, 0.9).upper, oximeter(1460, 640, 0.9).lower, oximeter(1460, 640, 0.9).hinge, oximeter(1460, 640, 0.9).display]} from={0} durationInFrames={4} id="ox" color="#2F5E8E" />
        <Label text="94%" x={oximeter(1460, 640, 0.9).readout[0]} y={oximeter(1460, 640, 0.9).readout[1] + 4} at={0} size={40} italic={false} weight={700} />
      </Picture>
    </Paper>
  </AbsoluteFill>
);

/* Page 17 (E16, bias in us): see-saw level and tilted, a CC mammogram with a spiculated mass, a colonoscopy view with the AI box. */
const SS0 = seeSaw(380, 300, 640, 0);
const SS1 = seeSaw(380, 720, 640, 0.22);
const MG = mammogram(760, 60, 520, 420);
const EV = endoView(1580, 640, 260);
export const ObjectsDemo17: React.FC = () => (
  <AbsoluteFill>
    <Paper chapter={C}>
      <Picture>
        <SeeSawArt cx={380} cy={300} w={640} at={0} id="s0" />
        <Label text="OVER-TRUST" x={SS0.seatL[0]} y={SS0.seatL[1] - 30} at={0} size={36} italic={false} weight={800} />
        <Label text="UNDER-TRUST" x={SS0.seatR[0]} y={SS0.seatR[1] - 30} at={0} size={36} italic={false} weight={800} />
        <SeeSawArt cx={380} cy={720} w={640} tilt={0.22} at={0} id="s1" />
        <Label text="over-trust wins" x={SS1.seatL[0]} y={SS1.seatL[1] - 30} at={0} size={36} italic={false} weight={700} />
        <MammogramArt x={760} y={60} w={520} h={420} at={0} id="mg" />
        <Label text="L CC" x={MG.markerAt[0]} y={MG.markerAt[1] + 10} at={0} size={30} italic={false} weight={800} color="#FFFFFF" />
        <Ink strokes={[P.ellipse(MG.massAt[0], MG.massAt[1], MG.massBox[2] / 2, MG.massBox[3] / 2)]} from={0} durationInFrames={4} id="mgr" color="#E9B949" width={4} double={false} pen={false} />
        <Label text="spiculated mass" x={1020} y={540} at={0} size={36} italic={false} />
        <EndoViewArt cx={1580} cy={640} r={260} at={0} id="ev" />
        <Label text="AI" x={EV.aiLabelAt[0]} y={EV.aiLabelAt[1]} at={0} size={32} italic={false} weight={800} color="#2FD16A" />
        <Label text="polyp, AI box" x={1580} y={980} at={0} size={36} italic={false} />
        <Label text="colonoscopy view" x={1580} y={330} at={0} size={36} italic={false} />
      </Picture>
    </Paper>
  </AbsoluteFill>
);

/* E17 page: core-biopsy slide with heat spot on the label, breast tiles, SHAP waterfall, LIME superpixels, film token, model card, snow. */
const WF_STEPS = [9, 7, 3, -2, -1];
const WF = shapWaterfall(1180, 40, 700, 440, 8, WF_STEPS, 30);
const CS = coreSlide(30, 40, 560, 190);
const FT = filmToken(1500, 600, 56);
const MC = modelCard(1560, 560, 330, 420);
export const ObjectsDemo18: React.FC = () => (
  <AbsoluteFill>
    <Paper chapter={C}>
      <Picture>
        <CoreSlideArt x={30} y={40} w={560} h={190} at={0} id="cs" />
        <HeatSpotArt cx={CS.labelAt[0]} cy={CS.labelAt[1]} rx={CS.labelBox[2] * 0.75} ry={CS.labelBox[3] * 0.62} at={0} id="hs1" />
        <Label text="core biopsy, heat on the LABEL" x={310} y={275} at={0} size={30} italic={false} />
        <CoreSlideArt x={30} y={310} w={560} h={190} at={0} id="cs2" />
        <HeatSpotArt cx={CS.tumourAt[0]} cy={CS.tumourAt[1] + 270} rx={CS.tumourBox[2] * 0.9} ry={CS.tumourBox[3] * 0.8} at={0} id="hs2" />
        <Label text="heat on the tumour" x={310} y={545} at={0} size={30} italic={false} />
        <BreastTileArt x={630} y={40} w={250} h={250} kind="idc" at={0} id="bi" />
        <BreastTileArt x={900} y={40} w={250} h={250} kind="normal" at={0} id="bn" />
        <Label text="breast: IDC (NST)" x={755} y={325} at={0} size={28} italic={false} />
        <Label text="normal lobule" x={1025} y={325} at={0} size={28} italic={false} />
        <BreastTileArt x={630} y={370} w={330} h={330} kind="idc" at={0} id="bi2" />
        <HeatSpotArt cx={800} cy={520} rx={140} ry={120} at={0} id="hs3" alpha={0.45} />
        <Label text="Grad-CAM over IDC" x={795} y={740} at={0} size={28} italic={false} />
        <WaterfallArt x={1180} y={40} w={700} h={440} base={8} steps={WF_STEPS} max={30} at={0} id="wf" />
        {["RR 28", "lactate 4", "age 78", "BP normal", "SpO2 97%"].map((t, i) => <Label key={i} text={t} x={WF.rows[i].labelAt[0]} y={WF.rows[i].labelAt[1]} at={0} size={28} italic={false} anchor="end" />)}
        {WF.ticks.map((t, i) => <Label key={i} text={`${t.v}%`} x={t.at[0]} y={t.at[1]} at={0} size={24} italic={false} />)}
        <Label text="average 8%" x={WF.baseAt[0]} y={WF.baseAt[1]} at={0} size={26} italic={false} />
        <Label text="24%" x={WF.finalAt[0] + 34} y={WF.finalAt[1] - 6} at={0} size={28} italic={false} weight={800} />
        <ColonTileArt x={1000} y={560} w={300} h={300} kind="tumour" at={0} id="lt" />
        <SuperpixelArt x={1000} y={560} w={300} h={300} at={0} id="sp" hidden={[0, 3, 6, 9, 14, 20, 23]} keep={[12]} />
        <Label text="LIME patches" x={1150} y={900} at={0} size={28} italic={false} />
        <FilmTokenArt x={1500} y={600} s={56} at={0} id="ft" />
        <Label text="L" x={FT.letterAt[0]} y={FT.letterAt[1]} at={0} size={40} italic={false} weight={800} color="#2B2B2B" />
        <ModelCardArt x={1560} y={560} w={330} h={420} at={0} id="mc" />
        <Label text="MODEL CARD" x={MC.titleAt[0]} y={MC.titleAt[1]} at={0} size={30} italic={false} weight={800} />
        {["intended use", "not for", "data", "performance by group", "limits"].map((t, i) => <Label key={i} text={t} x={MC.rowAt(i)[0]} y={MC.rowAt(i)[1] + 8} at={0} size={24} italic={false} anchor="start" />)}
        <SnowArt x={30} y={780} w={560} h={280} at={0} id="sn" />
        <DogArt x={160} y={800} s={0.9} at={0} id="dg" />
        <Label text="wolf or husky? (snow)" x={310} y={760} at={0} size={28} italic={false} />
      </Picture>
    </Paper>
  </AbsoluteFill>
);

const WM = worldMap(30, 40, 1180, 455);
const PP = passport(1560, 560, 230, 330);
export const ObjectsDemo19: React.FC = () => (
  <AbsoluteFill>
    <Paper chapter={C}>
      <Picture>
        <WorldMapArt x={30} y={40} w={1180} h={455} at={0} id="wm" />
        {([[WM.usAt, "FDA"], [WM.euAt, "EU"], [WM.indiaAt, "CDSCO"]] as const).map(([p, t], i) => <React.Fragment key={i}><Fills shapes={[P.ellipse(p[0], p[1], 10, 10, 0, Math.PI * 2, 20)]} color="#C8423B" at={0} alpha={1} /><Label text={t} x={p[0]} y={p[1] - 22} at={0} size={30} italic={false} weight={800} /></React.Fragment>)}
        <Label text="world map (FDA, EU, CDSCO pins)" x={620} y={530} at={0} size={28} italic={false} />
        <PapSmearArt x={1250} y={40} w={640} h={455} at={0} id="ps" />
        <Label text="Pap smear: squamous cells + 2 HSIL-like cells" x={1570} y={530} at={0} size={28} italic={false} />
        <PapSmearArt x={30} y={600} w={420} h={300} at={0} id="ps2" abnormal={0} />
        <Label text="normal Pap field" x={240} y={940} at={0} size={28} italic={false} />
        <ScalesArt cx={700} y={590} s={1} tilt={0} at={0} id="sc" />
        <ScalesArt cx={1150} y={590} s={0.9} tilt={0.18} at={0} id="sc2" />
        <Label text="scales of justice (level, tipped)" x={920} y={1000} at={0} size={28} italic={false} />
        <PassportArt x={1560} y={560} w={230} h={330} at={0} id="pp" />
        <Label text="PASSPORT" x={PP.titleAt[0]} y={PP.titleAt[1] + 10} at={0} size={26} italic={false} weight={800} color="#E8C766" />
        <Label text="passport" x={1675} y={930} at={0} size={28} italic={false} />
      </Picture>
    </Paper>
  </AbsoluteFill>
);

const UN = uNet(1010, 560, 880, 470);
export const ObjectsDemo20: React.FC = () => (
  <AbsoluteFill>
    <Paper chapter={C}>
      <Picture>
        <ChestXrayArt x={30} y={30} w={330} h={400} at={0} id="cx1" />
        <Label text="chest X-ray, nodule" x={195} y={470} at={0} size={28} italic={false} />
        <ChestXrayArt x={400} y={30} w={330} h={400} at={0} id="cx2" boxAt={0} />
        <Label text="detection box" x={565} y={470} at={0} size={28} italic={false} />
        <ChestXrayArt x={770} y={30} w={330} h={400} at={0} id="cx3" segAt={0} />
        <Label text="segmentation" x={935} y={470} at={0} size={28} italic={false} />
        <HeadCTArt cx={1330} cy={230} r={190} at={0} id="ct1" boxAt={0} />
        <Label text="axial head CT, right-sided bleed" x={1330} y={470} at={0} size={28} italic={false} />
        <HeadCTArt cx={1730} cy={230} r={150} at={0} id="ct2" bleed={false} />
        <Label text="normal" x={1730} y={430} at={0} size={28} italic={false} />
        <SkinProbeArt x={60} y={560} s={1.1} at={0} id="sp" lightAt={0} />
        <Label text="handheld skin probe (spectroscopy)" x={340} y={1000} at={0} size={28} italic={false} />
        <UNetArt x={1010} y={560} w={880} h={470} at={0} id="un" />
        <Label text="contracting: what" x={UN.whatAt[0]} y={UN.whatAt[1]} at={0} size={26} italic={false} />
        <Label text="expanding: where" x={UN.whereAt[0]} y={UN.whereAt[1]} at={0} size={26} italic={false} />
        <Label text="U-Net (bridges = skip connections)" x={1450} y={1030} at={0} size={28} italic={false} />
      </Picture>
    </Paper>
  </AbsoluteFill>
);

/** E21 page: slide scanner, tile pyramid, lymph node with subcapsular-sinus metastasis, the deposit at high power in three labs' stains, Ki-67, labelled node slide. */
export const ObjectsDemo21: React.FC = () => (
  <AbsoluteFill>
    <Paper chapter={C}>
      <Picture>
        <WsiScannerArt x={170} y={40} s={0.95} at={0} id="sc" />
        <Label text="slide scanner" x={200} y={420} at={0} size={28} italic={false} />
        <TilePyramidArt x={560} y={250} S={260} at={0} id="tp" />
        <Label text="tile pyramid" x={560} y={520} at={0} size={28} italic={false} />
        <LymphNodeArt cx={1130} cy={230} rx={300} ry={195} at={0} id="ln" met />
        <Label text="lymph node, metastasis in subcapsular sinus" x={1130} y={470} at={0} size={28} italic={false} />
        <NodeSlideArt x={1480} y={110} w={420} h={150} at={0} id="ns" met />
        <Label text="labelled node slide" x={1690} y={300} at={0} size={28} italic={false} />
        <NodeMetTileArt x={30} y={560} w={420} h={420} at={0} id="m1" lab="A" />
        <Label text="lab A (training)" x={240} y={1020} at={0} size={28} italic={false} />
        <NodeMetTileArt x={480} y={560} w={420} h={420} at={0} id="m2" lab="B" />
        <Label text="lab B" x={690} y={1020} at={0} size={28} italic={false} />
        <NodeMetTileArt x={930} y={560} w={420} h={420} at={0} id="m3" lab="C" />
        <Label text="lab C" x={1140} y={1020} at={0} size={28} italic={false} />
        <Ki67TileArt x={1400} y={560} w={420} h={420} index={0.3} at={0} id="k1" />
        <Label text="Ki-67, about 30%" x={1610} y={1020} at={0} size={28} italic={false} />
      </Picture>
    </Paper>
  </AbsoluteFill>
);

/** E22 page: HER2 IHC (3+ and 1+), ER nuclear IHC (Ki-67 tile at a high index), gene-expression heat map, knowledge graph, Bayesian network, DNA helix. */
export const ObjectsDemo22: React.FC = () => (
  <AbsoluteFill>
    <Paper chapter={C}>
      <Picture>
        <Her2TileArt x={30} y={40} w={400} h={400} score={3} at={0} id="h3" />
        <Label text="HER2 3+: complete, intense membrane" x={230} y={480} at={0} size={26} italic={false} />
        <Her2TileArt x={460} y={40} w={400} h={400} score={1} at={0} id="h1" />
        <Label text="HER2 1+: faint, incomplete" x={660} y={480} at={0} size={26} italic={false} />
        <Ki67TileArt x={890} y={40} w={400} h={400} index={0.9} at={0} id="er" />
        <Label text="ER: nuclear, about 90%" x={1090} y={480} at={0} size={26} italic={false} />
        <ExprHeatmapArt x={1330} y={40} w={560} h={420} at={0} id="ex" />
        <Label text="expression heat map, three families" x={1610} y={500} at={0} size={26} italic={false} />
        <KnowledgeGraphArt at={0} id="kg" r={44} nodes={[
          { id: "g", kind: "gene", at: [120, 640] }, { id: "p", kind: "protein", at: [340, 640] }, { id: "d", kind: "drug", at: [560, 640] }, { id: "x", kind: "disease", at: [340, 870] }, { id: "g2", kind: "gene", at: [120, 870] }, { id: "d2", kind: "drug", at: [560, 870] },
        ]} edges={[["g", "p"], ["d", "p"], ["x", "d"], ["g2", "x"], ["d2", "x"]]} hot={[4]} />
        <Label text="knowledge graph: gene, protein, drug, disease" x={340} y={1010} at={0} size={26} italic={false} />
        <KnowledgeGraphArt at={0} id="bn" r={38} directed nodes={[
          { id: "a", kind: "protein", at: [820, 620] }, { id: "b", kind: "protein", at: [1000, 720] }, { id: "c", kind: "protein", at: [820, 860] }, { id: "d", kind: "protein", at: [1180, 860] },
        ]} edges={[["a", "b"], ["a", "c"], ["b", "d"], ["c", "d"]]} />
        <Label text="Bayesian network (directed)" x={1000} y={1010} at={0} size={26} italic={false} />
        <DnaHelixArt x={1330} y={600} w={300} h={100} at={0} id="dna" />
        <Label text="DNA double helix" x={1480} y={740} at={0} size={26} italic={false} />
        <DuctArt cx={1760} cy={660} r={130} at={0} id="duct" />
        <Label text="duct: luminal inside, basal outside" x={1720} y={830} at={0} size={26} italic={false} />
        <ParaffinBlockArt x={1340} y={800} w={240} h={150} at={0} id="ffpe" />
        <Label text="FFPE block" x={1460} y={990} at={0} size={26} italic={false} />
      </Picture>
    </Paper>
  </AbsoluteFill>
);
