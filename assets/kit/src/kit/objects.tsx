/**
 * Recognisable medical objects as stroke lists in picture coordinates, for `Ink` (and `Wash` on the
 * closed outlines). Each returns named parts so a beat can draw them one step at a time, in
 * reading order: outline, then the identifying detail, then the label.
 *
 * Why this exists: in E01 (Nov 2026) the owner approved the video but said the pulse-oximeter
 * finger, a rounded bar, "is not at all looking like any finger". Primitive shapes read as
 * careless to a medical audience. Draw from these, check each on a key-frame still, and add new
 * objects here rather than sketching them inside a beat.
 */
import { P, type Pt, type Pts } from "./shapes";

/** Samples of a cubic Bézier. */
export const cubic = (a: Pt, b: Pt, c: Pt, d: Pt, n = 18): Pts =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]] as const;
  });

/** A path of cubic segments: start point, then [c1, c2, end] triples, in a local box, placed at (x, y) × s. */
const path = (x: number, y: number, s: number, start: Pt, segs: [Pt, Pt, Pt][]): Pts => {
  const T = (p: Pt): Pt => [x + p[0] * s, y + p[1] * s];
  const out: Pt[] = [];
  let from = start;
  for (const [c1, c2, to] of segs) {
    out.push(...cubic(T(from), T(c1), T(c2), T(to)).slice(out.length ? 1 : 0));
    from = to;
  }
  return out;
};

const rectL = (x: number, y: number, s: number, x0: number, y0: number, x1: number, y1: number, r: number): Pts =>
  P.rect(x + x0 * s, y + y0 * s, (x1 - x0) * s, (y1 - y0) * s, r * s);

/**
 * A fingertip in side view, nail up, pointing left, the hand off to the right. Local box 400 × 200
 * (tip at x≈45, base at x=400), placed with its top-left at (x, y), scaled by s.
 * Parts: outline (closed), nail (closed), cuticle, creases (two knuckle lines).
 */
export const finger = (x: number, y: number, s = 1) => ({
  outline: path(x, y, s, [400, 32], [
    [[330, 28], [250, 26], [175, 30]], [[120, 33], [74, 40], [56, 68]],
    [[42, 90], [52, 118], [84, 126]], [[140, 138], [260, 134], [400, 130]],
  ]),
  nail: path(x, y, s, [70, 48], [[[92, 32], [150, 26], [188, 30]], [[186, 44], [182, 54], [176, 58]], [[140, 56], [104, 58], [78, 66]], [[72, 62], [69, 55], [70, 48]]]),
  cuticle: path(x, y, s, [84, 61], [[[110, 54], [146, 52], [174, 53]]]),
  creases: [300, 316].map((cx) => path(x, y, s, [cx, 40], [[[cx - 6, 70], [cx - 6, 100], [cx, 124]]])),
  /** Where a label or pointer should aim: the pad of the fingertip. */
  pad: [x + 80 * s, y + 110 * s] as Pt,
});

/**
 * A pulse-oximeter clip on the `finger` above (same x, y, s): two jaws, the hinge, the display.
 * Draw the finger first, then the clip. `display` is the screen rectangle; put the reading in a
 * typeset Label at `readout`.
 */
export const oximeter = (x: number, y: number, s = 1) => ({
  upper: rectL(x, y, s, 108, 4, 262, 44, 12),
  lower: rectL(x, y, s, 106, 122, 264, 166, 12),
  hinge: P.quad(x + 262 * s, y + 24 * s, x + 300 * s, y + 72 * s, x + 264 * s, y + 142 * s, 20),
  display: rectL(x, y, s, 132, -54, 244, -4, 8),
  readout: [x + 188 * s, y - 18 * s] as Pt,
});

/** An ECG trace (P, QRS, T) repeated across [x1, x2] on baseline y; amp is the R-wave height. */
export const ecgTrace = (x1: number, x2: number, y: number, amp: number, beats: number, key = 0): Pts => {
  const pts: Pt[] = [];
  const span = (x2 - x1) / beats;
  const shape: [number, number][] = [[0, 0], [0.12, 0], [0.17, -0.12], [0.22, 0], [0.3, 0], [0.33, 0.15], [0.37, -1], [0.41, 0.35], [0.44, 0], [0.56, 0], [0.64, -0.25], [0.72, 0], [1, 0]];
  for (let b = 0; b < beats; b++) for (const [u, v] of shape) pts.push([x1 + (b + u) * span, y + v * amp * (1 + 0.04 * Math.sin(b + key))]);
  return pts;
};

/** A printed ECG strip: paper, a fine grid (as strokes), the trace, and where the printed reading goes. */
export const ecgStrip = (x: number, y: number, w: number, h: number, beats = 4) => {
  const grid: Pts[] = [];
  for (let gx = x + 20; gx < x + w; gx += 20) grid.push(P.line(gx, y + 40, gx, y + h - 10, 2));
  for (let gy = y + 40; gy < y + h; gy += 20) grid.push(P.line(x + 10, gy, x + w - 10, gy, 2));
  return {
    paper: P.rect(x, y, w, h, 6),
    grid,
    trace: ecgTrace(x + 20, x + w - 20, y + h * 0.62, h * 0.32, beats),
    reading: [x + w / 2, y + 28] as Pt,
  };
};

