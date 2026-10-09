/**
 * A whole video: every beat on the generated grid, each on its chapter's paper with the series
 * tag, a short dissolve between beats, the narration under it, and the QA probe on top.
 *
 * Remotion serialises composition props, and beats are components, so wrap Film in a component
 * of your own that binds the data, and register that:
 *
 *   const MyVideo: React.FC = () => <Film grid={grid} lines={lines} beats={BEATS} series="…" />;
 */

import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";

import { BeatContext, beatTiming, type Grid, type Lines } from "./beat";
import { fontsReady, Paper, SeriesTag } from "./Chrome";
import { QAProbe } from "./QAProbe";
import { chapter, MOTION, useLayout } from "./style";

export interface BeatEntry {
  /** The beat id in beats.json, e.g. "01". */
  readonly id: string;
  /** A chapter name from the style. */
  readonly chapter: string;
  readonly Component: React.FC;
}

const FadeIn: React.FC<{ children: React.ReactNode; enabled: boolean; scope: string }> = ({ children, enabled, scope }) => {
  const frame = useCurrentFrame();
  const opacity = enabled ? interpolate(frame, [0, MOTION.beatDissolve], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return <AbsoluteFill data-qa-scope={scope} style={{ opacity }}>{children}</AbsoluteFill>;
};

export const Film: React.FC<{
  grid: Grid;
  lines: Lines;
  beats: readonly BeatEntry[];
  /** The series tag shown top right on every beat. */
  series: string;
  /** Narration under `public/`, e.g. "A/grid/en-narration.wav". */
  narration?: string;
}> = ({ grid, lines, beats, series, narration }) => {
  const layout = useLayout();
  const [handle] = useState(() => delayRender("Film: waiting for fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fontsReady.then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  if (!ready) return <AbsoluteFill data-qa-root />;
  return (
    <AbsoluteFill data-qa-root>
      {beats.map(({ id, chapter: name, Component }, i) => {
        const timing = beatTiming(grid, lines, id);
        const last = i === beats.length - 1;
        const ch = chapter(name);
        return (
          <Sequence key={id} name={`beat ${id}`} from={timing.startFrame}
            durationInFrames={timing.durationInFrames + (last ? 0 : MOTION.beatDissolve)}>
            <BeatContext.Provider value={timing}>
              <FadeIn enabled={i > 0} scope={id}>
                <Paper chapter={ch}>
                  <SeriesTag chapter={ch} text={series} />
                  <Component />
                </Paper>
              </FadeIn>
            </BeatContext.Provider>
          </Sequence>
        );
      })}
      {narration ? <Audio src={staticFile(narration)} /> : null}
      <QAProbe minSize={layout.type.min} />
    </AbsoluteFill>
  );
};
