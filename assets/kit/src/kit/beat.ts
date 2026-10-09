/**
 * Timing for one beat, derived from the generated grid. A beat gets no duration of its own:
 * everything inside it is placed from its lines (and, once words.json exists, its words).
 */

import { createContext, useContext } from "react";
import { getInputProps, useCurrentFrame, useVideoConfig } from "remotion";

import { MOTION } from "./style";

export interface Grid {
  readonly fps: number;
  readonly totalFrames: number;
  readonly beats: readonly { beat: string; startFrame: number; durationFrames: number }[];
}

export interface LineTiming {
  readonly text: string;
  readonly start: number;
  readonly duration: number;
}

export interface Lines {
  readonly wpm: number;
  readonly beats: readonly { beat: string; title: string; lines: readonly LineTiming[] }[];
}

export interface BeatTiming {
  readonly id: string;
  readonly startFrame: number;
  readonly durationInFrames: number;
  readonly fps: number;
  readonly lines: readonly LineTiming[];
  /** Local frame on which line `i` starts. */
  readonly line: (i: number) => number;
  /** Local frame on which `word` (first match, by prefix) is spoken in line `i`. */
  readonly word: (word: string, i: number) => number;
}

const wordsOf = (text: string): string[] => text.match(/[A-Za-z0-9']+/g) ?? [];

export const beatTiming = (grid: Grid, lines: Lines, id: string): BeatTiming => {
  const slot = grid.beats.find((b) => b.beat === id);
  const beatLines = lines.beats.find((b) => b.beat === id)?.lines;
  if (!slot || !beatLines) throw new Error(`beat ${id} missing from grid or lines`);
  const line = (i: number): number => {
    const l = beatLines[i];
    if (!l) throw new Error(`beat ${id} has no line ${i}`);
    return Math.round(l.start * grid.fps);
  };
  const word = (w: string, i: number): number => {
    const l = beatLines[i];
    if (!l) throw new Error(`beat ${id} has no line ${i}`);
    const words = wordsOf(l.text);
    const index = words.findIndex((x) => x.toLowerCase().startsWith(w.toLowerCase()));
    if (index < 0) throw new Error(`beat ${id} line ${i}: "${w}" is not spoken in "${l.text}"`);
    return line(i) + Math.round((index / words.length) * l.duration * grid.fps);
  };
  return { id, startFrame: slot.startFrame, durationInFrames: slot.durationFrames, fps: grid.fps, lines: beatLines, line, word };
};

export const BeatContext = createContext<BeatTiming | null>(null);

export const useBeat = (): BeatTiming => {
  const beat = useContext(BeatContext);
  if (!beat) throw new Error("useBeat outside a beat");
  return beat;
};

/**
 * `--props='{"measure":true}'` holds every decorative motion still (line boil, drift), so a
 * freeze detector sees only real visual events. Used for rubric criterion 5.
 */
export const useMeasuring = (): boolean => Boolean((getInputProps() as { measure?: boolean }).measure);

/** The boil tick: changes `MOTION.boilFps` times a second, or never while measuring. */
export const useBoil = (): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const measuring = useMeasuring();
  return measuring ? 0 : Math.floor((frame * MOTION.boilFps) / fps);
};