/** A PA chest film: frame, spine, ribs, lung fields, heart shadow, diaphragm. `cardio` widens the heart. */
export const chestFilm = (x: number, y: number, w: number, h: number, cardio = 0.58) => {
  const cx = x + w / 2;
  const top = y + h * 0.12;
  const base = y + h * 0.82;
  const ribs: Pts[] = [];
  for (let i = 0; i < 5; i++) {
    const ry = top + (base - top) * (0.12 + i * 0.17);
    ribs.push(P.quad(cx - w * 0.05, ry, cx - w * 0.3, ry - h * 0.06, cx - w * 0.4, ry + h * 0.06, 16));
    ribs.push(P.quad(cx + w * 0.05, ry, cx + w * 0.3, ry - h * 0.06, cx + w * 0.4, ry + h * 0.06, 16));
  }
  const hw = (w * 0.8 * cardio) / 2;
  return {
    frame: P.rect(x, y, w, h, 10),
    spine: P.line(cx, y + h * 0.06, cx, y + h * 0.95, 12),
    ribs,
    lungs: [P.blob(cx - w * 0.22, y + h * 0.48, w * 0.16, h * 0.32, "lungL", 0.06), P.blob(cx + w * 0.22, y + h * 0.48, w * 0.16, h * 0.32, "lungR", 0.06)] as Pts[],
    heart: P.blob(cx + hw * 0.18, y + h * 0.66, hw, h * 0.14, "heart", 0.05),
    dome: [P.quad(cx - w * 0.4, base, cx - w * 0.2, base - h * 0.1, cx - w * 0.02, base), P.quad(cx + w * 0.02, base, cx + w * 0.2, base - h * 0.08, cx + w * 0.4, base)],
    /** [left, right, y] of the heart's widest line, and of the chest's, for a CTR measurement. */
    heartSpan: [cx + hw * 0.18 - hw, cx + hw * 0.18 + hw, y + h * 0.66] as const,
    chestSpan: [cx - w * 0.4, cx + w * 0.4, base - h * 0.04] as const,
  };
};

/**
 * An anatomical heart as on a film (patient's left on the viewer's right): body with the apex
 * down-right, the interventricular groove, aortic arch, superior vena cava, pulmonary trunk.
 * Local box 200 × 230, top-left at (x, y), scale s.
 */
export const heart = (x: number, y: number, s = 1) => ({
  body: path(x, y, s, [62, 70], [[[34, 84], [22, 130], [44, 170]], [[70, 205], [120, 222], [168, 214]], [[190, 190], [196, 140], [178, 104]], [[164, 78], [128, 64], [100, 66]], [[86, 66], [72, 66], [62, 70]]]),
  groove: path(x, y, s, [126, 70], [[[118, 110], [132, 160], [160, 208]]]),
  aorta: path(x, y, s, [96, 68], [[[92, 28], [112, 6], [140, 8]], [[166, 10], [176, 30], [170, 58]]]),
  vena: [P.line(x + 70 * s, y + 70 * s, x + 70 * s, y + 18 * s, 6), P.line(x + 86 * s, y + 66 * s, x + 86 * s, y + 18 * s, 6)],
  pulmonary: path(x, y, s, [120, 66], [[[128, 44], [142, 34], [160, 40]]]),
});

/** A stick figure, standing; (x, y) is the hip. */
export const person = (x: number, y: number, s = 1): Pts[] => [
  P.ellipse(x, y - 70 * s, 22 * s, 24 * s),
  P.line(x, y - 46 * s, x, y + 20 * s, 8),
  P.line(x - 40 * s, y - 20 * s, x, y - 34 * s, 6),
  P.line(x, y - 34 * s, x + 40 * s, y - 20 * s, 6),
  P.line(x, y + 20 * s, x - 26 * s, y + 80 * s, 8),
  P.line(x, y + 20 * s, x + 26 * s, y + 80 * s, 8),
];

/** A doctor, bust: head, coat with lapels, a stethoscope round the neck. (x, y) is the chin. */
export const doctor = (x: number, y: number, s = 1) => ({
  head: P.ellipse(x, y - 52 * s, 40 * s, 48 * s),
  coat: path(x, y, s, [-110, 200], [[[-108, 120], [-90, 40], [-40, 18]], [[-20, 10], [20, 10], [40, 18]], [[90, 40], [108, 120], [110, 200]]]),
  lapels: [P.line(x - 40 * s, y + 18 * s, x, y + 110 * s, 8), P.line(x + 40 * s, y + 18 * s, x, y + 110 * s, 8)],
  stethoscope: [path(x, y, s, [-34, 22], [[[-60, 80], [-50, 130], [-10, 140]]]), path(x, y, s, [34, 22], [[[50, 70], [44, 100], [30, 112]]])],
  chestpiece: P.ellipse(x - 4 * s, y + 146 * s, 12 * s, 12 * s),
});

/** A page with text lines. */
export const page = (x: number, y: number, w: number, h: number, lines = 6): Pts[] => [
  P.rect(x, y, w, h, 6),
  ...Array.from({ length: lines }, (_, i) => P.line(x + 30, y + 60 + i * ((h - 90) / lines), x + w - 30 - (i % 3) * 40, y + 60 + i * ((h - 90) / lines), 8)),
];

/** A stack of films or cards, offset. */
export const stack = (x: number, y: number, w: number, h: number, n = 3, dx = 22, dy = -18): Pts[] =>
  Array.from({ length: n }, (_, i) => P.rect(x + i * dx, y + i * dy, w, h, 6)).reverse();

export const circle = (cx: number, cy: number, r: number): Pts => P.ellipse(cx, cy, r, r * 0.9, -Math.PI / 2, Math.PI * 1.5, 72);

export const box = (x: number, y: number, w: number, h: number): Pts => P.rect(x, y, w, h, 14);
