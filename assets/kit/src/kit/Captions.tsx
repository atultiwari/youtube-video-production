/**
 * Burned-in captions (Shorts; added with the E01 Shorts, Nov 2026): the script's words, timed to the spoken word, in short
 * phrases, the current word highlighted. One line, between the note card and the bottom 360 px
 * that YouTube and Instagram cover with their own interface.
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

import type { Grid, Lines } from "./beat";
import { FONTS, INK, useLayout } from "./style";

type Tok = { text: string; t: number };

const phrases = (grid: Grid, lines: Lines): { toks: Tok[]; start: number; end: number }[] => {
  const out: { toks: Tok[]; start: number; end: number }[] = [];
  for (const b of lines.beats) {
    const s0 = grid.beats.find((x) => x.beat === b.beat)!.startFrame / grid.fps;
    for (const ln of b.lines) {
      const ws = ln.words ?? [];
      let idx = 0;
      const toks: Tok[] = ln.text.split(/\s+/).filter(Boolean).map((text) => {
        const n = (text.replace(/’/g, "'").match(/[A-Za-z0-9']+/g) ?? []).length;
        const t = s0 + (ws[Math.min(idx, ws.length - 1)]?.start ?? ln.start);
        idx += n;
        return { text, t };
      });
      let cur: Tok[] = [];
      toks.forEach((tok, i) => {
        // Break *before* a word that would make the phrase too wide for 1080 px at 54 px bold:
        // checking the length only after adding let a long last word run off the frame
        // (E02S2: "and twenty thousand chest radiographs,").
        if (cur.length && [...cur, tok].map((c) => c.text).join(" ").length > 28) {
          out.push({ toks: cur, start: cur[0].t, end: 0 });
          cur = [];
        }
        cur.push(tok);
        const len = cur.map((c) => c.text).join(" ").length;
        if (i === toks.length - 1 || /[.?!,;:]$/.test(tok.text) || cur.length >= 5 || len >= 26) {
          out.push({ toks: cur, start: cur[0].t, end: 0 });
          cur = [];
        }
      });
    }
  }
  out.forEach((p, i) => { p.end = out[i + 1]?.start ?? p.start + 3; });
  return out;
};

export const Captions: React.FC<{ grid: Grid; lines: Lines; accent?: string }> = ({ grid, lines, accent = "#2E77B4" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const t = frame / fps;
  const all = phrases(grid, lines);
  const p = all.find((x) => t >= x.start && t < x.end);
  if (!p) return null;
  const active = p.toks.reduce((k, tok, i) => (tok.t <= t ? i : k), 0);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div data-qa="caption" data-qa-size={54} style={{ position: "absolute", top: layout.height - (layout.safeBottom ?? 0) - 82, fontFamily: FONTS.sans, fontWeight: 700, fontSize: 54, lineHeight: 1.2, color: INK.line, whiteSpace: "nowrap" }}>
        {p.toks.map((tok, i) => (
          <span key={i} style={{ padding: "2px 8px", borderRadius: 8, marginRight: 4, background: i === active ? accent : "transparent", color: i === active ? "#FBF8F2" : INK.line }}>{tok.text}</span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
