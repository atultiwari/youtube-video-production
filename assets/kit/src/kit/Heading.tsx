import React from "react";

import { charWidths, totalWidth, WrittenText } from "../whiteboard";
import { FONTS, INK, MOTION, useLayout } from "./style";

/**
 * A chapter heading, written by the pen in the real typeface, just above the picture zone.
 * The QA box is the text's own measured width, so a long heading that reaches the series tag
 * is caught.
 */
export const Heading: React.FC<{ text: string; at: number; color?: string; size?: number }> = ({
  text, at, color = INK.line, size,
}) => {
  const { picture, type } = useLayout();
  const px = size ?? type.heading;
  const family = `"${FONTS.serif}", Georgia, serif`;
  const width = Math.ceil(totalWidth(charWidths(text, px, family, 600)));
  return (
    <div style={{ position: "absolute", left: picture.x, top: picture.y - Math.round(px * 0.92), width: picture.w }}>
      <WrittenText text={text} viewBox={`0 0 ${picture.w} ${Math.round(px * 1.35)}`} size={px} x={0}
        y={Math.round(px * 1.02)} from={at} durationInFrames={Math.round(text.length * MOTION.writeFramesPerChar)}
        color={color} fontFamily={family} fontWeight={600} pen="marker" />
      <div data-qa="heading" data-qa-size={px} style={{ position: "absolute", left: 0, top: px * 0.18, width, height: px * 1.05 }} />
    </div>
  );
};
