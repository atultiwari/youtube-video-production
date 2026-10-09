/**
 * The house style, read from `style.json` (copied from the skill's `styles/<name>.json` by
 * `install-kit.mjs`). The style is data: change the JSON, not the components.
 *
 * Layout depends on the composition's shape, so components ask `useLayout()` rather than
 * importing numbers: a 1920 × 1080 composition gets the "16:9" layout, a 1080 × 1920 one "9:16".
 */

import { useVideoConfig } from "remotion";

import style from "./style.json";

export interface Chapter {
  readonly accent: string;
  readonly ground: string;
  readonly wash: string;
}

export interface Layout {
  readonly width: number;
  readonly height: number;
  readonly margin: number;
  readonly picture: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
  readonly note: {
    readonly x: number;
    readonly w: number;
    readonly centreY: number;
    readonly kickerY: number;
    readonly pointerFrom: "left" | "top" | "none";
  };
  readonly tag: { readonly top: number };
  readonly simplifiedTag: { readonly x: number; readonly y: number; readonly text: string };
  readonly stamp: { readonly x: number; readonly y: number };
  readonly safeBottom?: number;
  readonly type: {
    readonly note: number;
    readonly noteLine: number;
    readonly kicker: number;
    readonly tag: number;
    readonly label: number;
    readonly heading: number;
    readonly stamp: number;
    readonly min: number;
  };
}

export const STYLE = style;
export const INK = style.ink;
export const TISSUE = style.tissue;
export const MOTION = style.motion;
export const STROKE = style.stroke;
export const CHAPTERS: Readonly<Record<string, Chapter>> = style.chapters;
export const FONTS = { serif: style.fonts.serif.family, sans: style.fonts.sans.family } as const;

export const chapter = (name: string): Chapter => {
  const found = CHAPTERS[name];
  if (!found) throw new Error(`style "${style.name}" has no chapter "${name}" (has: ${Object.keys(CHAPTERS).join(", ")})`);
  return found;
};

const LAYOUTS = style.layouts as unknown as Readonly<Record<"16:9" | "9:16", Layout>>;

export const layoutFor = (width: number, height: number): Layout => LAYOUTS[width >= height ? "16:9" : "9:16"];

/** The layout for the current composition's shape. */
export const useLayout = (): Layout => {
  const { width, height } = useVideoConfig();
  return layoutFor(width, height);
};
