# Sound design (step 10b, after the build)

v2 mastered the voice and nothing else. Both references carry sound under every picture; the
biopsy build synthesises all of it. This stage adds effects and a music bed, and levels them
under the voice.

## Effects come from the picture, not from a cue list

```
scripts/sound-design.py out/A/measure.mp4 --out out/A/sound --beats public/A/grid/beats.json \
    --narration out/A/grid/en-narration.wav
```

It reads the measure render (decorative motion held still) frame by frame and places effects
on what actually happens:

| On screen | Sound |
|---|---|
| ink being drawn in the picture zone | pencil scratch, gated, with grain |
| a sudden arrival in the picture (wash, label, ring) | soft pop |
| a note typing | quiet ticks, capped at 14 a second |
| a stamp landing, a card changing | thump, or paper swish |
| a beat boundary (from `beats.json`) | paper whoosh |

Why from the picture: a cue list duplicates timing that already lives in the components, and
drifts the first time a beat is retimed. On the pilot the detector found 638 ticks, 34 pops,
29 swishes, 20 thumps, 7 whooshes and 70 s of drawing in 250 s, with no list written by hand.
Beat boundaries come from the grid because a dissolve between similar paper tints changes too
little per frame to detect.

Everything is synthesised from seeded noise and sine partials (originally ported from a
project-local `sfx.mjs`, not shipped with the skill): no samples, so nothing to license. If a licensed library is used instead, record
every file and its licence in the validation file.

## Levels

| Stem | Level | Why |
|---|---|---|
| Voice | −14 LUFS, −1 dBTP (master-audio.py) | unchanged from v2 |
| Music bed | −22 LUFS, ducked about 4 dB under the voice | sits about 12 dB under speech, comes back in the pauses |
| Effects | −24 LUFS, ducked harder | less if their peaks would clip |
| Mix | true peak ≤ −1 dBTP, verified | |

Measured with a speech-like test signal: ducking at threshold 0.1 / ratio 3 pulled the bed down
6.8 dB, to 20 dB under speech, where it effectively vanished; 0.15 / 2.5 ducks 4.0 dB.

Two failures the script now prevents:

- **A clipped stem.** Levelling the effects to their loudness target put 63 samples at 0 dBFS
  (the thumps), and the mix limiter could not remove the inter-sample overs: −0.1 dBTP. Each
  stem is now levelled only as far as its peaks allow, and says so when that falls short.
- **A sample limiter trusted for true peak.** `alimiter` works on samples. The mix is measured
  with `ebur128=peak=true` and the limit lowered until the true peak is under −1 dBTP, the same
  lesson as `master-audio.py`.

Without a narration (a draft, or the voice not yet recorded) nothing is pushed up to fill the
silence: the bed stays at −22 LUFS.

## Dependencies

numpy and ffmpeg. Not SciPy: its compiled modules fail to load on some macOS builds, so the
one-pole filters are FFT convolutions with their exponential impulse response.
