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

/* ---------------------------------------------------------------------------------------------
 * Added for E02 (Nov 2026): blood-film cells, a glass slide, a fundus photograph, an IV bag, a
 * bedside monitor, a Go board and a classroom blackboard. Checked on the `kit-objects-2` still.
 * ------------------------------------------------------------------------------------------- */

/** Granule positions scattered inside a circle of radius r (deterministic per key). */
export const granules = (cx: number, cy: number, r: number, n: number, key: string, avoid?: (x: number, y: number) => boolean): Pt[] => {
  const out: Pt[] = [];
  let seed = 0;
  for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  let guard = 0;
  while (out.length < n && guard++ < n * 40) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    if (!avoid || !avoid(x, y)) out.push([x, y]);
  }
  return out;
};

export type CellKind = "neutrophil" | "band" | "lymphocyte" | "monocyte" | "eosinophil" | "basophil";

/** Colours for a Romanowsky-stained film (Leishman / May-Grünwald-Giemsa). */
export const STAIN = {
  nucleus: "#4B2F7F",
  nucleusWash: "#7A5AAE",
  neutroCyto: "#F1D9DF",
  lymphoCyto: "#A9C8EA",
  monoCyto: "#BCC3D6",
  eosGranule: "#D9622B",
  basoGranule: "#2E1F55",
  neutroGranule: "#B88AB8",
  rbc: "#E7A39A",
  rbcPale: "#F6D6CF",
} as const;

/**
 * A white blood cell as on a stained film, centred at (cx, cy), radius r (a neutrophil is about
 * twice an RBC's width: r ≈ 1.15 × the RBC radius; lymphocytes smaller, monocytes larger).
 * Parts: membrane (closed), nucleus (closed outlines, one per lobe), bridges (chromatin strands
 * between lobes), granules (dot centres), granuleR, cyto and granule colours.
 * - neutrophil: 3 dense lobes joined by thin strands, fine lilac granules, pale pink cytoplasm
 * - band: the same cell with an unsegmented horseshoe nucleus of even width
 * - eosinophil: 2 lobes ("spectacles"), packed coarse orange granules
 * - basophil: lobed nucleus mostly hidden under coarse dark-purple granules
 * - lymphocyte: small; round dense nucleus filling most of the cell, thin sky-blue rim
 * - monocyte: large; folded kidney-shaped nucleus, grey-blue cytoplasm, a few vacuoles
 */
export const wbc = (kind: CellKind, cx: number, cy: number, r: number) => {
  const k = `${kind}${Math.round(cx)}${Math.round(cy)}`;
  if (kind === "lymphocyte") {
    const R = r * 0.78;
    return {
      membrane: P.blob(cx, cy, R, R * 0.96, `${k}m`, 0.04),
      nucleus: [P.blob(cx - R * 0.06, cy + R * 0.02, R * 0.8, R * 0.76, `${k}n`, 0.05)] as Pts[],
      bridges: [] as Pts[], granules: [] as Pt[], granuleR: 0, cyto: STAIN.lymphoCyto, granule: STAIN.nucleus, vacuoles: [] as Pts[],
    };
  }
  if (kind === "monocyte") {
    const R = r * 1.25;
    const bean = path(cx - R, cy - R, R / 100, [40, 70], [
      [[40, 38], [80, 28], [112, 36]], [[150, 44], [170, 74], [160, 104]], [[152, 128], [128, 140], [112, 128]],
      [[100, 116], [88, 112], [74, 122]], [[56, 136], [36, 116], [36, 94]], [[36, 84], [38, 76], [40, 70]],
    ]);
    return {
      membrane: P.blob(cx, cy, R, R * 0.92, `${k}m`, 0.07),
      nucleus: [bean] as Pts[],
      bridges: [] as Pts[], granules: granules(cx, cy, R * 0.85, 14, `${k}g`), granuleR: r * 0.022, cyto: STAIN.monoCyto, granule: STAIN.neutroGranule,
      vacuoles: [P.ellipse(cx - R * 0.45, cy + R * 0.55, R * 0.08, R * 0.08), P.ellipse(cx + R * 0.55, cy + R * 0.5, R * 0.06, R * 0.06)] as Pts[],
    };
  }
  const membrane = P.blob(cx, cy, r, r * 0.97, `${k}m`, 0.04);
  if (kind === "eosinophil") {
    const L = P.blob(cx - r * 0.36, cy + r * 0.02, r * 0.3, r * 0.36, `${k}a`, 0.08);
    const Rr = P.blob(cx + r * 0.36, cy - r * 0.02, r * 0.3, r * 0.36, `${k}b`, 0.08);
    const inNuc = (x: number, y: number) => Math.hypot(x - (cx - r * 0.36), y - cy) < r * 0.34 || Math.hypot(x - (cx + r * 0.36), y - cy) < r * 0.34;
    return {
      membrane, nucleus: [L, Rr] as Pts[], bridges: [P.quad(cx - r * 0.08, cy - r * 0.02, cx, cy + r * 0.06, cx + r * 0.08, cy - r * 0.02, 8)],
      granules: granules(cx, cy, r * 0.8, 70, `${k}g`, inNuc), granuleR: r * 0.065, cyto: STAIN.neutroCyto, granule: STAIN.eosGranule, vacuoles: [] as Pts[],
    };
  }
  if (kind === "basophil") {
    return {
      membrane, nucleus: [P.blob(cx - r * 0.1, cy, r * 0.5, r * 0.42, `${k}n`, 0.18)] as Pts[], bridges: [] as Pts[],
      granules: granules(cx, cy, r * 0.85, 60, `${k}g`), granuleR: r * 0.075, cyto: STAIN.neutroCyto, granule: STAIN.basoGranule, vacuoles: [] as Pts[],
    };
  }
  if (kind === "band") {
    const outer = P.ellipse(cx, cy + r * 0.16, r * 0.62, r * 0.56, Math.PI * 0.85, Math.PI * 2.15, 40);
    const inner = P.ellipse(cx, cy + r * 0.16, r * 0.3, r * 0.25, Math.PI * 2.15, Math.PI * 0.85, 30);
    const shoe = [...outer, ...inner, outer[0]] as Pts;
    const inNuc = (x: number, y: number) => { const d = Math.hypot((x - cx) / 0.56, (y - cy - r * 0.12) / 0.5) / r; return d < 1.05 && d > 0.5 && y < cy + r * 0.3; };
    return { membrane, nucleus: [shoe] as Pts[], bridges: [] as Pts[], granules: granules(cx, cy, r * 0.85, 40, `${k}g`, inNuc), granuleR: r * 0.03, cyto: STAIN.neutroCyto, granule: STAIN.neutroGranule, vacuoles: [] as Pts[] };
  }
  // neutrophil
  const lobes: [number, number][] = [[-0.38, 0.12], [0.0, -0.26], [0.38, 0.14]];
  const nucleus = lobes.map(([dx, dy], i) => P.blob(cx + dx * r, cy + dy * r, r * 0.27, r * 0.23, `${k}l${i}`, 0.12));
  const bridges = [P.quad(cx - r * 0.22, cy + r * 0.0, cx - r * 0.16, cy - r * 0.16, cx - r * 0.12, cy - r * 0.26, 8),
    P.quad(cx + r * 0.14, cy - r * 0.24, cx + r * 0.24, cy - r * 0.08, cx + r * 0.24, cy + r * 0.08, 8)];
  const inNuc = (x: number, y: number) => lobes.some(([dx, dy]) => Math.hypot(x - (cx + dx * r), y - (cy + dy * r)) < r * 0.3);
  return { membrane, nucleus, bridges, granules: granules(cx, cy, r * 0.85, 40, `${k}g`, inNuc), granuleR: r * 0.03, cyto: STAIN.neutroCyto, granule: STAIN.neutroGranule, vacuoles: [] as Pts[] };
};

/** A red cell, face on: rim and the central pallor (about a third of the diameter). */
export const rbc = (cx: number, cy: number, r: number, key = "") => ({
  rim: P.blob(cx, cy, r, r * 0.95, `rbc${key}${Math.round(cx)}${Math.round(cy)}`, 0.03),
  pallor: P.ellipse(cx, cy, r * 0.38, r * 0.36),
});

/**
 * A glass microscope slide, label end on the left: glass, frosted label patch, and a blood film
 * with its thick start and its feathered tail (where the differential is counted).
 */
export const glassSlide = (x: number, y: number, w: number, h: number) => {
  const fx = x + w * 0.24;
  const smear = path(0, 0, 1, [fx + w * 0.04, y + h * 0.2], [
    [[fx + w * 0.3, y + h * 0.16], [x + w * 0.78, y + h * 0.18], [x + w * 0.86, y + h * 0.3]],
    [[x + w * 0.9, y + h * 0.4], [x + w * 0.88, y + h * 0.55], [x + w * 0.9, y + h * 0.66]],
    [[x + w * 0.86, y + h * 0.8], [x + w * 0.78, y + h * 0.82], [fx + w * 0.3, y + h * 0.84]],
    [[fx + w * 0.06, y + h * 0.84], [fx + w * 0.04, y + h * 0.5], [fx + w * 0.04, y + h * 0.2]],
  ]);
  return {
    glass: P.rect(x, y, w, h, 4),
    frost: P.rect(x + w * 0.02, y + h * 0.08, w * 0.2, h * 0.84, 3),
    smear,
    /** The feathered tail, where a differential is read. */
    tail: [x + w * 0.84, y + h * 0.5] as Pt,
    label: [x + w * 0.12, y + h * 0.56] as Pt,
  };
};

/**
 * A colour fundus photograph of a left eye: the circular field, the optic disc on the viewer's
 * left with its cup, the superior and inferior arcades curving round the macula, the fovea.
 */
export const fundus = (cx: number, cy: number, r: number) => {
  const dx = cx - r * 0.42, dy = cy;
  const arc = (sy: number, tx: number, ty: number) => path(0, 0, 1, [dx, dy + sy * r * 0.08], [[[dx + r * 0.1, dy + sy * r * 0.5], [cx + r * 0.3, cy + sy * r * 0.62], [tx, ty]]]);
  const vessels: Pts[] = [
    arc(-1, cx + r * 0.82, cy - r * 0.28), arc(1, cx + r * 0.82, cy + r * 0.3),
    arc(-1, cx + r * 0.6, cy - r * 0.72), arc(1, cx + r * 0.62, cy + r * 0.72),
    path(0, 0, 1, [dx, dy - r * 0.1], [[[dx - r * 0.08, dy - r * 0.36], [dx - r * 0.14, dy - r * 0.54], [dx - r * 0.2, cy - r * 0.66]]]),
    path(0, 0, 1, [dx, dy + r * 0.1], [[[dx - r * 0.08, dy + r * 0.36], [dx - r * 0.14, dy + r * 0.54], [dx - r * 0.2, cy + r * 0.66]]]),
    path(0, 0, 1, [dx - r * 0.08, dy], [[[dx - r * 0.3, dy - r * 0.04], [dx - r * 0.42, dy + r * 0.02], [dx - r * 0.52, dy - r * 0.04]]]),
  ];
  return {
    field: P.ellipse(cx, cy, r, r),
    disc: P.ellipse(dx, dy, r * 0.13, r * 0.15),
    cup: P.ellipse(dx + r * 0.02, dy, r * 0.05, r * 0.06),
    macula: P.ellipse(cx + r * 0.26, cy + r * 0.02, r * 0.14, r * 0.13),
    fovea: [cx + r * 0.26, cy + r * 0.02] as Pt,
    vessels,
  };
};

/**
 * An IV infusion bag on a hook: bag (closed), hanger hole, fluid level, printed label box,
 * port, drip chamber, tubing with a roller clamp. Local box 200 × 520, top-left (x, y), scale s.
 */
export const ivBag = (x: number, y: number, s = 1) => ({
  bag: path(x, y, s, [40, 40], [[[90, 30], [110, 30], [160, 40]], [[176, 44], [180, 60], [180, 80]], [[182, 160], [176, 230], [150, 270]],
    [[130, 290], [70, 290], [50, 270]], [[24, 230], [18, 160], [20, 80]], [[20, 60], [24, 44], [40, 40]]]),
  hole: P.ellipse(x + 100 * s, y + 52 * s, 14 * s, 8 * s),
  level: P.line(x + 26 * s, y + 110 * s, x + 174 * s, y + 110 * s, 8),
  labelBox: P.rect(x + 50 * s, y + 140 * s, 100 * s, 80 * s, 6 * s),
  port: P.rect(x + 88 * s, y + 288 * s, 24 * s, 30 * s, 4 * s),
  chamber: P.rect(x + 82 * s, y + 318 * s, 36 * s, 70 * s, 10 * s),
  drop: P.ellipse(x + 100 * s, y + 340 * s, 5 * s, 7 * s),
  tube: path(x, y, s, [100, 388], [[[100, 440], [130, 470], [120, 520]]]),
  clamp: P.rect(x + 104 * s, y + 448 * s, 34 * s, 22 * s, 4 * s),
  labelAt: [x + 100 * s, y + 188 * s] as Pt,
});

/** One arterial pressure pulse: steep upstroke, peak, dicrotic notch, run-off. */
export const arterialTrace = (x1: number, x2: number, y: number, amp: number, beats: number): Pts => {
  const pts: Pt[] = [];
  const span = (x2 - x1) / beats;
  const shape: [number, number][] = [[0, 0], [0.08, -0.9], [0.14, -1], [0.24, -0.72], [0.32, -0.5], [0.36, -0.58], [0.44, -0.42], [0.7, -0.14], [1, 0]];
  for (let b = 0; b < beats; b++) for (const [u, v] of shape) pts.push([x1 + (b + u) * span, y + v * amp]);
  return pts;
};

/** A bedside monitor: case, screen, stand, an arterial trace, and where the number goes. */
export const monitor = (x: number, y: number, w: number, h: number) => ({
  case: P.rect(x, y, w, h, 18),
  screen: P.rect(x + w * 0.06, y + h * 0.09, w * 0.88, h * 0.72, 8),
  stand: [P.line(x + w / 2, y + h, x + w / 2, y + h * 1.18, 6), P.line(x + w * 0.3, y + h * 1.18, x + w * 0.7, y + h * 1.18, 8)],
  buttons: [0, 1, 2].map((i) => P.ellipse(x + w * (0.72 + i * 0.08), y + h * 0.9, w * 0.022, w * 0.022)),
  trace: arterialTrace(x + w * 0.1, x + w * 0.62, y + h * 0.62, h * 0.32, 3),
  readout: [x + w * 0.78, y + h * 0.52] as Pt,
});

/**
 * A Go board, n × n lines (19 on a full board; 9 reads better small), with star points.
 * `at(i, j)` gives an intersection for placing stones (draw stones as filled dots, r ≈ 0.45 cell).
 */
export const goBoard = (x: number, y: number, size: number, n = 9) => {
  const m = size * 0.07, cell = (size - 2 * m) / (n - 1);
  const at = (i: number, j: number): Pt => [x + m + i * cell, y + m + j * cell];
  const lines: Pts[] = [];
  for (let i = 0; i < n; i++) {
    lines.push(P.line(x + m, y + m + i * cell, x + size - m, y + m + i * cell, 8));
    lines.push(P.line(x + m + i * cell, y + m, x + m + i * cell, y + size - m, 8));
  }
  const stars = n === 9 ? [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]] : [[3, 3], [9, 3], [15, 3], [3, 9], [9, 9], [15, 9], [3, 15], [9, 15], [15, 15]];
  return { board: P.rect(x, y, size, size, 6), lines, stars: stars.map(([i, j]) => at(i, j)), at, cell };
};

/** A classroom blackboard: wooden frame, the board, the chalk ledge with a stick of chalk. */
export const blackboard = (x: number, y: number, w: number, h: number) => ({
  frame: P.rect(x, y, w, h, 8),
  board: P.rect(x + 14, y + 14, w - 28, h - 28, 4),
  ledge: P.rect(x - 10, y + h, w + 20, 16, 4),
  chalk: P.rect(x + w * 0.7, y + h - 6, 46, 10, 4),
  centre: [x + w / 2, y + h / 2] as Pt,
});

/** A hospital building: block, door, red-cross sign, a row of windows. */
export const hospital = (x: number, y: number, w: number, h: number) => ({
  block: P.rect(x, y, w, h, 6),
  door: P.rect(x + w * 0.4, y + h * 0.66, w * 0.2, h * 0.34, 4),
  cross: [P.line(x + w / 2, y + h * 0.1, x + w / 2, y + h * 0.4, 6), P.line(x + w * 0.38, y + h * 0.25, x + w * 0.62, y + h * 0.25, 6)],
  windows: [0.12, 0.7].flatMap((fx) => [0.12, 0.42].map((fy) => P.rect(x + w * fx, y + h * (fy + 0.06), w * 0.18, h * 0.16, 3))),
});

/**
 * A syringe lying horizontally, needle to the right: barrel, graduations, plunger rod and thumb
 * rest, hub and needle. Local box 320 × 70, top-left (x, y), scale s. `fluid` is the barrel's
 * inner rectangle, for a coloured wash (a vasopressor infusion, a drug dose).
 */
export const syringe = (x: number, y: number, s = 1) => ({
  barrel: rectL(x, y, s, 60, 10, 240, 60, 6),
  fluid: rectL(x, y, s, 120, 16, 236, 54, 4),
  marks: [0, 1, 2, 3, 4, 5].map((i) => P.line(x + (130 + i * 20) * s, y + 10 * s, x + (130 + i * 20) * s, y + (i % 2 ? 24 : 30) * s, 4)),
  plunger: [P.line(x + 10 * s, y + 35 * s, x + 120 * s, y + 35 * s, 8), rectL(x, y, s, 0, 8, 12, 62, 3), rectL(x, y, s, 112, 14, 122, 56, 2)],
  hub: rectL(x, y, s, 240, 24, 262, 46, 3),
  needle: P.line(x + 262 * s, y + 35 * s, x + 320 * s, y + 35 * s, 6),
});

/* ---------------------------------------------------------------------------------------------
 * Added for E03 (Nov 2026): a spreadsheet, a database cylinder, a foot (plantar view) with an
 * ulcer, a 10-g monofilament, a phone, a clock, a blood-collection tube and a sagittal head scan.
 * Checked on the `kit-objects-3` still (ObjectsDemo3).
 * ------------------------------------------------------------------------------------------- */

/**
 * A spreadsheet: outer frame, a header row (drawn heavier by the caller), row and column rules.
 * `widths` are column widths; `cell(c, r)` is a cell centre (row 0 is the header); `colRect(c)`
 * and `rowRect(r)` are closed rectangles for a highlight wash on one column or one row.
 */
export const sheet = (x: number, y: number, widths: number[], rows: number, rh: number) => {
  const W = widths.reduce((a, b) => a + b, 0), H = rows * rh;
  const xs = widths.reduce<number[]>((acc, w) => [...acc, acc[acc.length - 1] + w], [x]);
  return {
    frame: P.rect(x, y, W, H, 6),
    header: P.line(x, y + rh, x + W, y + rh, 10),
    rules: Array.from({ length: rows - 2 }, (_, i) => P.line(x, y + rh * (i + 2), x + W, y + rh * (i + 2), 10)),
    cols: xs.slice(1, -1).map((cx) => P.line(cx, y, cx, y + H, 8)),
    cell: (c: number, r: number): Pt => [xs[c] + widths[c] / 2, y + r * rh + rh / 2],
    colRect: (c: number): Pts => P.rect(xs[c] + 3, y + 3, widths[c] - 6, H - 6, 4),
    rowRect: (r: number): Pts => P.rect(x + 3, y + r * rh + 3, W - 6, rh - 6, 4),
    w: W, h: H,
  };
};

/** A database drawn the usual way, as a cylinder of stacked discs. */
export const database = (x: number, y: number, w: number, h: number) => {
  const ry = w * 0.16;
  return {
    top: P.ellipse(x + w / 2, y + ry, w / 2, ry),
    sides: [P.line(x, y + ry, x, y + h - ry, 8), P.line(x + w, y + ry, x + w, y + h - ry, 8)],
    bands: [1 / 3, 2 / 3, 1].map((t) => P.ellipse(x + w / 2, y + ry + (h - 2 * ry) * t, w / 2, ry, 0, Math.PI, 24)),
    body: P.rect(x, y + ry, w, h - 2 * ry, 2),
  };
};

/**
 * A left foot seen from the sole (plantar view), toes up, big toe on the viewer's left: the sole
 * with the ball, the medial arch and the heel; five toes; an ulcer under the first metatarsal head
 * (the classic neuropathic site). Local box 230 × 540, top-left (x, y), scale s.
 * `sites` are the usual monofilament test points (great toe, 1st, 3rd and 5th metatarsal heads).
 */
export const foot = (x: number, y: number, s = 1) => ({
  sole: path(x, y, s, [22, 150], [
    [[60, 128], [150, 128], [208, 160]], [[214, 220], [206, 300], [196, 360]], [[190, 420], [196, 480], [170, 515]],
    [[140, 545], [80, 545], [56, 515]], [[38, 470], [52, 420], [72, 372]], [[88, 330], [72, 282], [44, 248]],
    [[22, 215], [16, 180], [22, 150]],
  ]),
  toes: [
    P.blob(x + 48 * s, y + 92 * s, 33 * s, 46 * s, "toe1", 0.03),
    P.blob(x + 104 * s, y + 80 * s, 19 * s, 28 * s, "toe2", 0.03),
    P.blob(x + 144 * s, y + 90 * s, 17 * s, 25 * s, "toe3", 0.03),
    P.blob(x + 178 * s, y + 106 * s, 15 * s, 22 * s, "toe4", 0.03),
    P.blob(x + 204 * s, y + 130 * s, 12 * s, 18 * s, "toe5", 0.03),
  ],
  creases: [path(x, y, s, [96, 214], [[[130, 204], [168, 210], [198, 226]]])],
  ulcer: P.blob(x + 62 * s, y + 178 * s, 24 * s, 18 * s, "ulcer", 0.08),
  ulcerBed: P.blob(x + 62 * s, y + 178 * s, 12 * s, 9 * s, "ulcerbed", 0.1),
  sites: [[48, 88], [62, 178], [140, 168], [196, 196]].map(([u, v]) => [x + u * s, y + v * s] as Pt),
  ulcerAt: [x + 62 * s, y + 178 * s] as Pt,
});

/**
 * A 10-g Semmes–Weinstein monofilament: the plastic holder and the nylon filament, buckled into
 * a C as it is pressed on the skin. Local box 120 × 300, holder on top, tip at the bottom.
 */
export const monofilament = (x: number, y: number, s = 1) => ({
  holder: rectL(x, y, s, 30, 0, 66, 190, 12),
  grip: [0, 1, 2, 3].map((i) => P.line(x + 34 * s, y + (40 + i * 16) * s, x + 62 * s, y + (40 + i * 16) * s, 4)),
  collar: rectL(x, y, s, 38, 190, 58, 206, 3),
  filament: path(x, y, s, [48, 206], [[[110, 226], [112, 290], [48, 304]]]),
  tip: [x + 48 * s, y + 300 * s] as Pt,
});

/** A smartphone, portrait: body, screen, camera, home bar. `screen` is closed for a photo wash. */
export const phone = (x: number, y: number, w: number, h: number) => ({
  body: P.rect(x, y, w, h, w * 0.14),
  screen: P.rect(x + w * 0.07, y + h * 0.07, w * 0.86, h * 0.84, w * 0.05),
  camera: P.ellipse(x + w / 2, y + h * 0.035, w * 0.025, w * 0.025),
  bar: P.line(x + w * 0.35, y + h * 0.955, x + w * 0.65, y + h * 0.955, 6),
});

/** A wall clock reading `hour`:`minute`: face, twelve ticks, two hands, the centre. */
export const clock = (cx: number, cy: number, r: number, hour = 3, minute = 0) => {
  const hand = (turns: number, len: number) => P.line(cx, cy, cx + Math.sin(turns * 2 * Math.PI) * len, cy - Math.cos(turns * 2 * Math.PI) * len, 6);
  return {
    face: P.ellipse(cx, cy, r, r),
    ticks: Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * 2 * Math.PI, r0 = i % 3 ? r * 0.86 : r * 0.78;
      return P.line(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0, cx + Math.sin(a) * r * 0.94, cy - Math.cos(a) * r * 0.94, 4);
    }),
    hour: hand((hour % 12 + minute / 60) / 12, r * 0.5),
    minute: hand(minute / 60, r * 0.75),
    centre: P.ellipse(cx, cy, r * 0.05, r * 0.05),
  };
};

/**
 * A blood-collection tube, upright: coloured stopper (wash it: grey for glucose, lavender for
 * HbA1c/CBC), the tube with a round bottom, the blood level and a paper label. Local 70 × 260.
 */
export const testTube = (x: number, y: number, s = 1) => ({
  cap: rectL(x, y, s, 2, 0, 68, 46, 8),
  tube: path(x, y, s, [8, 46], [[[8, 120], [8, 180], [8, 225]], [[8, 262], [62, 262], [62, 225]], [[62, 180], [62, 120], [62, 46]]]),
  blood: path(x, y, s, [12, 140], [[[30, 136], [44, 144], [58, 140]], [[58, 180], [58, 210], [58, 225]], [[58, 254], [12, 254], [12, 225]], [[12, 200], [12, 170], [12, 140]]]),
  label: rectL(x, y, s, 12, 66, 58, 128, 3),
  labelLines: [80, 96, 112].map((v) => P.line(x + 18 * s, y + v * s, x + 52 * s, y + v * s, 4)),
});

/**
 * A head in a sagittal MRI slice, facing right: the skin profile (forehead, nose, lips, chin and
 * neck: the part face-recognition rebuilds), the brain with its corpus callosum, the cerebellum
 * and brainstem. Local box 310 × 370, top-left (x, y), scale s. `scan` is the dark film behind it.
 */
export const headScan = (x: number, y: number, s = 1) => ({
  scan: rectL(x, y, s, -30, -20, 330, 390, 10),
  profile: path(x, y, s, [70, 370], [
    [[60, 320], [30, 290], [24, 220]], [[18, 130], [60, 30], [160, 18]], [[230, 12], [268, 60], [270, 120]],
    [[272, 140], [266, 150], [270, 160]], [[286, 180], [300, 196], [298, 206]], [[290, 214], [278, 214], [274, 220]],
    [[284, 228], [282, 236], [272, 240]], [[282, 248], [282, 258], [272, 264]], [[276, 284], [270, 300], [250, 306]],
    [[230, 310], [222, 320], [222, 370]],
  ]),
  brain: path(x, y, s, [60, 190], [[[44, 120], [80, 50], [160, 44]], [[222, 40], [252, 90], [248, 140]], [[246, 176], [220, 196], [180, 196]], [[140, 200], [100, 206], [60, 190]]]),
  callosum: path(x, y, s, [100, 140], [[[120, 110], [180, 104], [210, 136]]]),
  cerebellum: P.blob(x + 92 * s, y + 222 * s, 40 * s, 26 * s, "cbl", 0.05),
  stem: path(x, y, s, [140, 196], [[[134, 240], [130, 280], [126, 330]]]),
  face: [x + 284 * s, y + 200 * s] as Pt,
});

/* ---------------------------------------------------------------------------------------------
 * Added for E04 (Nov 2026): a pigmented skin lesion, a clinic ruler, a gentian-violet skin
 * marker, a question paper, a padlock and a settings dial. Checked on the `kit-objects-4` still.
 * ------------------------------------------------------------------------------------------- */

/**
 * A pigmented skin lesion seen from above. `kind: "nevus"` is small, round and even (benign);
 * `"melanoma"` is larger with an irregular, notched border and a darker off-centre area (the ABCD
 * signs). Wash `body` mid-brown and `dark` near-black brown; ink `body`. `ring` is the circle a
 * surgeon draws round it with a skin marker.
 */
export const lesion = (cx: number, cy: number, r: number, kind: "nevus" | "melanoma" = "nevus", key = "") => {
  const mel = kind === "melanoma";
  return {
    body: P.blob(cx, cy, r * (mel ? 1.15 : 1), r * (mel ? 0.92 : 0.95), `les${key}${kind}`, mel ? 0.2 : 0.04, 64),
    dark: P.blob(cx + (mel ? r * 0.25 : 0), cy - (mel ? r * 0.15 : 0), r * (mel ? 0.5 : 0.45), r * (mel ? 0.42 : 0.42), `lesd${key}`, mel ? 0.25 : 0.05),
    ring: P.blob(cx, cy, r * 1.9, r * 1.75, `lesr${key}`, 0.05, 56),
    at: [cx, cy] as Pt,
  };
};

/**
 * A clear plastic clinic ruler, horizontal: the body, millimetre ticks (every 5th longer, every
 * 10th longest) and `cm`, the positions for the centimetre numbers (typeset Labels). `mm` px.
 */
export const ruler = (x: number, y: number, cm = 5, mm = 10, h = 52) => ({
  body: P.rect(x, y, cm * 10 * mm + 2 * mm, h, 6),
  ticks: Array.from({ length: cm * 10 + 1 }, (_, i) => {
    const len = i % 10 === 0 ? h * 0.5 : i % 5 === 0 ? h * 0.36 : h * 0.22;
    return P.line(x + mm + i * mm, y, x + mm + i * mm, y + len, 1);
  }),
  cm: Array.from({ length: cm + 1 }, (_, i) => [x + mm + i * 10 * mm, y + h * 0.88] as Pt),
});

/**
 * A surgical skin marker (gentian violet), lying diagonally, tip at lower left: the barrel, the
 * clip of the cap at the back, the tapered tip and the violet nib. Local 300 × 60, scale s.
 */
export const skinMarker = (x: number, y: number, s = 1) => ({
  barrel: rectL(x, y, s, 60, 0, 260, 44, 14),
  cap: rectL(x, y, s, 200, -4, 300, 48, 16),
  clip: rectL(x, y, s, 216, -14, 290, -4, 3),
  taper: path(x, y, s, [60, 4], [[[40, 10], [24, 16], [14, 20]], [[12, 22], [12, 24], [14, 26]], [[24, 30], [40, 36], [60, 42]]]),
  nib: path(x, y, s, [14, 18], [[[6, 20], [2, 22], [0, 22]], [[2, 22], [6, 24], [14, 28]]]),
  violet: "#6A3FA0",
});

/**
 * A printed question paper: the sheet, a header box for the exam name, numbered questions
 * (`q(i)` is where "Q1." sits, followed by two text lines each) and a dog-ear corner.
 */
export const questionPaper = (x: number, y: number, w: number, h: number, n = 4) => {
  const top = y + 90, gap = (h - 120) / n;
  return {
    sheet: path(0, 0, 1, [x, y], [[[x + w * 0.4, y], [x + w * 0.7, y], [x + w - 34, y]], [[x + w - 20, y + 10], [x + w - 10, y + 22], [x + w, y + 34]], [[x + w, y + h * 0.4], [x + w, y + h * 0.7], [x + w, y + h]], [[x + w * 0.7, y + h], [x + w * 0.3, y + h], [x, y + h]], [[x, y + h * 0.7], [x, y + h * 0.3], [x, y]]]),
    ear: P.polyline([[x + w - 34, y], [x + w - 34, y + 34], [x + w, y + 34]], 8),
    header: P.rect(x + 24, y + 20, w - 90, 50, 4),
    title: [x + 24 + (w - 90) / 2, y + 55] as Pt,
    lines: Array.from({ length: n }, (_, i) => [
      P.line(x + 80, top + i * gap + 14, x + w - 30, top + i * gap + 14, 10),
      P.line(x + 80, top + i * gap + 40, x + w - 30 - (i % 2 ? 60 : 110), top + i * gap + 40, 10),
    ]).flat(),
    q: (i: number): Pt => [x + 44, top + i * gap + 24],
  };
};

/** A padlock, closed: the shackle (an inverted U), the body and the keyhole. Local 120 × 150. */
export const padlock = (x: number, y: number, s = 1) => ({
  shackle: path(x, y, s, [26, 66], [[[26, 30], [26, 4], [60, 4]], [[94, 4], [94, 30], [94, 66]]]),
  body: rectL(x, y, s, 6, 62, 114, 150, 12),
  keyhole: [P.ellipse(x + 60 * s, y + 96 * s, 10 * s, 10 * s), P.line(x + 60 * s, y + 104 * s, x + 60 * s, y + 126 * s, 4)],
});

/**
 * A settings knob on a panel: the face, a scale of ticks on the upper 270°, and a pointer at
 * `turn` (0 = fully left, 1 = fully right). For hyperparameters.
 */
export const dial = (cx: number, cy: number, r: number, turn = 0.5) => {
  const ang = (u: number) => (-135 + 270 * u) * (Math.PI / 180);
  const a = ang(turn);
  return {
    face: P.ellipse(cx, cy, r, r),
    grip: P.ellipse(cx, cy, r * 0.78, r * 0.78),
    ticks: Array.from({ length: 11 }, (_, i) => {
      const t = ang(i / 10);
      return P.line(cx + Math.sin(t) * r * 1.12, cy - Math.cos(t) * r * 1.12, cx + Math.sin(t) * r * (i % 5 ? 1.24 : 1.32), cy - Math.cos(t) * r * (i % 5 ? 1.24 : 1.32), 3);
    }),
    pointer: P.line(cx + Math.sin(a) * r * 0.2, cy - Math.cos(a) * r * 0.2, cx + Math.sin(a) * r * 0.7, cy - Math.cos(a) * r * 0.7, 6),
  };
};

