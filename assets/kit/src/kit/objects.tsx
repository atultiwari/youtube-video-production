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
