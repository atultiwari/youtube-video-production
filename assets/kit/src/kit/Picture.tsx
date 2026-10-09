/**
 * The picture zone and what is drawn in it. Every layer shares the picture's coordinate space
 * (the layout's `picture` box, 1 unit = 1 px), so strokes, washes, hatching and labels line up.
 *
 * Line work goes through remotion-whiteboard's `Drawing` (draw-on, pen, pen lifts, pressure).
 * Jitter, line boil, watercolour and hatching are ported from the biopsy build.
 */

import React, { useId, useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { Drawing } from "../whiteboard";
import { useBoil, useMeasuring } from "./beat";
import { jitter, P, toPath, type Pts } from "./shapes";
import { FONTS, INK, MOTION, STROKE, useLayout } from "./style";

const clamp01 = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useView = (): string => {
  const { picture } = useLayout();
  return `0 0 ${picture.w} ${picture.h}`;
};

/** The picture zone. Children are absolutely stacked layers in the same coordinate space. */
export const Picture: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { picture } = useLayout();
  return (
    <div style={{ position: "absolute", left: picture.x, top: picture.y, width: picture.w, height: picture.h }}>
      {children}
    </div>
  );
};

const Layer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox={useView()} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
    {children}
  </svg>
);

export interface InkProps {
  /** Strokes in narrative order: each follows the clause that names it. */
  readonly strokes: readonly Pts[];
  readonly from: number;
  readonly durationInFrames: number;
  readonly id: string;
  readonly color?: string;
  readonly width?: number;
  readonly jitterAmount?: number;
  readonly closed?: boolean;
  /** A faint second pass, pencil-over-pencil. */
  readonly double?: boolean;
  readonly pen?: boolean;
}

/** Line work, drawn on by the pen, re-jittered at the boil rate. */
export const Ink: React.FC<InkProps> = ({
  strokes, from, durationInFrames, id, color = INK.line, width = STROKE.standard, jitterAmount = STROKE.jitter,
  closed = false, double = true, pen = true,
}) => {
  const tick = useBoil();
  const view = useView();
  // The pen is hidden in measure renders: a moving pen reads as two places to focus-check.py
  // (where it was, where it is), and the stroke it draws already marks the spot.
  const measuring = useMeasuring();
  const showPen = pen && !measuring;
  const paths = useMemo(
    () => strokes.map((s, i) => toPath(jitter(s, `${id}:${i}`, jitterAmount, tick), closed)),
    [strokes, id, jitterAmount, tick, closed],
  );
  const ghost = useMemo(
    () => (double ? strokes.map((s, i) => toPath(jitter(s, `${id}:${i}#2`, jitterAmount * 1.4, tick), closed)) : []),
    [strokes, id, jitterAmount, tick, closed, double],
  );
  return (
    <>
      {double ? (
        <div style={{ position: "absolute", inset: 0, opacity: STROKE.ghostOpacity }}>
          <Drawing viewBox={view} paths={ghost} from={from} durationInFrames={durationInFrames}
            stroke={color} strokeWidth={width * 0.6} showMarker={false} liftFraction={0.1} />
        </div>
      ) : null}
      <div style={{ position: "absolute", inset: 0 }}>
        <Drawing viewBox={view} paths={paths} from={from} durationInFrames={durationInFrames}
          stroke={color} strokeWidth={width} showMarker={showPen} liftFraction={0.1} markerSize={84} />
      </div>
    </>
  );
};

/**
 * Watercolour: three jittered translucent layers and a pooled darker edge.
 * `highlight` arrives in `MOTION.highlightWashFrames` so it reads as an event; a ground wash
 * fades slowly and reads as ambient (pilot-01, D7).
 */
export const Wash: React.FC<{
  shape: Pts; color: string; at: number; id: string; alpha?: number; amount?: number; highlight?: boolean;
}> = ({ shape, color, at, id, alpha = 0.55, amount = 5, highlight = false }) => {
  const frame = useCurrentFrame();
  const tick = useBoil();
  const frames = highlight ? MOTION.highlightWashFrames : MOTION.groundWashFrames;
  const a = alpha * interpolate(frame, [at, at + frames], [0, 1], clamp01);
  if (a <= 0) return null;
  return (
    <Layer>
      {[0, 1, 2].map((l) => (
        <path key={l} d={toPath(jitter(shape, `${id}:w${l}`, amount, tick), true)} fill={color} opacity={a * 0.42} />
      ))}
      <path d={toPath(jitter(shape, `${id}:we`, amount * 0.6, tick), true)} fill="none" stroke={color} strokeWidth={3} opacity={a * 0.45} />
    </Layer>
  );
};

