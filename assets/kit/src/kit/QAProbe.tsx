/**
 * Visual QA from inside the page (v3 plan, Step 8). With `--props='{"qa":true}'`, every frame
 * measures each element the kit tagged with `data-qa` and logs what is wrong with it:
 *
 *   - text overlapping other text (more than 8% of the smaller box);
 *   - text running outside the frame;
 *   - text set under the minimum size.
 *
 * `tools/qa.mjs` renders a frame every second and collects the log. Measuring the real layout
 * finds what eyeballing a contact sheet misses (PILOT-LOG F4).
 */

import { useEffect } from "react";
import {
  continueRender,
  delayRender,
  getInputProps,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface Box {
  readonly kind: string;
  /** Elements in different scopes (two beats mid-dissolve) are never compared. */
  readonly scope: string;
  readonly text: string;
  readonly size: number;
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

const ONE_LINE = new Set(["tag", "kicker", "stamp", "heading"]);

const visible = (el: Element): boolean => {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      Number(style.opacity) < 0.1
    )
      return false;
  }
  return true;
};

const overlap = (a: Box, b: Box): number => {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  if (w <= 0 || h <= 0) return 0;
  const smaller = Math.min(
    (a.x1 - a.x0) * (a.y1 - a.y0),
    (b.x1 - b.x0) * (b.y1 - b.y0),
  );
  return (w * h) / smaller;
};

export const QAProbe: React.FC<{ minSize: number }> = ({ minSize }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const on = Boolean((getInputProps() as { qa?: boolean }).qa);
  useEffect(() => {
    if (!on) return;
    // Measured one animation frame late: in a layout effect the composition wrapper has not
    // been sized yet, every absolutely placed box has a zero-width parent, and right-anchored
    // text wraps to one word per line (PILOT-LOG F12). The screenshot waits for this.
    const handle = delayRender("QAProbe measuring");
    const id = requestAnimationFrame(() => {
      // The composition root carries data-qa-root; its box is the frame, whatever the page scale.
      const root = document.querySelector("[data-qa-root]");
      if (!root)
        throw new Error(
          "QAProbe: no element with data-qa-root (put it on the composition root)",
        );
      const origin = root.getBoundingClientRect();
      const scale = origin.width / width || 1;
      const boxes: Box[] = [...document.querySelectorAll("[data-qa]")]
        .filter(visible)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            kind: el.getAttribute("data-qa") ?? "?",
            scope:
              el.closest("[data-qa-scope]")?.getAttribute("data-qa-scope") ??
              "",
            text: (el.textContent ?? "").trim().slice(0, 40),
            size: Number(el.getAttribute("data-qa-size") ?? 0),
            x0: (r.left - origin.left) / scale,
            y0: (r.top - origin.top) / scale,
            x1: (r.right - origin.left) / scale,
            y1: (r.bottom - origin.top) / scale,
          };
        })
        .filter((b) => b.x1 - b.x0 > 1 && b.y1 - b.y0 > 1);
      const issues: string[] = [];
      for (const b of boxes) {
        if (b.size && b.size < minSize)
          issues.push(`small ${b.kind} "${b.text}" ${b.size}px`);
        if (b.x0 < -2 || b.y0 < -2 || b.x1 > width + 2 || b.y1 > height + 2)
          issues.push(`outside ${b.kind} "${b.text}"`);
        // One-line elements that wrap have run out of room (a long series tag on 9:16).
        if (b.size && ONE_LINE.has(b.kind) && b.y1 - b.y0 > b.size * 1.9)
          issues.push(`wraps ${b.kind} "${b.text}"`);
      }
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          if (boxes[i].scope !== boxes[j].scope) continue;
          const o = overlap(boxes[i], boxes[j]);
          if (o > 0.08)
            issues.push(
              `overlap ${Math.round(o * 100)}% ${boxes[i].kind} "${boxes[i].text}" × ${boxes[j].kind} "${boxes[j].text}"`,
            );
        }
      }
      const rounded = boxes.map((b) => ({
        kind: b.kind,
        text: b.text,
        box: [b.x0, b.y0, b.x1, b.y1].map(Math.round),
      }));
      console.log(`QA ${JSON.stringify({ frame, boxes: rounded, issues })}`);
      continueRender(handle);
    });
    return () => cancelAnimationFrame(id);
  }, [on, frame, width, height, minSize]);
  return null;
};
