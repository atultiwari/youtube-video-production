/**
 * One focus at a time.
 *
 * A beat lists its steps in reading order: the note, then each thing drawn, written, washed or
 * stamped. Each step has the frame it would like to start (its cue) and how long it takes.
 * `sequence` starts every step at its cue or when the previous step has finished, whichever is
 * later, so nothing is ever drawn or written in two places at once.
 *
 * Why: the first v3 builds put a picture event on every spoken line while the note typed beside
 * it. They were never static, but they split attention up to six ways, and a viewer watching
 * without narration had nothing to say where to look (owner, 2026-10-09; focus-check.py measured
 * 17% and 27% of the runtime in split focus). In sequence, the order of arrival tells the story.
 *
 * Things in the *same place* as the step that owns them (a wash filling the shape just drawn,
 * the label on it) belong to that step, not to steps of their own.
 */

export interface Step {
  /** Name the beat uses to read the result: `s.red.from`. */
  readonly id: string;
  /** Earliest local frame: usually `b.line(i)` for a note, `b.word("cue", i)` for a drawing. */
  readonly at: number;
  /** Frames the step takes, from its start until its place is still again. */
  readonly dur: number;
}

export interface Slot {
  readonly from: number;
  readonly to: number;
  /** How many frames after its cue the step had to wait. */
  readonly late: number;
}

export type Sequence = Readonly<Record<string, Slot>> & { readonly __steps: readonly string[] };

/** Frames of stillness between two steps, so each arrival reads as its own. */
export const FOCUS_GAP = 4;

export const sequence = (steps: readonly Step[], gap = FOCUS_GAP): Sequence => {
  const out: Record<string, Slot> = {};
  let free = 0;
  for (const step of steps) {
    if (out[step.id]) throw new Error(`sequence: step "${step.id}" is listed twice`);
    if (!(step.dur > 0)) throw new Error(`sequence: step "${step.id}" needs a positive duration`);
    const from = Math.max(step.at, free);
    out[step.id] = { from, to: from + step.dur, late: from - step.at };
    free = from + step.dur + gap;
  }
  return Object.assign(out, { __steps: steps.map((s) => s.id) }) as Sequence;
};

/** The step for typing a note: typing time plus the pointer line drawing to its feature. */
export const noteStep = (id: string, at: number, text: string, fps: number, typeCps: number, pointerFrames: number): Step => ({
  id,
  at,
  // Typing, a 4-frame pause, then the pointer line (NoteCard draws it after the text).
  dur: Math.ceil((text.length / typeCps) * fps) + 4 + pointerFrames,
});

/** The most a step waited past its cue: a large value means the beat is overfull. */
export const maxLate = (s: Sequence): number => Math.max(0, ...s.__steps.map((id) => s[id].late));
