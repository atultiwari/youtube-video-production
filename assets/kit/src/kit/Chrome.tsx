/**
 * Everything around the picture: paper, the series tag, the kicker, stamps and the
 * "simplified picture" tag. Positions and sizes come from the layout; all text is tagged for
 * the QA probe.
 */

import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";

import { FONTS, INK, MOTION, STYLE, useLayout, type Chapter } from "./style";

/**
 * Fonts load from local files in public/fonts (copied from Fontsource by install-kit.mjs), not
 * from Google at render time: a network fetch during a render timed out intermittently and
 * stalled the root component (pilot-01, F13). Local files make every render reproducible offline.
 */
const loaded = new Set<string>();
const loading: Promise<void>[] = [];
for (const font of [STYLE.fonts.serif, STYLE.fonts.sans]) {
  const faces = [
    ...font.weights.map((w) => ({ weight: w, style: "normal" as const })),
    ...font.italic.map((w) => ({ weight: w, style: "italic" as const })),
  ];
  for (const face of faces) {
    const key = `${font.family}:${face.weight}:${face.style}`;
    if (loaded.has(key)) continue;
    loaded.add(key);
    const promise = loadFont({
      family: font.family,
      url: staticFile(`fonts/${font.fontsource}-latin-${face.weight}-${face.style}.woff2`),
      weight: face.weight,
      style: face.style,
    }).catch((err: unknown) => {
      throw new Error(`could not load ${key}: ${String(err)} (re-run install-kit.mjs to copy the fonts)`);
    });
    loading.push(promise);
  }
}

/**
 * Resolves when every face is loaded. `Film` renders nothing until then: remotion-whiteboard
 * measures glyph widths once and caches them, so a heading measured against a fallback font
 * would keep the wrong pen path for the whole render.
 */
export const fontsReady: Promise<void> = Promise.all(loading).then(() => undefined);

const clamp01 = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Tinted paper, grain and a soft vignette. */
export const Paper: React.FC<{ chapter: Chapter; children?: React.ReactNode }> = ({ chapter, children }) => (
  <AbsoluteFill style={{ backgroundColor: chapter.ground }}>
    <Img src={staticFile(STYLE.paper.grain)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, ${STYLE.paper.vignette} 100%)` }} />
    {children}
  </AbsoluteFill>
);

/** The series tag, top right, in the chapter accent. One per video: the heading carries the chapter. */
export const SeriesTag: React.FC<{ chapter: Chapter; text: string }> = ({ chapter, text }) => {
  const layout = useLayout();
  return (
    <div data-qa="tag" data-qa-size={layout.type.tag} style={{
      position: "absolute", top: layout.tag.top, right: layout.margin, fontFamily: FONTS.sans, fontWeight: 600,
      fontSize: layout.type.tag, letterSpacing: "0.12em", textTransform: "uppercase", color: chapter.accent,
    }}>
      {text}
    </div>
  );
};

/** A short question above the notes, with an accent dash under it. */
export const Kicker: React.FC<{ chapter: Chapter; text: string; at?: number }> = ({ chapter, text, at = 0 }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  return (
    <div style={{ opacity: interpolate(frame, [at, at + 8], [0, 1], clamp01) }}>
      <div data-qa="kicker" data-qa-size={layout.type.kicker}
        style={{ display: "inline-block", fontFamily: FONTS.sans, fontWeight: 600, fontSize: layout.type.kicker, color: INK.line }}>{text}</div>
      <div style={{ width: 52, height: 6, borderRadius: 3, background: chapter.accent, marginTop: 12,
        transform: `scaleX(${interpolate(frame, [at + 4, at + 14], [0, 1], clamp01)})`, transformOrigin: "left" }} />
    </div>
  );
};

/** A rubber stamp: arrives big and tilted, settles with an overshoot. Defaults to the layout's stamp spot. */
export const Stamp: React.FC<{ text: string; at: number; color: string; x?: number; y?: number; rotate?: number; size?: number }> = ({
  text, at, color, x, y, rotate = -6, size,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  if (frame < at) return null;
  const px = size ?? layout.type.stamp;
  const s = spring({ frame: frame - at, fps, durationInFrames: MOTION.stampFrames * 2, config: { damping: 11, stiffness: 180 } });
  return (
    <div data-qa="stamp" data-qa-size={px} style={{
      position: "absolute", left: x ?? layout.stamp.x, top: y ?? layout.stamp.y,
      transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${interpolate(s, [0, 1], [1.7, 1])})`,
      opacity: interpolate(frame - at, [0, 3], [0, 1], clamp01), border: `5px solid ${color}`, borderRadius: 8,
      padding: "10px 22px", color, fontFamily: FONTS.sans, fontWeight: 700, fontSize: px, letterSpacing: "0.14em",
      textTransform: "uppercase", whiteSpace: "nowrap", background: "rgba(251,248,242,0.55)",
    }}>
      {text}
    </div>
  );
};

/** Marks a schematic as simplified, so a still cannot pass for a micrograph. */
export const SimplifiedTag: React.FC<{ at?: number }> = ({ at = 0 }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  return (
    <div data-qa="tag" data-qa-size={layout.type.tag} style={{
      position: "absolute", left: layout.simplifiedTag.x, top: layout.simplifiedTag.y,
      opacity: interpolate(frame, [at, at + 8], [0, 1], clamp01), border: `2px solid ${INK.soft}`, borderRadius: 6,
      padding: "4px 12px", fontFamily: FONTS.sans, fontWeight: 600, fontSize: layout.type.tag, letterSpacing: "0.1em",
      color: INK.soft, textTransform: "uppercase",
    }}>
      {layout.simplifiedTag.text}
    </div>
  );
};
