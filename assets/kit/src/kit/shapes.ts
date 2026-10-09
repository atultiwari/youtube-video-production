/**
 * Shapes as point lists, and the hand-drawn jitter, ported from the biopsy build's
 * `js/sketch.js`. Everything random is seeded from (key, boil tick), so a frame always renders
 * the same, and a held frame re-jitters a few times a second ("line boil").
 *
 * Paths are dense polylines on purpose: a two-point line cannot wobble.
 */

export type Pt = readonly [number, number];
export type Pts = readonly Pt[];

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (x: number): number => {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
};

const mulberry = (seed: number) => {
  let a = seed | 0;
  return (): number => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hash = (...parts: readonly (string | number)[]): number => {
  let h = 2166136261;
  for (const part of parts) {
    const s = String(part);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
};

/** A stable random stream per key and boil tick. */
export const rng = (key: string, tick = 0) => mulberry(hash(key, tick));

export const P = {
  line(x1: number, y1: number, x2: number, y2: number, n = 16): Pts {
    return Array.from({ length: n + 1 }, (_, i) => [lerp(x1, x2, i / n), lerp(y1, y2, i / n)] as const);
  },
  polyline(points: Pts, step = 18): Pts {
    return densify(points, step);
  },
  ellipse(cx: number, cy: number, rx: number, ry: number, a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2, n = 64): Pts {
    return Array.from({ length: n + 1 }, (_, i) => {
      const a = lerp(a0, a1, i / n);
      return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as const;
    });
  },
  rect(x: number, y: number, w: number, h: number, r = 12): Pts {
    const pts: Pt[] = [];
    const q = 6;
    const corner = (cx: number, cy: number, a0: number) => {
      for (let i = 0; i <= q; i++) {
        const a = a0 + (i / q) * (Math.PI / 2);
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    };
    corner(x + w - r, y + r, -Math.PI / 2);
    corner(x + w - r, y + h - r, 0);
    corner(x + r, y + h - r, Math.PI / 2);
    corner(x + r, y + r, Math.PI);
    pts.push(pts[0]);
    return densify(pts, 18);
  },
  /** An organic closed outline: cells, nuclei, swellings. */
  blob(cx: number, cy: number, rx: number, ry: number, key: string, lumpy = 0.14, n = 48): Pts {
    const r = rng(key);
    const k = [r(), r(), r()].map((v) => v * Math.PI * 2);
    return Array.from({ length: n + 1 }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const f = 1 + lumpy * (Math.sin(2 * a + k[0]) * 0.6 + Math.sin(3 * a + k[1]) * 0.4 + Math.sin(5 * a + k[2]) * 0.25);
      return [cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f] as const;
    });
  },
  wave(x1: number, x2: number, y: number, amp: number, waves: number, n = 72, phase = 0): Pts {
    return Array.from({ length: n + 1 }, (_, i) => {
      const u = i / n;
      return [lerp(x1, x2, u), y + Math.sin(u * waves * Math.PI * 2 + phase) * amp] as const;
    });
  },
  quad(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, n = 28): Pts {
    return Array.from({ length: n + 1 }, (_, i) => {
      const u = i / n;
      const v = 1 - u;
      return [v * v * x1 + 2 * v * u * cx + u * u * x2, v * v * y1 + 2 * v * u * cy + u * u * y2] as const;
    });
  },
};

export function densify(pts: Pts, step: number): Pts {
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let j = 1; j <= n; j++) out.push([lerp(ax, bx, j / n), lerp(ay, by, j / n)]);
  }
  return out;
}

/** Soft, low-frequency wobble: a few random control offsets, interpolated along the stroke. */
export function jitter(pts: Pts, key: string, amount: number, tick = 0): Pts {
  const r = rng(key, tick);
  const nc = 6;
  const cx = Array.from({ length: nc }, () => (r() - 0.5) * 2 * amount);
  const cy = Array.from({ length: nc }, () => (r() - 0.5) * 2 * amount);
  const last = pts.length - 1 || 1;
  return pts.map(([x, y], i) => {
    const u = (i / last) * (nc - 1);
    const k = Math.min(nc - 2, Math.floor(u));
    const f = smooth(u - k);
    return [x + lerp(cx[k], cx[k + 1], f), y + lerp(cy[k], cy[k + 1], f)] as const;
  });
}

export const toPath = (pts: Pts, close = false): string =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + (close ? " Z" : "");

/** An arrow as two strokes: a gently bent body, then the head. */
export function arrow(x1: number, y1: number, x2: number, y2: number, bend = 0.15, head = 20): Pts[] {
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend;
  const my = (y1 + y2) / 2 + (x2 - x1) * bend;
  const a = Math.atan2(y2 - my, x2 - mx);
  return [
    P.quad(x1, y1, mx, my, x2, y2),
    [
      [x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head],
      [x2, y2],
      [x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head],
    ],
  ];
}
