# 4–5 · Script, lint, approve

## The first line decides everything

Measured on a real channel's published Shorts: **75.8% of viewers swiped away**, and **82.9% of
views came from the feed**. Distribution was never the problem — the opening was.

The two best performers opened on something the viewer already owned. The worst opened on a
definition or a number.

**So the first line names something the viewer already has.** Never a definition, never a
statistic, never the topic. `scripts/check-script.py` warns when the opening contains neither a
second-person pronoun nor a concrete anchor, and that warning is worth obeying.

The same holds for the first ten seconds of a longform, with less mercy — there is no feed to
catch someone who leaves.

## Delivery traps that are structural, not stylistic

These break **TTS specifically**. A human reader would sail through them.

**No one- or two-word heading followed by a full stop.** "Compute." and "Generalisation." each
fused into the following word on delivery, because the engine does not reliably pause there. It
was reported twice before a linter caught it — and the second time the linter missed it because
it only checked *within* a line, quietly assuming a line break is safe, which contradicts the
measurement that produced the rule.

**Never let a script depend on a pause existing.** Neither a full stop nor a line break reliably
buys one. Measured across 13 takes.

**No em dashes in spoken text.** They make the pause problem worse, not better.

**No digits in spoken text.** Spell them: `2023` → "twenty twenty-three". Numerals are read
unpredictably, sometimes as separate digits.

**No numbered or bulleted lists in the paste block.** The numbering gets read aloud. Plain
paragraphs, blank line between each.

## Structure that works

A **list with a rule running through it** — seven habits to drop, five mistakes, four checks —
where one principle is stated early and then visibly obeyed in every demonstration afterwards.

The rule is what makes it your video rather than a translation of someone else's. A caveat
delivered once and never referred to again is a disclaimer; a principle visible in every relevant
shot is a practice.

## Beats

Write the script in **beats** — one movement of the argument each, 20–90 seconds. Beats become
the audio takes, the timing grid and the Remotion sequences, so they are the unit everything
downstream shares.

**Beats reference lines of narration, never frame numbers.** A beat that names a frame breaks the
moment the take changes.

## Length

Derive a word target from the voice's **real** words-per-minute — for a cloned TTS voice this has
measured at **179 wpm**, not the 145 a human presenter runs at. Then treat it as an ordering
signal only. The real length comes from the take.

## The channel asks

Three things get promoted: **subscribe**, the **WhatsApp group**, and the **online workshops**.
Done badly this is the fastest way to lose the viewer you just earned.

**Rules that hold.**

- **Never before the value.** No ask in the first third. The hook has one job.
- **One sentence each.** An ask that needs a paragraph is an advert.
- **Earn it with the sentence before.** "If that was useful" beats "don't forget to".
- **Never stack them.** Two asks in one breath reads as a menu and nobody reads a menu.

**Where they go in a longform.**

| Where | Ask |
|---|---|
| After the first real payoff, ~⅓ in | The soft one, in passing: *"There's a one-minute version of each of these on the channel."* Drives subscription by showing there is more, not by asking. |
| End card | Workshops, then the group. *"If you'd rather work through this yourself than watch someone else do it, I run hands-on online workshops on ⟨topic⟩."* Then: *"There's also a WhatsApp group where I post what's worth knowing and when the next session runs. Both links are in the description."* |

**Where they go in a Short.** Nowhere in the narration — 26 to 56 seconds has no room and an ask
costs the payoff. Put them in the **pinned comment** and the **end frame**, and let the video
spend all its time being useful.

**On the end card**, drop the app chrome entirely. Everything before it has been a demonstration;
this is the channel speaking, and the change of register carries the shift without a word.

**What not to do.** An earlier end card summarised the vendor's price tiers. It read like the
vendor's marketing rather than a practitioner's video. If an ending sounds like it belongs to
somebody else's product, it does.

## Fabricated examples

Every invented case, figure, citation or output shown on screen is labelled as invented, and the
script says so aloud once. On a channel teaching people to check what a tool tells them, an
unlabelled invented output is the exact failure the video is about.

## The approval gate

A human reads the script before a take is spent. Scripts are cheap to change; takes are not, and
a script that has been recorded acquires a gravity it has not earned.

Run `scripts/check-script.py` first so the gate is spent on judgement, not typos.
