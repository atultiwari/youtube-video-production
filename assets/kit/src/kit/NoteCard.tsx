/**
 * The note: one short line typed in beside (16:9) or under (9:16) the picture, joined to the
 * spot it describes by a pointer line, with the key phrase underlined in the chapter accent on
 * the frame it is spoken. In a "caption" style (sketchbook) it is a strip with no pointer.
 *
 * The pointer draws after the note has been typed, never while (one focus at a time): read
 * the note, then follow the line to the place it names.
 *
 * A note holds no duration: it starts on a frame from the beat's lines and stays until the next.
 */

import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { Kicker } from "./Chrome";
import { FONTS, INK, MOTION, STYLE, useLayout, type Chapter, type Layout } from "./style";

export interface Note {
  /** Local frame the note starts typing. */
  readonly at: number;
  readonly text: string;
  /** Phrase to underline, and the frame it is spoken. */
  readonly underline?: { readonly phrase: string; readonly at: number };
  /** Where the pointer lands, in picture coordinates. */
  readonly anchor?: readonly [number, number];
}

const clamp01 = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Frames to type `n` characters. */
export const typeFrames = (n: number, fps: number): number => Math.ceil((n / MOTION.typeCps) * fps);

/** Where the card sits, and where its pointer leaves from. */
const cardBox = (layout: Layout): { top?: number; centreY?: number; from: [number, number] | null } => {
  const n = layout.note;
  if (n.pointerFrom === "left") return { centreY: n.centreY, from: [n.x, n.centreY] };
  if (n.pointerFrom === "top") return { top: n.kickerY + 90, from: [n.x + 70, n.kickerY + 90] };
  return { centreY: n.centreY, from: null };
};

const Pointer: React.FC<{ from: [number, number]; anchor: readonly [number, number]; at: number; color: string; vertical: boolean }> = ({
  from, anchor, at, color, vertical,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { picture } = useLayout();
  const p = interpolate(frame, [at, at + MOTION.pointerFrames], [0, 1], clamp01);
  if (p <= 0) return null;
  const ax = picture.x + anchor[0];
  const ay = picture.y + anchor[1];
  const elbow = vertical ? `L ${from[0]} ${from[1] - 44}` : `L ${from[0] - 44} ${from[1]}`;
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} viewBox={`0 0 ${width} ${height}`}>
      <path d={`M ${from[0]} ${from[1]} ${elbow} L ${ax} ${ay}`} fill="none" stroke={INK.line} strokeWidth={2.4} pathLength={1}
        strokeDasharray={1} strokeDashoffset={1 - p} strokeLinecap="round" />
      <circle cx={ax} cy={ay} r={7 * interpolate(p, [0.85, 1], [0, 1], clamp01)} fill={color} stroke={INK.line} strokeWidth={2} />
    </svg>
  );
};

/** Text typed in place: untyped characters keep their space, so nothing reflows. */
const Typed: React.FC<{ text: string; shown: number; underline?: Note["underline"]; typedAt: number; color: string }> = ({
  text, shown, underline, typedAt, color,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const visible = (from: number, to: number) => {
    const cut = Math.max(from, Math.min(to, shown));
    return (
      <>
        <span>{text.slice(from, cut)}</span>
        <span style={{ color: "transparent" }}>{text.slice(cut, to)}</span>
      </>
    );
  };
  if (!underline) return visible(0, text.length);
  const start = text.indexOf(underline.phrase);
  if (start < 0) throw new Error(`underline "${underline.phrase}" is not in the note "${text}"`);
  const end = start + underline.phrase.length;
  // Lands on the spoken word, but never before the phrase has been typed.
  const u0 = Math.max(underline.at, typedAt + typeFrames(end, fps));
  const u = interpolate(frame, [u0, u0 + MOTION.underlineFrames], [0, 1], clamp01);
  return (
    <>
      {visible(0, start)}
      <span style={{ position: "relative", whiteSpace: "nowrap" }}>
        {visible(start, end)}
        <span style={{ position: "absolute", left: 0, bottom: "-0.06em", height: 6, borderRadius: 3, width: `${u * 100}%`, background: color }} />
      </span>
      {visible(end, text.length)}
    </>
  );
};

export const NoteCard: React.FC<{
  notes: readonly Note[];
  chapter: Chapter;
  /** The question above the notes (card styles only). */
  kicker?: string;
  kickerAt?: number;
  /** Local frame after which the card steps aside, e.g. for an end card. */
  until?: number;
}> = ({ notes, chapter, kicker, kickerAt = 0, until = Number.MAX_SAFE_INTEGER }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const caption = STYLE.notes === "caption";
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].at < notes[i - 1].at) throw new Error(`NoteCard: notes must be in time order ("${notes[i].text}" starts before the note above it)`);
  }
  const index = notes.reduce((found, n, i) => (n.at <= frame ? i : found), -1);
  const note = index >= 0 ? notes[index] : null;
  const shown = note ? Math.floor(((frame - note.at) * MOTION.typeCps) / fps) : 0;
  const cardIn = interpolate(frame, [notes[0]?.at ?? 0, (notes[0]?.at ?? 0) + 6], [0, 1], clamp01);
  const gone = interpolate(frame, [until, until + 8], [1, 0], clamp01);
  if (gone <= 0) return null;
  const box = cardBox(layout);
  const n = layout.note;
  const body = (
    <div data-qa="note" data-qa-size={layout.type.note} style={{
      opacity: cardIn, background: caption ? `${INK.card}D9` : INK.card,
      border: caption ? "none" : `2px solid ${INK.cardEdge}`, borderRadius: caption ? 16 : 0,
      padding: caption ? "14px 30px" : "30px 36px 36px", fontFamily: FONTS.serif, fontWeight: 500,
      fontSize: layout.type.note, lineHeight: layout.type.noteLine, color: INK.line, textAlign: caption ? "center" : "left",
      boxShadow: caption ? "none" : "0 2px 0 rgba(43,39,35,0.08)",
    }}>
      {caption ? null : <div style={{ width: 40, height: 5, borderRadius: 3, background: chapter.accent, marginBottom: 16 }} />}
      {note ? <Typed text={note.text} shown={shown} underline={note.underline} typedAt={note.at} color={chapter.accent} /> : " "}
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, opacity: gone }}>
      {note?.anchor && box.from ? (
        <Pointer key={index} from={box.from} anchor={note.anchor} at={note.at + typeFrames(note.text.length, fps) + 4} color={chapter.accent} vertical={n.pointerFrom === "top"} />
      ) : null}
      {kicker && !caption ? (
        <div style={{ position: "absolute", left: n.x, top: n.kickerY, width: n.w }}>
          <Kicker chapter={chapter} text={kicker} at={kickerAt} />
        </div>
      ) : null}
      {box.top !== undefined ? (
        <div style={{ position: "absolute", left: n.x, top: box.top, width: n.w }}>{body}</div>
      ) : (
        <div style={{ position: "absolute", left: n.x, width: n.w, top: 0, height: (box.centreY ?? 0) * 2,
          display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {body}
        </div>
      )}
    </div>
  );
};