/* ---------------------------------------------------------------------------------------------
 * Added for E05 (Nov 2026): a hospital bed, a broad-leaved tree (for the forest), a blister strip
 * of tablets. Checked on the `kit-objects-5` still.
 * ------------------------------------------------------------------------------------------- */

/**
 * A ward bed in side view, head to the left: headboard, footboard, mattress, pillow, the frame,
 * two legs on castors and a folded-down side rail. Local box 420 × 240, top-left (x, y), scale s.
 * Wash `mattress` pale blue and `pillow` white. `top` is where a lying patient's head would rest.
 */
export const hospitalBed = (x: number, y: number, s = 1) => ({
  headboard: rectL(x, y, s, 0, 20, 34, 190, 10),
  footboard: rectL(x, y, s, 386, 70, 416, 190, 10),
  mattress: rectL(x, y, s, 34, 96, 386, 140, 14),
  pillow: path(x, y, s, [44, 96], [[[44, 70], [70, 62], [100, 64]], [[124, 66], [134, 80], [132, 96]]]),
  frame: [P.line(x + 34 * s, y + 156 * s, x + 386 * s, y + 156 * s, 12), P.line(x + 34 * s, y + 140 * s, x + 34 * s, y + 156 * s, 2)],
  rail: [P.line(x + 150 * s, y + 112 * s, x + 320 * s, y + 112 * s, 8), ...[170, 235, 300].map((rx) => P.line(x + rx * s, y + 112 * s, x + rx * s, y + 140 * s, 3))],
  legs: [P.line(x + 70 * s, y + 156 * s, x + 70 * s, y + 210 * s, 4), P.line(x + 350 * s, y + 156 * s, x + 350 * s, y + 210 * s, 4)],
  castors: [70, 350].map((cx) => P.ellipse(x + cx * s, y + 222 * s, 13 * s, 13 * s)),
  top: [x + 90 * s, y + 70 * s] as Pt,
});

/**
 * A broad-leaved tree: a trunk that flares at the root, two branches into the crown, and a
 * scalloped crown outline. (x, y) is the foot of the trunk; the tree is about 220 × 300 × s.
 * Draw in this order so the trunk's top hides in the leaves: trunk wash + ink, then the crown
 * wash (alpha ≈ 0.85) over it, then the crown and branch ink. `key` varies the crown so a forest of
 * trees is not identical.
 */
export const tree = (x: number, y: number, s = 1, key = "") => {
  const cx = x, cy = y - 200 * s, rx = 105 * s, ry = 95 * s;
  const k = key.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const lobes = 9 + (k % 3), phase = (k % 7) * 0.4;
  const crown: Pt[] = Array.from({ length: 145 }, (_, i) => {
    const t = (i / 144) * Math.PI * 2;
    const bump = 1 + 0.09 * Math.abs(Math.sin((t * lobes) / 2 + phase));
    return [cx + Math.cos(t) * rx * bump, cy + Math.sin(t) * ry * bump] as const;
  });
  return {
    crown: crown as Pts,
    trunk: path(x, y, s, [-26, 0], [[[-14, -10], [-12, -40], [-14, -160]], [[-6, -162], [6, -162], [14, -160]], [[12, -40], [14, -10], [26, 0]]]),
    branches: [path(x, y, s, [-6, -110], [[[-20, -140], [-40, -160], [-56, -176]]]), path(x, y, s, [6, -112], [[[18, -150], [34, -170], [48, -190]]])],
    centre: [cx, cy] as Pt,
  };
};

/**
 * A blister strip of tablets seen from the front: the foil card, 2 × n domed pockets with a
 * tablet in each, and the perforation down the middle. Local (x, y) top-left, w × h.
 */
export const blister = (x: number, y: number, w: number, h: number, n = 5) => {
  const pw = w / n, ph = h / 2;
  return {
    card: P.rect(x, y, w, h, 8),
    pockets: Array.from({ length: n * 2 }, (_, i) => P.ellipse(x + pw * ((i % n) + 0.5), y + ph * (Math.floor(i / n) + 0.5), pw * 0.34, ph * 0.3)),
    tablets: Array.from({ length: n * 2 }, (_, i) => P.ellipse(x + pw * ((i % n) + 0.5), y + ph * (Math.floor(i / n) + 0.5), pw * 0.22, ph * 0.18)),
    perforation: Array.from({ length: n * 2 }, (_, i) => P.line(x + (i + 0.2) * (w / (n * 2)), y + ph, x + (i + 0.7) * (w / (n * 2)), y + ph, 2)),
  };
};

/* ---------------------------------------------------------------------------------------------
 * Added for E06 (Nov 2026): a neuron, an H&E colon mucosa tile (normal and adenocarcinoma), a
 * neural-network diagram, an error landscape for gradient descent, a kidney, and three
 * everyday photo subjects (a dog, a car, an apple). Checked on the `kit-objects-6` still.
 * ------------------------------------------------------------------------------------------- */

/** A closed Catmull-Rom curve through `pts` (local box, placed at (x, y) × s). */
const smoothClosed = (x: number, y: number, s: number, pts: [number, number][], n = 10): Pts => {
  const out: Pt[] = [];
  const m = pts.length;
  for (let i = 0; i < m; i++) {
    const p0 = pts[(i - 1 + m) % m], p1 = pts[i], p2 = pts[(i + 1) % m], p3 = pts[(i + 2) % m];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([x + f(p0[0], p1[0], p2[0], p3[0]) * s, y + f(p0[1], p1[1], p2[1], p3[1]) * s]);
    }
  }
  out.push(out[0]);
  return out;
};
/** An open Catmull-Rom curve through `pts` (ends clamped). */
const smoothOpen = (x: number, y: number, s: number, pts: [number, number][], n = 10): Pts => {
  const out: Pt[] = [];
  const m = pts.length;
  for (let i = 0; i < m - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(m - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([x + f(p0[0], p1[0], p2[0], p3[0]) * s, y + f(p0[1], p1[1], p2[1], p3[1]) * s]);
    }
  }
  out.push([x + pts[m - 1][0] * s, y + pts[m - 1][1] * s]);
  return out;
};

/** A deterministic 0..1 stream per key. */
const stream = (key: string) => {
  let seed = 7;
  for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
};

/**
 * A multipolar neuron, as in a histology or physiology textbook: an angular cell body with a
 * round nucleus and a nucleolus, branching dendrites on the left, the axon hillock, a myelinated
 * axon (sheath segments with nodes of Ranvier between them) running right, and terminal branches
 * ending in synaptic boutons. Local box 900 × 300, top-left (x, y), scale s.
 * Parts: soma (closed), nucleus, nucleolus, dendrites (open strokes, trunk first), axon,
 * myelin (closed segments), terminals (open), boutons (closed); dendriteTip / somaAt / axonEnd
 * for labels.
 */
export const neuron = (x: number, y: number, s = 1) => {
  const T = (px: number, py: number): Pt => [x + px * s, y + py * s];
  const dendrites: Pts[] = [];
  const branch = (sx: number, sy: number, ang: number, len: number, depth: number, key: string) => {
    const r = stream(key);
    const ex = sx + Math.cos(ang) * len, ey = sy + Math.sin(ang) * len;
    const bend = (r() - 0.5) * len * 0.35;
    const mx = (sx + ex) / 2 - Math.sin(ang) * bend, my = (sy + ey) / 2 + Math.cos(ang) * bend;
    dendrites.push(P.quad(...T(sx, sy), ...T(mx, my), ...T(ex, ey), 14));
    if (depth > 0) {
      branch(ex, ey, ang - 0.42 - r() * 0.2, len * 0.62, depth - 1, `${key}a`);
      branch(ex, ey, ang + 0.38 + r() * 0.2, len * 0.58, depth - 1, `${key}b`);
    }
  };
  const somaPts: [number, number][] = [[255, 150], [232, 112], [196, 98], [168, 104], [150, 128], [146, 158], [158, 190], [190, 204], [228, 190]];
  const roots: [number, number, number][] = [[196, 100, -1.75], [160, 112, -2.45], [146, 150, Math.PI], [156, 186, 2.5], [196, 202, 1.85]];
  roots.forEach(([sx, sy, a], i) => branch(sx, sy, a, i === 2 ? 70 : 62, 2, `nd${i}`));
  const seg = (x0: number, x1: number) => P.rect(x + x0 * s, y + 138 * s, (x1 - x0) * s, 24 * s, 12 * s);
  const myelin = [310, 400, 490, 580, 670].map((x0) => seg(x0, x0 + 76));
  const ends: [number, number][] = [[880, 96], [892, 136], [890, 172], [872, 210]];
  return {
    soma: smoothClosed(x, y, s, somaPts, 8),
    nucleus: P.ellipse(...T(198, 152), 24 * s, 22 * s),
    nucleolus: P.ellipse(...T(204, 148), 6 * s, 6 * s),
    dendrites,
    axon: P.line(...T(255, 150), ...T(800, 150), 40),
    hillock: smoothOpen(x, y, s, [[246, 132], [262, 144], [280, 148]], 6),
    myelin,
    terminals: ends.map(([ex, ey]) => smoothOpen(x, y, s, [[800, 150], [835, 150 + (ey - 150) * 0.4], [ex - 10, ey]], 8)),
    boutons: ends.map(([ex, ey]) => P.ellipse(...T(ex, ey), 9 * s, 9 * s)),
    somaAt: T(200, 150), dendriteTip: T(60, 70), axonEnd: T(880, 150),
  };
};

/** H&E colours as on a well-stained colon section (haematoxylin purple-blue, eosin pink, mucin pale). */
export const HE = {
  stroma: "#E7A3C2",
  stromaPale: "#F0C3D6",
  cyto: "#E9A6CB",
  nucleus: "#4A3A8C",
  nucleusLight: "#6C5AAE",
  mucin: "#E4E6F2",
  lumen: "#FFFFFF",
  necrosis: "#D98AAE",
  lymph: "#3B2E78",
} as const;

export interface Crypt {
  /** Basement membrane (closed). */
  readonly outline: Pts;
  /** Lumen (closed); tumour glands may have several (cribriform). */
  readonly lumens: Pts[];
  /** Epithelial nuclei (closed, small ellipses), basal in normal crypts, stratified in tumour. */
  readonly nuclei: Pts[];
  /** Goblet-cell mucin vacuoles (closed); none in tumour glands. */
  readonly goblets: Pts[];
  /** Cell borders (short radial strokes). */
  readonly walls: Pts[];
  /** Luminal debris in tumour glands ("dirty necrosis": pink with nuclear dust). */
  readonly debris: Pt[];
  readonly centre: Pt;
}

/**
 * A square H&E tile of colonic mucosa with the crypts cut across (the "test-tube rack" seen end
 * on), the way a pathologist sees a well-oriented transverse section at medium power.
 * - `normal`: round, evenly spaced crypts of equal size in pink lamina propria; each crypt is a
 *   single layer of tall cells round a small central lumen, small dark nuclei sitting basally at
 *   the basement membrane, many goblet cells (pale mucin vacuoles) between them; the lamina
 *   propria holds scattered small round lymphocyte and plasma-cell nuclei.
 * - `tumour` (adenocarcinoma): crowded, back-to-back glands of unequal size and angular shape,
 *   some with two or three lumens (cribriform); enlarged, elongated, pencil-like nuclei stacked
 *   in two or three rows up to the lumen; no goblet cells; pink debris with nuclear dust in the
 *   lumens; little stroma between glands.
 * Wash `field` HE.stroma, each crypt outline HE.cyto, goblets HE.mucin, lumens HE.lumen, then
 * fill the nuclei HE.nucleus (see e06 `Fills`) and ink the outlines. (x, y) top-left, size w × h.
 */
export const colonTile = (x: number, y: number, w: number, h: number, kind: "normal" | "tumour" = "normal", key = "ct") => {
  const r = stream(`${key}${kind}`);
  const crypts: Crypt[] = [];
  const tumour = kind === "tumour";
  const R = Math.min(w, h) * (tumour ? 0.12 : 0.12);
  const gap = R * (tumour ? 2.15 : 2.55);
  const m = R * (tumour ? 1.3 : 1.1);
  const cols = Math.max(2, Math.floor((w - 2 * m) / gap + 0.5) + 1);
  const rows = Math.max(2, Math.floor((h - 2 * m) / (gap * 0.87) + 0.5) + 1);
  const sx = (w - 2 * m) / (cols - 0.5), sy = (h - 2 * m) / (rows - 1);
  const centres: Pt[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = x + m + col * sx + (row % 2 ? sx / 2 : 0);
      const cy = y + m + row * sy;
      const j = tumour ? 0.35 : 0.1;
      centres.push([cx + (r() - 0.5) * R * j, cy + (r() - 0.5) * R * j]);
    }
  }
  centres.forEach(([cx, cy], gi) => {
    const k = `${key}${kind}${gi}`;
    const sz = tumour ? 0.8 + r() * 0.35 : 0.96 + r() * 0.08;
    const rx = R * sz * (tumour ? 0.9 + r() * 0.3 : 1), ry = R * sz * (tumour ? 0.8 + r() * 0.3 : 0.96);
    const outline = P.blob(cx, cy, rx, ry, `${k}o`, tumour ? 0.16 : 0.035, 64);
    const radiusAt = (a: number) => {
      let best = 0, bd = 1e9;
      for (const [px, py] of outline) {
        const d = Math.abs(Math.atan2(py - cy, px - cx) - a);
        const dd = Math.min(d, Math.PI * 2 - d);
        if (dd < bd) { bd = dd; best = Math.hypot(px - cx, py - cy); }
      }
      return best;
    };
    /** A small ellipse at radius fraction f along angle a, long axis `along` (radial) × `across`. */
    const nuc = (a: number, f: number, along: number, across: number): Pts => {
      const ro = radiusAt(a), ca = Math.cos(a), sa = Math.sin(a);
      const ncx = cx + ca * ro * f, ncy = cy + sa * ro * f;
      return P.ellipse(0, 0, along * ro, across * ro, 0, Math.PI * 2, 14).map(([px, py]) => [ncx + px * ca - py * sa, ncy + px * sa + py * ca] as const);
    };
    const lumens: Pts[] = [];
    const nuclei: Pts[] = [];
    const goblets: Pts[] = [];
    const walls: Pts[] = [];
    const debris: Pt[] = [];
    if (!tumour) {
      const lr = R * 0.16;
      lumens.push(P.blob(cx, cy, lr, lr * 0.85, `${k}l`, 0.15, 24));
      const n = 30;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.08;
        nuclei.push(nuc(a, 0.87 + (r() - 0.5) * 0.04, 0.075, 0.045));
      }
      const g = 13;
      for (let i = 0; i < g; i++) {
        const a = (i / g) * Math.PI * 2 + 0.2 + (r() - 0.5) * 0.1;
        const ro = radiusAt(a), gr = ro * (0.55 + (r() - 0.5) * 0.06);
        goblets.push(P.blob(cx + Math.cos(a) * gr, cy + Math.sin(a) * gr, ro * 0.165, ro * 0.14, `${k}g${i}`, 0.12, 18));
      }
    } else {
      const nl = gi % 4 === 1 ? 3 : gi % 4 === 3 ? 2 : 1;
      const lc: Pt[] = nl === 1 ? [[cx + (r() - 0.5) * rx * 0.2, cy]] : Array.from({ length: nl }, (_, j) => [cx + Math.cos((j / nl) * Math.PI * 2 + 0.5) * rx * 0.36, cy + Math.sin((j / nl) * Math.PI * 2 + 0.5) * ry * 0.36] as Pt);
      lc.forEach(([lx, ly], j) => {
        const lr = (nl === 1 ? 0.36 : 0.18) * Math.min(rx, ry);
        lumens.push(P.blob(lx, ly, lr * (0.9 + r() * 0.4), lr * (0.6 + r() * 0.3), `${k}l${j}`, 0.3, 24));
        if (gi % 2 === 0) for (let d = 0; d < 6; d++) {
          const a = r() * Math.PI * 2, dd = r() * lr * 0.5;
          debris.push([lx + Math.cos(a) * dd, ly + Math.sin(a) * dd]);
        }
      });
      const n = 26;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.15;
        const layers = 2 + (r() < 0.5 ? 1 : 0);
        for (let layer = 0; layer < layers; layer++) {
          nuclei.push(nuc(a + (r() - 0.5) * 0.1, 0.85 - layer * 0.14 + (r() - 0.5) * 0.05, 0.07 + r() * 0.02, 0.04 + r() * 0.012));
        }
      }
    }
    crypts.push({ outline, lumens, nuclei, goblets, walls, debris, centre: [cx, cy] });
  });
  const inCrypt = (px: number, py: number) => crypts.some((c) => Math.hypot(px - c.centre[0], py - c.centre[1]) < R * (tumour ? 1.25 : 1.08));
  const stromaNuclei = granules(x + w / 2, y + h / 2, Math.hypot(w, h) / 2, tumour ? 45 : 170, `${key}${kind}s`, (px, py) => px < x + 5 || px > x + w - 5 || py < y + 5 || py > y + h - 5 || inCrypt(px, py))
    .map(([px, py], i) => tumour && i % 2 === 0
      ? P.ellipse(px, py, R * 0.1, R * 0.025, 0, Math.PI * 2, 12).map(([qx, qy]) => [px + (qx - px) * 0.8 - (qy - py) * 0.6, py + (qx - px) * 0.6 + (qy - py) * 0.8] as const)
      : P.ellipse(px, py, R * 0.045, R * 0.042, 0, Math.PI * 2, 12));
  return { field: P.rect(x, y, w, h, 4), crypts, stromaNuclei, R };
};

/**
 * A feed-forward neural network diagram: `layers` gives the node count per layer, left to right.
 * Parts: nodes (per layer, closed circles), centres (per layer), edges (per gap between layers,
 * one stroke per connection), r.
 */
export const network = (x: number, y: number, w: number, h: number, layers: number[] = [3, 4, 4, 2], r = 26) => {
  const centres: Pt[][] = layers.map((n, li) => {
    const lx = x + (layers.length === 1 ? w / 2 : (li / (layers.length - 1)) * w);
    const step = n > 1 ? Math.min(h / (n - 1), r * 4.2) : 0;
    const top = y + h / 2 - (step * (n - 1)) / 2;
    return Array.from({ length: n }, (_, i) => [lx, top + i * step] as Pt);
  });
  const nodes = centres.map((col) => col.map(([cx, cy]) => P.ellipse(cx, cy, r, r, -Math.PI / 2, Math.PI * 1.5, 36)));
  const edges = centres.slice(0, -1).map((col, li) => col.flatMap(([ax, ay]) => centres[li + 1].map(([bx, by]) => {
    const d = Math.hypot(bx - ax, by - ay);
    return P.line(ax + ((bx - ax) / d) * r, ay + ((by - ay) / d) * r, bx - ((bx - ax) / d) * r, by - ((by - ay) / d) * r, 6);
  })));
  return { nodes, centres, edges, r };
};

/**
 * An error landscape seen side-on, for gradient descent: high ground on the left, a shallow dip
 * (local minimum), a ridge, the deep valley (global minimum), rising again on the right.
 * `height(u)` is 0 (lowest) .. 1 (highest) for u in 0..1; `at(u)` the ground point; `slope(u)`
 * the gradient; `ground` the stroke; `body` the closed shape under it for a wash; `local` and
 * `global` the u of the two minima.
 */
export const errorLandscape = (x: number, y: number, w: number, h: number) => {
  const height = (u: number) =>
    0.55 + 0.42 * Math.cos(u * Math.PI * 1.15) * (1 - u * 0.2)
    - 0.34 * Math.exp(-((u - 0.7) ** 2) / 0.012)
    - 0.2 * Math.exp(-((u - 0.27) ** 2) / 0.004)
    + 0.35 * u ** 6;
  const us = Array.from({ length: 241 }, (_, i) => i / 240);
  const hs = us.map(height);
  const lo = Math.min(...hs), hi = Math.max(...hs);
  const H = (u: number) => (height(u) - lo) / (hi - lo);
  const at = (u: number): Pt => [x + u * w, y + (1 - H(u)) * h];
  const slope = (u: number) => (H(u + 1e-4) - H(u - 1e-4)) / 2e-4;
  const ground = us.map(at);
  const argmin = (a: number, b: number) => us.filter((u) => u >= a && u <= b).reduce((m, u) => (H(u) < H(m) ? u : m), a);
  return {
    ground, at, slope, height: H,
    body: [...ground, [x + w, y + h + 40], [x, y + h + 40], ground[0]] as Pts,
    local: argmin(0.15, 0.4), global: argmin(0.5, 0.9),
  };
};

/**
 * A kidney in coronal section, hilum facing right: the capsule, the cortex/medulla border,
 * five medullary pyramids pointing to the hilum, the renal pelvis and the ureter leaving
 * downward. Local box 220 × 300 (ureter to 380), top-left (x, y), scale s.
 */
export const kidney = (x: number, y: number, s = 1) => {
  const outer: [number, number][] = [[150, 92], [160, 40], [118, 6], [70, 10], [22, 26], [4, 90], [6, 150], [10, 210], [36, 268], [88, 278], [140, 272], [166, 220], [156, 176], [134, 160], [128, 134], [136, 110]];
  const inner: [number, number][] = [[136, 92], [132, 50], [104, 30], [70, 34], [40, 46], [28, 96], [30, 150], [34, 206], [54, 248], [92, 254], [128, 246], [144, 212], [140, 182]];
  const pyr = (tx: number, ty: number, bx1: number, by1: number, bx2: number, by2: number) => smoothClosed(x, y, s, [[bx1, by1], [(bx1 + bx2) / 2 - (tx > 100 ? 0 : 6), (by1 + by2) / 2], [bx2, by2], [tx, ty]], 6);
  return {
    capsule: smoothClosed(x, y, s, outer, 8),
    cortex: smoothOpen(x, y, s, inner, 8),
    pyramids: [pyr(118, 96, 62, 50, 92, 40), pyr(112, 124, 40, 92, 46, 128), pyr(112, 152, 38, 156, 44, 192), pyr(116, 180, 52, 222, 80, 238), pyr(124, 112, 96, 52, 76, 60)],
    pelvis: smoothClosed(x, y, s, [[118, 100], [140, 118], [150, 150], [138, 176], [118, 186], [128, 150]], 8),
    ureter: smoothOpen(x, y, s, [[140, 176], [158, 210], [170, 270], [176, 330], [184, 380]], 8),
    centre: [x + 90 * s, y + 140 * s] as Pt,
  };
};

/**
 * A dog standing, side view facing left (a Labrador-like build): one closed silhouette with
 * the near legs, the far legs as separate strokes, a floppy ear, eye, nose, collar and tail.
 * Local box 320 × 220, top-left (x, y), scale s.
 */
export const dog = (x: number, y: number, s = 1) => ({
  body: smoothClosed(x, y, s, [
    [10, 66], [16, 56], [40, 50], [60, 40], [74, 24], [96, 16], [116, 24], [128, 44], [134, 62], [160, 72], [210, 72], [262, 74], [284, 82],
    [292, 104], [294, 130], [286, 160], [292, 192], [298, 208], [276, 210], [270, 186], [262, 150], [240, 134], [180, 132], [146, 132],
    [140, 168], [140, 208], [116, 210], [114, 172], [108, 128], [98, 104], [84, 86], [56, 80], [26, 78],
  ], 8),
  farLegs: [smoothOpen(x, y, s, [[160, 132], [164, 172], [168, 206], [150, 208]], 8), smoothOpen(x, y, s, [[250, 140], [246, 176], [252, 206], [234, 208]], 8)],
  ear: smoothOpen(x, y, s, [[98, 22], [110, 34], [116, 58], [108, 72], [100, 60], [100, 40]], 8),
  eye: P.ellipse(x + 70 * s, y + 38 * s, 4 * s, 4 * s),
  nose: P.blob(x + 14 * s, y + 60 * s, 7 * s, 6 * s, "dognose", 0.05, 16),
  mouth: smoothOpen(x, y, s, [[18, 72], [36, 74], [54, 70]], 6),
  collar: smoothOpen(x, y, s, [[126, 50], [128, 74], [118, 96]], 6),
  tail: smoothOpen(x, y, s, [[284, 84], [300, 66], [312, 44], [318, 30]], 8),
});

/**
 * A family hatchback, side view facing left: body with bonnet, windscreen, roof, rear window and
 * boot, two windows with the B-pillar, door line, handle, headlamp, and two wheels with hubs.
 * Local box 380 × 170, top-left (x, y), scale s.
 */
export const car = (x: number, y: number, s = 1) => ({
  body: smoothClosed(x, y, s, [
    [12, 112], [16, 92], [40, 84], [110, 76], [150, 40], [180, 30], [270, 30], [304, 46], [338, 80], [362, 90], [368, 116], [356, 128],
    [326, 128], [318, 108], [296, 98], [272, 108], [264, 128], [124, 128], [116, 108], [94, 98], [72, 108], [64, 128], [20, 128],
  ], 6),
  windows: [smoothClosed(x, y, s, [[158, 76], [184, 44], [222, 42], [222, 76]], 4), smoothClosed(x, y, s, [[234, 76], [234, 42], [270, 42], [298, 54], [318, 76]], 4)],
  door: P.line(x + 228 * s, y + 80 * s, x + 228 * s, y + 124 * s, 6),
  handle: P.line(x + 196 * s, y + 90 * s, x + 214 * s, y + 90 * s, 3),
  lamp: P.ellipse(x + 30 * s, y + 96 * s, 10 * s, 6 * s),
  wheels: [P.ellipse(x + 94 * s, y + 128 * s, 28 * s, 28 * s), P.ellipse(x + 296 * s, y + 128 * s, 28 * s, 28 * s)],
  hubs: [P.ellipse(x + 94 * s, y + 128 * s, 11 * s, 11 * s), P.ellipse(x + 296 * s, y + 128 * s, 11 * s, 11 * s)],
});

/** An apple: two-lobed body with the top dimple, stem and one leaf. Local box 200 × 200. */
export const apple = (x: number, y: number, s = 1) => ({
  body: smoothClosed(x, y, s, [[100, 44], [130, 26], [172, 34], [194, 76], [190, 130], [166, 176], [130, 192], [100, 182], [70, 192], [34, 176], [10, 130], [6, 76], [28, 34], [70, 26]], 8),
  stem: smoothOpen(x, y, s, [[100, 46], [102, 26], [108, 8]], 6),
  leaf: smoothClosed(x, y, s, [[106, 20], [128, 4], [156, 6], [140, 22]], 6),
  shine: smoothOpen(x, y, s, [[44, 70], [36, 96], [40, 120]], 6),
});

/**
 * The diagnostic 2×2 table (E07): disease across the top (present | absent), test down the side
 * (positive | negative). (x, y) is the top-left of the whole table including the header strips;
 * `hw` is the row-header strip's width, `hh` the column-header strip's height.
 * Cells in reading order: tp (top-left), fp (top-right), fn (bottom-left), tn (bottom-right).
 * Parts: frame (closed, cells only), dividers (the cross), headerLines (the strips' inner edges),
 * cells (closed rects for washes, inset 6 px), centre of each cell, colHead/rowHead centres.
 */
export const twoByTwo = (x: number, y: number, w: number, h: number, hw = 170, hh = 70) => {
  const cx0 = x + hw, cy0 = y + hh, cw = (w - hw) / 2, ch = (h - hh) / 2;
  const cell = (i: number, j: number) => P.rect(cx0 + i * cw + 6, cy0 + j * ch + 6, cw - 12, ch - 12, 8);
  const centre = (i: number, j: number): Pt => [cx0 + (i + 0.5) * cw, cy0 + (j + 0.5) * ch];
  return {
    frame: P.rect(cx0, cy0, w - hw, h - hh, 10),
    dividers: [P.line(cx0 + cw, cy0 - hh * 0.9, cx0 + cw, y + h, 16), P.line(cx0 - hw * 0.9, cy0 + ch, x + w, cy0 + ch, 16)],
    headerLines: [P.line(cx0, cy0 - hh * 0.9, cx0, cy0, 4), P.line(cx0 - hw * 0.9, cy0, cx0, cy0, 4)],
    cells: { tp: cell(0, 0), fp: cell(1, 0), fn: cell(0, 1), tn: cell(1, 1) },
    centre: { tp: centre(0, 0), fp: centre(1, 0), fn: centre(0, 1), tn: centre(1, 1) },
    colHead: [[cx0 + cw / 2, y + hh / 2], [cx0 + cw * 1.5, y + hh / 2]] as Pt[],
    rowHead: [[x + hw / 2, cy0 + ch / 2], [x + hw / 2, cy0 + ch * 1.5]] as Pt[],
    cellW: cw, cellH: ch,
  };
};

/**
 * An injection vial (antibiotic powder), front view: glass body with shoulders and a neck, the
 * aluminium crimp ring, the plastic flip-off cap, a paper label with two print lines, and the
 * powder level. Local box 120 × 230, top-left (x, y), scale s. Wash `glass` pale, `cap` coloured,
 * `powder` white, `label` cream, then ink everything.
 */
export const vial = (x: number, y: number, s = 1) => ({
  glass: smoothClosed(x, y, s, [[34, 66], [34, 74], [14, 92], [8, 112], [8, 214], [16, 226], [104, 226], [112, 214], [112, 112], [106, 92], [86, 74], [86, 66]], 6),
  crimp: rectL(x, y, s, 26, 36, 94, 68, 6),
  cap: rectL(x, y, s, 22, 8, 98, 38, 10),
  capRidge: P.line(x + 30 * s, y + 24 * s, x + 90 * s, y + 24 * s, 6),
  label: rectL(x, y, s, 14, 124, 106, 196, 4),
  print: [P.line(x + 28 * s, y + 148 * s, x + 92 * s, y + 148 * s, 8), P.line(x + 28 * s, y + 172 * s, x + 76 * s, y + 172 * s, 8)],
  powder: smoothClosed(x, y, s, [[12, 200], [60, 194], [108, 200], [108, 214], [100, 222], [20, 222], [12, 214]], 4),
  shine: P.line(x + 20 * s, y + 104 * s, x + 20 * s, y + 118 * s, 3),
});

/**
 * A one-rupee coin, face on: rim, raised inner ring, the ₹ sign (two top bars, the bowl, the
 * diagonal leg) and a numeral "1" stroke. Centre (cx, cy), radius r. Wash `face` in a steel grey.
 */
export const coin = (cx: number, cy: number, r: number) => {
  const k = r / 100;
  const L = (x1: number, y1: number, x2: number, y2: number) => P.line(cx + x1 * k, cy + y1 * k, cx + x2 * k, cy + y2 * k, 10);
  return {
    face: P.ellipse(cx, cy, r, r),
    ring: P.ellipse(cx, cy, r * 0.86, r * 0.86),
    rupee: [
      L(-34, -48, 30, -48), L(-34, -26, 30, -26),
      smoothOpen(cx, cy, k, [[-34, -48], [2, -48], [16, -36], [14, -20], [0, -8], [-34, -6]], 8),
      L(-34, -6, 22, 44),
    ],
    reeds: Array.from({ length: 36 }, (_, i) => {
      const a = (i / 36) * Math.PI * 2;
      return P.line(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9, cx + Math.cos(a) * r * 0.97, cy + Math.sin(a) * r * 0.97, 2);
    }),
  };
};

/**
 * An alarm bell: a flared bell body, the lip, a top knob, the clapper below the lip, and three
 * sound arcs on each side (draw the arcs last, when it rings). Centre of the body (cx, cy), scale s;
 * the bell is about 200 × 220 × s.
 */
export const bell = (cx: number, cy: number, s = 1) => ({
  body: smoothClosed(cx, cy, s, [[0, -96], [34, -86], [54, -50], [60, 0], [70, 40], [96, 66], [96, 76], [-96, 76], [-96, 66], [-70, 40], [-60, 0], [-54, -50], [-34, -86]], 8),
  lip: P.line(cx - 96 * s, cy + 66 * s, cx + 96 * s, cy + 66 * s, 10),
  knob: P.ellipse(cx, cy - 106 * s, 12 * s, 12 * s),
  clapper: P.ellipse(cx, cy + 94 * s, 18 * s, 14 * s),
  shine: smoothOpen(cx, cy, s, [[-30, -60], [-40, -20], [-42, 20]], 6),
  arcs: [1, 2, 3].flatMap((i) => [
    P.ellipse(cx, cy - 10 * s, (100 + i * 26) * s, (100 + i * 26) * s, -Math.PI * 0.18, Math.PI * 0.12, 10),
    P.ellipse(cx, cy - 10 * s, (100 + i * 26) * s, (100 + i * 26) * s, Math.PI * 0.88, Math.PI * 1.18, 10),
  ]),
});

