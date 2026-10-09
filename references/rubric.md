# Rubric: scoring a video's picture (step 11)

Eleven criteria, each scored 0–2, for a maximum of 22. The same rubric scored the v2 builds and
the v3 builds of the same briefs; a change to a video, or to this skill, counts as an improvement
only if it moves these scores.

**Score from evidence, not impressions.** Every score cites a measurement or a named frame. The
measurements below are reproducible with this skill's scripts (`tools/build-all.sh` runs them).

## Evidence to collect first

| Evidence | How |
|---|---|
| Beat-midpoint stills | one still at the midpoint of every beat (v2 step 11) |
| 2-second contact sheet | one still every 2 s across the whole video |
| Frame fill | per 2 s still, the content bounding box as a share of the frame (pixels brighter than the ground, spine margin excluded) |
| Event gaps | the measure render (`--props='{"measure":true}'`), then `scripts/event-gaps.py`; each static stretch of 4 s or more |
| One focus at a time | the same render, `scripts/focus-check.py`: sustained split focus and far arrivals |
| Phone test | stills downscaled to 360 px wide, read by eye |
| Text sizes | from the components: px at 1080p (16:9) or at 1080 wide (9:16) |

## The criteria

| # | Criterion | 2 | 1 | 0 |
|---|---|---|---|---|
| 1 | **A picture in every beat**: a drawn or photographed object that carries the idea, not a card of text | every beat | at least half the beats | under half |
| 2 | **The frame is filled** (median content bounding box on the 2 s sheet) | ≥ 50% | 30–49% | < 30% |
| 3 | **Text meets the minimum size**: 16:9 ≥ 36 px at 1080p; 9:16 ≥ 48 px at 1080 wide | all text | body text yes, secondary (headers, labels, sources) no | body text below |
| 4 | **One idea per frame** | every frame | one or two frames carry two | common |
| 5 | **A visual event every 2–4 s** (cut, stroke, arrival, highlight; a slow push-in does not count) | no static stretch ≥ 4 s | static ≥ 4 s for under 25% of runtime | 25% or more |
| 6 | **The style is consistent** (ground, palette, type, stroke) | throughout | one or two outliers | no house style |
| 7 | **Nothing overlaps** that should not (text on text, text on chrome, pen on what is being read) | none | one recurring or minor case | text unreadable from an overlap |
| 8 | **Readable at 360 px wide** | all text | main text yes, secondary no | main text no |
| 9 | **Sound design present**: music bed and/or effects tied to events, mixed under the voice | both, ducked | one of them | none |
| 10 | **Content accurate** against the validation file | every claim validated, caveats honoured | a caveat dropped | a false or unvalidated claim |
| 11 | **One focus at a time** (sustained split focus, `focus-check.py`; added 2026-10-09 after the owner watched v3) | under 5% of runtime, no run over 0.5 s | under 15% | 15% or more |

## Notes

- Criterion 5 measures *events*, so decorative motion (line boil, drift) is held still before
  measuring. Thin rings and typing count too little area to register: check a flagged stretch
  on the 2-second sheet (11-visual-qa.md).
- Criterion 9 is scored on the picture build as rendered. The voice is not scored here.
- A criterion that cannot be measured for a video is scored and marked **n/a**, never skipped.