/** Diagonal pencil hatching clipped to a shape, revealed line by line. */
export const Hatch: React.FC<{
  shape: Pts; at: number; durationInFrames?: number; id: string; gap?: number; color?: string; alpha?: number; width?: number;
}> = ({ shape, at, durationInFrames = 18, id, gap = 16, color = INK.line, alpha = 0.32, width = 1.8 }) => {
  const frame = useCurrentFrame();
  const tick = useBoil();
  const clipId = useId().replace(/:/g, "");
  const xs = shape.map((p) => p[0]);
  const ys = shape.map((p) => p[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
  const total = Math.floor((x1 - x0 + (y1 - y0)) / gap);
  const shown = Math.floor(total * interpolate(frame, [at, at + durationInFrames], [0, 1], clamp01));
  if (shown <= 0) return null;
  return (
    <Layer>
      <defs>
        <clipPath id={clipId}><path d={toPath(shape, true)} /></clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`} opacity={alpha}>
        {Array.from({ length: shown }, (_, i) => {
          const s = x0 - (y1 - y0) + i * gap;
          return (
            <path key={i} d={toPath(jitter(P.line(s, y1, s + (y1 - y0), y0, 6), `${id}:h${i}`, 1, tick))}
              stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" />
          );
        })}
      </g>
    </Layer>
  );
};

/** A typeset label inside the picture: never drawn. Tagged for the QA probe. */
export const Label: React.FC<{
  text: string; x: number; y: number; at: number; color?: string; size?: number;
  anchor?: "start" | "middle" | "end"; italic?: boolean; weight?: number;
}> = ({ text, x, y, at, color = INK.line, size, anchor = "middle", italic = true, weight = 500 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const px = size ?? layout.type.label;
  const s = spring({ frame: frame - at, fps, config: { damping: 200 }, durationInFrames: 10 });
  if (frame < at) return null;
  return (
    <Layer>
      <text data-qa="label" data-qa-size={px} x={x} y={y + (1 - s) * 10} textAnchor={anchor} fontFamily={FONTS.serif}
        fontStyle={italic ? "italic" : "normal"} fontWeight={weight} fontSize={px} fill={color} opacity={s}>
        {text}
      </text>
    </Layer>
  );
};

/** Filled dots (proteins, granules) that pop in one after another. */
export const Dots: React.FC<{ points: readonly (readonly [number, number])[]; r: number; color: string; at: number; every?: number }> = ({
  points, r, color, at, every = 2,
}) => {
  const frame = useCurrentFrame();
  return (
    <Layer>
      {points.map(([x, y], i) => {
        const t = frame - at - i * every;
        if (t < 0) return null;
        const k = interpolate(t, [0, 4, 7], [0, 1.25, 1], clamp01);
        return <circle key={i} cx={x} cy={y} r={r * k} fill={color} />;
      })}
    </Layer>
  );
};

/** Moves a group in a straight line between two frames (cells drifting, fluid leaving). */
export const Drift: React.FC<{ from: number; to: number; dx: number; dy: number; children: React.ReactNode }> = ({
  from, to, dx, dy, children,
}) => {
  const frame = useCurrentFrame();
  const { picture } = useLayout();
  const p = interpolate(frame, [from, to], [0, 1], { ...clamp01, easing: (t) => t * t * (3 - 2 * t) });
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translate(${(dx * p * 100) / picture.w}%, ${(dy * p * 100) / picture.h}%)` }}>
      {children}
    </div>
  );
};

/** Shows its layers only between two frames, fading at both ends (a state that passes). */
export const Between: React.FC<{ from: number; to: number; children: React.ReactNode; fade?: number }> = ({
  from, to, children, fade = 6,
}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to) return null;
  const o = Math.min(interpolate(frame, [from, from + fade], [0, 1], clamp01), interpolate(frame, [to - fade, to], [1, 0], clamp01));
  return <div style={{ position: "absolute", inset: 0, opacity: o }}>{children}</div>;
};

/**
 * A hand-drawn callout ring around a feature, drawn on a cue word. Thin strokes alone barely
 * register as events, so pair a ring with a highlight wash when it is the line's only event.
 */
export const Ring: React.FC<{ cx: number; cy: number; rx: number; ry: number; at: number; id: string; color: string; width?: number }> = ({
  cx, cy, rx, ry, at, id, color, width = 5,
}) => (
  <Ink strokes={[P.ellipse(cx, cy, rx, ry, -Math.PI * 0.6, Math.PI * 1.55, 72)]} from={at} durationInFrames={MOTION.ringFrames}
    id={id} color={color} width={width} double={false} />
);