/* ---------------------------------------------------------------------------------------------
 * Added for E08 (Nov 2026): a CT scanner (gantry ring and patient table), a desktop EHR screen,
 * a cloud, a microchip (edge device) and a Wi-Fi signal. Checked on the `kit-objects-8` still.
 * ------------------------------------------------------------------------------------------- */

const poly = (x: number, y: number, s: number, pts: [number, number][], close = true): Pts => {
  const out: Pt[] = pts.map(([u, v]) => [x + u * s, y + v * s] as const);
  return P.polyline(close ? [...out, out[0]] : out, 14);
};

/**
 * A CT scanner in three-quarter view: the gantry housing (a big rounded doughnut block with its
 * side depth and plinth), the round bore filling most of it with an inner rim and a light ring, a
 * slim control panel and two LEDs beside the bore (not above it: that reads as a washing machine), and the patient table running out of the bore to the right on a pedestal.
 * Optional `patient` lies on the table, head in the bore. Local box 620 × 360, top-left (x, y),
 * scale s. Wash `housing` and `side` off-white, `bore` dark grey, `mattress` blue, `table` grey.
 */
export const ctScanner = (x: number, y: number, s = 1) => ({
  housing: rectL(x, y, s, 30, 0, 360, 344, 120),
  side: poly(x, y, s, [[60, 20], [12, 60], [8, 290], [52, 332]]),
  plinth: rectL(x, y, s, 70, 336, 320, 360, 6),
  ring: P.ellipse(x + 195 * s, y + 172 * s, 140 * s, 140 * s),
  bore: P.ellipse(x + 195 * s, y + 172 * s, 122 * s, 122 * s),
  rim: P.ellipse(x + 195 * s, y + 172 * s, 100 * s, 100 * s),
  display: rectL(x, y, s, 328, 84, 346, 124, 4),
  leds: [P.ellipse(x + 337 * s, y + 70 * s, 5 * s, 5 * s), P.ellipse(x + 322 * s, y + 56 * s, 5 * s, 5 * s)],
  table: rectL(x, y, s, 110, 208, 620, 230, 6),
  mattress: rectL(x, y, s, 116, 194, 600, 210, 8),
  pedestal: poly(x, y, s, [[420, 230], [570, 230], [550, 336], [440, 336]]),
  foot: rectL(x, y, s, 390, 336, 600, 360, 6),
  patientHead: P.ellipse(x + 152 * s, y + 174 * s, 22 * s, 20 * s),
  patientBody: smoothClosed(x, y, s, [[178, 168], [240, 158], [380, 160], [500, 168], [576, 176], [580, 190], [500, 194], [240, 194], [178, 192]], 6),
  centre: [x + 195 * s, y + 172 * s] as Pt,
});

/**
 * A desktop computer monitor showing an electronic health record: the case, the screen, a neck and
 * a foot; on screen a title bar, a patient-list sidebar with entries, an alert banner (wash it red
 * when an alert fires), text rows and a small trend chart. Box w × h for the case (the stand hangs
 * below it, about 0.2 h). `banner` centre is `bannerAt`.
 */
export const ehrScreen = (x: number, y: number, w: number, h: number) => {
  const sx = x + w * 0.04, sy = y + h * 0.05, sw = w * 0.92, sh = h * 0.82;
  const bx = sx + sw * 0.28, bw = sw * 0.68;
  return {
    case: P.rect(x, y, w, h, 14),
    screen: P.rect(sx, sy, sw, sh, 4),
    neck: P.rect(x + w * 0.45, y + h, w * 0.1, h * 0.12, 3),
    foot: P.rect(x + w * 0.3, y + h * 1.12, w * 0.4, h * 0.06, 8),
    titleBar: P.rect(sx, sy, sw, sh * 0.1, 3),
    sidebar: P.rect(sx, sy + sh * 0.1, sw * 0.24, sh * 0.9, 2),
    entries: [0, 1, 2, 3, 4].map((i) => P.line(sx + sw * 0.03, sy + sh * (0.2 + i * 0.15), sx + sw * 0.2, sy + sh * (0.2 + i * 0.15), 6)),
    banner: P.rect(bx, sy + sh * 0.15, bw, sh * 0.16, 6),
    rows: [0, 1, 2].map((i) => P.line(bx, sy + sh * (0.42 + i * 0.1), bx + bw * (i === 1 ? 0.6 : 0.85), sy + sh * (0.42 + i * 0.1), 8)),
    chartBox: P.rect(bx, sy + sh * 0.7, bw * 0.5, sh * 0.24, 3),
    chart: [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1].map((u, i) => [bx + bw * 0.03 + u * bw * 0.44, sy + sh * (0.9 - [0.05, 0.1, 0.06, 0.12, 0.09, 0.14, 0.16][i])] as const) as Pts,
    bannerAt: [bx + bw / 2, sy + sh * 0.23] as Pt,
  };
};

/** A cloud: a flat-bottomed bumpy outline, centre (cx, cy), width w (height about 0.6 w). */
export const cloud = (cx: number, cy: number, w: number) =>
  smoothClosed(cx, cy, w / 200, [[-96, 34], [-104, 8], [-80, -14], [-66, -44], [-30, -60], [2, -52], [22, -76], [62, -74], [82, -44], [102, -28], [108, 6], [96, 34], [0, 38]], 8);

/** A microchip seen from above: the package, the die, and five pins on each side. Centre, size. */
export const chip = (cx: number, cy: number, size: number) => {
  const h = size / 2, pin = size * 0.16;
  const at = (i: number) => -h + size * (0.18 + i * 0.16);
  return {
    body: P.rect(cx - h, cy - h, size, size, size * 0.06),
    die: P.rect(cx - h * 0.5, cy - h * 0.5, h, h, size * 0.03),
    pins: [0, 1, 2, 3, 4].flatMap((i) => [
      P.line(cx + at(i), cy - h, cx + at(i), cy - h - pin, 3), P.line(cx + at(i), cy + h, cx + at(i), cy + h + pin, 3),
      P.line(cx - h, cy + at(i), cx - h - pin, cy + at(i), 3), P.line(cx + h, cy + at(i), cx + h + pin, cy + at(i), 3),
    ]),
  };
};

/** A Wi-Fi signal: a dot and three arcs opening upwards; `cross` strikes it out (no signal). */
export const wifi = (cx: number, cy: number, s = 1) => ({
  dot: P.ellipse(cx, cy, 10 * s, 10 * s),
  arcs: [1, 2, 3].map((i) => P.ellipse(cx, cy, 34 * i * s, 34 * i * s, -Math.PI * 0.78, -Math.PI * 0.22, 16)),
  cross: [P.line(cx - 90 * s, cy - 110 * s, cx + 90 * s, cy + 20 * s, 8), P.line(cx + 90 * s, cy - 110 * s, cx - 90 * s, cy + 20 * s, 8)],
});

/**
 * An ultrasound image as the screen shows it: the fan-shaped sector (apex at the top, curved
 * bottom edge) and, inside it, a kidney in long axis: the bright capsule, the cortex and the
 * central sinus; `pelvis` is the dark fluid-filled pelvis of a blocked (hydronephrotic) kidney.
 * Apex (cx, y), radius r (the sector spans ±40°, a curved-array probe face at the top). Wash `fan` near-black, `kidney` mid-grey.
 */
export const ultrasoundFan = (cx: number, y: number, r: number) => {
  const a0 = Math.PI / 2 - 0.7, a1 = Math.PI / 2 + 0.7, r0 = r * 0.12;
  const outer = P.ellipse(cx, y, r, r, a0, a1, 32);
  const inner = P.ellipse(cx, y, r0, r0, a1, a0, 8);
  const ky = y + r * 0.6, kw = r * 0.4, kh = r * 0.2;
  return {
    fan: P.polyline([...inner, ...outer, inner[0]], 14),
    kidney: P.ellipse(cx, ky, kw, kh * 0.8, -Math.PI / 2, Math.PI * 1.5, 48),
    sinus: smoothClosed(cx, ky, 1, [[-kw * 0.62, 0], [-kw * 0.4, -kh * 0.42], [kw * 0.1, -kh * 0.5], [kw * 0.6, -kh * 0.3], [kw * 0.66, kh * 0.1], [kw * 0.3, kh * 0.45], [-kw * 0.3, kh * 0.42]], 8),
    pelvis: smoothClosed(cx, ky, 1, [[-kw * 0.42, -kh * 0.05], [-kw * 0.3, -kh * 0.3], [-kw * 0.12, -kh * 0.12], [kw * 0.05, -kh * 0.34], [kw * 0.18, -kh * 0.1], [kw * 0.4, -kh * 0.2], [kw * 0.36, kh * 0.08], [kw * 0.1, kh * 0.3], [-kw * 0.2, kh * 0.26]], 8),
    scale: Array.from({ length: 6 }, (_, i) => P.line(cx - r * 0.78, y + r * (0.2 + i * 0.14), cx - r * 0.73, y + r * (0.2 + i * 0.14), 2)),
  };
};

/* ---------------------------------------------------------------------------------------------
 * Added for E09 (Nov 2026): a hospital report page with a real report layout (discharge summary
 * or histopathology report), a drawstring cloth bag (bag of words), a magnifying glass (keyword
 * search), a pile of books (training text) and a transformer layer stack. Checked on the
 * `kit-objects-9` still.
 * ------------------------------------------------------------------------------------------- */

/**
 * A printed hospital report, laid out as real ones are: a letterhead band across the top with a
 * round logo (a cross inside) and room for the hospital's name; a centred title rule; a
 * patient-details box ruled into two columns of three fields (field name as a short dark stub,
 * value as a longer light line); then sections, each a short bold heading stub over 2–3 body
 * lines; and a signature line with a stamp circle at the bottom right. Box w × h, top-left (x, y).
 * Text the caller writes: `nameAt` (hospital name, white on the band), `titleAt` (e.g.
 * "DISCHARGE SUMMARY"), `sectionAt[i]` (left end of section i's heading), `bodyAt[i]` (left end
 * of its first body line, for a highlighted sentence). Wash `band` blue, `details` pale.
 * Text drawn on it is a label: keep it ≥ 36 px in a 16:9 picture, so write only the name, title and
 * one or two key words; the rest stays as ruled lines (it reads as text from across the room).
 */
export const reportSheet = (x: number, y: number, w: number, h: number, sections = 3) => {
  const bandH = h * 0.13, m = w * 0.07;
  const titleY = y + bandH + h * 0.075;
  const dY = titleY + h * 0.045, dH = h * 0.17, colW = (w - 2 * m) / 2;
  const fields = [0, 1, 2].flatMap((r) => [0, 1].map((c) => {
    const fy = dY + dH * (0.25 + r * 0.27), fx = x + m + c * colW + colW * 0.06;
    return [P.line(fx, fy, fx + colW * 0.24, fy, 4), P.line(fx + colW * 0.3, fy, fx + colW * (0.84 - ((r + c) % 3) * 0.1), fy, 6)];
  }));
  const sTop = dY + dH + h * 0.05, sGap = (y + h * 0.84 - sTop) / sections;
  const secs = Array.from({ length: sections }, (_, i) => {
    const sy = sTop + i * sGap;
    const nLines = i === 0 ? 2 : 3;
    return {
      head: P.line(x + m, sy, x + m + w * (0.22 + (i % 2) * 0.08), sy, 6),
      body: Array.from({ length: nLines }, (_, j) => P.line(x + m, sy + sGap * (0.28 + j * 0.22), x + w - m - ((i + j) % 3) * w * 0.12, sy + sGap * (0.28 + j * 0.22), 10)),
      at: [x + m, sy] as Pt,
      bodyAt: [x + m, sy + sGap * 0.28] as Pt,
    };
  });
  const lr = bandH * 0.32, lx = x + m + lr, ly = y + bandH / 2;
  return {
    sheet: P.rect(x, y, w, h, 4),
    band: P.rect(x, y, w, bandH, 4),
    logo: P.ellipse(lx, ly, lr, lr),
    logoCross: [P.line(lx, ly - lr * 0.6, lx, ly + lr * 0.6, 4), P.line(lx - lr * 0.6, ly, lx + lr * 0.6, ly, 4)],
    titleRule: P.line(x + w * 0.25, titleY + h * 0.018, x + w * 0.75, titleY + h * 0.018, 8),
    details: P.rect(x + m, dY, w - 2 * m, dH, 4),
    detailsMid: P.line(x + m + colW, dY + dH * 0.1, x + m + colW, dY + dH * 0.9, 6),
    fields: fields.flat(),
    sectionHeads: secs.map((s) => s.head),
    sectionBodies: secs.flatMap((s) => s.body),
    signature: P.polyline([[x + w * 0.6, y + h * 0.93], [x + w * 0.66, y + h * 0.9], [x + w * 0.7, y + h * 0.93], [x + w * 0.75, y + h * 0.89], [x + w * 0.8, y + h * 0.925]], 8),
    signRule: P.line(x + w * 0.56, y + h * 0.945, x + w - m, y + h * 0.945, 8),
    stamp: P.ellipse(x + m + w * 0.1, y + h * 0.915, w * 0.08, w * 0.08),
    nameAt: [lx + lr * 1.6, ly + bandH * 0.13] as Pt,
    titleAt: [x + w / 2, titleY] as Pt,
    sectionAt: secs.map((s) => s.at),
    bodyAt: secs.map((s) => s.bodyAt),
  };
};

/**
 * A cloth drawstring bag, standing: a rounded sack wider at the bottom, the gathered neck with
 * folds, the cord tied in a bow. Local box 260 × 300, top-left (x, y), scale s. `mouth` is the
 * point where things drop in. Wash `sack` a hessian colour.
 */
export const clothBag = (x: number, y: number, s = 1) => ({
  sack: smoothClosed(x, y, s, [[95, 70], [60, 110], [25, 180], [20, 250], [60, 292], [130, 300], [200, 292], [240, 250], [235, 180], [200, 110], [165, 70], [130, 78]], 10),
  neck: smoothClosed(x, y, s, [[92, 70], [80, 40], [105, 22], [130, 30], [155, 22], [180, 40], [168, 70], [130, 78]], 8),
  folds: [P.line(x + 110 * s, y + 80 * s, x + 95 * s, y + 140 * s, 6), P.line(x + 150 * s, y + 80 * s, x + 165 * s, y + 140 * s, 6), P.line(x + 130 * s, y + 82 * s, x + 130 * s, y + 130 * s, 6)],
  cord: [P.quad(x + 88 * s, y + 66 * s, x + 130 * s, y + 84 * s, x + 172 * s, y + 66 * s, 14),
    P.ellipse(x + 112 * s, y + 92 * s, 18 * s, 10 * s, 0, Math.PI * 2, 18), P.ellipse(x + 148 * s, y + 92 * s, 18 * s, 10 * s, 0, Math.PI * 2, 18),
    P.line(x + 125 * s, y + 98 * s, x + 112 * s, y + 140 * s, 6), P.line(x + 135 * s, y + 98 * s, x + 150 * s, y + 138 * s, 6)],
  mouth: [x + 130 * s, y + 20 * s] as Pt,
});

/** A magnifying glass: the lens ring (wash `lens` pale blue, low alpha), rim and a handle to the lower right. Centre and lens radius. */
export const magnifier = (cx: number, cy: number, r: number) => {
  const a = Math.PI / 4, hx = cx + Math.cos(a) * r, hy = cy + Math.sin(a) * r;
  const L = r * 1.1, t = r * 0.16, dx = Math.cos(a), dy = Math.sin(a);
  return {
    lens: P.ellipse(cx, cy, r, r),
    rim: P.ellipse(cx, cy, r * 1.1, r * 1.1),
    glint: P.ellipse(cx, cy, r * 0.7, r * 0.7, -Math.PI * 0.85, -Math.PI * 0.55, 10),
    handle: P.polyline([[hx + dx * r * 0.1 - dy * t, hy + dy * r * 0.1 + dx * t], [hx + dx * L - dy * t, hy + dy * L + dx * t], [hx + dx * L + dy * t, hy + dy * L - dx * t], [hx + dx * r * 0.1 + dy * t, hy + dy * r * 0.1 - dx * t], [hx + dx * r * 0.1 - dy * t, hy + dy * r * 0.1 + dx * t]], 10),
  };
};

/**
 * A pile of three hardback books lying flat, slightly offset: each a cover slab with its page
 * block (pages as fine lines on the fore-edge) and a spine band. Local box 320 × 200, top-left
 * (x, y), scale s. `covers[i]` to wash in three colours, bottom book first.
 */
export const bookPile = (x: number, y: number, s = 1) => {
  const books = [[0, 140, 320], [20, 80, 280], [6, 22, 300]].map(([dx, dy, w]) => {
    const bx = x + dx * s, by = y + dy * s, bw = w * s, bh = 58 * s;
    return {
      cover: P.rect(bx, by, bw, bh, 6 * s),
      pages: P.rect(bx + bw * 0.06, by + bh * 0.2, bw * 0.9, bh * 0.6, 2),
      leaves: [0.35, 0.5, 0.65].map((u) => P.line(bx + bw * 0.08, by + bh * u, bx + bw * 0.94, by + bh * u, 10)),
      spine: P.line(bx + bw * 0.03, by + bh * 0.1, bx + bw * 0.03, by + bh * 0.9, 4),
    };
  });
  return { covers: books.map((b) => b.cover), pages: books.map((b) => b.pages), leaves: books.flatMap((b) => b.leaves), spines: books.map((b) => b.spine) };
};

/**
 * A transformer drawn as engineers draw it: a stack of n identical layer blocks, each split into
 * an attention band (top) and a feed-forward band, with an arrow up the left side between layers.
 * Box w × h for the whole stack, top-left (x, y); layer 0 is the bottom. `blocks[i]`, `attn[i]`
 * (wash it in the accent) and `centre(i)` per layer.
 */
export const layerStack = (x: number, y: number, w: number, h: number, n = 6) => {
  const gap = h * 0.04, lh = (h - gap * (n - 1)) / n;
  const top = (i: number) => y + h - (i + 1) * lh - i * gap;
  return {
    blocks: Array.from({ length: n }, (_, i) => P.rect(x, top(i), w, lh, 8)),
    attn: Array.from({ length: n }, (_, i) => P.rect(x + 6, top(i) + 5, w - 12, lh * 0.5 - 6, 5)),
    splits: Array.from({ length: n }, (_, i) => P.line(x + 6, top(i) + lh * 0.5, x + w - 6, top(i) + lh * 0.5, 8)),
    links: Array.from({ length: n - 1 }, (_, i) => P.line(x + w / 2, top(i), x + w / 2, top(i + 1) + lh, 3)),
    centre: (i: number): Pt => [x + w / 2, top(i) + lh / 2],
    attnAt: (i: number): Pt => [x + w / 2, top(i) + lh * 0.25],
  };
};

/** A curved attention arc between two points on one line of text, bowing up by `lift` (or down if negative). */
export const attentionArc = (x1: number, x2: number, y: number, lift: number): Pts =>
  P.quad(x1, y, (x1 + x2) / 2, y - lift * 2, x2, y, 28);

/* ---------------------------------------------------------------------------------------------
 * Added for E10 (Nov 2026): an open laptop seen from the front and a little above, and a server
 * rack (a hospital's own server, or "the cloud" made concrete). Checked on `kit-objects-10`.
 * ------------------------------------------------------------------------------------------- */

const quad = (a: Pt, b: Pt, c: Pt, d: Pt): Pts => P.polyline([a, b, c, d, a], 4);

/**
 * An open laptop, front view from slightly above. Box w × h: the lid is the top 0.6 h (bezel,
 * screen, webcam), the hinge, then the keyboard deck drawn in perspective (wider at the front):
 * five rows of keys, a space bar and a touchpad, and the thin front lip. `screenBox` is
 * [x, y, w, h] of the screen for labels; wash `lid` dark grey, `screen` a pale colour, `deck` light grey.
 */
export const laptop = (x: number, y: number, w: number, h: number) => {
  const lx = x + w * 0.1, lw = w * 0.8, lh = h * 0.6;
  const sx = lx + lw * 0.04, sy = y + lh * 0.07, sw = lw * 0.92, sh = lh * 0.86;
  const top = y + lh, bot = y + h * 0.95;
  const at = (u: number, v: number): Pt => {
    // u across (0..1), v from the hinge (0) to the front edge (1): the deck widens towards the front
    const yy = top + (bot - top) * v, half = (lw / 2) * (1 + v * 0.22);
    return [x + w / 2 - half + u * half * 2, yy];
  };
  const keys: Pts[] = [];
  for (let r = 0; r < 5; r++) {
    const v0 = 0.08 + r * 0.115, v1 = v0 + 0.09;
    const n = 12;
    for (let k = 0; k < n; k++) {
      const u0 = 0.06 + k * (0.88 / n), u1 = u0 + 0.88 / n - 0.012;
      keys.push(quad(at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)));
    }
  }
  return {
    lid: P.rect(lx, y, lw, lh, w * 0.02),
    screen: P.rect(sx, sy, sw, sh, w * 0.006),
    webcam: P.ellipse(lx + lw / 2, y + lh * 0.035, w * 0.006, w * 0.006),
    hinge: P.line(lx + lw * 0.02, top, lx + lw * 0.98, top, 4),
    deck: quad(at(0, 0), at(1, 0), at(1, 1), at(0, 1)),
    keys,
    space: quad(at(0.3, 0.66), at(0.7, 0.66), at(0.7, 0.75), at(0.3, 0.75)),
    touchpad: quad(at(0.36, 0.8), at(0.64, 0.8), at(0.64, 0.97), at(0.36, 0.97)),
    lip: P.line(at(0, 1)[0], bot + h * 0.03, at(1, 1)[0], bot + h * 0.03, 4),
    lipSides: [P.line(...at(0, 1), at(0, 1)[0], bot + h * 0.03, 2), P.line(...at(1, 1), at(1, 1)[0], bot + h * 0.03, 2)],
    screenBox: [sx, sy, sw, sh] as [number, number, number, number],
  };
};

/**
 * A server rack: a tall cabinet with a top vent and feet, mounting rails with screw holes, and
 * `units` rack servers stacked in it. Each server has a front panel with a row of drive bays on
 * the left, vent slots in the middle and status lights on the right (`leds`: wash them green).
 * Box w × h (cabinet). Wash `cabinet` near-black, `servers` mid-grey, `bays` darker.
 */
export const serverRack = (x: number, y: number, w: number, h: number, units = 5) => {
  const ix = x + w * 0.1, iw = w * 0.8, iy = y + h * 0.07, ih = h * 0.84;
  const uh = ih / units, gap = uh * 0.12;
  const servers = Array.from({ length: units }, (_, i) => P.rect(ix, iy + i * uh + gap / 2, iw, uh - gap, 4));
  const bays: Pts[] = [], vents: Pts[] = [], leds: Pts[] = [];
  for (let i = 0; i < units; i++) {
    const sy = iy + i * uh + gap / 2, sh = uh - gap;
    for (let k = 0; k < 4; k++) bays.push(P.rect(ix + iw * (0.05 + k * 0.1), sy + sh * 0.2, iw * 0.08, sh * 0.6, 2));
    for (let k = 0; k < 5; k++) vents.push(P.line(ix + iw * (0.5 + k * 0.05), sy + sh * 0.25, ix + iw * (0.5 + k * 0.05), sy + sh * 0.75, 3));
    for (let k = 0; k < 2; k++) leds.push(P.ellipse(ix + iw * (0.85 + k * 0.07), sy + sh * 0.5, iw * 0.018, iw * 0.018));
  }
  return {
    cabinet: P.rect(x, y, w, h, 6),
    topVent: [0, 1, 2, 3].map((k) => P.line(x + w * (0.3 + k * 0.13), y + h * 0.025, x + w * (0.36 + k * 0.13), y + h * 0.025, 3)),
    rails: [P.line(x + w * 0.06, iy, x + w * 0.06, iy + ih, 3), P.line(x + w * 0.94, iy, x + w * 0.94, iy + ih, 3)],
    holes: Array.from({ length: units * 2 }, (_, i) => [P.ellipse(x + w * 0.06, iy + (i + 0.5) * (ih / (units * 2)), 3, 3), P.ellipse(x + w * 0.94, iy + (i + 0.5) * (ih / (units * 2)), 3, 3)]).flat(),
    servers, bays, vents, leds,
    feet: [P.rect(x + w * 0.04, y + h, w * 0.14, h * 0.025, 2), P.rect(x + w * 0.82, y + h, w * 0.14, h * 0.025, 2)],
  };
};

/* ---------------------------------------------------------------------------------------------
 * Added for E11 (Nov 2026): the exam-hall desk (closed-book vs open-book exam), an open textbook,
 * a closed textbook, and a journal reference list (the fabricated-citation picture). Checked on
 * `kit-objects-11`.
 * ------------------------------------------------------------------------------------------- */

/**
 * A single exam-hall desk in three-quarter front view, as in Indian exam halls: a wooden top in
 * perspective (back edge narrower), the front edge's thickness, a book rack (open shelf) under
 * the top, four steel tube legs and a foot bar. Box w × h, top-left (x, y). `onTop(u, v)` maps
 * (0..1 across, 0 back .. 1 front) to a point on the top, `rack` is [x, y, w, h] of the shelf's
 * opening (put the closed book there). Wash `top` light wood, `edge` darker wood, `rackBack` dark.
 */
export const examDesk = (x: number, y: number, w: number, h: number) => {
  const backInset = w * 0.08, topH = h * 0.26, edgeH = h * 0.05;
  const bl: Pt = [x + backInset, y], br: Pt = [x + w - backInset, y], fr: Pt = [x + w, y + topH], fl: Pt = [x, y + topH];
  const onTop = (u: number, v: number): Pt => {
    const lx = bl[0] + (fl[0] - bl[0]) * v, rx = br[0] + (fr[0] - br[0]) * v;
    return [lx + (rx - lx) * u, y + topH * v];
  };
  const ey = y + topH + edgeH;
  const rx0 = x + w * 0.06, rw = w * 0.88, ry = ey, rh = h * 0.16;
  const legTop = ry + rh, legBot = y + h;
  const leg = (lx: number, back = false): Pts => P.rect(lx, back ? legTop - h * 0.04 : legTop, w * 0.025, (back ? legBot - h * 0.08 : legBot) - (back ? legTop - h * 0.04 : legTop), 3);
  return {
    top: P.polyline([bl, br, fr, fl, bl], 6),
    edge: P.rect(x, y + topH, w, edgeH, 3),
    grain: [0.3, 0.55, 0.8].map((v) => P.line(...onTop(0.06, v), ...onTop(0.94 - v * 0.1, v), 12)),
    rack: [rx0, ry, rw, rh] as [number, number, number, number],
    rackBox: P.rect(rx0, ry, rw, rh, 2),
    rackBack: P.rect(rx0 + w * 0.02, ry + rh * 0.12, rw - w * 0.04, rh * 0.76, 2),
    legs: [leg(x + w * 0.04), leg(x + w * 0.935), leg(x + w * 0.13, true), leg(x + w * 0.845, true)],
    footBar: P.line(x + w * 0.05, legBot - h * 0.12, x + w * 0.95, legBot - h * 0.12, 12),
    feet: [P.rect(x + w * 0.03, legBot - 4, w * 0.045, 8, 3), P.rect(x + w * 0.925, legBot - 4, w * 0.045, 8, 3)],
    onTop,
  };
};

/**
 * A closed hardback textbook, front cover facing us, lying flat-ish: cover, a spine band on the
 * left, the page block showing along the right and bottom edges (thickness), a title panel and two
 * title rules. Box w × h. Wash `cover` a book colour, `pageBlock` cream, `panel` lighter.
 */
export const closedBook = (x: number, y: number, w: number, h: number) => {
  const t = Math.min(w, h) * 0.06;
  return {
    pageBlock: P.polyline([[x + w, y + t], [x + w + t, y + t * 1.6], [x + w + t, y + h + t * 0.6], [x + t, y + h + t * 0.6], [x, y + h], [x + w, y + h], [x + w, y + t]], 6),
    pageLines: [0.3, 0.55, 0.8].map((u) => P.line(x + w + t * u, y + t * (1 + u * 0.6), x + w + t * u, y + h + t * u * 0.6, 10)),
    cover: P.rect(x, y, w, h, 4),
    spine: P.rect(x, y, w * 0.12, h, 3),
    spineBands: [0.15, 0.85].map((v) => P.line(x + w * 0.01, y + h * v, x + w * 0.11, y + h * v, 6)),
    panel: P.rect(x + w * 0.24, y + h * 0.16, w * 0.64, h * 0.3, 4),
    rules: [0.58, 0.66].map((v) => P.line(x + w * 0.3, y + h * v, x + w * 0.82, y + h * v, 10)),
    titleAt: [x + w * 0.56, y + h * 0.33] as Pt,
  };
};

/**
 * An open textbook seen from above and in front: two pages whose top and bottom edges curve down
 * into the gutter, the page stacks fanning at the outer edges, the cover showing beneath, and on
 * each page a heading bar and ruled text lines that follow the page curve. Box w × h.
 * `line(side, i)` is text line i on page side 0 (left) or 1 (right) as a stroke (wash a fat copy of
 * it to highlight the passage); `lineBox(side, i)` gives [cx, cy, w] for a highlight.
 */
export const openBook = (x: number, y: number, w: number, h: number, nLines = 9) => {
  const gx = x + w / 2, sag = h * 0.06, top = y + sag, bot = y + h - sag * 0.6;
  const pageEdge = (x0: number, x1: number, yy: number, dir: 1 | -1): Pts =>
    // a page edge: flat at the outer side, curving down (dir) into the gutter
    cubic([x0, yy], [x0 + (x1 - x0) * 0.6, yy - sag * 0.4], [x1 - (x1 - x0) * 0.08, yy - sag * 0.2], [x1, yy + sag * dir], 24);
  const leftTop = pageEdge(x + w * 0.02, gx, top, 1), rightTop = pageEdge(x + w * 0.98, gx, top, 1);
  const leftBot = pageEdge(x + w * 0.02, gx, bot, 1), rightBot = pageEdge(x + w * 0.98, gx, bot, 1);
  const page = (t: Pts, b: Pts): Pts => [...t, ...[...b].reverse(), t[0]];
  const lineY = (i: number) => top + h * 0.2 + i * ((bot - top - h * 0.28) / (nLines - 1));
  const textLine = (side: 0 | 1, i: number): Pts => {
    const xa = side === 0 ? x + w * 0.07 : gx + w * 0.05, xb = side === 0 ? gx - w * 0.05 : x + w * 0.93;
    const yy = lineY(i), short = i % 4 === 3 ? 0.65 : 1;
    const xe = side === 0 ? xa + (xb - xa) * short : xb;
    const xs = side === 0 ? xa : xb - (xb - xa) * short;
    const dip = (px: number) => yy + sag * 0.5 * Math.pow(1 - Math.abs(px - gx) / (w / 2), 3);
    return Array.from({ length: 17 }, (_, k) => { const px = xs + (xe - xs) * (k / 16); return [px, dip(px)] as Pt; });
  };
  return {
    cover: P.polyline([[x - w * 0.015, top + sag * 0.2], [x + w * 1.015, top + sag * 0.2], [x + w * 1.015, bot + sag * 0.9], [gx, bot + sag * 1.4], [x - w * 0.015, bot + sag * 0.9], [x - w * 0.015, top + sag * 0.2]], 8),
    stacks: [1, 2, 3].flatMap((k) => [
      P.line(x + w * 0.02 - k * 3, top + k * 3, x + w * 0.02 - k * 3, bot + k * 3, 12),
      P.line(x + w * 0.98 + k * 3, top + k * 3, x + w * 0.98 + k * 3, bot + k * 3, 12),
    ]),
    left: page(leftTop, leftBot),
    right: page(rightTop, rightBot),
    gutter: P.line(gx, top + sag, gx, bot + sag, 16),
    heads: [P.rect(x + w * 0.07, top + h * 0.06, w * 0.26, h * 0.06, 3), P.rect(gx + w * 0.05, top + h * 0.06, w * 0.2, h * 0.06, 3)],
    figure: P.rect(gx + w * 0.26, top + h * 0.05, w * 0.18, h * 0.16, 3),
    lines: [0, 1].flatMap((side) => Array.from({ length: nLines }, (_, i) => textLine(side as 0 | 1, i))),
    line: textLine,
    lineBox: (side: 0 | 1, i: number): [number, number, number] =>
      [side === 0 ? (x + w * 0.07 + gx - w * 0.05) / 2 : (gx + w * 0.05 + x + w * 0.93) / 2, lineY(i) + sag * 0.15, w * 0.4],
  };
};

/**
 * A journal article page at its reference list: a sheet with the journal's running head (a thin
 * coloured band with a rule), a two-column body above, the "References" heading rule, and `n`
 * numbered entry slots. `entry(i)` is [x, y] of entry i's first baseline (put the typeset citation
 * there, about 0.9 × w wide, two lines per entry); `number(i)` is where the "[i]" goes. Box w × h.
 */
