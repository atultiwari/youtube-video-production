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
  /**
   * Where the step happens, in picture coordinates. When two steps in a row both say where,
   * the second waits longer the farther the eye has to travel (EYE_TRAVEL frames to cross the
   * whole picture). Notes have no `where`: the note column is home, and the eye returns there.
   */
  readonly where?: readonly [number, number];
  /**
   * For a pointer: the step that draws what it points at. That step must come first, or the
   * pointer lands on blank paper (muted viewer, pilot round 2): `sequence` throws if it does not.
   */
  readonly target?: string;
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

/**
 * Extra frames to cross the whole picture diagonally. A muted viewer of the pilot lost the thread
 * when four labels appeared in four corners within two seconds (2026-10-09): one at a time is not
 * enough if the eye cannot get there before the next one starts.
 */
export const EYE_TRAVEL = 14;

export const sequence = (
  steps: readonly Step[],
  gap = FOCUS_GAP,
  /** Picture width and height, to scale eye travel. */
  size: readonly [number, number] = [1090, 860],
): Sequence => {
  const out: Record<string, Slot> = {};
  const diagonal = Math.hypot(size[0], size[1]);
  const places: Record<string, readonly [number, number] | undefined> = {};
  let free = 0;
  let last: readonly [number, number] | undefined;
  for (const step of steps) {
    if (out[step.id]) throw new Error(`sequence: step "${step.id}" is listed twice`);
    if (!(step.dur > 0)) throw new Error(`sequence: step "${step.id}" needs a positive duration`);
    if (step.target !== undefined && !out[step.target]) {
      throw new Error(`sequence: pointer "${step.id}" points at "${step.target}", which is not drawn yet: list it after "${step.target}"`);
    }
    const where = step.where ?? (step.target !== undefined ? places[step.target] : undefined);
    places[step.id] = where;
    const travel = last && where
      ? Math.round((EYE_TRAVEL * Math.hypot(where[0] - last[0], where[1] - last[1])) / diagonal)
      : 0;
    const from = Math.max(step.at, free + travel);
    out[step.id] = { from, to: from + step.dur, late: from - step.at };
    free = from + step.dur + gap;
    last = where ?? last;
  }
  return Object.assign(out, { __steps: steps.map((s) => s.id) }) as Sequence;
};

/** The step for typing a note. Its pointer is a separate `pointStep`, after the picture step. */
export const noteStep = (id: string, at: number, text: string, fps: number, typeCps: number): Step => ({
  id,
  at,
  dur: Math.ceil((text.length / typeCps) * fps),
});

/**
 * The pointer from a note to its feature, placed after the step that draws the feature, so it
 * lands on something. Drawn first, it ended on blank paper (muted viewers, 2026-10-09). Name the
 * `target` step (the one that draws what the note's `anchor` points at) and `sequence` checks it.
 */
export const pointStep = (id: string, pointerFrames: number, target?: string): Step =>
  target === undefined ? { id, at: 0, dur: pointerFrames } : { id, at: 0, dur: pointerFrames, target };

/** The most a step waited past its cue: a large value means the beat is overfull. */
export const maxLate = (s: Sequence): number => Math.max(0, ...s.__steps.map((id) => s[id].late));
