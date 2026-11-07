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