export const journalPage = (x: number, y: number, w: number, h: number, n = 3) => {
  const bodyTop = y + h * 0.1, refTop = y + h * 0.36, step = (h * 0.6) / n;
  const col = (cx0: number, cx1: number) => [0, 1, 2, 3].map((k) => P.line(cx0, bodyTop + h * 0.04 + k * h * 0.045, cx1 - (k === 3 ? (cx1 - cx0) * 0.35 : 0), bodyTop + h * 0.04 + k * h * 0.045, 10));
  return {
    sheet: P.rect(x, y, w, h, 4),
    head: P.rect(x, y, w, h * 0.06, 4),
    headRule: P.line(x + w * 0.04, y + h * 0.075, x + w * 0.96, y + h * 0.075, 16),
    body: [...col(x + w * 0.05, x + w * 0.48), ...col(x + w * 0.52, x + w * 0.95)],
    refRule: P.line(x + w * 0.05, refTop, x + w * 0.95, refTop, 16),
    refHeadAt: [x + w * 0.05, refTop - h * 0.02] as Pt,
    entry: (i: number): Pt => [x + w * 0.1, refTop + h * 0.1 + i * step],
    number: (i: number): Pt => [x + w * 0.05, refTop + h * 0.1 + i * step],
    slot: (i: number): [number, number, number, number] => [x + w * 0.03, refTop + h * 0.015 + i * step, w * 0.94, step * 0.9],
  };
};

/* ---------------------------------------------------------------------------------------------
 * Page 12 (E12, Nov 2026): a chat app window, a patient information leaflet and an MCQ exam sheet.
 * Checked on the `kit-objects-12` still (ObjectsDemo12).
 * ------------------------------------------------------------------------------------------- */

/**
 * A desktop chat-assistant window, as people see it: rounded window frame, a title bar with the
 * three window buttons (close, minimise, zoom) and the assistant's round avatar beside a name
 * slot, a thin scroll bar on the right, and at the bottom a rounded message box with a round send
 * button holding an up arrow. Box w × h. `body` is [x, y, w, h] of the conversation area (place
 * bubbles there); `nameAt` is the baseline start of the assistant's name; `inputAt` the baseline
 * start of text typed in the message box. Wash `titleBar` light grey, `send` the accent.
 */
export const chatWindow = (x: number, y: number, w: number, h: number) => {
  const tb = Math.max(46, h * 0.09), ib = Math.max(64, h * 0.13), m = w * 0.03;
  const bx = x + m, bw = w - 2 * m, iy = y + h - ib + ib * 0.14, ih = ib * 0.66;
  const sr = ih * 0.36, scx = x + w - m - sr - ih * 0.15, scy = iy + ih / 2;
  const ar = tb * 0.3, ax = x + w * 0.2, ay = y + tb / 2;
  return {
    frame: P.rect(x, y, w, h, 16),
    titleBar: P.rect(x, y, w, tb, 16),
    titleRule: P.line(x, y + tb, x + w, y + tb, 16),
    buttons: [0, 1, 2].map((i) => P.ellipse(x + 26 + i * 26, y + tb / 2, 8, 8)),
    avatar: P.ellipse(ax, ay, ar, ar),
    spark: [P.line(ax, ay - ar * 0.55, ax, ay + ar * 0.55, 4), P.line(ax - ar * 0.55, ay, ax + ar * 0.55, ay, 4),
      P.line(ax - ar * 0.35, ay - ar * 0.35, ax + ar * 0.35, ay + ar * 0.35, 4), P.line(ax - ar * 0.35, ay + ar * 0.35, ax + ar * 0.35, ay - ar * 0.35, 4)],
    nameAt: [ax + ar * 1.7, ay + tb * 0.16] as Pt,
    scroll: P.rect(x + w - 12, y + tb + 14, 5, (h - tb - ib) * 0.35, 3),
    body: [bx, y + tb + 12, bw - 14, h - tb - ib - 18] as [number, number, number, number],
    input: P.rect(bx, iy, bw, ih, ih / 2),
    send: P.ellipse(scx, scy, sr, sr),
    sendArrow: [P.line(scx, scy + sr * 0.5, scx, scy - sr * 0.5, 4), P.polyline([[scx - sr * 0.4, scy - sr * 0.1], [scx, scy - sr * 0.5], [scx + sr * 0.4, scy - sr * 0.1]], 4)],
    inputAt: [bx + ih * 0.45, scy + ih * 0.13] as Pt,
  };
};

/**
 * A printed patient information leaflet, A4 portrait, folded once (a faint vertical crease): a
 * coloured header band with the hospital's round logo (a cross), a title slot, a pictogram panel
 * with a tablet (a round pill with its score line) and a glass of water, `sections` headed
 * sections each with a heading bar and bullet dots, and a footer band with a phone handset for
 * "questions? call us" (or a warning line). `pic` is the pictogram panel's share of h (0.1 when the
 * leaflet carries four or more lines a section at 36 px: E12 found 0.14 left headings overlapping). Box w × h. `titleAt` is the centre of the title; `headAt(i)` the start of
 * section i's heading at the bar's middle (add 0.35 × size for a baseline); `crease` is optional
 * (it crosses the text, so most pictures leave it out); `bulletAt(i, j)` the baseline start of bullet j's text (dot to
 * its left); `footAt` the footer text start. Wash `band`/`footer` a hospital colour, `heads` pale.
 */
export const leaflet = (x: number, y: number, w: number, h: number, sections = 3, bullets = 2, pic = 0.14) => {
  const bandH = h * 0.12, m = w * 0.07, footH = h * 0.08;
  const lr = bandH * 0.3, lx = x + m + lr, ly = y + bandH / 2;
  const picY = y + bandH + h * 0.03, picH = h * pic;
  const sTop = picY + picH + h * 0.035, sH = (y + h - footH - h * 0.02 - sTop) / sections;
  const headH = sH * 0.3;
  const headAt = (i: number): Pt => [x + m + w * 0.03, sTop + i * sH + headH / 2];
  const bulletAt = (i: number, j: number): Pt => [x + m + w * 0.07, sTop + i * sH + headH + (j + 0.72) * ((sH * 0.68) / bullets)];
  const pcx = x + w * 0.32, pcy = picY + picH / 2, pr = picH * 0.3;
  const gx = x + w * 0.6, gw = picH * 0.42, gy = picY + picH * 0.14, gh = picH * 0.72;
  const hx = x + m + 6, hy = y + h - footH / 2;
  return {
    sheet: P.rect(x, y, w, h, 4),
    crease: P.line(x + w / 2, y + bandH + 4, x + w / 2, y + h - footH - 4, 20),
    band: P.rect(x, y, w, bandH, 4),
    logo: P.ellipse(lx, ly, lr, lr),
    logoCross: [P.line(lx, ly - lr * 0.6, lx, ly + lr * 0.6, 4), P.line(lx - lr * 0.6, ly, lx + lr * 0.6, ly, 4)],
    titleAt: [x + w / 2 + lr, ly + bandH * 0.13] as Pt,
    picture: P.rect(x + m, picY, w - 2 * m, picH, 10),
    pill: P.ellipse(pcx, pcy, pr, pr),
    pillScore: P.line(pcx - pr * 0.7, pcy, pcx + pr * 0.7, pcy, 4),
    glass: P.polyline([[gx, gy], [gx + gw, gy], [gx + gw * 0.86, gy + gh], [gx + gw * 0.14, gy + gh], [gx, gy]], 6),
    water: P.polyline([[gx + gw * 0.04, gy + gh * 0.3], [gx + gw * 0.96, gy + gh * 0.3], [gx + gw * 0.86, gy + gh], [gx + gw * 0.14, gy + gh], [gx + gw * 0.04, gy + gh * 0.3]], 6),
    heads: Array.from({ length: sections }, (_, i) => P.rect(x + m, sTop + i * sH, w - 2 * m, headH, 6)),
    dots: Array.from({ length: sections }, (_, i) => Array.from({ length: bullets }, (_, j) => {
      const [bx, by] = bulletAt(i, j);
      return P.ellipse(bx - w * 0.035, by - h * 0.008, 6, 6);
    })).flat(),
    footer: P.rect(x, y + h - footH, w, footH, 4),
    phone: P.polyline([[hx, hy - 12], [hx + 6, hy - 16], [hx + 10, hy - 10], [hx + 6, hy - 4], [hx + 12, hy + 6], [hx + 18, hy + 2], [hx + 24, hy + 6], [hx + 20, hy + 12], [hx + 10, hy + 10], [hx, hy - 2], [hx, hy - 12]], 4),
    headAt, bulletAt,
    footAt: [hx + 40, hy + footH * 0.16] as Pt,
  };
};

/**
 * A single-best-answer MCQ exam sheet: the paper with a dog-ear, a header box (exam name) with a
 * marks box at its right, the question number in a circle, `stem` lines of the question, and four
 * options A–D, each with an OMR answer bubble (a circle you fill in) and a text slot. Box w × h.
 * `stemAt(i)` is the baseline start of stem line i; `opt(k)` gives { bubble: [cx, cy, r],
 * textAt } for option k; `qAt` the centre of the question-number circle; `titleAt` the header
 * centre. Fill `bubble(k)` (a closed circle) to mark the answer. Pass `minGap` ≈ 1.25 × the text
 * size: the stem gap scales with h, and at 48 px on a 580-high Short the lines overlapped (E12S3).
 */
export const mcqSheet = (x: number, y: number, w: number, h: number, stem = 3, minGap = 0) => {
  const m = w * 0.06, hdH = h * 0.1, top = y + h * 0.03 + hdH + Math.max(h * 0.08, 64);
  const lineGap = Math.max(h * 0.075, minGap), optTop = top + stem * lineGap + h * 0.04, optGap = (y + h - h * 0.05 - optTop) / 4;
  const br = Math.min(optGap * 0.28, w * 0.03);
  const qr = Math.min(h * 0.035, 28), qx = x + m + qr, qy = top - 12;
  const opt = (k: number) => {
    const cy = optTop + k * optGap + optGap * 0.42, cx = x + m * 1.9 + br;
    return { bubble: [cx, cy, br] as [number, number, number], textAt: [cx + br * 2.2, cy + br * 0.45] as Pt };
  };
  return {
    sheet: path(0, 0, 1, [x, y], [[[x + w * 0.4, y], [x + w * 0.7, y], [x + w - 34, y]], [[x + w - 20, y + 10], [x + w - 10, y + 22], [x + w, y + 34]], [[x + w, y + h * 0.4], [x + w, y + h * 0.7], [x + w, y + h]], [[x + w * 0.7, y + h], [x + w * 0.3, y + h], [x, y + h]], [[x, y + h * 0.7], [x, y + h * 0.3], [x, y]]]),
    ear: P.polyline([[x + w - 34, y], [x + w - 34, y + 34], [x + w, y + 34]], 8),
    header: P.rect(x + m, y + h * 0.03, w - 2 * m - w * 0.16, hdH, 4),
    marks: P.rect(x + w - m - w * 0.13, y + h * 0.03, w * 0.13, hdH, 4),
    titleAt: [x + m + (w - 2 * m - w * 0.16) / 2, y + h * 0.03 + hdH * 0.66] as Pt,
    marksAt: [x + w - m - w * 0.065, y + h * 0.03 + hdH * 0.66] as Pt,
    qCircle: P.ellipse(qx, qy, qr, qr),
    qAt: [qx, qy] as Pt,
    stemAt: (i: number): Pt => [x + m + qr * 2.8, top + i * lineGap],
    bubbles: [0, 1, 2, 3].map((k) => { const [cx, cy, r] = opt(k).bubble; return P.ellipse(cx, cy, r, r); }),
    bubble: (k: number) => { const [cx, cy, r] = opt(k).bubble; return P.ellipse(cx, cy, r * 0.72, r * 0.72); },
    opt,
  };
};

/* ---------------------------------------------------------------------------------------------
 * Page 13 (E13, Nov 2026): an OPD consultation desk with a phone recording on a stand, a seated
 * patient, an EHR clinic note (an AI draft with Sign and Edit buttons), a tumour-board meeting
 * room, and a USB-C plug. Checked on the `kit-objects-13` still (ObjectsDemo13).
 * ------------------------------------------------------------------------------------------- */

/**
 * An outpatient (OPD) consultation desk, front view from slightly above, as an Indian OPD looks:
 * the desk top drawn in perspective (narrower at the back), its front edge, a modesty panel, a
 * drawer pedestal on the left (three drawers with handles) and a leg on the right. On the desk: a
 * smartphone standing in a small stand, recording (a red dot, a waveform of bars, a mic glyph at
 * the bottom of the screen), a prescription pad with ruled lines and a pen lying beside it. Box
 * w × h (desk top front edge at 0.46 h). Wash `top` wood, `panel`/`pedestal` a darker wood, `screen`
 * near-black, `rec` red, `pad` white. `phoneBox` is [x, y, w, h] of the phone; `deskTopY` the front
 * edge; `seat` is where a patient's stool goes (right of the desk, at floor level).
 */
export const opdDesk = (x: number, y: number, w: number, h: number) => {
  const ty = y + h * 0.46, th = h * 0.05, back = y + h * 0.36, inset = w * 0.05;
  const px = x + w * 0.6, pw = w * 0.1, ph = h * 0.28, py = back + h * 0.02 - ph;
  const sx = px + pw * 0.08, sy = py + ph * 0.06, sw = pw * 0.84, sh = ph * 0.86;
  const wy = sy + sh * 0.5, bars = 9;
  const mx = sx + sw / 2, my = sy + sh * 0.8;
  const padQ: Pts = [[x + w * 0.2, back + h * 0.02], [x + w * 0.42, back + h * 0.02], [x + w * 0.44, ty - h * 0.015], [x + w * 0.18, ty - h * 0.015], [x + w * 0.2, back + h * 0.02]];
  const pedX = x + w * 0.04, pedW = w * 0.3, pedTop = ty + th, pedH = y + h - pedTop;
  return {
    top: [[x + inset, back], [x + w - inset, back], [x + w, ty], [x, ty], [x + inset, back]] as Pts,
    edge: P.rect(x, ty, w, th, 3),
    panel: P.rect(x + w * 0.34, ty + th, w * 0.56, h * 0.3, 2),
    pedestal: P.rect(pedX, pedTop, pedW, pedH, 3),
    drawers: [0, 1, 2].map((i) => P.rect(pedX + pedW * 0.06, pedTop + pedH * (0.05 + i * 0.31), pedW * 0.88, pedH * 0.27, 3)),
    handles: [0, 1, 2].map((i) => P.line(pedX + pedW * 0.38, pedTop + pedH * (0.18 + i * 0.31), pedX + pedW * 0.62, pedTop + pedH * (0.18 + i * 0.31), 4)),
    leg: P.rect(x + w * 0.9, ty + th, w * 0.05, y + h - ty - th, 2),
    stand: P.polyline([[px - pw * 0.15, back + h * 0.03], [px + pw * 0.5, back - h * 0.03], [px + pw * 1.15, back + h * 0.03], [px - pw * 0.15, back + h * 0.03]], 4),
    phone: P.rect(px, py, pw, ph, pw * 0.14),
    screen: P.rect(sx, sy, sw, sh, pw * 0.05),
    rec: P.ellipse(sx + sw * 0.5, sy + sh * 0.16, sw * 0.12, sw * 0.12),
    wave: Array.from({ length: bars }, (_, i) => {
      const bx = sx + sw * (0.12 + (0.76 * i) / (bars - 1)), a = sh * [0.04, 0.1, 0.16, 0.08, 0.2, 0.12, 0.17, 0.07, 0.04][i];
      return P.line(bx, wy - a, bx, wy + a, 3);
    }),
    mic: [P.rect(mx - sw * 0.1, my - sh * 0.12, sw * 0.2, sh * 0.13, sw * 0.1), P.ellipse(mx, my - sh * 0.04, sw * 0.18, sh * 0.06, 0, Math.PI, 12), P.line(mx, my + sh * 0.02, mx, my + sh * 0.07, 2), P.line(mx - sw * 0.1, my + sh * 0.07, mx + sw * 0.1, my + sh * 0.07, 2)],
    pad: padQ,
    padLines: [0, 1, 2, 3].map((i) => {
      const v = 0.25 + i * 0.18, yy = back + h * 0.02 + (ty - h * 0.015 - back - h * 0.02) * v;
      return P.line(x + w * (0.215 - v * 0.02), yy, x + w * (0.4 + v * 0.02), yy, 4);
    }),
    pen: P.line(x + w * 0.46, ty - h * 0.02, x + w * 0.53, back + h * 0.03, 4),
    phoneBox: [px, py, pw, ph] as [number, number, number, number],
    recAt: [sx + sw * 0.5, sy + sh * 0.16] as Pt,
    deskTopY: ty,
    seat: [x + w * 1.12, y + h] as Pt,
  };
};

/**
 * A person seated on a round OPD stool, side view, facing left (dir = 1) or right (dir = -1):
 * head, torso, upper arm and forearm resting on the thigh, thigh, shin, foot, and the stool (seat
 * disc and three legs). (x, y) is the floor point under the stool's centre; s scales (s = 1 is
 * about 300 tall). Closed `head`, `seat` for washes.
 */
export const seatedPerson = (x: number, y: number, s = 1, dir = 1) => {
  const X = (u: number) => x - dir * u * s, Y = (v: number) => y - v * s;
  return {
    head: P.ellipse(X(-6), Y(262), 24 * s, 27 * s),
    body: [P.line(X(0), Y(232), X(6), Y(124), 8)],
    arm: [P.line(X(2), Y(212), X(26), Y(160), 6), P.line(X(26), Y(160), X(66), Y(132), 6)],
    leg: [P.line(X(6), Y(124), X(76), Y(122), 8), P.line(X(76), Y(122), X(82), Y(14), 8), P.line(X(82), Y(14), X(106), Y(10), 6)],
    seat: P.ellipse(X(6), Y(112), 42 * s, 9 * s),
    stoolLegs: [P.line(X(-24), Y(106), X(-36), Y(0), 6), P.line(X(36), Y(106), X(48), Y(0), 6), P.line(X(6), Y(104), X(6), Y(0), 6)],
  };
};

/**
 * An electronic health record clinic note, as an AI scribe leaves it for the doctor: a window
 * frame and title bar, a patient banner (a round photo placeholder and two placeholder bars, no
 * real identifier), an "AI draft" ribbon at the top right, `sections` sections (SOAP: S, O, A, P)
 * each with a coloured letter tab on the left and `rows` text-row slots, and at the bottom two
 * buttons, Edit and Sign. Box w × h. `tabAt(i)` is the centre of section i's tab; `rowAt(i, j)` the
 * baseline start of row j's text; `ribbonAt`, `editAt`, `signAt` centres; `rowBox(i, j)` is
 * [x, y, w, h] of a row's slot (for a highlight or a red strike).
 */
export const ehrNote = (x: number, y: number, w: number, h: number, sections = 4, rows = 2) => {
  const tb = Math.max(44, h * 0.07), bn = h * 0.11, foot = h * 0.13, m = w * 0.03;
  const top = y + tb + bn + h * 0.02, secH = (y + h - foot - top) / sections, tabW = Math.min(w * 0.09, secH * 0.8);
  const rowH = (secH * 0.86) / rows;
  const rowX = x + m + tabW + w * 0.03, rowW = w - (rowX - x) - m;
  const rowBox = (i: number, j: number): [number, number, number, number] => [rowX, top + i * secH + secH * 0.07 + j * rowH, rowW, rowH * 0.9];
  const btnY = y + h - foot + foot * 0.2, btnH = foot * 0.6, bw = w * 0.24;
  const cx = x + m + bn * 0.4, cy = y + tb + bn / 2;
  return {
    frame: P.rect(x, y, w, h, 12),
    titleBar: P.rect(x, y, w, tb, 12),
    titleRule: P.line(x, y + tb, x + w, y + tb, 12),
    banner: P.rect(x + m * 0.5, y + tb + 6, w - m, bn - 12, 6),
    photo: P.ellipse(cx, cy, bn * 0.3, bn * 0.3),
    photoHead: P.ellipse(cx, cy - bn * 0.06, bn * 0.1, bn * 0.1),
    photoBody: P.ellipse(cx, cy + bn * 0.2, bn * 0.18, bn * 0.12, Math.PI, 2 * Math.PI, 12),
    idBars: [P.rect(cx + bn * 0.5, cy - bn * 0.2, w * 0.26, bn * 0.14, 4), P.rect(cx + bn * 0.5, cy + bn * 0.06, w * 0.18, bn * 0.14, 4)],
    ribbon: P.rect(x + w * 0.66, y + tb + bn * 0.22, w * 0.3, bn * 0.56, bn * 0.28),
    ribbonAt: [x + w * 0.81, y + tb + bn * 0.5] as Pt,
    tabs: Array.from({ length: sections }, (_, i) => P.rect(x + m, top + i * secH + secH * 0.08, tabW, secH * 0.84, 6)),
    tabAt: (i: number): Pt => [x + m + tabW / 2, top + i * secH + secH / 2],
    rules: Array.from({ length: sections - 1 }, (_, i) => P.line(x + m, top + (i + 1) * secH, x + w - m, top + (i + 1) * secH, 12)),
    rowAt: (i: number, j: number): Pt => { const [bx, by, , bh] = rowBox(i, j); return [bx + 8, by + bh * 0.72]; },
    rowBox,
    edit: P.rect(x + w - m - bw * 2.15, btnY, bw, btnH, btnH / 2),
    sign: P.rect(x + w - m - bw, btnY, bw, btnH, btnH / 2),
    editAt: [x + w - m - bw * 1.65, btnY + btnH / 2] as Pt,
    signAt: [x + w - m - bw / 2, btnY + btnH / 2] as Pt,
    titleAt: [x + w * 0.05, y + tb * 0.68] as Pt,
  };
};

/**
 * A tumour-board meeting: a wall screen (bezel and two panels: on the left an axial CT slice of the
 * abdomen with the body outline, a vertebra, the liver and a round lesion in it; on the right a
 * histology field with tumour glands), a long table in perspective, five attendees seen from the
 * front across the table (head and shoulders, with a laptop or papers in front of two), and two
 * seen from behind on the near side. Box w × h; the screen fills the top 0.42 h. Wash `ctField`
 * near-black, `body` grey, `liver` mid-grey, `lesion` darker, `histo` pink, `glands` purple,
 * `table` wood. `ctBox`, `histoBox` are [x, y, w, h] of the panels; `lesionAt` the lesion centre.
 */
export const tumourBoard = (x: number, y: number, w: number, h: number) => {
  const scx = x + w * 0.2, scw = w * 0.6, scy = y, sch = h * 0.4;
  const pad = scw * 0.03, pw = (scw - pad * 3) / 2, ph = sch - pad * 2;
  const ct: [number, number, number, number] = [scx + pad, scy + pad, pw, ph];
  const hi: [number, number, number, number] = [scx + pad * 2 + pw, scy + pad, pw, ph];
  const ccx = ct[0] + pw / 2, ccy = ct[1] + ph / 2, rx = pw * 0.42, ry = ph * 0.34;
  const hcx = hi[0] + pw / 2, hcy = hi[1] + ph / 2, hr = Math.min(pw, ph) * 0.46;
  const tTop = y + h * 0.62, tBot = y + h * 0.8;
  const head = (cx: number, cy: number, r: number) => ({
    head: P.ellipse(cx, cy, r, r * 1.12),
    shoulders: P.ellipse(cx, cy + r * 2.3, r * 1.9, r * 1.2, Math.PI, 2 * Math.PI, 16),
  });
  const far = [0.16, 0.33, 0.5, 0.67, 0.84].map((u) => head(x + w * u, tTop - h * 0.15, h * 0.055));
  const near = [0.3, 0.7].map((u) => head(x + w * u, tBot + h * 0.08, h * 0.06));
  return {
    bezel: P.rect(scx, scy, scw, sch, 8),
    ctField: P.rect(...ct, 4),
    histoField: P.rect(...hi, 4),
    body: P.ellipse(ccx, ccy, rx, ry),
    vertebra: P.ellipse(ccx, ccy + ry * 0.55, rx * 0.13, ry * 0.2),
    liver: smoothClosed(ccx - rx * 0.38, ccy - ry * 0.12, rx / 190, [[-50, -45], [10, -55], [45, -30], [30, 10], [-10, 35], [-50, 30], [-62, -5]], 6),
    lesion: P.ellipse(ccx - rx * 0.36, ccy - ry * 0.2, rx * 0.08, rx * 0.075),
    lesionAt: [ccx - rx * 0.36, ccy - ry * 0.2] as Pt,
    histo: P.ellipse(hcx, hcy, hr, hr),
    glands: [[-0.45, -0.3], [0.1, -0.5], [0.45, -0.1], [-0.2, 0.2], [0.3, 0.45], [-0.5, 0.45]].map(([u, v], i) => P.ellipse(hcx + u * hr, hcy + v * hr, hr * (0.17 + (i % 2) * 0.05), hr * 0.13, 0, 2 * Math.PI, 24)),
    lumens: [[-0.45, -0.3], [0.1, -0.5], [0.45, -0.1], [-0.2, 0.2], [0.3, 0.45], [-0.5, 0.45]].map(([u, v]) => P.ellipse(hcx + u * hr, hcy + v * hr, hr * 0.06, hr * 0.04)),
    table: [[x + w * 0.08, tTop], [x + w * 0.92, tTop], [x + w, tBot], [x, tBot], [x + w * 0.08, tTop]] as Pts,
    tableEdge: P.rect(x, tBot, w, h * 0.03, 2),
    far: far.map((p) => [p.head, p.shoulders]).flat(),
    farHeads: far.map((p) => p.head),
    near: near.map((p) => [p.head, p.shoulders]).flat(),
    nearHeads: near.map((p) => p.head),
    papers: [0.33, 0.67].map((u) => P.rect(x + w * u - w * 0.05, tTop + h * 0.03, w * 0.1, h * 0.06, 3)),
    ctBox: ct, histoBox: hi,
    tableAt: [x + w / 2, (tTop + tBot) / 2] as Pt,
  };
};

/**
 * A USB-C plug pointing right, with its cable: the rounded moulded body, the narrower metal shell
 * with the oval slot in it, a strain-relief collar, and the cable curving away to the left. (x, y)
 * is the tip's centre; s scales (the plug is about 200 long at s = 1). Wash `body` dark grey,
 * `shell` light grey.
 */
export const usbPlug = (x: number, y: number, s = 1) => ({
  shell: P.rect(x - 60 * s, y - 18 * s, 60 * s, 36 * s, 16 * s),
  slot: P.rect(x - 50 * s, y - 6 * s, 40 * s, 12 * s, 6 * s),
  body: P.rect(x - 150 * s, y - 30 * s, 92 * s, 60 * s, 18 * s),
  collar: P.rect(x - 184 * s, y - 16 * s, 36 * s, 32 * s, 8 * s),
  cable: path(x, y, s, [-184, 0], [[[-240, 0], [-250, 40], [-310, 50]]]),
});

/*
 * Added for E14 (Nov 2026): a brightfield microscope, an H&E tissue slide, the GAN's forger (at an
 * easel) and detective (with a magnifier), diabetic-retinopathy lesions for `fundus`, a squamous
 * carcinoma tile (keratin pearls) and a thyroid tile (colloid-filled follicles).
 */

/**
 * An upright brightfield microscope in side view, facing left (as in a lab): a heavy base with the
 * lamp port, the curved arm rising from the back, coarse and fine focus knobs on the arm, the
 * stage with a slide clip, the condenser under it, the revolving nosepiece with three objectives
 * (short, medium, long), and an inclined binocular head with two eyepieces. Local box 420 × 560,
 * top-left (x, y), scale s. Wash `base`, `arm` cream or grey; `stage` near-black; `objectives`
 * silver. `stageAt` is the slide's place on the stage; `lampAt` the light port; `eyeAt` the eyepiece.
 */
export const microscope = (x: number, y: number, s = 1) => {
  const T = (u: number, v: number): Pt => [x + u * s, y + v * s];
  const R = (x0: number, y0: number, x1: number, y1: number, r: number) => rectL(x, y, s, x0, y0, x1, y1, r);
  /** A tube of width w from (u0, v0) to (u1, v1), as a closed quad. */
  const tube = (u0: number, v0: number, u1: number, v1: number, w: number): Pts => {
    const L = Math.hypot(u1 - u0, v1 - v0), nx = (-(v1 - v0) / L) * w / 2, ny = ((u1 - u0) / L) * w / 2;
    return P.polyline([T(u0 + nx, v0 + ny), T(u1 + nx, v1 + ny), T(u1 - nx, v1 - ny), T(u0 - nx, v0 - ny), T(u0 + nx, v0 + ny)], 8);
  };
  return {
    base: R(40, 490, 400, 550, 18),
    lamp: P.ellipse(...T(170, 490), 28 * s, 8 * s),
    arm: smoothClosed(x, y, s, [[290, 492], [380, 492], [392, 400], [380, 270], [350, 170], [300, 130], [280, 190], [312, 260], [322, 350], [312, 440]], 8),
    coarse: P.ellipse(...T(352, 380), 34 * s, 34 * s),
    fine: P.ellipse(...T(352, 380), 15 * s, 15 * s),
    stage: R(60, 330, 330, 352, 4),
    clip: P.polyline([T(96, 326), T(150, 318), T(206, 318)], 8),
    condenser: R(140, 352, 200, 400, 6),
    head: P.polyline([T(120, 120), T(320, 120), T(330, 186), T(130, 196), T(120, 120)], 8),
    nosepiece: P.polyline([T(130, 196), T(250, 190), T(240, 222), T(146, 226), T(130, 196)], 8),
    objectives: [R(146, 224, 170, 268, 5), R(178, 222, 202, 284, 5), R(210, 220, 232, 298, 5)],
    eyepieces: [tube(150, 124, 92, 34, 34), tube(186, 122, 132, 28, 34)],
    tube: P.line(...T(120, 150), ...T(320, 150), 8),
    stageAt: T(170, 322),
    lampAt: T(170, 490),
    eyeAt: T(100, 30),
  };
};

/**
 * A glass slide of an H&E-stained tissue section, label end on the left: glass, frosted label
 * patch, the coverslip (a thin rectangle) and an irregular tissue section under it (wash pink,
 * HE.stroma, with a purple core HE.nucleusLight). Box w × h.
 */
export const heSlide = (x: number, y: number, w: number, h: number) => ({
  glass: P.rect(x, y, w, h, 4),
  frost: P.rect(x + w * 0.02, y + h * 0.08, w * 0.22, h * 0.84, 3),
  cover: P.rect(x + w * 0.28, y + h * 0.05, w * 0.68, h * 0.9, 2),
  tissue: P.blob(x + w * 0.62, y + h * 0.5, w * 0.26, h * 0.32, "heslide", 0.22, 64),
  core: P.blob(x + w * 0.6, y + h * 0.52, w * 0.12, h * 0.16, "hecore", 0.3, 40),
  label: [x + w * 0.13, y + h * 0.56] as Pt,
});

/**
 * The GAN's forger: an artist's studio easel (two front legs, a back leg, the ledge and the top
 * clamp) holding a square canvas, the forger standing at its left in profile facing right (beret,
 * head, smock, the arm raised with a fine brush to the canvas), and a small side table with a
 * palette of paint blobs and a jar of brushes. Local box 760 × 640, top-left (x, y), scale s.
 * `canvasBox` [x, y, w, h] is where the painting (a tile) goes. Wash `smock` a muted blue, `beret`
 * dark, `palette` wood, `blobs` in H&E pink and purple.
 */
export const forger = (x: number, y: number, s = 1) => {
  const T = (u: number, v: number): Pt => [x + u * s, y + v * s];
  const cb: [number, number, number, number] = [x + 360 * s, y + 90 * s, 300 * s, 300 * s];
  return {
    legs: [P.line(...T(380, 400), ...T(330, 630), 10), P.line(...T(640, 400), ...T(690, 630), 10), P.line(...T(510, 60), ...T(560, 630), 12)],
    mast: P.line(...T(510, 30), ...T(510, 400), 12),
    ledge: rectL(x, y, s, 350, 392, 672, 410, 3),
    clamp: rectL(x, y, s, 480, 70, 540, 92, 3),
    canvas: P.rect(...cb, 3),
    head: P.ellipse(...T(170, 150), 38 * s, 44 * s),
    beret: smoothClosed(x, y, s, [[120, 118], [150, 92], [205, 92], [228, 112], [212, 124], [150, 124]], 6),
    stalk: P.line(...T(176, 92), ...T(180, 80), 4),
    nose: P.polyline([T(206, 146), T(220, 162), T(206, 168)], 6),
    smock: smoothClosed(x, y, s, [[130, 196], [214, 196], [246, 260], [252, 470], [96, 470], [100, 260]], 8),
    neck: P.line(...T(168, 192), ...T(170, 198), 2),
    arm: [P.polyline([T(220, 230), T(282, 300), T(340, 250)], 10), P.ellipse(...T(346, 246), 12 * s, 12 * s)],
    brush: P.line(...T(352, 240), ...T(410, 196), 10),
    otherArm: P.polyline([T(112, 240), T(96, 360), T(124, 420)], 10),
    trousers: [P.line(...T(130, 470), ...T(122, 630), 10), P.line(...T(220, 470), ...T(228, 630), 10)],
    table: [rectL(x, y, s, 0, 500, 120, 516, 3), P.line(...T(20, 516), ...T(20, 630), 6), P.line(...T(100, 516), ...T(100, 630), 6)],
    palette: smoothClosed(x, y, s, [[4, 480], [60, 470], [118, 482], [112, 498], [60, 500], [6, 496]], 6),
    blobs: [[24, 486], [48, 482], [72, 484], [96, 488]].map(([u, v]) => P.ellipse(...T(u, v), 8 * s, 5 * s)),
    jar: rectL(x, y, s, 70, 420, 104, 478, 6),
    jarBrushes: [P.line(...T(78, 424), ...T(66, 380), 6), P.line(...T(88, 424), ...T(92, 372), 6), P.line(...T(96, 424), ...T(112, 384), 6)],
    canvasBox: cb,
    tipAt: T(410, 196),
  };
};

/**
 * The GAN's detective: a figure in a belted trench coat and a brimmed hat, half-turned to the left,
 * holding a magnifying glass up in the right hand (the kit `magnifier`). Local box 420 × 620,
 * top-left (x, y), scale s; the lens is centred at `lensAt` with radius `lensR`. Wash `coat`
 * khaki, `hat` dark brown, `lens` pale blue (low alpha).
 */
export const detective = (x: number, y: number, s = 1) => {
  const T = (u: number, v: number): Pt => [x + u * s, y + v * s];
  const lensAt = T(90, 200), lensR = 62 * s;
  const mg = magnifier(lensAt[0], lensAt[1], lensR);
  return {
    head: P.ellipse(...T(250, 150), 40 * s, 46 * s),
    hat: smoothClosed(x, y, s, [[206, 118], [214, 70], [250, 58], [290, 70], [296, 118]], 8),
    brim: P.ellipse(...T(251, 120), 72 * s, 13 * s),
    band: P.line(...T(210, 108), ...T(292, 108), 8),
    nose: P.polyline([T(212, 150), T(198, 168), T(214, 172)], 6),
    coat: smoothClosed(x, y, s, [[200, 200], [300, 200], [338, 260], [356, 600], [150, 600], [168, 260]], 8),
    collar: [P.polyline([T(210, 200), T(240, 262), T(250, 214)], 8), P.polyline([T(290, 200), T(262, 262), T(250, 214)], 8)],
    belt: P.line(...T(166, 400), ...T(344, 400), 12),
    buckle: rectL(x, y, s, 236, 390, 264, 410, 3),
    buttons: [300, 340, 450, 500].map((v) => P.ellipse(...T(232, v), 6 * s, 6 * s)),
    arm: [P.polyline([T(196, 230), T(150, 300), T(126, 262)], 10), P.ellipse(...T(124, 256), 14 * s, 14 * s)],
    otherArm: P.polyline([T(310, 240), T(352, 360), T(330, 430)], 10),
    lens: mg.lens, rim: mg.rim, glint: mg.glint,
    handle: P.polyline([T(124, 256), T(112, 238), T(100, 222)], 6),
    lensAt, lensR,
  };
};

/**
 * Diabetic-retinopathy lesions to lay over `fundus(cx, cy, r)` (same arguments): microaneurysms
 * (tiny red dots), dot and blot haemorrhages (small dark-red dots and larger irregular blots) in
 * the posterior pole, and hard exudates (small waxy yellow flecks) in a partial ring near the
 * macula, as in moderate non-proliferative DR with exudates threatening the macula. Fill
 * `microaneurysms` and `haems` #9B1C1C, `exudates` #F2D16B (see e06 `Fills`). `exudateAt` centre.
 */
export const drLesions = (cx: number, cy: number, r: number) => {
  const rr = stream("dr-lesions");
  const mx = cx + r * 0.26, my = cy + r * 0.02;
  const at = (u: number, v: number): Pt => [cx + u * r, cy + v * r];
  const haemPts: [number, number, number][] = [[0.05, -0.32, 0.035], [0.48, -0.36, 0.03], [0.62, 0.14, 0.04], [0.1, 0.38, 0.03], [0.4, 0.5, 0.035], [-0.05, -0.05, 0.025], [0.7, -0.12, 0.028]];
  const maPts: [number, number][] = [[0.18, -0.2], [0.36, -0.18], [0.5, 0.26], [0.2, 0.28], [0.58, -0.02], [-0.02, 0.2], [0.3, 0.4]];
  const exu: Pt[] = [];
  for (let i = 0; i < 16; i++) {
    const a = -1.2 + (i / 15) * 2.4 + (rr() - 0.5) * 0.12, d = r * (0.22 + (rr() - 0.5) * 0.04);
    exu.push([mx + Math.cos(a) * d, my + Math.sin(a) * d]);
  }
  return {
    microaneurysms: maPts.map(([u, v]) => P.ellipse(...at(u, v), r * 0.011, r * 0.011, 0, Math.PI * 2, 10)),
    haems: haemPts.map(([u, v, k], i) => i % 2 ? P.ellipse(...at(u, v), r * k * 0.55, r * k * 0.55, 0, Math.PI * 2, 12) : P.blob(...at(u, v), r * k, r * k * 0.8, `drh${i}`, 0.3, 18)),
    exudates: exu.map(([ex, ey], i) => P.blob(ex, ey, r * (0.02 + (i % 3) * 0.007), r * 0.017, `dre${i}`, 0.25, 12)),
    exudateAt: [mx + r * 0.22, my] as Pt,
    macula: [mx, my] as Pt,
  };
};

/**
 * A square H&E tile of keratinising squamous cell carcinoma at medium power: pink stroma, nests of
 * large polygonal tumour cells (pale pink cytoplasm, big dark nuclei) and, in the middle of the
 * larger nests, keratin pearls (concentric whorls of bright eosinophilic keratin). Wash `field`
 * HE.stromaPale, `nests` HE.cyto, `pearls` "#F06FA0" then ink `whorls`; fill `nuclei` HE.nucleus.
 */
export const squamousTile = (x: number, y: number, w: number, h: number, key = "sq") => {
  const r = stream(key);
  const R = Math.min(w, h);
  const centres: Pt[] = [[0.3, 0.3], [0.72, 0.28], [0.28, 0.74], [0.74, 0.72]].map(([u, v]) => [x + w * u + (r() - 0.5) * R * 0.05, y + h * v + (r() - 0.5) * R * 0.05]);
  const nests = centres.map(([ncx, ncy], i) => P.blob(ncx, ncy, R * (0.2 + (i % 2) * 0.03), R * 0.18, `${key}n${i}`, 0.18, 48));
  const pearls = centres.filter((_, i) => i !== 2).map(([ncx, ncy], i) => P.blob(ncx, ncy, R * 0.075, R * 0.065, `${key}p${i}`, 0.12, 32));
  const whorls = centres.filter((_, i) => i !== 2).flatMap(([ncx, ncy]) => [0.05, 0.035, 0.02].map((k) => P.ellipse(ncx, ncy, R * k, R * k * 0.85, 0.3, 0.3 + Math.PI * 1.7, 24)));
  const nuclei: Pts[] = [];
  centres.forEach(([ncx, ncy], i) => {
    for (let k = 0; k < 22; k++) {
      const a = r() * Math.PI * 2, d = R * (i === 2 ? 0.02 : 0.095) + r() * R * (i === 2 ? 0.14 : 0.08);
      const px = ncx + Math.cos(a) * d, py = ncy + Math.sin(a) * d * 0.9;
      nuclei.push(P.blob(px, py, R * 0.017, R * 0.013, `${key}k${i}${k}`, 0.2, 12));
    }
  });
  return { field: P.rect(x, y, w, h, 4), nests, pearls, whorls, nuclei, pearlAt: centres[0] };
};

/**
 * A square H&E tile of thyroid: round follicles of different sizes, each lined by one layer of
 * cuboidal follicular cells (a ring of small round dark nuclei) round pink colloid, with thin
 * pale stroma between. Wash `field` HE.stromaPale, `follicles` HE.cyto, `colloid` "#EE9CC0";
 * fill `nuclei` HE.nucleus.
 */
export const thyroidTile = (x: number, y: number, w: number, h: number, key = "th") => {
  const r = stream(key);
  const R = Math.min(w, h);
  const spots: [number, number, number][] = [[0.22, 0.22, 0.15], [0.58, 0.18, 0.12], [0.84, 0.3, 0.1], [0.3, 0.58, 0.12], [0.66, 0.56, 0.16], [0.18, 0.86, 0.09], [0.5, 0.86, 0.1], [0.84, 0.82, 0.1]];
  const follicles: Pts[] = [], colloid: Pts[] = [], nuclei: Pts[] = [];
  spots.forEach(([u, v, k], i) => {
    const fx = x + w * u, fy = y + h * v, fr = R * k;
    follicles.push(P.blob(fx, fy, fr, fr * 0.92, `${key}f${i}`, 0.08, 40));
    colloid.push(P.blob(fx, fy, fr * 0.74, fr * 0.68, `${key}c${i}`, 0.1, 36));
    const n = Math.round(14 + k * 80);
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2 + (r() - 0.5) * 0.1;
      nuclei.push(P.ellipse(fx + Math.cos(a) * fr * 0.86, fy + Math.sin(a) * fr * 0.8, R * 0.012, R * 0.012, 0, Math.PI * 2, 10));
    }
  });
  return { field: P.rect(x, y, w, h, 4), follicles, colloid, nuclei };
};

/* ---------------------------------------------------------------------------------------------
 * Page 15 (B1, Nov 2026): the first page of a research article, a checklist clipboard and a
 * non-mydriatic retinal (fundus) camera. Checked on the `kit-objects-15` still (ObjectsDemo15).
 * ------------------------------------------------------------------------------------------- */

/**
 * The first page of a research article, as a reader meets it: a coloured masthead band (journal
 * name), a thin rule, the title block (two lines of large type) with an author line and two grey
 * affiliation lines, a shaded ABSTRACT box with five text lines, then two columns: METHODS on the
 * left (heading + text lines), and on the right a small participant-flow figure (three stacked
 * boxes with down arrows and a side "excluded" box, as in a STARD/CONSORT flow diagram) above a
 * RESULTS heading and lines; a footer rule. Box w × h. Slots: `journalAt`, `titleAt(k)`,
 * `authorsAt`, `abstractHeadAt`, `methodsHeadAt`, `resultsHeadAt` are text baselines (start
 * anchor); `abstractBox`, `methodsBox`, `figBox`, `resultsBox` are [x, y, w, h] for highlights.
 * Wash `sheet` white, `band` the journal colour, `abstract` pale; ink the rest; grey `lines`.
 */
export const researchArticle = (x: number, y: number, w: number, h: number) => {
  const L = (x0: number, x1: number, yy: number) => P.line(x0, yy, x1, yy, 10);
  const lines = (x0: number, x1: number, y0: number, n: number, gap: number) =>
    Array.from({ length: n }, (_, k) => L(x0, x1 - (k === n - 1 ? (x1 - x0) * 0.4 : (k % 3 === 1 ? (x1 - x0) * 0.06 : 0)), y0 + k * gap));
  const mx = x + w * 0.06, Mx = x + w * 0.94, mid = x + w * 0.5;
  const absY = y + h * 0.27, absH = h * 0.2;
  const colY = y + h * 0.52;
  const fx = mid + w * 0.03, fw = Mx - fx, fy = colY + h * 0.02, fh = h * 0.22;
  const bw = fw * 0.5, bh = fh * 0.2, bx = fx + fw * 0.08;
  const fbox = (k: number) => P.rect(bx, fy + k * fh * 0.38, bw, bh, 4);
  const arrow = (k: number) => {
    const ax = bx + bw / 2, a0 = fy + k * fh * 0.38 + bh, a1 = fy + (k + 1) * fh * 0.38;
    return [P.line(ax, a0, ax, a1, 6), P.polyline([[ax - 6, a1 - 9], [ax, a1], [ax + 6, a1 - 9]], 4)];
  };
  return {
    sheet: P.rect(x, y, w, h, 4),
    band: P.rect(x, y, w, h * 0.075, 4),
    rule: L(mx, Mx, y + h * 0.092),
    titleLines: [L(mx, Mx - w * 0.04, y + h * 0.13), L(mx, Mx - w * 0.3, y + h * 0.165)],
    aff: [L(mx, mx + w * 0.62, y + h * 0.232), L(mx, mx + w * 0.48, y + h * 0.247)],
    abstract: P.rect(mx - w * 0.015, absY, Mx - mx + w * 0.03, absH, 6),
    abstractLines: lines(mx + w * 0.01, Mx - w * 0.01, absY + absH * 0.42, 5, absH * 0.12),
    methodsLines: lines(mx, mid - w * 0.03, colY + h * 0.08, 9, h * 0.032),
    flow: [fbox(0), fbox(1), fbox(2), P.rect(bx + bw + fw * 0.1, fy + fh * 0.38 + bh * 0.1, fw * 0.3, bh * 0.8, 4)],
    flowArrows: [...arrow(0), ...arrow(1), P.line(bx + bw, fy + fh * 0.38 + bh * 0.5, bx + bw + fw * 0.1, fy + fh * 0.38 + bh * 0.5, 4)],
    resultsLines: lines(fx, Mx, fy + fh + h * 0.075, 4, h * 0.032),
    footer: L(mx, Mx, y + h * 0.95),
    journalAt: [mx, y + h * 0.054] as Pt,
    titleAt: (k: number): Pt => [mx, y + h * (0.13 + k * 0.035)],
    authorsAt: [mx, y + h * 0.21] as Pt,
    abstractHeadAt: [mx + w * 0.01, absY + absH * 0.24] as Pt,
    methodsHeadAt: [mx, colY + h * 0.035] as Pt,
    resultsHeadAt: [fx, fy + fh + h * 0.035] as Pt,
    abstractBox: [mx - w * 0.015, absY, Mx - mx + w * 0.03, absH] as [number, number, number, number],
    methodsBox: [mx, colY, mid - w * 0.03 - mx, h * 0.38] as [number, number, number, number],
    figBox: [fx, fy, fw, fh] as [number, number, number, number],
    resultsBox: [fx, fy + fh, fw, h * 0.18] as [number, number, number, number],
  };
};

/**
 * A clipboard with a checklist: brown hardboard with rounded corners and a hanging hole, a white
 * sheet held under a chrome spring clip (base plate with two rivets and a curved lever), and `n`
 * rows each with a square tick box, a rule and room for text. Box w × h. `rowAt(i)` is the text
 * baseline start of row i, `boxAt(i)` the centre of its tick box, `tick(i)` a tick path in it,
 * `row(i)` the row's [x, y, w, h]. Wash `board` brown, `sheet` white, `clip` silver.
 */
export const clipboard = (x: number, y: number, w: number, h: number, n = 10) => {
  const sx = x + w * 0.06, sw = w * 0.88, sy = y + h * 0.09, sh = h * 0.87;
  const cw = w * 0.42, cx = x + (w - cw) / 2, ch = h * 0.075, cy = y + h * 0.035;
  const top = sy + sh * 0.09, rh = (sh * 0.88) / n, bs = Math.min(rh * 0.62, w * 0.07);
  const boxAt = (i: number): Pt => [sx + sw * 0.05 + bs / 2, top + i * rh + rh / 2];
  return {
    board: P.rect(x, y, w, h, w * 0.05),
    hole: P.ellipse(x + w / 2, y + h * 0.02, w * 0.035, h * 0.008),
    sheet: P.rect(sx, sy, sw, sh, 3),
    clip: P.rect(cx, cy, cw, ch, ch * 0.3),
    lever: P.ellipse(x + w / 2, cy + ch * 0.55, cw * 0.36, ch * 0.75, Math.PI * 1.08, Math.PI * 1.92, 24),
    rivets: [P.ellipse(cx + cw * 0.12, cy + ch * 0.62, ch * 0.13, ch * 0.13), P.ellipse(cx + cw * 0.88, cy + ch * 0.62, ch * 0.13, ch * 0.13)],
    boxes: Array.from({ length: n }, (_, i) => { const [bx, by] = boxAt(i); return P.rect(bx - bs / 2, by - bs / 2, bs, bs, 3); }),
    rules: Array.from({ length: n }, (_, i) => P.line(sx + sw * 0.05 + bs * 1.4, top + (i + 1) * rh - rh * 0.12, sx + sw * 0.95, top + (i + 1) * rh - rh * 0.12, 12)),
    rowAt: (i: number): Pt => [sx + sw * 0.05 + bs * 1.5, top + i * rh + rh * 0.66],
    boxAt,
    tick: (i: number): Pts => { const [bx, by] = boxAt(i); return P.polyline([[bx - bs * 0.32, by], [bx - bs * 0.06, by + bs * 0.28], [bx + bs * 0.4, by - bs * 0.38]], 6); },
    row: (i: number): [number, number, number, number] => [sx + sw * 0.03, top + i * rh, sw * 0.94, rh],
    titleAt: [sx + sw / 2, sy + sh * 0.065] as Pt,
  };
};

/**
 * A non-mydriatic retinal (fundus) camera on its table, side view, patient side on the LEFT: the
 * chin-and-forehead rest (upright post, curved forehead band, chin cup), the camera head with its
 * lens barrel pointing at the rest, the sliding base with the operator's joystick on the right,
 * and a small monitor on an arm behind the head. Local box 560 × 420, top-left (x, y), scale s.
 * `lensAt` is the front lens centre; `screenBox` [x, y, w, h] the monitor's screen (draw a fundus
 * there). Wash `body` off-white, `barrel` dark grey, `screen` near-black, `table` wood.
 */
export const retinalCamera = (x: number, y: number, s = 1) => {
  const R = (x0: number, y0: number, x1: number, y1: number, r = 10) => rectL(x, y, s, x0, y0, x1, y1, r);
  const T = (px: number, py: number): Pt => [x + px * s, y + py * s];
  return {
    table: R(0, 360, 560, 384, 4),
    tableLegs: [P.line(...T(40, 384), ...T(40, 420), 6), P.line(...T(520, 384), ...T(520, 420), 6)],
    base: R(150, 316, 520, 360, 12),
    rail: P.line(...T(170, 330), ...T(500, 330), 12),
    joystick: [P.line(...T(470, 316), ...T(470, 262), 8), P.ellipse(...T(470, 252), 16 * s, 14 * s)],
    body: R(210, 130, 430, 316, 26),
    barrel: R(142, 186, 214, 262, 10),
    lens: P.ellipse(...T(140, 224), 12 * s, 34 * s),
    knob: P.ellipse(...T(330, 290), 14 * s, 14 * s),
    post: R(78, 70, 96, 360, 6),
    forehead: path(x, y, s, [78, 92], [[[48, 84], [36, 100], [36, 118]], [[36, 132], [58, 136], [78, 130]]]),
    chin: path(x, y, s, [78, 250], [[[58, 250], [28, 254], [24, 266]], [[28, 282], [58, 284], [78, 280]]]),
    arm: P.line(...T(400, 130), ...T(430, 70), 8),
    monitor: R(380, 6, 548, 110, 8),
    screen: R(392, 16, 536, 100, 4),
    lensAt: T(140, 224),
    screenBox: [x + 392 * s, y + 16 * s, 144 * s, 84 * s] as [number, number, number, number],
  };
};

/* ---- Page 16 (E15, bias zoo): zoo map, zoo gate, a fenced enclosure, the skin-tone scale, a paw print ---- */

/**
 * A zoo seen from above, as on a visitor map: a boundary wall with the entrance gap at the bottom
 * centre (two pillars and an arch over it), a path from the gate to a round central plaza, and four
 * fenced enclosures in the quadrants, each with a row of fence posts along its edge and a sign
 * board on a post facing the plaza. Box w × h. `pens[i]` (0 top-left, 1 top-right, 2 bottom-left,
 * 3 bottom-right) gives `box` [x, y, w, h], `outline`, `posts`, `board`, `post`, `signAt` (centre
 * of the board, for a typeset name) and `centre`. Wash pens grass green, the path sand.
 */
export const zooMap = (x: number, y: number, w: number, h: number) => {
  const cx = x + w / 2, cy = y + h * 0.46;
  const gw = w * 0.12, gy = y + h, pathW = w * 0.09;
  const m = w * 0.04, pw = (w - 2 * m - pathW * 1.6) / 2, ph = (h - 2 * m - pathW * 2.2) / 2;
  const boxes: [number, number, number, number][] = [
    [x + m, y + m, pw, ph], [x + w - m - pw, y + m, pw, ph],
    [x + m, y + h - m - ph - pathW * 0.6, pw, ph], [x + w - m - pw, y + h - m - ph - pathW * 0.6, pw, ph],
  ];
  const pens = boxes.map(([bx, by, bw, bh]) => {
    const outline = P.rect(bx, by, bw, bh, 18);
    const posts: Pts[] = [];
    const nx = 9, ny = 7;
    for (let k = 1; k < nx; k++) {
      const px = bx + (bw * k) / nx;
      posts.push(P.line(px, by - 7, px, by + 7, 2), P.line(px, by + bh - 7, px, by + bh + 7, 2));
    }
    for (let k = 1; k < ny; k++) {
      const py = by + (bh * k) / ny;
      posts.push(P.line(bx - 7, py, bx + 7, py, 2), P.line(bx + bw - 7, py, bx + bw + 7, py, 2));
    }
    const bwid = bw * 0.9, bh2 = Math.max(48, bh * 0.2), sx = bx + bw / 2, sy = by + bh * 0.06 + bh2 / 2;
    return {
      box: [bx, by, bw, bh] as [number, number, number, number],
      outline, posts,
      board: P.rect(sx - bwid / 2, sy - bh2 / 2, bwid, bh2, 6),
      post: P.line(sx, sy + bh2 / 2, sx, sy + bh2 / 2 + bh * 0.06, 2),
      signAt: [sx, sy] as Pt,
      signBox: [sx - bwid / 2, sy - bh2 / 2, bwid, bh2] as [number, number, number, number],
      centre: [bx + bw / 2, by + bh * 0.6] as Pt,
    };
  });
  const pr = Math.min(w, h) * 0.075;
  return {
    wall: P.polyline([[cx - gw / 2, gy], [x, gy], [x, y], [x + w, y], [x + w, gy], [cx + gw / 2, gy]], 18),
    pillars: [P.rect(cx - gw / 2 - 16, gy - 22, 32, 44, 4), P.rect(cx + gw / 2 - 16, gy - 22, 32, 44, 4)],
    arch: P.quad(cx - gw / 2, gy - 20, cx, gy - 70, cx + gw / 2, gy - 20, 20),
    pathL: P.line(cx - pathW / 2, gy, cx - pathW / 2, y + m, 10),
    pathR: P.line(cx + pathW / 2, gy, cx + pathW / 2, y + m, 10),
    path: P.rect(cx - pathW / 2, y + m, pathW, gy - y - m, 2),
    crossPath: P.rect(x + m, cy - pathW / 2, w - 2 * m, pathW, 2),
    plaza: P.ellipse(cx, cy, pr, pr, -Math.PI / 2, Math.PI * 1.5, 48),
    plazaAt: [cx, cy] as Pt,
    gateAt: [cx, gy] as Pt,
    pens,
  };
};

/**
 * A zoo entrance, front view: two brick pillars with caps, a curved name board across the top
 * (put the zoo's name at `signAt`), and two open iron gate leaves of vertical bars between the
 * pillars. Local box 600 × 420, top-left (x, y), scale s. Wash `pillars` brick, `board` cream.
 */
export const zooGate = (x: number, y: number, s = 1) => {
  const T = (px: number, py: number): Pt => [x + px * s, y + py * s];
  const R = (x0: number, y0: number, x1: number, y1: number, r = 6) => rectL(x, y, s, x0, y0, x1, y1, r);
  const leaf = (x0: number, x1: number) => [
    P.line(...T(x0, 214), ...T(x1, 226), 10), P.line(...T(x0, 400), ...T(x1, 396), 10),
    ...Array.from({ length: 5 }, (_, k) => { const px = x0 + ((x1 - x0) * (k + 0.5)) / 5; const t = (px - x0) / (x1 - x0); return P.line(...T(px, 214 + 12 * t - 14), ...T(px, 400 - 4 * t), 10); }),
  ];
  return {
    pillars: [R(0, 120, 74, 420), R(526, 120, 600, 420)],
    caps: [R(-10, 100, 84, 124, 4), R(516, 100, 610, 124, 4)],
    bricks: [0, 1].flatMap((k) => [170, 230, 290, 350].map((py) => P.line(...T(k * 526 + 6, py), ...T(k * 526 + 68, py), 6))),
    board: [...path(x, y, s, [60, 150], [[[160, 40], [440, 40], [540, 150]]]), ...P.line(...T(540, 150), ...T(540, 196), 4), ...P.line(...T(540, 196), ...T(60, 196), 12), ...P.line(...T(60, 196), ...T(60, 150), 4)],
    leaves: [...leaf(78, 250), ...leaf(522, 350)],
    ground: P.line(...T(-40, 420), ...T(640, 420), 20),
    signAt: T(300, 150),
  };
};

/**
 * One zoo enclosure, front view: a wooden fence (two rails on posts, the posts with pointed tops)
 * on a ground line, and a name plaque screwed to the middle of the fence (`boardPosts` are its two
 * screws). The exhibit goes in `inside` [x, y, w, h], the whole area above the fence, so nothing
 * crosses it. Box w × h (fence in the lower 30%). Wash `board`
 * cream, `fence` timber brown, `grass` green.
 */
export const enclosure = (x: number, y: number, w: number, h: number) => {
  const fy = y + h * 0.7, gy = y + h, n = Math.max(6, Math.round(w / 90));
  const posts = Array.from({ length: n + 1 }, (_, k) => {
    const px = x + (w * k) / n;
    return P.polyline([[px - 9, gy], [px - 9, fy + 10], [px, fy - 8], [px + 9, fy + 10], [px + 9, gy]], 8);
  });
  const bw = Math.min(w * 0.72, 680), bh = Math.max(56, (gy - fy) * 0.62), bx = x + (w - bw) / 2, by = fy + (gy - fy) * 0.12;
  return {
    posts,
    rails: [P.line(x, fy + (gy - fy) * 0.3, x + w, fy + (gy - fy) * 0.3, 24), P.line(x, fy + (gy - fy) * 0.72, x + w, fy + (gy - fy) * 0.72, 24)],
    railBands: [P.rect(x, fy + (gy - fy) * 0.24, w, (gy - fy) * 0.12, 3), P.rect(x, fy + (gy - fy) * 0.66, w, (gy - fy) * 0.12, 3)],
    grass: P.rect(x - 10, fy + (gy - fy) * 0.5, w + 20, (gy - fy) * 0.5, 4),
    ground: P.line(x - 30, gy, x + w + 30, gy, 24),
    board: P.rect(bx, by, bw, bh, 8),
    boardPosts: [P.ellipse(bx + 14, by + bh / 2, 4, 4), P.ellipse(bx + bw - 14, by + bh / 2, 4, 4)],
    signAt: [x + w / 2, by + bh * 0.66] as Pt,
    inside: [x + w * 0.03, y, w * 0.94, fy - y - 16] as [number, number, number, number],
  };
};

/**
 * The Fitzpatrick skin-type scale as a row of n (6) rounded swatches, lightest (I) on the left.
 * Box w × h. `swatches[i]` closed outlines (wash with TISSUE.skinTones[i]); `labelAt(i)` the point
 * under swatch i for its numeral; `span(a, b)` a bracket under swatches a..b for a group label,
 * with `spanAt(a, b)` its label point.
 */
export const toneScale = (x: number, y: number, w: number, h: number, n = 6) => {
  const gap = w * 0.02, sw = (w - gap * (n - 1)) / n;
  const sx = (i: number) => x + i * (sw + gap);
  return {
    swatches: Array.from({ length: n }, (_, i) => P.rect(sx(i), y, sw, h, Math.min(14, sw * 0.12))),
    labelAt: (i: number): Pt => [sx(i) + sw / 2, y + h + 44],
    span: (a: number, b: number): Pts => P.polyline([[sx(a), y + h + 62], [sx(a), y + h + 78], [sx(b) + sw, y + h + 78], [sx(b) + sw, y + h + 62]], 12),
    spanAt: (a: number, b: number): Pt => [(sx(a) + sx(b) + sw) / 2, y + h + 122],
    box: (i: number): [number, number, number, number] => [sx(i), y, sw, h],
  };
};

/** An animal's paw print: a lobed main pad and four oval toe pads. Centre (cx, cy) of the main pad, scale s (pad ~60 px wide at s = 1). */
export const pawPrint = (cx: number, cy: number, s = 1) => ({
  pad: path(cx, cy, s, [0, -18], [[[18, -20], [34, 2], [30, 16]], [[26, 30], [10, 26], [0, 22]], [[-10, 26], [-26, 30], [-30, 16]], [[-34, 2], [-18, -20], [0, -18]]]),
  toes: [[-30, -34, -0.5], [-11, -50, -0.15], [11, -50, 0.15], [30, -34, 0.5]].map(([dx, dy, a]) =>
    P.ellipse(cx + dx * s, cy + dy * s, 8.5 * s, 12 * s, -Math.PI / 2 + a, Math.PI * 1.5 + a, 28)),
});

/* ---- Page 17 (E16, bias in us): a see-saw, a mammogram (CC view), a colonoscopy view with an AI detection box ---- */

/**
 * A playground see-saw, side view: a long plank on a triangular fulcrum with a bolt at the pivot,
 * a T-handle near each end and a seat block at each end, on a ground line. Pivot top at (cx, cy),
 * plank length w; `tilt` in radians, positive = LEFT end down. `seatL` / `seatR` are points just
 * above the plank at each seat (to stand a label, a person or a weight on), `endL` / `endR` the
 * plank's end centres. Wash `plank` timber, `fulcrum` grey or a colour.
 */
export const seeSaw = (cx: number, cy: number, w: number, tilt = 0) => {
  const t = w * 0.035, c = Math.cos(tilt), sn = Math.sin(tilt);
  // along-plank unit vector points right; left end goes down when tilt > 0
  const U = (d: number, o: number): Pt => [cx + d * c + o * sn, cy - d * sn - o * c + t / 2];
  const plank = P.polyline([U(-w / 2, -t / 2), U(w / 2, -t / 2), U(w / 2, t / 2), U(-w / 2, t / 2), U(-w / 2, -t / 2)], 10);
  const handle = (d: number) => [...P.line(...U(d, t / 2), ...U(d, t * 3), 8), ...P.line(...U(d - t * 0.8, t * 3), ...U(d + t * 0.8, t * 3), 6)] as Pts;
  const seat = (d: number) => P.polyline([U(d - t * 1.8, t / 2), U(d - t * 1.8, t * 1.15), U(d + t * 1.8, t * 1.15), U(d + t * 1.8, t / 2), U(d - t * 1.8, t / 2)], 8);
  const gy = cy + w * 0.17, bw = w * 0.11;
  return {
    plank,
    fulcrum: P.polyline([[cx, cy + t * 0.6], [cx + bw, gy], [cx - bw, gy], [cx, cy + t * 0.6]], 10),
    bolt: P.ellipse(cx, cy + t * 0.9, t * 0.32, t * 0.32),
    handles: [handle(-w * 0.34), handle(w * 0.34)],
    seats: [seat(-w * 0.44), seat(w * 0.44)],
    ground: P.line(cx - w * 0.6, gy, cx + w * 0.6, gy, 24),
    seatL: U(-w * 0.44, t * 1.3),
    seatR: U(w * 0.44, t * 1.3),
    endL: U(-w / 2, 0),
    endR: U(w / 2, 0),
    groundY: gy,
  };
};

/**
 * A mammogram, craniocaudal (CC) view, as it hangs on the viewer: a dark film; the breast as a
 * half-dome from the chest wall on the left edge to the nipple on the right; fibroglandular
 * strands fanning from the chest wall towards the nipple; and, when `mass`, a spiculated mass in
 * the outer upper quadrant. Box w × h. Parts: `film`, `breast` (closed; wash pale grey),
 * `nipple`, `strands`, `mass` (closed core), `spicules`, `massAt`, `markerAt` (top-left corner,
 * for an "L CC" marker) and `massBox` [x, y, w, h] for a ring or a highlight.
 */
export const mammogram = (x: number, y: number, w: number, h: number, mass = true) => {
  const T = (px: number, py: number): Pt => [x + px * w, y + py * h];
  const breast = [...cubic(T(0.06, 0.06), T(0.4, 0.06), T(0.78, 0.22), T(0.82, 0.48)), ...cubic(T(0.82, 0.52), T(0.78, 0.78), T(0.4, 0.94), T(0.06, 0.94)).slice(0), T(0.06, 0.06)] as Pts;
  const strands = [0.2, 0.32, 0.44, 0.56, 0.68, 0.8].map((sy, k) => cubic(T(0.08, sy), T(0.3, sy + (0.5 - sy) * 0.2), T(0.55, 0.5 + (sy - 0.5) * 0.45), T(0.74 - (k % 2) * 0.04, 0.5 + (sy - 0.5) * 0.18), 14));
  const mx = 0.44, my = 0.34, mr = Math.min(w, h) * 0.055;
  const [mcx, mcy] = T(mx, my);
  const spicules = Array.from({ length: 11 }, (_, k) => {
    const a = (k / 11) * Math.PI * 2 + 0.2, l = mr * (1.9 + 0.6 * ((k * 7) % 3) / 2);
    return P.line(mcx + Math.cos(a) * mr * 0.8, mcy + Math.sin(a) * mr * 0.8, mcx + Math.cos(a) * l, mcy + Math.sin(a) * l, 6);
  });
  return {
    film: P.rect(x, y, w, h, 8),
    breast,
    nipple: P.ellipse(T(0.83, 0.5)[0], T(0.83, 0.5)[1], w * 0.014, h * 0.022),
    strands,
    mass: mass ? P.blob(mcx, mcy, mr, mr * 0.9, "mammoMass", 0.18, 36) : ([] as unknown as Pts),
    spicules: mass ? spicules : [],
    massAt: [mcx, mcy] as Pt,
    massBox: [mcx - mr * 2.6, mcy - mr * 2.6, mr * 5.2, mr * 5.2] as [number, number, number, number],
    markerAt: T(0.12, 0.12),
  };
};

/**
 * What the endoscopist sees in colonoscopy: the round endoscopic field on a monitor frame, the
 * dark lumen ahead (off-centre), three haustral folds as broken rings around it, a few mucosal
 * vessels, and a sessile polyp on a fold at lower left with the AI's detection box (four corner
 * brackets) around it. Centre (cx, cy), field radius r. Parts: `frame`, `field` (wash pink),
 * `lumen` (wash dark), `folds`, `vessels`, `polyp` (closed; wash a deeper pink), `polypAt`,
 * `aiBox` (corner strokes; draw green), `aiBoxRect` [x, y, w, h] and `aiLabelAt` (above the box).
 */
export const endoView = (cx: number, cy: number, r: number) => {
  const lx = cx + r * 0.16, ly = cy - r * 0.12;
  const fold = (k: number, gap: number) => {
    const rr = r * (0.3 + k * 0.2);
    return P.ellipse(lx - k * r * 0.05, ly + k * r * 0.04, rr, rr * 0.86, -Math.PI / 2 + gap, Math.PI * 1.5 - 0.5 + gap * 0.3, 60);
  };
  const px = cx - r * 0.42, py = cy + r * 0.36, pr = r * 0.15;
  const b = pr * 1.7, bx = px - b, by = py - b * 0.95, bs = b * 2, k = bs * 0.26;
  const corner = (x0: number, y0: number, dx: number, dy: number) => P.polyline([[x0 + dx * k, y0], [x0, y0], [x0, y0 + dy * k]], 6);
  return {
    frame: P.rect(cx - r * 1.12, cy - r * 1.06, r * 2.24, r * 2.12, r * 0.08),
    field: P.ellipse(cx, cy, r, r),
    lumen: P.blob(lx, ly, r * 0.15, r * 0.13, "endoLumen", 0.12, 32),
    folds: [fold(0, 0.3), fold(1, 1.1), fold(2, 2.3)],
    vessels: [P.wave(cx + r * 0.3, cx + r * 0.75, cy + r * 0.42, r * 0.03, 2, 24), P.wave(cx - r * 0.2, cx + r * 0.2, cy + r * 0.7, r * 0.025, 2, 24), P.wave(cx - r * 0.8, cx - r * 0.45, cy - r * 0.3, r * 0.03, 1.5, 24)],
    polyp: [...cubic([px - pr * 1.3, py + pr * 0.5], [px - pr * 1.1, py - pr * 1.2], [px + pr * 1.1, py - pr * 1.2], [px + pr * 1.3, py + pr * 0.5]), ...cubic([px + pr * 1.3, py + pr * 0.5], [px + pr * 0.5, py + pr * 0.8], [px - pr * 0.5, py + pr * 0.8], [px - pr * 1.3, py + pr * 0.5]).slice(1)] as Pts,
    polypAt: [px, py] as Pt,
    aiBox: [corner(bx, by, 1, 1), corner(bx + bs, by, -1, 1), corner(bx, by + bs, 1, -1), corner(bx + bs, by + bs, -1, -1)],
    aiBoxRect: [bx, by, bs, bs] as [number, number, number, number],
    aiLabelAt: [bx + bs / 2, by - 18] as Pt,
  };
};

/* ---------------------------------------------------------------------------------------------
 * Added for E17 (Nov 2026): a breast core-biopsy glass slide with a written label and barcode,
 * an H&E breast tile (invasive carcinoma or a normal lobule), a Grad-CAM style heat spot, a
 * SHAP waterfall, LIME superpixels, an X-ray lead marker, a model card and a snow bank.
 */

/** Grad-CAM / jet colours, outermost (cool) to innermost (hot). */
export const HEAT = ["#3D7BE0", "#3FC79A", "#F2D33C", "#E8432E"] as const;

/**
 * A glass slide of a breast core biopsy, as a pathologist holds it, label end on the left: the
 * glass, a frosted label patch carrying a printed barcode and a handwritten accession number
 * (open pen strokes), the coverslip, and three long thin cores lying side by side (each a
 * slightly curved cylinder with rounded ends; the middle one broken into two pieces). Part of the
 * middle core is denser and more purple (the tumour). Wash `cores` HE.stroma, `tumour`
 * HE.nucleusLight. `labelBox` / `tumourBox` are [x, y, w, h] for highlights or a heat spot.
 */
export const coreSlide = (x: number, y: number, w: number, h: number) => {
  const r = stream("coreSlide");
  const fx = x + w * 0.025, fy = y + h * 0.08, fw = w * 0.22, fh = h * 0.84;
  const capsule = (x1: number, x2: number, yc: number, hw: number, bend: number, key: string): Pts => {
    const n = 40, top: Pt[] = [], bot: Pt[] = [];
    const rr = stream(key);
    for (let i = 0; i <= n; i++) {
      const t = i / n, cx = x1 + (x2 - x1) * t, cy = yc + Math.sin(t * Math.PI) * bend;
      const jt = 1 + (rr() - 0.5) * 0.22;
      top.push([cx, cy - hw * jt]);
      bot.push([cx, cy + hw * (1 + (rr() - 0.5) * 0.22)]);
    }
    const capR = P.ellipse(x2, yc, hw, hw, -Math.PI / 2, Math.PI / 2, 10);
    const capL = P.ellipse(x1, yc, hw, hw, Math.PI / 2, Math.PI * 1.5, 10);
    return [...top, ...capR, ...bot.reverse(), ...capL, top[0]];
  };
  const cx0 = x + w * 0.32, cx1 = x + w * 0.93, hw = h * 0.045;
  const ys = [y + h * 0.3, y + h * 0.5, y + h * 0.7];
  const cores: Pts[] = [
    capsule(cx0, cx1 - w * 0.03, ys[0], hw, h * 0.02, "core0"),
    capsule(cx0 + w * 0.02, cx0 + w * 0.3, ys[1], hw * 1.05, -h * 0.015, "core1a"),
    capsule(cx0 + w * 0.33, cx1, ys[1], hw, h * 0.01, "core1b"),
    capsule(cx0 + w * 0.04, cx1 - w * 0.08, ys[2], hw * 0.95, h * 0.02, "core2"),
  ];
  const tx = cx0 + w * 0.15, tw = w * 0.13;
  const tumour = P.blob(tx + tw / 2, ys[1], tw / 2, hw * 0.85, "coreTum", 0.12, 40);
  const barcode: Pts[] = [];
  let bx = fx + fw * 0.12;
  while (bx < fx + fw * 0.86) {
    const bw = fw * (0.015 + r() * 0.03);
    barcode.push(P.rect(bx, fy + fh * 0.1, bw, fh * 0.26, 0));
    bx += bw + fw * (0.02 + r() * 0.025);
  }
  /** Handwriting: a few connected loops per "word", two lines. */
  const scrawl = (sx: number, sy: number, len: number, key: string): Pts => {
    const rr = stream(key), pts: Pt[] = [];
    const n = 60;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([sx + t * len + Math.sin(t * 22) * fw * 0.025, sy - Math.abs(Math.sin(t * 11 + rr())) * fh * 0.07 + (rr() - 0.5) * fh * 0.02]);
    }
    return pts;
  };
  const writing = [scrawl(fx + fw * 0.12, fy + fh * 0.58, fw * 0.74, "lab1"), scrawl(fx + fw * 0.12, fy + fh * 0.8, fw * 0.5, "lab2")];
  return {
    glass: P.rect(x, y, w, h, 4),
    frost: P.rect(fx, fy, fw, fh, 3),
    barcode, writing,
    cover: P.rect(x + w * 0.27, y + h * 0.05, w * 0.7, h * 0.9, 2),
    cores, tumour,
    labelBox: [fx, fy, fw, fh] as [number, number, number, number],
    tumourBox: [tx, ys[1] - hw * 1.6, tw, hw * 3.2] as [number, number, number, number],
    labelAt: [fx + fw / 2, fy + fh / 2] as Pt,
    tumourAt: [tx + tw / 2, ys[1]] as Pt,
  };
};

/**
 * A square H&E tile of breast tissue at medium power.
 * - `idc` (invasive carcinoma of no special type): irregular nests, cords and a few small
 *   tubules of tumour cells infiltrating pale desmoplastic stroma with wavy collagen fibres;
 *   large, pleomorphic, vesicular nuclei with visible nucleoli; scattered lymphocytes.
 * - `normal`: a terminal duct lobular unit: small round acini (two-layered: cuboidal luminal
 *   cells round a small lumen, flat myoepithelial nuclei outside) in loose pale intralobular
 *   stroma, set in denser pink interlobular stroma, with fat cells in one corner.
 * Wash `field` HE.stroma (idc: HE.stromaPale), `loose` HE.stromaPale, `groups` HE.cyto, `fat`
 * white, `lumens` white; ink `fibres` darker pink; fill `nuclei` HE.nucleusLight (idc) or
 * HE.nucleus (normal), `flat` and `lymphs` HE.nucleus/HE.lymph, `nucleoli` as dots.
 */
export const breastTile = (x: number, y: number, w: number, h: number, kind: "idc" | "normal" = "idc", key = "bt") => {
  const r = stream(`${key}${kind}`);
  const S = Math.min(w, h);
  const groups: Pts[] = [], lumens: Pts[] = [], nuclei: Pts[] = [], flat: Pts[] = [], nucleoli: Pt[] = [], fat: Pts[] = [], loose: Pts[] = [];
  const fibres: Pts[] = [];
  const occupied: [number, number, number][] = [];
  const free = (px: number, py: number, pad: number) => px > x + pad && px < x + w - pad && py > y + pad && py < y + h - pad && occupied.every(([ox, oy, orr]) => Math.hypot(px - ox, py - oy) > orr + pad);
  if (kind === "idc") {
    for (let i = 0; i < 9; i++) {
      const px = x + w * (0.05 + 0.9 * (((i * 37) % 9) / 9 + r() * 0.08)) , py = y + h * (0.1 + (0.8 * ((i * 5) % 9)) / 9 + r() * 0.06);
      fibres.push(P.wave(px - S * 0.22, px + S * 0.22, py, S * 0.012, 2.5 + r() * 1.5, 40, r() * 6).map(([qx, qy]) => [qx, qy + (qx - px) * 0.25 * (i % 2 ? 1 : -1)] as Pt).filter(([qx, qy]) => qx > x + 4 && qx < x + w - 4 && qy > y + 4 && qy < y + h - 4));
    }
    let tries = 0;
    while (groups.length < 22 && tries++ < 1500) {
      const cx = x + w * (0.08 + r() * 0.84), cy = y + h * (0.08 + r() * 0.84);
      const cord = r() < 0.35, tub = !cord && r() < 0.3;
      const rx = S * (cord ? 0.13 + r() * 0.06 : 0.08 + r() * 0.05), ry = S * (cord ? 0.04 : 0.06 + r() * 0.035);
      if (!free(cx, cy, Math.max(rx, ry) * 0.75)) continue;
      occupied.push([cx, cy, Math.max(rx, ry)]);
      const ang = r() * Math.PI;
      const rot = (p: Pt): Pt => [cx + (p[0] - cx) * Math.cos(ang) - (p[1] - cy) * Math.sin(ang), cy + (p[0] - cx) * Math.sin(ang) + (p[1] - cy) * Math.cos(ang)];
      groups.push(P.blob(cx, cy, rx, ry, `${key}g${groups.length}`, 0.22, 40).map(rot));
      if (tub) lumens.push(P.blob(cx, cy, rx * 0.32, ry * 0.4, `${key}l${groups.length}`, 0.2, 20).map(rot));
      const nn = Math.round((rx * ry) / (S * S * 0.0007));
      for (let k = 0; k < nn; k++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.78;
        const p = rot([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d]);
        if (tub && Math.hypot((p[0] - cx) / (rx * 0.4), (p[1] - cy) / (ry * 0.5)) < 1) continue;
        const nr = S * (0.015 + r() * 0.016);
        nuclei.push(P.blob(p[0], p[1], nr, nr * (0.7 + r() * 0.3), `${key}n${nuclei.length}`, 0.22, 14));
        nucleoli.push([p[0] + (r() - 0.5) * nr * 0.5, p[1] + (r() - 0.5) * nr * 0.5]);
      }
    }
  } else {
    const lx = x + w * 0.42, ly = y + h * 0.45, lr = S * 0.32;
    loose.push(P.blob(lx, ly, lr, lr * 0.85, `${key}lob`, 0.12, 48));
    occupied.push([lx, ly, lr * 0.95]);
    const acini: Pt[] = [];
    for (let k = 0; k < 13; k++) {
      const a = k * 2.4, d = Math.sqrt((k + 0.5) / 13) * lr * 0.72;
      acini.push([lx + Math.cos(a) * d, ly + Math.sin(a) * d * 0.85]);
    }
    acini.forEach(([ax, ay], k) => {
      const ar = S * (0.05 + r() * 0.01);
      groups.push(P.blob(ax, ay, ar, ar * 0.92, `${key}a${k}`, 0.06, 28));
      lumens.push(P.blob(ax, ay, ar * 0.3, ar * 0.26, `${key}al${k}`, 0.15, 16));
      for (let j = 0; j < 9; j++) {
        const t = (j / 9) * Math.PI * 2 + r() * 0.2;
        const nx = ax + Math.cos(t) * ar * 0.6, ny = ay + Math.sin(t) * ar * 0.6, nr = ar * 0.15;
        nuclei.push(P.ellipse(nx, ny, nr, nr * 0.85, 0, Math.PI * 2, 12));
        const mx = ax + Math.cos(t + 0.35) * ar * 0.96, my = ay + Math.sin(t + 0.35) * ar * 0.96;
        flat.push(P.ellipse(0, 0, ar * 0.17, ar * 0.05, 0, Math.PI * 2, 12).map(([qx, qy]) => [mx + qx * Math.cos(t + 1.92) - qy * Math.sin(t + 1.92), my + qx * Math.sin(t + 1.92) + qy * Math.cos(t + 1.92)] as Pt));
      }
    });
    for (let i = 0; i < 6; i++) {
      const fy = y + h * (0.08 + i * 0.16);
      fibres.push(P.wave(x + w * 0.05, x + w * 0.95, fy, S * 0.01, 3, 60, i));
    }
    const fx0 = x + w * 0.8, fy0 = y + h * 0.82;
    for (let k = 0; k < 6; k++) {
      const fx = fx0 + ((k % 3) - 1) * S * 0.11, fy = fy0 + (Math.floor(k / 3) - 0.5) * S * 0.12;
      fat.push(P.blob(fx + (r() - 0.5) * S * 0.02, fy, S * 0.062, S * 0.056, `${key}fat${k}`, 0.1, 9));
    }
    occupied.push([fx0, fy0, S * 0.2]);
  }
  const lymphs = granules(x + w / 2, y + h / 2, Math.hypot(w, h) / 2, kind === "idc" ? 45 : 30, `${key}${kind}ly`, (px, py) => !free(px, py, 6))
    .map(([px, py]) => P.ellipse(px, py, S * 0.009, S * 0.008, 0, Math.PI * 2, 10));
  const spindles = granules(x + w / 2, y + h / 2, Math.hypot(w, h) / 2, 14, `${key}${kind}sp`, (px, py) => !free(px, py, 8))
    .map(([px, py], i) => P.ellipse(0, 0, S * 0.022, S * 0.005, 0, Math.PI * 2, 10).map(([qx, qy]) => [px + qx * Math.cos(i) - qy * Math.sin(i), py + qx * Math.sin(i) + qy * Math.cos(i)] as Pt));
  return { field: P.rect(x, y, w, h, 4), loose, groups, lumens, nuclei, flat, nucleoli, lymphs, spindles, fibres, fat };
};

/**
 * A Grad-CAM style heat spot: four nested irregular contours, outermost first, for washing with
 * HEAT[0..3] (blue, green, yellow, red) over an image. Centre (cx, cy), outer radii rx, ry.
 */
export const heatSpot = (cx: number, cy: number, rx: number, ry: number, key = "hs") =>
  [1, 0.74, 0.5, 0.28].map((k, i) => P.blob(cx + (i ? (stream(`${key}${i}`)() - 0.5) * rx * 0.12 : 0), cy, rx * k, ry * k, `${key}r${i}`, 0.14 + i * 0.03, 48));

/**
 * A SHAP waterfall for one prediction, read top to bottom: the model's average (base) value, one
 * horizontal bar per feature starting where the running total stands (positive bars to the right,
 * negative to the left), and the final value. Box w × h; the feature names sit in the left
 * column (`labelAt`, right-aligned at the column edge), the chart to the right with an axis and
 * ticks along the bottom. `steps` values and `base` in percentage points; `max` the axis end.
 * Parts: `axis`, `ticks` [{ at: Pt, v }], `baseLine` / `finalLine` (dashed verticals as strokes),
 * `rows` [{ rect, up, labelAt, valueAt }], `connectors`, `baseAt`, `finalAt`.
 */
export const shapWaterfall = (x: number, y: number, w: number, h: number, base: number, steps: number[], max = 30, labelW = 0.34) => {
  const cx0 = x + w * labelW, cw = w - w * labelW - 20;
  const X = (v: number) => cx0 + (v / max) * cw;
  const n = steps.length, top = y + h * 0.14, rowH = (h * 0.72) / n, barH = rowH * 0.62;
  const axisY = y + h * 0.9;
  let cum = base;
  const rows = steps.map((v, i) => {
    const a = cum, b = cum + v, ry = top + i * rowH + (rowH - barH) / 2;
    cum = b;
    const x1 = X(Math.min(a, b)), x2 = X(Math.max(a, b));
    return { rect: P.rect(x1, ry, Math.max(6, x2 - x1), barH, 4), up: v > 0, labelAt: [cx0 - 18, ry + barH * 0.72] as Pt, valueAt: [v > 0 ? x2 + 12 : x1 - 12, ry + barH * 0.72] as Pt, from: a, to: b, mid: [(x1 + x2) / 2, ry + barH / 2] as Pt };
  });
  const dash = (xv: number, y1: number, y2: number): Pts[] => {
    const out: Pts[] = [];
    for (let yy = y1; yy < y2; yy += 22) out.push(P.line(xv, yy, xv, Math.min(y2, yy + 12), 2));
    return out;
  };
  const connectors = rows.slice(0, -1).map((rw, i) => P.line(X(rw.to), top + i * rowH + (rowH + barH) / 2, X(rw.to), top + (i + 1) * rowH + (rowH - barH) / 2, 4));
  return {
    axis: P.line(cx0, axisY, cx0 + cw, axisY, 24),
    ticks: Array.from({ length: Math.floor(max / 10) + 1 }, (_, k) => ({ at: [X(k * 10), axisY + 40] as Pt, v: k * 10, tick: P.line(X(k * 10), axisY, X(k * 10), axisY + 10, 2) })),
    baseLine: dash(X(base), y + h * 0.08, axisY),
    finalLine: dash(X(cum), top, axisY),
    rows, connectors,
    baseAt: [X(base), y + h * 0.06] as Pt,
    finalAt: [X(cum), axisY - 8] as Pt,
    X,
  };
};

/**
 * LIME superpixels: a jittered grid of irregular quadrilateral patches covering a box (shared
 * corners, so the patches tile without gaps). `cells[i]` closed; grey some out to show "hidden".
 */
export const superpixels = (x: number, y: number, w: number, h: number, cols = 5, rows = 5, key = "sp") => {
  const r = stream(key);
  const V: Pt[][] = [];
  for (let j = 0; j <= rows; j++) {
    V.push([]);
    for (let i = 0; i <= cols; i++) {
      const edgeX = i === 0 || i === cols, edgeY = j === 0 || j === rows;
      V[j].push([x + (i / cols) * w + (edgeX ? 0 : (r() - 0.5) * (w / cols) * 0.5), y + (j / rows) * h + (edgeY ? 0 : (r() - 0.5) * (h / rows) * 0.5)]);
    }
  }
  const cells: Pts[] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) cells.push(P.polyline([V[j][i], V[j][i + 1], V[j + 1][i + 1], V[j + 1][i], V[j][i]], 14));
  return { cells, cols, rows };
};

/**
 * A radiographer's lead side marker as it shows on a film: a small rounded square plate with two
 * rivets (the letter, R or L, is a typeset Label at `letterAt`). Top-left (x, y), side s.
 */
export const filmToken = (x: number, y: number, s = 60) => ({
  plate: P.rect(x, y, s, s, s * 0.14),
  rivets: [P.ellipse(x + s * 0.16, y + s * 0.16, s * 0.05, s * 0.05, 0, Math.PI * 2, 10), P.ellipse(x + s * 0.84, y + s * 0.84, s * 0.05, s * 0.05, 0, Math.PI * 2, 10)],
  letterAt: [x + s / 2, y + s * 0.72] as Pt,
});

/**
 * A model card, like a package insert: a card with a folded top-right corner, a coloured title
 * band, and `n` rows, each a small square bullet and two text lines (labels are typeset at
 * `rowAt(i)`, left-aligned after the bullet). Box w × h.
 */
export const modelCard = (x: number, y: number, w: number, h: number, n = 5) => {
  const band = h * 0.16, fold = Math.min(w, h) * 0.1;
  const gap = (h - band - 30) / n;
  return {
    card: P.polyline([[x, y], [x + w - fold, y], [x + w, y + fold], [x + w, y + h], [x, y + h], [x, y]], 14),
    fold: P.polyline([[x + w - fold, y], [x + w - fold, y + fold], [x + w, y + fold]], 10),
    band: P.rect(x + 1, y + 1, w - fold - 2, band, 2),
    bullets: Array.from({ length: n }, (_, i) => P.rect(x + 30, y + band + 22 + i * gap + gap * 0.18, gap * 0.3, gap * 0.3, 3)),
    lines: Array.from({ length: n }, (_, i) => P.line(x + 50 + gap * 0.3, y + band + 22 + i * gap + gap * 0.82, x + w - 40 - (i % 2) * w * 0.15, y + band + 22 + i * gap + gap * 0.82, 10)),
    titleAt: [x + (w - fold) / 2, y + band * 0.68] as Pt,
    rowAt: (i: number) => [x + 50 + gap * 0.3, y + band + 22 + i * gap + gap * 0.46] as Pt,
  };
};

/** A snow bank: a lumpy white mound along the ground and falling flakes above it. Box w × h, ground at y + h. */
export const snowBank = (x: number, y: number, w: number, h: number, key = "snow") => {
  const r = stream(key);
  const top: Pt[] = [];
  for (let i = 0; i <= 30; i++) top.push([x + (i / 30) * w, y + h * 0.62 - Math.sin((i / 30) * Math.PI) * h * 0.12 - Math.sin(i * 1.3) * h * 0.03]);
  return {
    mound: [...top, [x + w, y + h], [x, y + h], top[0]] as Pts,
    flakes: Array.from({ length: 26 }, () => [x + r() * w, y + r() * h * 0.5] as Pt),
  };
};

/* ---- E19 (Nov 2026): world map, Pap smear field, scales of justice, passport ---- */

/** Continent outlines as [longitude, latitude] rings (coarse coastlines, about 1:100 M). */
const LANDS: [number, number][][] = [
  // North America (Alaska → Arctic → Labrador → east coast → Gulf → Central America → west coast)
  [[-168, 66], [-162, 70], [-150, 71], [-140, 70], [-128, 70], [-115, 68], [-100, 68], [-95, 72], [-85, 70], [-80, 64], [-90, 57], [-82, 53], [-78, 60], [-72, 60], [-65, 58], [-60, 54], [-56, 51], [-60, 47], [-66, 45], [-70, 42], [-74, 40], [-76, 37], [-76, 35], [-81, 31], [-80, 26], [-82, 28], [-84, 30], [-90, 30], [-94, 29], [-97, 26], [-97, 21], [-94, 18], [-90, 21], [-87, 21], [-88, 16], [-84, 15], [-83, 10], [-79, 9], [-77, 8], [-80, 7], [-83, 8], [-86, 12], [-92, 14], [-96, 16], [-105, 20], [-106, 23], [-112, 29], [-114, 31], [-110, 23], [-117, 32], [-120, 34], [-124, 40], [-124, 46], [-123, 49], [-128, 51], [-132, 55], [-138, 59], [-147, 61], [-153, 59], [-158, 57], [-163, 55], [-158, 59], [-162, 60], [-165, 62], [-168, 66]],
  // Greenland
  [[-55, 60], [-45, 60], [-40, 65], [-22, 70], [-20, 77], [-30, 82], [-55, 82], [-70, 78], [-60, 75], [-55, 70], [-52, 65], [-55, 60]],
  // South America
  [[-77, 8], [-72, 12], [-63, 11], [-60, 8], [-52, 5], [-50, 0], [-44, -2], [-35, -5], [-35, -9], [-39, -15], [-40, -22], [-48, -26], [-53, -34], [-58, -38], [-62, -40], [-65, -45], [-68, -50], [-69, -55], [-72, -53], [-75, -48], [-74, -40], [-73, -30], [-71, -18], [-76, -14], [-81, -5], [-80, 0], [-78, 2], [-77, 8]],
  // Eurasia (Iberia → Baltic → Scandinavia → Arctic → Pacific → South-East Asia → India → Arabia → Red Sea → Mediterranean)
  [[-6, 36], [-9, 37], [-9, 43], [-2, 43.5], [-1, 46], [-4, 48], [2, 51], [5, 53], [8, 54], [8, 57], [10, 57], [11, 55], [13, 55], [14, 54], [20, 55], [21, 57], [24, 59], [22, 61], [25, 65], [22, 66], [18, 63], [17, 61], [19, 60], [16, 57], [12, 56], [11, 59], [6, 58], [5, 62], [12, 66], [15, 69], [22, 70], [28, 71], [33, 69], [40, 67], [44, 68], [50, 68], [60, 69], [68, 72], [73, 72], [80, 73], [90, 76], [100, 77], [110, 74], [120, 73], [130, 71], [140, 72], [150, 71], [160, 70], [170, 70], [180, 68], [180, 65], [175, 63], [165, 60], [162, 57], [156, 51], [156, 57], [160, 61], [154, 59], [143, 59], [137, 54], [141, 52], [140, 48], [135, 43], [130, 42], [129, 36], [126, 35], [126, 38], [125, 40], [121, 39], [122, 37], [119, 35], [121, 32], [122, 30], [120, 26], [116, 23], [110, 21], [108, 22], [106, 19], [108, 15], [109, 12], [105, 9], [103, 10], [100, 13], [100, 8], [103, 4], [104, 1.5], [101, 3], [98, 8], [98, 16], [94, 17], [94, 20], [92, 22], [90, 22], [87, 21], [85, 20], [82, 17], [80, 15], [80, 10], [78, 8], [76, 9], [74, 14], [73, 17], [73, 20], [70, 21], [68, 23], [66, 25], [62, 25], [57, 25], [57, 27], [54, 27], [51, 26], [50, 30], [48, 30], [50, 26], [52, 24], [56, 24], [56, 26], [59, 23], [56, 18], [52, 16], [45, 13], [43, 14], [39, 21], [35, 28], [34, 29.5], [33, 31], [35, 33], [36, 36], [30, 36], [27, 37], [26, 40], [23, 40.5], [24, 38], [22, 36.5], [20, 40], [19, 42], [16, 43.5], [13.5, 45.5], [12, 44], [16, 41], [18, 40], [16, 38], [15.5, 40], [12, 42], [10, 44], [8, 44], [6, 43], [3, 43], [3, 42], [0, 40], [-1, 37], [-6, 36]],
  // Africa
  [[-6, 35.8], [10, 37], [11, 34], [20, 31], [25, 32], [32, 31], [34, 28], [36, 24], [38, 18], [43, 12], [51, 12], [48, 6], [42, -1], [40, -10], [40, -15], [35, -24], [32, -29], [27, -34], [20, -35], [18, -32], [15, -27], [12, -17], [13, -12], [9, -1], [10, 4], [5, 6], [-2, 5], [-8, 4], [-13, 8], [-17, 14], [-17, 21], [-13, 28], [-10, 30], [-6, 35.8]],
  // Madagascar, Britain, Ireland, Sri Lanka, Japan (Honshu, Hokkaido), Sumatra, Borneo, New Guinea, Australia, New Zealand
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17], [44, -25]],
  [[-5, 50], [1, 51], [1.7, 52.7], [0, 54], [-2, 56], [-2, 58], [-5, 58.5], [-6, 56], [-5, 55], [-3, 54], [-4, 53], [-5, 52], [-5, 50]],
  [[-10, 52], [-6, 52], [-6, 55], [-8, 55], [-10, 54], [-10, 52]],
  [[80, 6], [82, 7.5], [80, 9.8], [79.7, 8], [80, 6]],
  [[130, 31], [135, 34], [140, 35], [141, 41], [140, 38], [136, 36], [132, 34], [130, 31]],
  [[140, 42], [145, 43], [142, 46], [140, 42]],
  [[95, 5.5], [106, -6], [104, -6], [95, 3], [95, 5.5]],
  [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3], [109, 1]],
  [[131, -1], [141, -3], [150, -10], [141, -9], [137, -5], [131, -1]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [136, -15], [141, -17], [142, -11], [146, -19], [153, -25], [151, -34], [146, -39], [140, -38], [135, -35], [131, -31], [115, -34], [114, -22]],
  [[172, -34], [178, -38], [174, -42], [167, -46], [172, -41], [172, -34]],
];

/**
 * A world map (equirectangular, longitude −170° to 190°, latitude 82° N to 56° S) in the box
 * w × h (w ≈ 2.6 h looks right). `lands` are closed outlines to wash and ink; `at(lon, lat)`
 * projects any place; `usAt`, `euAt` (Brussels) and `indiaAt` (New Delhi) are pin points.
 */
export const worldMap = (x: number, y: number, w: number, h: number) => {
  const at = (lon: number, lat: number): Pt => [x + ((lon + 170) / 360) * w, y + ((82 - lat) / 138) * h];
  return {
    frame: P.rect(x, y, w, h, 10),
    lands: LANDS.map((ring) => ring.map(([lo, la]) => at(lo, la)) as Pts),
    at,
    usAt: at(-77, 39), euAt: at(4.4, 50.8), indiaAt: at(77.2, 28.6),
  };
};

/** Papanicolaou stain colours: superficial cells pink-orange, intermediate cells blue-green, nuclei. */
export const PAP = { bg: "#F4EFE6", pink: "#F3B6C4", cyan: "#A8D4DA", rim: "#8C6F86", nucleus: "#3E3466", hsil: "#2A1F57", hsilCyto: "#9FC6CF" } as const;

/**
 * A Pap smear field: large flat polygonal squamous cells (pink superficial and blue-green
 * intermediate, small round nuclei), overlapping, plus `abnormal` small cells with a large dark
 * irregular nucleus (high nuclear-to-cytoplasmic ratio, as in HSIL). Wash `field` PAP.bg, each
 * cell's `cyto` in its `color`, fill `nucleus`; `abnormalAt` lists the abnormal cells' centres.
 */
export const papSmear = (x: number, y: number, w: number, h: number, key = "pap", abnormal = 2) => {
  const r = stream(key);
  const R = Math.min(w, h);
  const cells: { cyto: Pts; nucleus: Pts; color: string }[] = [];
  const cols = 4, rows = 3;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const cw = w / cols, ch = h / rows;
    const rr = Math.min(cw / 1.85, ch / 1.4) * (0.85 + r() * 0.2);
    const cx = x + (i + 0.5) * cw + (r() - 0.5) * cw * 0.2, cy = y + (j + 0.5) * ch + (r() - 0.5) * ch * 0.2;
    const n = 5 + Math.floor(r() * 3), a0 = r() * Math.PI;
    const ring: Pt[] = [];
    for (let k = 0; k <= n; k++) {
      const a = a0 + (k % n) * (Math.PI * 2) / n + (r() - 0.5) * 0.5, d = rr * (0.78 + r() * 0.24);
      ring.push([Math.min(x + w - 5, Math.max(x + 5, cx + Math.cos(a) * d * 1.12)), Math.min(y + h - 5, Math.max(y + 5, cy + Math.sin(a) * d * 0.84))]);
    }
    const cyto = P.polyline(ring.map((p, k) => (k === n ? ring[0] : p)), 10);
    cells.push({ cyto, nucleus: P.blob(cx + (r() - 0.5) * rr * 0.3, cy + (r() - 0.5) * rr * 0.3, R * 0.022, R * 0.02, `${key}n${i}${j}`, 0.1, 16), color: r() < 0.55 ? PAP.pink : PAP.cyan });
  }
  const abnormalAt: Pt[] = [];
  const spots: [number, number][] = [[0.38, 0.55], [0.7, 0.3], [0.2, 0.25]];
  for (let k = 0; k < abnormal; k++) {
    const [u, v] = spots[k % spots.length];
    const cx = x + w * u, cy = y + h * v;
    abnormalAt.push([cx, cy]);
    cells.push({
      cyto: P.blob(cx, cy, R * 0.085, R * 0.075, `${key}ac${k}`, 0.16, 32),
      nucleus: P.blob(cx + R * 0.008, cy, R * 0.055, R * 0.048, `${key}an${k}`, 0.28, 28),
      color: PAP.hsilCyto,
    });
  }
  return { field: P.rect(x, y, w, h, 6), cells, abnormalAt, nNormal: rows * cols };
};

/** Scales of justice: a post on a base, a beam tilted by `tilt` (radians), two hanging pans on chains. */
export const scales = (cx: number, y: number, s = 1, tilt = 0) => {
  const W = 300 * s, H = 300 * s, half = W / 2;
  const top: Pt = [cx, y + 30 * s];
  const L: Pt = [cx - half * Math.cos(tilt), top[1] - half * Math.sin(tilt)], Rt: Pt = [cx + half * Math.cos(tilt), top[1] + half * Math.sin(tilt)];
  const pan = (p: Pt) => {
    const py = p[1] + 120 * s;
    return { chains: [P.line(p[0], p[1], p[0] - 50 * s, py, 8), P.line(p[0], p[1], p[0] + 50 * s, py, 8)], dish: P.polyline([...Array.from({ length: 13 }, (_, k) => [p[0] - 60 * s + (k / 12) * 120 * s, py + Math.sin((k / 12) * Math.PI) * 28 * s] as Pt), [p[0] - 60 * s, py]], 8) };
  };
  const pl = pan(L), pr = pan(Rt);
  return {
    post: P.line(cx, y, cx, y + H, 10),
    base: P.polyline([[cx - 90 * s, y + H + 24 * s], [cx + 90 * s, y + H + 24 * s], [cx + 40 * s, y + H], [cx - 40 * s, y + H], [cx - 90 * s, y + H + 24 * s]], 10),
    knob: P.ellipse(cx, y, 14 * s, 14 * s, 0, Math.PI * 2, 20),
    beam: P.line(L[0], L[1], Rt[0], Rt[1], 10),
    chains: [...pl.chains, ...pr.chains], pans: [pl.dish, pr.dish],
    leftAt: [L[0], L[1] + 150 * s] as Pt, rightAt: [Rt[0], Rt[1] + 150 * s] as Pt,
  };
};

/** A passport booklet: cover with rounded spine edge, an emblem (circle with a wheel of 12 spokes), a title band and a chip mark. Box w × h (portrait, w ≈ 0.7 h). */
export const passport = (x: number, y: number, w: number, h: number) => {
  const ec: Pt = [x + w / 2, y + h * 0.46], er = w * 0.2;
  return {
    cover: P.rect(x, y, w, h, w * 0.06),
    spine: P.line(x + w * 0.06, y + 4, x + w * 0.06, y + h - 4, 10),
    emblem: [P.ellipse(ec[0], ec[1], er, er, 0, Math.PI * 2, 40), ...Array.from({ length: 12 }, (_, k) => P.line(ec[0], ec[1], ec[0] + Math.cos((k * Math.PI) / 6) * er * 0.85, ec[1] + Math.sin((k * Math.PI) / 6) * er * 0.85, 4))],
    titleLine: P.line(x + w * 0.2, y + h * 0.21, x + w * 0.8, y + h * 0.21, 8),
    chip: P.rect(x + w * 0.42, y + h * 0.82, w * 0.16, h * 0.07, 4),
    titleAt: [x + w / 2, y + h * 0.12] as Pt, nameAt: [x + w / 2, y + h * 0.74] as Pt,
  };
};

/* ---- E20 (Nov 2026): chest radiograph, axial head CT, U-Net diagram, handheld skin probe ---- */

/**
 * A frontal (PA) chest radiograph as it looks on a light box: black film, mid-grey soft tissue of
 * the torso and shoulders, two dark lung fields, the white mediastinum and heart (bulging to the
 * patient's left, the viewer's right), the spine behind it, clavicles, eight posterior ribs on
 * each side, the diaphragm domes, and an optional solitary nodule in the patient's right mid zone
 * (viewer's left). Box w × h (portrait, w ≈ 0.85 h). Parts: `film`, `body`, `lungs` [R, L],
 * `mediastinum`, `spine`, `ribs`, `clavicles`, `nodule` (closed, slightly lobulated: the
 * segmentation outline), `nodAt`, `nodR`, `nodBox` [x, y, w, h] (the detection box),
 * `boxCorners` (four corner brackets for that box), `markerAt` (the side marker "R").
 */
export const chestXray = (x: number, y: number, w: number, h: number, nodule = true) => {
  const T = (u: number, v: number): Pt => [x + u * w, y + v * h];
  const C = (pts: [number, number][], step = 10): Pts => P.polyline([...pts.map(([u, v]) => T(u, v)), T(pts[0][0], pts[0][1])], step);
  const body = C([[0.44, 0.03], [0.56, 0.03], [0.58, 0.1], [0.78, 0.13], [0.92, 0.2], [0.96, 0.32], [0.93, 0.6], [0.9, 0.97], [0.1, 0.97], [0.07, 0.6], [0.04, 0.32], [0.08, 0.2], [0.22, 0.13], [0.42, 0.1]]);
  const lungR = C([[0.4, 0.17], [0.32, 0.18], [0.22, 0.26], [0.16, 0.42], [0.14, 0.6], [0.15, 0.74], [0.18, 0.79], [0.27, 0.73], [0.38, 0.69], [0.44, 0.68], [0.44, 0.5], [0.43, 0.3]]);
  const lungL = C([[0.6, 0.17], [0.68, 0.18], [0.78, 0.26], [0.84, 0.42], [0.86, 0.6], [0.85, 0.76], [0.82, 0.81], [0.76, 0.77], [0.7, 0.74], [0.66, 0.66], [0.6, 0.55], [0.57, 0.44], [0.57, 0.3]]);
  const mediastinum = C([[0.45, 0.12], [0.55, 0.12], [0.57, 0.3], [0.6, 0.42], [0.7, 0.55], [0.73, 0.68], [0.68, 0.77], [0.5, 0.79], [0.4, 0.76], [0.38, 0.66], [0.43, 0.5], [0.43, 0.3]]);
  const spine = C([[0.475, 0.04], [0.525, 0.04], [0.53, 0.96], [0.47, 0.96]]);
  const ribs: Pts[] = [];
  for (let k = 0; k < 8; k++) {
    const v = 0.2 + k * 0.068;
    ribs.push(cubic(T(0.46, v), T(0.3, v - 0.05), T(0.16, v + 0.0), T(0.15, v + 0.1 + k * 0.004), 16));
    ribs.push(cubic(T(0.54, v), T(0.7, v - 0.05), T(0.84, v + 0.0), T(0.85, v + 0.1 + k * 0.004), 16));
  }
  const clavicles = [cubic(T(0.47, 0.17), T(0.38, 0.13), T(0.28, 0.16), T(0.18, 0.13), 14), cubic(T(0.53, 0.17), T(0.62, 0.13), T(0.72, 0.16), T(0.82, 0.13), 14)];
  const vessels: Pts[] = [];
  for (const sd of [-1, 1]) {
    const hx = 0.5 + sd * 0.11, hy = 0.42;
    for (let k = 0; k < 5; k++) {
      const a = -0.9 + k * 0.45, len = 0.17 + (k % 2) * 0.05;
      const ex = hx + sd * Math.cos(a) * len * 0.9, ey = hy + Math.sin(a) * len;
      vessels.push(cubic(T(hx, hy), T(hx + sd * 0.05, hy + Math.sin(a) * 0.04), T((hx + ex) / 2, (hy + ey) / 2), T(ex, ey), 10));
    }
  }
  const nodAt = T(0.3, 0.44), nodR = w * 0.042;
  const b = nodR * 2.1, bx = nodAt[0] - b, by = nodAt[1] - b, bs = b * 2, k = bs * 0.28;
  const corner = (x0: number, y0: number, dx: number, dy: number) => P.polyline([[x0 + dx * k, y0], [x0, y0], [x0, y0 + dy * k]], 6);
  return {
    film: P.rect(x, y, w, h, 8), body, lungs: [lungR, lungL], mediastinum, spine, ribs, clavicles, vessels,
    nodule: nodule ? P.blob(nodAt[0], nodAt[1], nodR, nodR * 0.9, "cxrNodule", 0.12, 36) : ([] as unknown as Pts),
    nodAt, nodR, nodBox: [bx, by, bs, bs] as [number, number, number, number],
    boxCorners: [corner(bx, by, 1, 1), corner(bx + bs, by, -1, 1), corner(bx, by + bs, 1, -1), corner(bx + bs, by + bs, -1, -1)],
    markerAt: T(0.1, 0.07),
  };
};

/**
 * An axial non-contrast head CT slice at the level of the lateral ventricles, radiological
 * convention (patient's right on the viewer's left): black background square, the white skull
 * (outer and inner table), grey brain, darker CSF in a few sulci, the falx in the midline, the
 * two frontal horns of the lateral ventricles (dark, butterfly), and an optional hyperdense
 * (white) intraparenchymal bleed in the patient's right basal ganglia with a dark rim of oedema.
 * Centre (cx, cy), half-width r. Parts: `frame`, `skull` (outer), `inner`, `brain`, `sulci`,
 * `falx`, `ventricles` [R, L], `bleed`, `oedema`, `bleedAt`, `bleedBox`, `boxCorners`.
 */
export const headCT = (cx: number, cy: number, r: number, bleed = true) => {
  const rx = r * 0.78, ry = r * 0.92;
  const vent = (s: number) => {
    const A = (u: number, v: number): Pt => [cx + s * u * r, cy + v * r];
    return [...cubic(A(0.03, -0.32), A(0.17, -0.34), A(0.2, -0.12), A(0.1, 0.0), 12), ...cubic(A(0.1, 0.0), A(0.07, 0.06), A(0.08, 0.14), A(0.04, 0.14), 8).slice(1),
      ...cubic(A(0.04, 0.14), A(0.02, 0.04), A(0.02, -0.2), A(0.03, -0.32), 10).slice(1)] as Pts;
  };
  const sulci: Pts[] = [];
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 + 0.2, a2 = a + 0.06;
    const r0 = 0.86, r1 = 0.72 + 0.05 * (k % 3);
    sulci.push(P.polyline([[cx + Math.cos(a) * rx * r0 * 0.95, cy + Math.sin(a) * ry * r0 * 0.95], [cx + Math.cos(a2) * rx * r1, cy + Math.sin(a2) * ry * r1]], 6));
  }
  const bAt: Pt = [cx - r * 0.32, cy + r * 0.02], br = r * 0.13;
  const b = br * 1.9, bx = bAt[0] - b, by = bAt[1] - b, bs = b * 2, k = bs * 0.28;
  const corner = (x0: number, y0: number, dx: number, dy: number) => P.polyline([[x0 + dx * k, y0], [x0, y0], [x0, y0 + dy * k]], 6);
  return {
    frame: P.rect(cx - r * 1.05, cy - r * 1.05, r * 2.1, r * 2.1, 6),
    skull: P.blob(cx, cy, rx * 1.1, ry * 1.06, "ctSkull", 0.02, 72),
    inner: P.blob(cx, cy, rx * 1.0, ry * 0.97, "ctInner", 0.02, 72),
    brain: P.blob(cx, cy, rx * 0.98, ry * 0.95, "ctInner", 0.02, 72),
    sulci, falx: P.line(cx, cy - ry * 0.95, cx, cy + ry * 0.95, 20),
    ventricles: [vent(-1), vent(1)],
    bleed: bleed ? P.blob(bAt[0], bAt[1], br * 1.1, br * 0.85, "ctBleed", 0.18, 32) : ([] as unknown as Pts),
    oedema: bleed ? P.blob(bAt[0], bAt[1], br * 1.55, br * 1.25, "ctOed", 0.12, 32) : ([] as unknown as Pts),
    bleedAt: bAt, bleedBox: [bx, by, bs, bs] as [number, number, number, number],
    boxCorners: [corner(bx, by, 1, 1), corner(bx + bs, by, -1, 1), corner(bx, by + bs, 1, -1), corner(bx + bs, by + bs, -1, -1)],
  };
};

/**
 * The U-Net diagram (Ronneberger 2015, Fig. 1, simplified): feature-map blocks down the left arm
 * (four levels, each lower and narrower: the contracting path), one block at the bottom, four up
 * the right arm (the expanding path), red down-arrows between left levels, green up-arrows on the
 * right, and grey "bridge" arrows across the U at each level (skip connections). A small input
 * image tile at the far left and an output mask tile at the far right. Box w × h (w ≈ 1.6 h).
 * Parts: `left`, `right` (block rects, top level first), `bottom`, `downs`, `ups`, `bridges`,
 * `inTile`, `outTile`, `whatAt`, `whereAt`, `bridgeAt` (label points), `bridgeMid` (centres).
 */
export const uNet = (x: number, y: number, w: number, h: number) => {
  const lv = 4, bw = w * 0.05, gap = w * 0.012;
  const lvlY = (i: number) => y + h * 0.04 + i * h * 0.2;
  const lvlH = (i: number) => h * (0.17 - i * 0.025);
  const lx = (i: number) => x + w * 0.14 + i * w * 0.075;
  const rx = (i: number) => x + w * 0.86 - i * w * 0.075 - 2 * bw - gap;
  const pair = (x0: number, y0: number, hh: number) => [P.rect(x0, y0, bw, hh, 3), P.rect(x0 + bw + gap, y0, bw, hh, 3)];
  const left = Array.from({ length: lv }, (_, i) => pair(lx(i), lvlY(i), lvlH(i)));
  const right = Array.from({ length: lv }, (_, i) => pair(rx(i), lvlY(i), lvlH(i)));
  const bx0 = x + w / 2 - bw - gap / 2, by0 = lvlY(lv), bh = lvlH(lv);
  const bottom = pair(bx0, by0, bh);
  const arrow = (a: Pt, b: Pt): Pts[] => {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hl = w * 0.016;
    return [P.line(a[0], a[1], b[0], b[1], 10), P.polyline([[b[0] - Math.cos(ang - 0.5) * hl, b[1] - Math.sin(ang - 0.5) * hl], b, [b[0] - Math.cos(ang + 0.5) * hl, b[1] - Math.sin(ang + 0.5) * hl]], 4)];
  };
  const downs: Pts[] = [], ups: Pts[] = [], bridges: Pts[] = [], bridgeMid: Pt[] = [];
  for (let i = 0; i < lv; i++) {
    const nx = i + 1 < lv ? lx(i + 1) : bx0, ny = i + 1 < lv ? lvlY(i + 1) : by0;
    downs.push(...arrow([lx(i) + bw, lvlY(i) + lvlH(i) + 4], [nx + bw * 0.6, ny - 6]));
    const ux = i + 1 < lv ? rx(i + 1) + 2 * bw + gap : bx0 + 2 * bw + gap, uy = i + 1 < lv ? lvlY(i + 1) : by0;
    ups.push(...arrow([ux - bw * 0.6, uy - 6], [rx(i) + bw, lvlY(i) + lvlH(i) + 4]));
    const yy = lvlY(i) + lvlH(i) / 2;
    bridges.push(...arrow([lx(i) + 2 * bw + gap + 8, yy], [rx(i) - 8, yy]));
    bridgeMid.push([(lx(i) + 2 * bw + gap + rx(i)) / 2, yy]);
  }
  const ts = h * 0.17;
  return {
    left, right, bottom, downs, ups, bridges, bridgeMid,
    inTile: P.rect(x, lvlY(0), ts * 0.95, ts, 4), outTile: P.rect(x + w - ts * 0.95, lvlY(0), ts * 0.95, ts, 4),
    inBox: [x, lvlY(0), ts * 0.95, ts] as [number, number, number, number], outBox: [x + w - ts * 0.95, lvlY(0), ts * 0.95, ts] as [number, number, number, number],
    whatAt: [lx(1) - w * 0.06, lvlY(3) + h * 0.06] as Pt, whereAt: [rx(1) + w * 0.12, lvlY(3) + h * 0.06] as Pt, bridgeAt: [x + w / 2, lvlY(0) - h * 0.02] as Pt,
  };
};

/**
 * A handheld skin probe (spectroscopy pen of the kind authorised for primary care in 2024): a
 * long rounded body angled down to the left, a small screen, a grip band, a tapered nose with the
 * optical window at the tip, held over a pigmented lesion on a patch of skin; three short light
 * rays go down from the tip and three scatter back up. Local box 520 × 360 at (x, y) × s.
 * Parts: `skin` (closed), `body`, `screen`, `grip`, `nose`, `window`, `raysIn`, `raysOut`,
 * `lesionAt` (centre of the lesion; draw kit `lesion` there), `tipAt`.
 */
export const skinProbe = (x: number, y: number, s = 1) => {
  const T = (u: number, v: number): Pt => [x + u * s, y + v * s];
  const rot = (u: number, v: number): Pt => {
    const a = -0.42, ox = 300, oy = 120; // body tilted, nose down-left
    const du = u - ox, dv = v - oy;
    return T(ox + du * Math.cos(a) - dv * Math.sin(a), oy + du * Math.sin(a) + dv * Math.cos(a));
  };
  const R = (pts: [number, number][]) => P.polyline([...pts.map(([u, v]) => rot(u, v)), rot(pts[0][0], pts[0][1])], 8);
  const tip = rot(150, 120);
  const lesionAt: Pt = [tip[0] - 4 * s, y + 318 * s];
  return {
    skin: P.polyline([T(0, 290), T(520, 290), T(520, 360), T(0, 360), T(0, 290)], 12),
    body: R([[220, 92], [470, 92], [486, 104], [486, 136], [470, 148], [220, 148]]),
    screen: R([[300, 102], [380, 102], [380, 124], [300, 124]]),
    grip: R([[400, 92], [430, 92], [430, 148], [400, 148]]),
    nose: R([[220, 92], [160, 110], [150, 120], [160, 130], [220, 148]]),
    window: P.ellipse(tip[0], tip[1], 6 * s, 6 * s, 0, Math.PI * 2, 16),
    raysIn: [-0.25, 0, 0.25].map((d) => P.line(tip[0] + d * 30 * s, tip[1] + 14 * s, lesionAt[0] + d * 60 * s, lesionAt[1] - 18 * s, 8)),
    raysOut: [-0.6, 0.6, 1.0].map((d) => P.line(lesionAt[0] + d * 30 * s, lesionAt[1] - 22 * s, lesionAt[0] + d * 110 * s, lesionAt[1] - 110 * s, 8)),
    lesionAt, tipAt: tip,
  };
};

/* ---------------------------------------------------------------------------------------------
 * Added for E21 (Nov 2026), AI in pathology: an isometric slide scanner and tile pyramid (the
 * Pradarshan "Sketchbook" look: three tones, heavy silhouette, short blue-grey shadow), a lymph
 * node at low power with a metastatic deposit in the subcapsular sinus, the same deposit at high
 * power (in three labs' stain colours), a Ki-67 tile, and a labelled lymph-node slide.
 * ------------------------------------------------------------------------------------------- */

/** Isometric projection: u runs right-and-back, v left-and-back, w up; origin (ox, oy), scale s. */
export const isoPt = (ox: number, oy: number, s: number) => (u: number, v: number, w: number): Pt =>
  [ox + (u - v) * 0.866 * s, oy + (u + v) * 0.5 * s - w * s];

/**
 * An isometric box [u0..u1] × [v0..v1] × [w0..w1]: the three visible faces (top lightest, left
 * face `left` at v = v1 mid tone, right face `right` at u = u1 darkest), the silhouette `hull`,
 * and a short cast `shadow` on the ground (to the right). Wash the faces, then ink `hull` heavy
 * and `edges` fine.
 */
export const isoBox = (ox: number, oy: number, s: number, u0: number, v0: number, w0: number, u1: number, v1: number, w1: number) => {
  const T = isoPt(ox, oy, s);
  const poly = (pts: Pt[]) => P.polyline([...pts, pts[0]], 6);
  const d = (w1 - w0) * 0.35;
  return {
    top: poly([T(u0, v0, w1), T(u1, v0, w1), T(u1, v1, w1), T(u0, v1, w1)]),
    left: poly([T(u0, v1, w1), T(u1, v1, w1), T(u1, v1, w0), T(u0, v1, w0)]),
    right: poly([T(u1, v0, w1), T(u1, v1, w1), T(u1, v1, w0), T(u1, v0, w0)]),
    hull: poly([T(u0, v0, w1), T(u1, v0, w1), T(u1, v0, w0), T(u1, v1, w0), T(u0, v1, w0), T(u0, v1, w1)]),
    edges: [P.polyline([T(u0, v1, w1), T(u1, v1, w1), T(u1, v0, w1)], 6), P.line(...T(u1, v1, w1), ...T(u1, v1, w0), 6)],
    shadow: poly([T(u1, v0, w0), T(u1 + d, v0 + d * 0.2, w0), T(u1 + d, v1 + d * 0.6, w0), T(u0 + d * 0.3, v1 + d * 0.6, w0), T(u0, v1, w0), T(u1, v1, w0)]),
  };
};

/**
 * A whole-slide scanner in the Sketchbook isometric view: a desk-top cabinet (top lid seam and a
 * vent grille), on its left-facing front a loading slot with a slide tray sticking out carrying
 * one glass slide (frosted label end, pink tissue), a small status screen and a green status
 * lamp. Local units: body 300 (u) × 230 (v) × 170 (w); origin (x, y) is the back-top corner's
 * ground point, scale s. Parts: `body` (isoBox), `lidSeam`, `vents`, `slot`, `tray` (isoBox),
 * `slide` {glass, frost, tissue}, `screen`, `screenLines`, `lamp`, `slotAt`, `trayAt`, `topAt`.
 */
export const wsiScanner = (x: number, y: number, s = 1) => {
  const T = isoPt(x, y, s);
  const U = 300, V = 230, W = 170;
  const poly = (pts: Pt[]) => P.polyline([...pts, pts[0]], 6);
  const onFront = (u0: number, w0: number, u1: number, w1: number) => poly([T(u0, V, w1), T(u1, V, w1), T(u1, V, w0), T(u0, V, w0)]);
  const sl0 = 70, sl1 = 230, sw0 = 52, sw1 = 74;
  const tray = isoBox(x, y, s, sl0 + 10, V, 56, sl1 - 10, V + 90, 62);
  const g0 = sl0 + 22, g1 = sl1 - 22, gv0 = V + 28, gv1 = V + 62, gw = 62.5;
  const glass = poly([T(g0, gv0, gw), T(g1, gv0, gw), T(g1, gv1, gw), T(g0, gv1, gw)]);
  const frost = poly([T(g0, gv0, gw), T(g0 + 34, gv0, gw), T(g0 + 34, gv1, gw), T(g0, gv1, gw)]);
  const tcu = (g0 + g1) / 2 + 18, tcv = (gv0 + gv1) / 2;
  const tissue = P.polyline(Array.from({ length: 25 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2, rr = 1 + 0.12 * Math.sin(a * 3 + 1);
    return T(tcu + Math.cos(a) * 34 * rr, tcv + Math.sin(a) * 11 * rr, gw);
  }), 4);
  return {
    body: isoBox(x, y, s, 0, 0, 0, U, V, W),
    lidSeam: P.polyline([T(0, V, W - 22), T(U, V, W - 22), T(U, 0, W - 22)], 6),
    vents: Array.from({ length: 6 }, (_, i) => P.line(...T(60 + i * 30, 50, W), ...T(60 + i * 30, 140, W), 6)),
    slot: onFront(sl0, sw0, sl1, sw1),
    tray, slide: { glass, frost, tissue },
    screen: onFront(20, 100, 120, 145),
    screenLines: [P.line(...T(32, V, 132), ...T(100, V, 132), 6), P.line(...T(32, V, 116), ...T(84, V, 116), 6)],
    lamp: P.ellipse(...T(150, V, 122), 8 * s, 8 * s),
    slotAt: T((sl0 + sl1) / 2, V, sw1),
    trayAt: T((g0 + g1) / 2, (gv0 + gv1) / 2, gw),
    topAt: T(U / 2, V / 2, W),
  };
};

/**
 * The tile pyramid of a whole-slide image in isometric view: `levels` thin slabs stacked with
 * gaps, the full-resolution level at the bottom (largest, cut into the finest grid of tiles) and
 * the thumbnail at the top (one tile). Level j counts from the bottom: size S × (1 − 0.24 j),
 * grid 2^(levels−1−j). Parts per level: `slab` (isoBox), `grid` (tile lines on the top face),
 * `map(a, b)` (a point on the top face, a and b in 0..1, for drawing tissue on it), `rightAt`
 * (the right corner, for a label). Origin (x, y) = the back corner of the bottom slab's top.
 */
export const tilePyramid = (x: number, y: number, S: number, levels = 4, gap = 70) =>
  Array.from({ length: levels }, (_, j) => {
    const size = S * (1 - 0.24 * j), o = (S - size) / 2, wTop = j * gap, th = 8;
    const T = isoPt(x, y, 1);
    const n = 2 ** (levels - 1 - j);
    const map = (a: number, b: number): Pt => T(o + a * size, o + b * size, wTop);
    const grid: Pts[] = [];
    for (let k = 1; k < n; k++) {
      grid.push(P.line(...map(k / n, 0), ...map(k / n, 1), 8));
      grid.push(P.line(...map(0, k / n), ...map(1, k / n), 8));
    }
    return { slab: isoBox(x, y, 1, o, o, wTop - th, o + size, o + size, wTop), grid, map, n, rightAt: map(1, 0), frontAt: map(1, 1), topAt: map(0.5, 0.5) };
  });

/** Low-power H&E lymph-node colours (cortex deep blue-purple, medulla pinker, metastasis eosinophilic). */
export const LN = {
  capsule: "#D58BB0", sinus: "#F6E6EE", cortex: "#5B4BA0", follicle: "#3E3184", germinal: "#A898D2",
  paracortex: "#6A5BAE", medulla: "#E8B2CC", cord: "#6F60B2", fat: "#FFFFFF", fatLine: "#E2B8CB",
  vessel: "#D77A8E", rbc: "#C8423B", met: "#EE9DC2", metNucleus: "#5B3F98",
} as const;

/**
 * A lymph node in H&E at low power (scanning objective), bean-shaped with the hilum notch on the
 * left: the thin pink fibrous `capsule`, the pale `sinus` ring under it (subcapsular sinus, with
 * a few `histiocytes`), the deep-purple `cortex` with secondary `follicles` (dark mantle) and
 * pale `germinal` centres along the convex side, the slightly paler `paracortex`, the pink
 * `medulla` near the hilum with purple medullary `cords` running toward the hilum, hilar
 * `vessels` (with `rbcs`) and perinodal `fat` cells outside the notch.
 * With `met`, a cohesive metastatic deposit fills and widens the subcapsular sinus at angle
 * `metAngle` (radians, 0 = right, negative = up): a lens of eosinophilic tumour (`metShape`) with
 * large `metNuclei`; `metAt` is its centre, `metBox` [x, y, w, h]. Wash in the order listed.
 */
export const lymphNode = (cx: number, cy: number, rx: number, ry: number, opts: { met?: boolean; metAngle?: number; key?: string } = {}) => {
  const { met = false, metAngle = -0.85, key = "ln" } = opts;
  const r = stream(key);
  const N = 120;
  const wob = Array.from({ length: 6 }, () => r() * Math.PI * 2);
  const R = (a: number) => {
    const d = Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI));
    return 1 - 0.16 * Math.exp(-((d / 0.5) ** 2)) + 0.018 * Math.sin(a * 3 + wob[0]) + 0.012 * Math.sin(a * 5 + wob[1]);
  };
  const at = (a: number, k: number): Pt => [cx + Math.cos(a) * rx * R(a) * k, cy + Math.sin(a) * ry * R(a) * k];
  const ring = (k: number): Pts => Array.from({ length: N + 1 }, (_, i) => at((i / N) * Math.PI * 2, k));
  const fol: Pts[] = [], germ: Pts[] = [];
  for (let i = 0; i < 9; i++) {
    const a = -2.15 + (i / 8) * 4.3 + (r() - 0.5) * 0.12;
    const [fx, fy] = at(a, 0.78);
    const fr = Math.min(rx, ry) * (0.1 + r() * 0.025);
    fol.push(P.blob(fx, fy, fr, fr * 0.92, `${key}f${i}`, 0.08, 28));
    germ.push(P.blob(fx + Math.cos(a) * fr * 0.15, fy + Math.sin(a) * fr * 0.15, fr * 0.6, fr * 0.55, `${key}g${i}`, 0.12, 24));
  }
  const hx = cx - rx * 0.8, hy = cy;
  const medulla = P.blob(cx - rx * 0.38, cy, rx * 0.36, ry * 0.42, `${key}m`, 0.18, 48);
  const cords: Pts[] = Array.from({ length: 7 }, (_, i) => {
    const a = -0.9 + (i / 6) * 1.8;
    const ex = cx - rx * 0.38 + Math.cos(a) * rx * 0.3, ey = cy + Math.sin(a) * ry * 0.38;
    return P.quad(hx + rx * 0.06, hy + (i - 3) * ry * 0.02, (hx + ex) / 2 + (r() - 0.5) * rx * 0.08, (hy + ey) / 2 + (r() - 0.5) * ry * 0.1, ex, ey, 16);
  });
  const vessels = [P.ellipse(hx - rx * 0.02, hy - ry * 0.07, rx * 0.035, ry * 0.045, 0, Math.PI * 2, 20), P.ellipse(hx + rx * 0.01, hy + ry * 0.07, rx * 0.028, ry * 0.035, 0, Math.PI * 2, 20)];
  const rbcs = vessels.map((_, i) => P.ellipse(hx + (i ? rx * 0.01 : -rx * 0.02), hy + (i ? ry * 0.07 : -ry * 0.07), rx * (i ? 0.018 : 0.022), ry * (i ? 0.022 : 0.028), 0, Math.PI * 2, 16));
  const fat: Pts[] = [];
  for (let i = 0; i < 9; i++) {
    const fx = hx - rx * (0.12 + (i % 3) * 0.08) + (r() - 0.5) * rx * 0.03, fy = hy + (Math.floor(i / 3) - 1) * ry * 0.13;
    fat.push(P.blob(fx, fy, rx * 0.045, ry * 0.06, `${key}fat${i}`, 0.12, 9));
  }
  const histiocytes: Pt[] = Array.from({ length: 26 }, (_, i) => at((i / 26) * Math.PI * 2 + 0.1, 0.955)).filter(([px]) => px > hx + rx * 0.12);
  let metShape: Pts = [], metNuclei: Pt[] = [], metAt: Pt = [cx, cy], metBox: [number, number, number, number] = [cx, cy, 0, 0];
  if (met) {
    const span = 0.34, n = 30;
    const outer: Pt[] = [], inner: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = metAngle - span + 2 * span * t;
      outer.push(at(a, 0.972));
      inner.push(at(a, 0.972 - 0.14 * Math.sin(Math.PI * t) ** 0.8 * (1 + (r() - 0.5) * 0.25)));
    }
    metShape = [...outer, ...inner.reverse(), outer[0]];
    metAt = at(metAngle, 0.91);
    const xs = metShape.map((p) => p[0]), ys = metShape.map((p) => p[1]);
    metBox = [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
    for (let i = 0; i < 22; i++) {
      const t = 0.12 + r() * 0.76, a = metAngle - span + 2 * span * t;
      const depth = 0.972 - (0.02 + r() * 0.1) * Math.sin(Math.PI * t);
      metNuclei.push(at(a, depth));
    }
  }
  return {
    capsule: ring(1), sinus: ring(0.972), cortex: ring(0.94), paracortex: P.blob(cx - rx * 0.12, cy, rx * 0.56, ry * 0.6, `${key}pc`, 0.1, 48),
    medulla, cords, follicles: fol, germinal: germ, vessels, rbcs, fat, histiocytes,
    metShape, metNuclei, metAt, metBox,
    hilumAt: [hx, hy] as Pt, capsuleAt: at(-Math.PI / 2, 1), cortexAt: at(0.5, 0.8), medullaAt: [cx - rx * 0.4, cy] as Pt,
  };
};

/** Three labs' H&E colours for the same tissue: `A` the training lab, `B` heavy haematoxylin (bluer), `C` pale eosin, faded. */
export const HE_LAB = {
  A: { capsule: "#D88AB0", sinus: "#F5E4EC", cyto: "#E48DB9", nucleus: "#4A3A8C", nucleusLight: "#7B68B8", lymph: "#3B2E78", cortex: "#C9B2D6", fibre: "#C76B9A", histio: "#F0C6D8" },
  B: { capsule: "#A98BC6", sinus: "#DDD6EE", cyto: "#AE96D2", nucleus: "#241C5A", nucleusLight: "#3F3490", lymph: "#1B154A", cortex: "#8579BC", fibre: "#7F65A8", histio: "#C8BBE2" },
  C: { capsule: "#F4ADB8", sinus: "#FCF1F3", cyto: "#F7BCCB", nucleus: "#9480C8", nucleusLight: "#BBABDD", lymph: "#8573BD", cortex: "#ECD9E9", fibre: "#EAA3B4", histio: "#FADDE4" },
} as const;
export type HeLab = { readonly [K in keyof (typeof HE_LAB)["A"]]: string };

/**
 * High power of a nodal metastasis in the subcapsular sinus (tile w × h, top-left x, y), top to
 * bottom: the fibrous `capsule` band (wavy `fibres`, flat `spindles`), the pale `sinus` holding
 * sinus `histiocytes` (pale cytoplasm, oval pale nuclei) and a few lymphocytes, and in it a
 * cohesive `cluster` of carcinoma cells (eosinophilic cytoplasm, `cellWalls`, large vesicular
 * `nuclei` with `nucleoli`, one small gland `lumen`); below, the cortex: `cortex` field packed
 * with small dark round `lymphs`. Wash/fill with a palette from HE_LAB. `clusterAt` its centre.
 */
export const nodeMetTile = (x: number, y: number, w: number, h: number, key = "nm") => {
  const r = stream(key);
  const S = Math.min(w, h);
  const capY = y + h * 0.13, sinY = y + h * 0.64;
  const edge = (yy: number, amp: number, k: string): Pt[] => P.wave(x, x + w, yy, amp, 2.2, 40, stream(k)() * 6) as Pt[];
  const capsule: Pts = [[x, y], [x + w, y], ...edge(capY, h * 0.012, `${key}c`).reverse(), [x, y]];
  const lower = edge(sinY, h * 0.025, `${key}s`);
  const cortex: Pts = [...lower, [x + w, y + h], [x, y + h], lower[0]];
  const fibres = [0.035, 0.065, 0.095].map((k, i) => P.wave(x + 6, x + w - 6, y + h * k, h * 0.006, 3 + i, 50, i * 2));
  const spindles = Array.from({ length: 7 }, (_, i) => {
    const sx = x + w * (0.08 + i * 0.13 + r() * 0.04), sy = y + h * (0.04 + r() * 0.07);
    return P.ellipse(sx, sy, S * 0.03, S * 0.006, 0, Math.PI * 2, 12);
  });
  const ccx = x + w * 0.54, ccy = y + h * 0.39, crx = w * 0.3, cry = h * 0.17;
  const cluster = P.blob(ccx, ccy, crx, cry, `${key}cl`, 0.16, 56);
  const inCluster = (px: number, py: number, k = 1) => ((px - ccx) / (crx * k)) ** 2 + ((py - ccy) / (cry * k)) ** 2 < 1;
  const lumenC: Pt = [ccx + crx * 0.18, ccy - cry * 0.05];
  const lumen = P.blob(lumenC[0], lumenC[1], crx * 0.11, cry * 0.16, `${key}lu`, 0.2, 20);
  const nuclei: Pts[] = [], nucleoli: Pt[] = [], centres: Pt[] = [];
  let guard = 0;
  while (centres.length < 17 && guard++ < 900) {
    const px = ccx + (r() - 0.5) * 2 * crx * 0.85, py = ccy + (r() - 0.5) * 2 * cry * 0.8;
    if (!inCluster(px, py, 0.82)) continue;
    if (Math.hypot(px - lumenC[0], (py - lumenC[1]) * 1.4) < crx * 0.2) continue;
    if (centres.some(([qx, qy]) => Math.hypot(px - qx, py - qy) < S * 0.075)) continue;
    centres.push([px, py]);
    const nr = S * (0.027 + r() * 0.012);
    nuclei.push(P.blob(px, py, nr, nr * (0.75 + r() * 0.25), `${key}n${centres.length}`, 0.2, 18));
    nucleoli.push([px + (r() - 0.5) * nr * 0.4, py + (r() - 0.5) * nr * 0.4]);
  }
  const cellWalls: Pts[] = [];
  centres.forEach(([px, py], i) => centres.forEach(([qx, qy], j) => {
    if (j <= i) return;
    const d = Math.hypot(px - qx, py - qy);
    if (d > S * 0.13) return;
    const mx = (px + qx) / 2, my = (py + qy) / 2, nx = -(qy - py) / d, ny = (qx - px) / d, L = d * 0.42;
    if (inCluster(mx + nx * L, my + ny * L, 0.97) && inCluster(mx - nx * L, my - ny * L, 0.97)) cellWalls.push(P.line(mx - nx * L, my - ny * L, mx + nx * L, my + ny * L, 6));
  }));
  const histiocytes: Pts[] = [], histioNuclei: Pts[] = [];
  guard = 0;
  while (histiocytes.length < 7 && guard++ < 600) {
    const px = x + w * (0.06 + r() * 0.88), py = capY + (sinY - capY) * (0.15 + r() * 0.7);
    if (inCluster(px, py, 1.25)) continue;
    if (histiocytes.some((hh) => Math.hypot(hh[0][0] - px, hh[0][1] - py) < S * 0.16)) continue;
    const hr = S * 0.05;
    const shape = P.blob(px, py, hr, hr * 0.8, `${key}h${histiocytes.length}`, 0.2, 20);
    histiocytes.push(shape);
    histioNuclei.push(P.ellipse(px + hr * 0.15, py, S * 0.017, S * 0.011, 0.4, 0.4 + Math.PI * 2, 14));
  }
  const sinusLymphs = granules(x + w / 2, (capY + sinY) / 2, w * 0.5, 14, `${key}sl`, (px, py) => py < capY + 8 || py > sinY - 8 || inCluster(px, py, 1.15) || px < x + 6 || px > x + w - 6)
    .map(([px, py]) => P.ellipse(px, py, S * 0.012, S * 0.011, 0, Math.PI * 2, 10));
  const lymphs = granules(x + w / 2, y + h * 0.82, Math.hypot(w, h) * 0.6, 230, `${key}ly`, (px, py) => py < sinY + 6 || py > y + h - 5 || px < x + 5 || px > x + w - 5)
    .map(([px, py]) => P.ellipse(px, py, S * 0.012, S * 0.0115, 0, Math.PI * 2, 10));
  return { field: P.rect(x, y, w, h, 4), capsule, cortex, fibres, spindles, cluster, lumen, nuclei, nucleoli, cellWalls, histiocytes, histioNuclei, sinusLymphs, lymphs, clusterAt: [ccx, ccy] as Pt, sinusAt: [x + w * 0.12, (capY + sinY) / 2] as Pt, capsuleAt: [x + w / 2, y + h * 0.065] as Pt, cortexAt: [x + w / 2, y + h * 0.82] as Pt };
};

/** Ki-67 immunohistochemistry colours: DAB brown (three intensities) on haematoxylin-blue negatives, near-white background. */
export const KI67 = { bg: "#F6F2EC", stroma: "#EDE5E3", cyto: "#EEE6E6", neg: "#7487C2", negRim: "#4D5F9E", pos: ["#B9824A", "#8B5524", "#5A3110"], fibre: "#D9CCCC" } as const;

/**
 * A Ki-67 stained breast-carcinoma tile at medium power (top-left x, y, w × h): nests of tumour
 * cells (`groups`, unstained cytoplasm) in pale stroma (`fibres`, a few flat `stromaNuclei`),
 * small `lymphs`; every tumour nucleus is brown (`pos[0..2]`, light to dark DAB) or blue
 * (`neg`), with the brown fraction ≈ `index` (0..1). The stain is nuclear only. `counts` gives
 * { pos, neg } as drawn, so a label can quote the true index of the picture.
 */
export const ki67Tile = (x: number, y: number, w: number, h: number, index = 0.3, key = "ki") => {
  const r = stream(key);
  const S = Math.min(w, h);
  const groups: Pts[] = [], neg: Pts[] = [], pos: Pts[][] = [[], [], []];
  const occupied: [number, number, number][] = [];
  const free = (px: number, py: number, pad: number) => px > x + pad && px < x + w - pad && py > y + pad && py < y + h - pad && occupied.every(([ox, oy, orr]) => Math.hypot(px - ox, py - oy) > orr + pad);
  const fibres: Pts[] = Array.from({ length: 7 }, (_, i) => P.wave(x + 6, x + w - 6, y + h * (0.08 + i * 0.14), S * 0.01, 2 + (i % 3), 50, i * 1.7));
  let tries = 0, all = 0, brown = 0;
  while (groups.length < 12 && tries++ < 1200) {
    const cx = x + w * (0.1 + r() * 0.8), cy = y + h * (0.1 + r() * 0.8);
    const rx = S * (0.1 + r() * 0.06), ry = S * (0.07 + r() * 0.04);
    if (!free(cx, cy, Math.max(rx, ry) * 0.8)) continue;
    occupied.push([cx, cy, Math.max(rx, ry)]);
    const ang = r() * Math.PI;
    const rot = (p: Pt): Pt => [cx + (p[0] - cx) * Math.cos(ang) - (p[1] - cy) * Math.sin(ang), cy + (p[0] - cx) * Math.sin(ang) + (p[1] - cy) * Math.cos(ang)];
    groups.push(P.blob(cx, cy, rx, ry, `${key}g${groups.length}`, 0.2, 36).map(rot));
    const pts: Pt[] = [];
    let g = 0;
    while (pts.length < Math.round((rx * ry) / (S * S * 0.0011)) && g++ < 300) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.8;
      const p = rot([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d]);
      if (pts.some(([qx, qy]) => Math.hypot(p[0] - qx, p[1] - qy) < S * 0.036)) continue;
      pts.push(p);
    }
    pts.forEach((p, k) => {
      const nr = S * (0.016 + r() * 0.008);
      const shape = P.blob(p[0], p[1], nr, nr * (0.78 + r() * 0.2), `${key}n${groups.length}_${k}`, 0.18, 14);
      all++;
      if ((brown + 0.5) / all < index || (brown / all < index && r() < 0.5)) {
        brown++;
        pos[r() < 0.3 ? 0 : r() < 0.6 ? 1 : 2].push(shape);
      } else neg.push(shape);
    });
  }
  const stromaNuclei = Array.from({ length: 14 }, (_, i) => {
    let px = 0, py = 0, g = 0;
    do { px = x + w * (0.05 + r() * 0.9); py = y + h * (0.05 + r() * 0.9); } while (!free(px, py, 4) && g++ < 40);
    return P.ellipse(0, 0, S * 0.024, S * 0.005, 0, Math.PI * 2, 10).map(([qx, qy]) => [px + qx * Math.cos(i) - qy * Math.sin(i), py + qx * Math.sin(i) + qy * Math.cos(i)] as Pt);
  });
  const lymphs = granules(x + w / 2, y + h / 2, Math.hypot(w, h) / 2, 22, `${key}ly`, (px, py) => !free(px, py, 5))
    .map(([px, py]) => P.ellipse(px, py, S * 0.009, S * 0.0085, 0, Math.PI * 2, 10));
  return { field: P.rect(x, y, w, h, 4), groups, fibres, neg, pos, stromaNuclei, lymphs, counts: { pos: brown, neg: all - brown } };
};

/**
 * A glass slide of two lymph-node sections, as a pathologist holds it, label end on the left:
 * the glass, a frosted printed label (a 2D `matrix` code of small squares, three printed text
 * `lines` as thin bars: accession number, block, stain), the coverslip, and two bean-shaped node
 * sections (`nodes` [cx, cy, rx, ry]; draw the kit's lymph node at that size). `labelBox`,
 * `labelAt`.
 */
export const nodeSlide = (x: number, y: number, w: number, h: number) => {
  const r = stream("nodeSlide");
  const fx = x + w * 0.025, fy = y + h * 0.08, fw = w * 0.22, fh = h * 0.84;
  const ms = fw * 0.42, mx = fx + fw * 0.08, my = fy + fh * 0.08, k = 8, c = ms / k;
  const matrix: Pts[] = [];
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
    if (i === 0 || j === k - 1 || ((i + j) % 2 === 0 && j === 0) || (i !== 0 && j !== k - 1 && r() < 0.45)) matrix.push(P.rect(mx + j * c, my + i * c, c * 0.98, c * 0.98, 0));
  }
  const lines = [0.62, 0.74, 0.86].map((t, i) => P.rect(fx + fw * 0.1, fy + fh * t, fw * (0.78 - i * 0.18), fh * 0.05, 1));
  return {
    glass: P.rect(x, y, w, h, 4),
    frost: P.rect(fx, fy, fw, fh, 3),
    matrix, lines,
    cover: P.rect(x + w * 0.27, y + h * 0.05, w * 0.7, h * 0.9, 2),
    nodes: [[x + w * 0.46, y + h * 0.5, w * 0.12, h * 0.3], [x + w * 0.76, y + h * 0.52, w * 0.13, h * 0.33]] as [number, number, number, number][],
    labelBox: [fx, fy, fw, fh] as [number, number, number, number],
    labelAt: [fx + fw / 2, fy + fh / 2] as Pt,
  };
};

/* -------------------------------------------------------------------------------------------
 * Added for E22 (Nov 2026, precision medicine): HER2 membrane IHC tile, gene-expression heat
 * map with dendrogram, a knowledge graph (gene, protein, drug, disease nodes), a DNA helix.
 * Checked on the `kit-objects-22` still.
 * ------------------------------------------------------------------------------------------- */

/** HER2 immunohistochemistry colours: DAB brown membranes, haematoxylin-blue nuclei, pale cytoplasm. */
export const HER2C = { bg: "#F7F3EE", stroma: "#EFE6E4", cyto: "#F1E9E7", nucleus: "#7D8FC6", nucleusRim: "#4D5F9E", fibre: "#DCCFCF", dab: ["#C99A6A", "#A8692F", "#6E3A12"] } as const;

/**
 * A HER2-stained breast-carcinoma tile at medium power (top-left x, y, w × h): cohesive nests
 * (`nests`) of polygonal tumour cells in pale stroma. Each cell has an outline (`cells`, closed,
 * shared walls drawn as rings) and a blue nucleus (`nuclei`). The stain is on the cell membrane
 * only: `score` 3 = complete, thick, dark rings ("chicken-wire"); 2 = complete, thin, moderate;
 * 1 = faint and incomplete (`membranes` are arcs); 0 = none. `membranes` are the strokes to ink
 * in `HER2C.dab[score-1]` at width `membraneW`.
 */
export const her2Tile = (x: number, y: number, w: number, h: number, score: 0 | 1 | 2 | 3 = 3, key = "her2") => {
  const r = stream(key);
  const S = Math.min(w, h);
  const d = S * 0.085; // cell spacing
  const nests: Pts[] = [], cells: Pts[] = [], nuclei: Pts[] = [], membranes: Pts[] = [];
  const occupied: [number, number, number][] = [];
  const fibres: Pts[] = Array.from({ length: 6 }, (_, i) => P.wave(x + 6, x + w - 6, y + h * (0.1 + i * 0.16), S * 0.012, 2 + (i % 3), 50, i * 1.3));
  let tries = 0;
  while (nests.length < 5 && tries++ < 600) {
    const rx = S * (0.17 + r() * 0.08), ry = S * (0.13 + r() * 0.06);
    const cx = x + rx + 8 + r() * (w - 2 * rx - 16), cy = y + ry + 8 + r() * (h - 2 * ry - 16);
    if (occupied.some(([ox, oy, orr]) => Math.hypot(cx - ox, cy - oy) < orr + Math.max(rx, ry) + S * 0.03)) continue;
    occupied.push([cx, cy, Math.max(rx, ry)]);
    const nest = P.blob(cx, cy, rx, ry, `${key}n${nests.length}`, 0.12, 40);
    nests.push(nest);
    for (let row = -6; row <= 6; row++) for (let col = -6; col <= 6; col++) {
      const px = cx + (col + (row % 2 ? 0.5 : 0)) * d + (r() - 0.5) * d * 0.25, py = cy + row * d * 0.87 + (r() - 0.5) * d * 0.25;
      if (((px - cx) / (rx * 0.9)) ** 2 + ((py - cy) / (ry * 0.9)) ** 2 > 1) continue;
      const cr = d * 0.55;
      const cell = P.blob(px, py, cr, cr * 0.92, `${key}c${cells.length}`, 0.16, 7);
      cells.push(cell);
      const nr = d * (0.2 + r() * 0.06);
      nuclei.push(P.blob(px + (r() - 0.5) * d * 0.15, py + (r() - 0.5) * d * 0.15, nr, nr * 0.85, `${key}k${cells.length}`, 0.15, 12));
      if (score >= 2) membranes.push(cell);
      else if (score === 1 && r() < 0.6) {
        const a0 = r() * Math.PI * 2;
        membranes.push(P.ellipse(px, py, cr * 0.95, cr * 0.88, a0, a0 + Math.PI * (0.5 + r() * 0.6), 10));
      }
    }
  }
  const stromaNuclei = Array.from({ length: 10 }, (_, i) => {
    let px = 0, py = 0, g = 0;
    do { px = x + w * (0.06 + r() * 0.88); py = y + h * (0.06 + r() * 0.88); } while (occupied.some(([ox, oy, orr]) => Math.hypot(px - ox, py - oy) < orr + 6) && g++ < 40);
    return P.ellipse(0, 0, S * 0.024, S * 0.005, 0, Math.PI * 2, 10).map(([qx, qy]) => [px + qx * Math.cos(i * 1.3) - qy * Math.sin(i * 1.3), py + qx * Math.sin(i * 1.3) + qy * Math.cos(i * 1.3)] as Pt);
  });
  const membraneW = score === 3 ? Math.max(2.4, S * 0.009) : score === 2 ? Math.max(1.4, S * 0.005) : Math.max(1, S * 0.0035);
  return { field: P.rect(x, y, w, h, 4), nests, cells, nuclei, membranes, membraneW, fibres, stromaNuclei, nestAt: [occupied[0][0], occupied[0][1]] as Pt };
};

/**
 * A gene-expression heat map as in the first breast-cancer "molecular portraits": `cols` tumours
 * (columns) by `rows` genes, red = high, green = low, pale = average, with a dendrogram above the
 * columns. Columns come in `groups` (sizes, left to right, e.g. luminal / HER2-enriched / basal):
 * each group has its own block of up-regulated genes, so the families read at a glance.
 * Parts: cells ({ shape, v } with v in -1..1), tree (dendrogram strokes), bars (one rect per group
 * under the columns), groupAt (centre x of each group, y under the bars), top/bottom.
 */
export const exprHeatmap = (x: number, y: number, w: number, h: number, groups: number[] = [7, 4, 5], rows = 14, key = "expr") => {
  const r = stream(key);
  const cols = groups.reduce((a, b) => a + b, 0);
  const treeH = h * 0.2, barH = h * 0.05;
  const gx = x, gy = y + treeH, gw = w, gh = h - treeH - barH - 6;
  const cw = gw / cols, ch = gh / rows;
  const groupOf: number[] = [];
  groups.forEach((n, g) => { for (let i = 0; i < n; i++) groupOf.push(g); });
  const block = (row: number) => Math.min(groups.length - 1, Math.floor((row / rows) * groups.length));
  const cells: { shape: Pts; v: number }[] = [];
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const on = block(j) === groupOf[i];
    const v = Math.max(-1, Math.min(1, (on ? 0.75 : -0.45) + (r() - 0.5) * 0.7));
    cells.push({ shape: P.rect(gx + i * cw + 0.5, gy + j * ch + 0.5, cw - 1, ch - 1, 0), v });
  }
  // dendrogram: leaves joined in pairs within a group, then groups joined
  const tree: Pts[] = [];
  const leafX = (i: number) => gx + (i + 0.5) * cw;
  const bottom = gy - 2;
  const groupTops: [number, number][] = [];
  let start = 0;
  groups.forEach((n) => {
    let level: [number, number][] = Array.from({ length: n }, (_, k) => [leafX(start + k), bottom] as [number, number]);
    let lh = bottom;
    while (level.length > 1) {
      lh -= treeH * 0.16;
      const next: [number, number][] = [];
      for (let k = 0; k < level.length; k += 2) {
        if (k + 1 >= level.length) { tree.push(P.line(level[k][0], level[k][1], level[k][0], lh, 4)); next.push([level[k][0], lh]); continue; }
        const [ax, ay] = level[k], [bx, by] = level[k + 1];
        tree.push(P.polyline([[ax, ay], [ax, lh], [bx, lh], [bx, by]] as Pt[], 8));
        next.push([(ax + bx) / 2, lh]);
      }
      level = next;
    }
    groupTops.push([level[0][0], lh]);
    start += n;
  });
  const top = y + 4;
  let acc = groupTops[0];
  groupTops.slice(1).forEach((g, k) => {
    const yy = top + (groupTops.length - 2 - k) * treeH * 0.12;
    tree.push(P.polyline([[acc[0], acc[1]], [acc[0], yy], [g[0], yy], [g[0], g[1]]] as Pt[], 8));
    acc = [(acc[0] + g[0]) / 2, yy];
  });
  const bars: Pts[] = [];
  const groupAt: Pt[] = [];
  start = 0;
  groups.forEach((n) => {
    bars.push(P.rect(gx + start * cw + 1, gy + gh + 4, n * cw - 2, barH, 2));
    groupAt.push([gx + (start + n / 2) * cw, gy + gh + barH + 8]);
    start += n;
  });
  return { cells, tree, bars, groupAt, grid: P.rect(gx, gy, gw, gh, 0), top: y, bottom: gy + gh + barH + 4 };
};

export type KgKind = "gene" | "protein" | "drug" | "disease";
export type KgNode = { id: string; kind: KgKind; at: Pt };
/** Fill colours for knowledge-graph node kinds (gene blue, protein violet, drug amber, disease red). */
export const KG = { gene: "#A9C8EA", protein: "#CDB8E6", drug: "#F2CF8A", disease: "#F2B0A8", edge: "#6F675E" } as const;

/**
 * A knowledge graph: typed nodes joined by relationship edges. Node shapes by kind: gene = circle
 * with a small double-helix glyph; protein = a folded, lumpy globule; drug = a two-tone capsule;
 * disease = a rounded square with a cross. `r` is the node radius. Edges run border to border;
 * `directed` adds an arrowhead at the target (for Bayesian networks). Parts: per node { shape,
 * glyph (strokes), half (capsule half for a second colour), centre, labelAt (below) }, edges
 * (per input edge: { stroke, head, mid }).
 */
export const knowledgeGraph = (nodes: KgNode[], edges: [string, string][], r = 46, directed = false) => {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const parts = nodes.map((n) => {
    const [cx, cy] = n.at;
    let shape: Pts, glyph: Pts[] = [], half: Pts | null = null;
    if (n.kind === "gene") {
      shape = P.ellipse(cx, cy, r, r, -Math.PI / 2, Math.PI * 1.5, 40);
      const a = P.wave(cx - r * 0.55, cx + r * 0.55, cy, r * 0.28, 1.5, 30, 0), b = P.wave(cx - r * 0.55, cx + r * 0.55, cy, r * 0.28, 1.5, 30, Math.PI);
      const rungs = [0.17, 0.5, 0.83].map((u) => { const px = cx - r * 0.55 + u * r * 1.1, dy = Math.sin(u * 1.5 * Math.PI * 2) * r * 0.28; return P.line(px, cy - dy, px, cy + dy, 3); });
      glyph = [a, b, ...rungs];
    } else if (n.kind === "protein") {
      shape = P.blob(cx, cy, r * 1.05, r * 0.9, `kgp${n.id}`, 0.22, 40);
      glyph = [P.quad(cx - r * 0.5, cy + r * 0.1, cx - r * 0.1, cy - r * 0.6, cx + r * 0.2, cy, 12), P.quad(cx + r * 0.2, cy, cx + r * 0.5, cy + r * 0.5, cx + r * 0.55, cy - r * 0.2, 12)];
    } else if (n.kind === "drug") {
      const L = r * 1.25, R = r * 0.55, ang = -0.5;
      const rot = (p: Pt): Pt => [cx + p[0] * Math.cos(ang) - p[1] * Math.sin(ang), cy + p[0] * Math.sin(ang) + p[1] * Math.cos(ang)];
      shape = P.rect(-L, -R, 2 * L, 2 * R, R).map(([px, py]) => rot([px, py]));
      half = P.rect(-L, -R, L, 2 * R, R).map(([px, py]) => rot([px, py]));
      glyph = [P.line(0, -R, 0, R, 4).map(([px, py]) => rot([px, py]))];
    } else {
      shape = P.rect(cx - r, cy - r * 0.85, 2 * r, r * 1.7, r * 0.35);
      glyph = [P.line(cx, cy - r * 0.45, cx, cy + r * 0.45, 4), P.line(cx - r * 0.45, cy, cx + r * 0.45, cy, 4)];
    }
    return { id: n.id, kind: n.kind, shape, glyph, half, centre: n.at, labelAt: [cx, cy + r + 30] as Pt };
  });
  const edgeParts = edges.map(([a, b]) => {
    const A = byId[a].at, B = byId[b].at;
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const pad = r * 1.12;
    const s: Pt = [A[0] + ux * pad, A[1] + uy * pad], e: Pt = [B[0] - ux * (pad + (directed ? 4 : 0)), B[1] - uy * (pad + (directed ? 4 : 0))];
    const hl = r * 0.36;
    const head = directed ? P.polyline([[e[0] - ux * hl - uy * hl * 0.6, e[1] - uy * hl + ux * hl * 0.6], e, [e[0] - ux * hl + uy * hl * 0.6, e[1] - uy * hl - ux * hl * 0.6]] as Pt[], 6) : null;
    return { from: a, to: b, stroke: P.line(s[0], s[1], e[0], e[1], 12), head, mid: [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2] as Pt, s, e };
  });
  return { nodes: parts, edges: edgeParts, r };
};

/**
 * A DNA double helix, horizontal (top-left x, y, w × h): two backbones (sine strands, one in
 * front) and base-pair rungs between them. Parts: strandA, strandB, rungs, midAt.
 */
export const dnaHelix = (x: number, y: number, w: number, h: number, turns = 2.5) => {
  const amp = h / 2, cy = y + h / 2;
  const strandA = P.wave(x, x + w, cy, amp, turns, 120, 0), strandB = P.wave(x, x + w, cy, amp, turns, 120, Math.PI);
  const n = Math.round(turns * 8);
  const rungs = Array.from({ length: n }, (_, i) => {
    const u = (i + 0.5) / n, px = x + u * w, dy = Math.sin(u * turns * Math.PI * 2) * amp;
    return P.line(px, cy - dy * 0.92, px, cy + dy * 0.92, 3);
  }).filter((_, i) => Math.abs(Math.sin(((i + 0.5) / n) * turns * Math.PI * 2)) > 0.25);
  return { strandA, strandB, rungs, midAt: [x + w / 2, cy] as Pt };
};

/**
 * A breast duct in cross-section, as on H&E (centre cx, cy, outer radius r): the lumen (`lumen`,
 * wash white), an inner ring of cuboidal-to-columnar luminal epithelial cells (`luminal`, closed,
 * with round `luminalNuclei` toward the base), an outer ring of flattened myoepithelial (basal)
 * cells (`basal`, thin spindles, with elongated `basalNuclei`), the basement membrane
 * (`membrane`) and periductal stroma fibres (`stroma`). `luminalAt` / `basalAt` label anchors.
 */
export const ductSection = (cx: number, cy: number, r: number, key = "duct") => {
  const rnd = stream(key);
  const rL = r * 0.38, rIn = r * 0.72, rB = r * 0.84;
  const nL = 18, nB = 26;
  const lumen = P.blob(cx, cy, rL, rL * 0.92, `${key}l`, 0.08, 40);
  const luminal: Pts[] = [], luminalNuclei: Pts[] = [], basal: Pts[] = [], basalNuclei: Pts[] = [];
  for (let i = 0; i < nL; i++) {
    const a0 = (i / nL) * Math.PI * 2, a1 = ((i + 1) / nL) * Math.PI * 2, j = (rnd() - 0.5) * 0.04;
    const pt = (rr: number, a: number): Pt => [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.92];
    luminal.push([pt(rL, a0 + j), pt(rIn, a0 + j), pt(rIn, (a0 + a1) / 2), pt(rIn, a1 + j), pt(rL, a1 + j), pt(rL, (a0 + a1) / 2), pt(rL, a0 + j)] as Pts);
    const am = (a0 + a1) / 2, nr = (rIn - rL) * 0.2;
    const [nx, ny] = pt(rL + (rIn - rL) * 0.62, am);
    luminalNuclei.push(P.ellipse(nx, ny, nr, nr * 0.85, 0, Math.PI * 2, 14));
  }
  for (let i = 0; i < nB; i++) {
    const a = (i / nB) * Math.PI * 2 + rnd() * 0.05, rr = (rIn + rB) / 2;
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.92;
    const len = (Math.PI * 2 * rr) / nB * 0.5, th = (rB - rIn) * 0.42;
    const t = a + Math.PI / 2;
    const spindle = P.ellipse(0, 0, len, th, 0, Math.PI * 2, 16).map(([qx, qy]) => [px + qx * Math.cos(t) - qy * Math.sin(t), py + qx * Math.sin(t) + qy * Math.cos(t)] as Pt);
    basal.push(spindle);
    basalNuclei.push(P.ellipse(0, 0, len * 0.55, th * 0.5, 0, Math.PI * 2, 12).map(([qx, qy]) => [px + qx * Math.cos(t) - qy * Math.sin(t), py + qx * Math.sin(t) + qy * Math.cos(t)] as Pt));
  }
  const membrane = P.ellipse(cx, cy, rB + 2, (rB + 2) * 0.92, 0, Math.PI * 2, 64);
  const stroma = Array.from({ length: 5 }, (_, i) => P.ellipse(cx, cy, r * (0.92 + i * 0.05), r * (0.92 + i * 0.05) * 0.92, i * 0.9, i * 0.9 + Math.PI * (0.6 + rnd() * 0.5), 24));
  return { lumen, luminal, luminalNuclei, basal, basalNuclei, membrane, stroma, luminalAt: [cx, cy - (rL + rIn) / 2 * 0.92] as Pt, basalAt: [cx + rB * 0.7, cy + rB * 0.7] as Pt };
};

/**
 * A formalin-fixed, paraffin-embedded (FFPE) tissue block in its plastic cassette, seen from
 * above at a slight angle (top-left x, y, w × h): the cassette frame with the writing face on
 * the left (`label`, angled) and slots, the wax block (`wax`, wash cream) and the embedded
 * tissue piece (`tissue`, wash pale pink-grey). `labelAt` is where an accession bar can go.
 */
export const paraffinBlock = (x: number, y: number, w: number, h: number) => {
  const frame = P.rect(x, y, w, h, Math.min(w, h) * 0.06);
  const label = P.polyline([[x, y + h * 0.08], [x + w * 0.2, y], [x + w * 0.2, y + h], [x, y + h * 0.92], [x, y + h * 0.08]] as Pt[], 10);
  const slots = Array.from({ length: 6 }, (_, i) => P.rect(x + w * 0.25 + i * w * 0.12, y + h * 0.05, w * 0.05, h * 0.08, 2));
  const wax = P.rect(x + w * 0.26, y + h * 0.18, w * 0.68, h * 0.74, Math.min(w, h) * 0.04);
  const tissue = P.blob(x + w * 0.6, y + h * 0.55, w * 0.22, h * 0.22, "ffpeT", 0.18, 40);
  const bars = [0.35, 0.5, 0.65].map((t, i) => P.rect(x + w * 0.04, y + h * t, w * (0.12 - i * 0.02), h * 0.05, 1));
  return { frame, label, slots, wax, tissue, bars, labelAt: [x + w * 0.1, y + h * 0.5] as Pt, tissueAt: [x + w * 0.6, y + h * 0.55] as Pt };
};
