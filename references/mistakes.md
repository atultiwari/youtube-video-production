# The catalogue

What went wrong, how it was found, and what it cost. Read this when something behaves oddly —
several of these look like other problems.

## Timing and audio

**A word-count runtime estimate was 25% wrong.** 145 wpm is a human-presenter figure; the cloned
voice ran at **179**. A script estimated at 9:04 came back at 7:21 — and 89 words had already been
cut from it to fix a runtime that was never over. *Record, then measure. Never trim to an estimate.*

**A comparison between a measured take and an estimated one inverted the answer.** A single Hindi
beat looked 15% *shorter* than English. Measured against measured, Hindi ran 8% **longer** — the
expected direction. *Never compare a measurement against an estimate.*

**Five mastering passes reported identical numbers.** The ffmpeg wrapper did not raise, so a
failed filter left the loop re-measuring a stale file. The filter had never run: `alimiter`'s
`limit` is a linear ratio, not decibels, and the dB value was out of range. *Check return codes;
identical output across passes means nothing ran.*

**Sizing each beat to the slower language put 35 seconds of silence in the primary track.**
Audible as dead air. Fixed by time-stretching the second language per beat, capped. *Fit to the
reference language; do not pad to the slowest.*

**A 1,204-character paste was silently cut to 1,000.** The visible counter advertised a larger cap
that did not apply to cloned voices; a quieter line elsewhere carried the true number. The wrong
one was believed and stated confidently before the truncation was noticed. *Check the counter
against your own count on every paste.*

**Draft timing put words a median 1.3 s from where they were spoken.** Word share of a line at
179 wpm, checked against a real take's transcribed word times (S-107, 157 words): 90th
percentile 2.6 s, worst 3.1 s. An underline that lands a second late has missed. *Transcribe the
takes (`word-timestamps.py`) before the final build.*

**An effects stem clipped on its way to its loudness target.** 63 samples at 0 dBFS, from the
stamp thumps; the mix limiter could not remove the inter-sample overs it made (−0.1 dBTP).
*Level a stem only as far as its peaks allow, and verify true peak after limiting.*

**Ducking at the obvious settings made the music vanish.** Threshold 0.1, ratio 3 pulled the
bed 6.8 dB, to 20 dB under speech. *Measure the duck with a speech-like signal; 4 dB was right.*

**"The API serves stock speakers only" stayed true in this file long after it stopped being
true.** Every take of every video went through the browser studio, pasted and downloaded by
hand, while Sarvam's API had a cloned-voice endpoint. *Re-check a provider's API before
automating around it; date the claim when it is written.*

## Delivery

**"Compute." and "Generalisation." each fused into the next word.** A one- or two-word heading
followed by a full stop does not buy a pause. Reported twice by the user before a linter caught it
— and the second time the linter missed it because it only checked *within* a line, quietly
assuming a line break was safe, which contradicted the very measurement that produced the rule.
*A rule derived from a measurement must not be implemented against an assumption.*

**An em dash was proposed as the fix for a missing pause.** It makes it worse.

## Interfaces

**The same prompt box was rebuilt wrong twice from memory.** It is a pill, not a rounded
rectangle; one line, not two; a coloured send button, not white; a 768px column. *Ten minutes of
looking beats any amount of remembering.*

**Settings was built as a full page. It is a modal dialog** — 680×514, radius 16, with a search
field at the top of its sidebar that the invented version did not have at all.

**A task list was built as cards with Pause and Delete buttons.** The real one is a flat list with
no controls until hover.

**Complete, accurate, unreadable screens.** The first build showed whole interfaces at product
scale. The reference never shows a whole interface — it pushes in until type is two to three times
product size.

**A first build cut once every 16 seconds.** The reference cuts every 4.9. That alone was most of
"not engaging".

## Composition

**An absolutely-positioned fill inside a plain `<div>` collapsed**, rendering an empty background
where a window should have been.

**A persistent rule badge was rendered per beat, and one beat forgot it** — exactly the failure a
persistent badge exists to prevent. *Hoist anything that must always be present to the root.*

**An eased reveal made a process look further along than the narration said.** At 39% elapsed it
read 77% done. *Linear for processes.*

**Set type appeared before the hand-written heading it belonged to.** Anything beside written text
needs an explicit start frame.

**Fonts fetched at render time stalled the whole composition.** `@remotion/google-fonts` loads
from Google during each render; twice a render timed out "waiting for root component to load".
*Load fonts from local files (`install-kit.mjs` copies them from Fontsource, OFL).*

**A QA probe in a layout effect measured a frame with no width.** The composition wrapper is
sized after layout effects run; every right-anchored tag "wrapped" to one word per line at
x −443. *Measure one animation frame later, holding the screenshot with `delayRender`.*

**Re-running remotion-whiteboard's installer overwrote the project's tokens.ts**, the one file
a project is told to edit. Fixed in that repo: it now keeps the project's copy.

**A centred `WrittenText` with no `x` centred on 0**, half off the frame. Fixed in
remotion-whiteboard: it now centres on the viewBox.

**Composition props are serialised**, so a shot list of render functions arrived as nothing.
*Wrap `Film` in a component that binds its own data.*

**SciPy's compiled modules failed to load on macOS.** *The sound script uses numpy only.*

## Picture (v3)

**Both v2 test videos used a sixth of the frame.** Measured median content box: 21% (longform),
18% (Short). Dark cards of text on a dark ground, no picture in most beats, and the stills
review passed them, because it had no standard. *Score stills against the rubric, with numbers.*

**The stills review passed two lines of text overlapping (S-107).** Looking at one frame per
beat finds bugs, not collisions. *Run the QA probe; read the 2-second sheet.*

**Label collisions showed only on the 2-second sheet.** On the v3 pilot, every label that landed
on a stroke, a stamp or a tag was invisible on the beat midpoints. *Midpoints are not enough.*

**A cut on every line still left 52% of the runtime static.** And a hand-built picture with no
rule left 35%: the gaps sat wherever a note had finished typing. *Plan one sizeable picture
event per spoken line, on a cue word (`check-storyboard.py`).*

**Small or slow events do not register.** A 42 px label, a thin arrow, an 18-frame fade: to a
detector and to the eye. *Events are about 70 × 70 px and arrive within 6 frames.*

**ffmpeg's freezedetect reported "static" while three cells drifted across the frame.** It
averages change over the whole frame between consecutive frames. *Measure changed area, 0.5 s
apart (`event-gaps.py`); re-measure the baseline with the same ruler before comparing.*

**A chapter tag that repeated the heading put the same words twice in one frame.** *One series
tag per video; the heading carries the chapter.*

**Never static, and still unwatchable.** The first v3 builds put an event on every line while the
note typed beside it: 17% and 27% of the runtime had two to six places changing at once, and the
owner could not tell where to look. *One step at a time, in reading order (`sequence()`); measure
with `focus-check.py`; watch it muted (`templates/MUTE-REVIEW.md`).*

**Sequenced, a muted viewer still got lost, and the split-focus number did not show it.** Brief
two-place moments, too short to be "sustained": an underline finishing while the next stroke
began, two labels set on one frame in opposite corners, a `Between` fading out before its step
ended, the "Simplified" tag fading in with the first note. "Where to look" fell from 3 to 2.
*Count far arrivals (`focus-check.py --sheet`); underline as the phrase types; chrome arrives
with the beat; `Between` fades after its end.*

**Pointers landed on blank paper, eight times, after two fixes.** Ordered by hand, a pointer
followed the right step but its anchor named a later one. *`pointStep(id, frames, target)`
checks the target came first; `anchor: s.pN.where` takes the target's own place; target the
step that shows the idea (the filled tube), not its outline.*

**An overfull beat lost its last steps, and every check passed.** Three rings in the pilot and a
label in brief B were scheduled after the cut. QA, focus-check and event-gaps never saw them.
*Wrap every sequence in `fits()`; it throws. It caught the kit's own demo on its first run.*

**A list set around a picture scattered the eye, one item at a time.** Five signs in five
corners, three labels in three: two muted reviewers in a row lost the thread there, after every
other fix. *A list goes in one region, or each item draws its connector as it arrives.*

**A stamp in a corner pulled the eye off the drawing every time, and "Lewis · 1927" meant nothing
to a muted viewer.** *A verdict or a name is a label on the thing it marks; terms and symbols get
their words beside them.*

## Publishing

**An upload went live with the channel's default description template**, placeholder text
included. Title, tags and the disclosure radio all landed; only the description silently failed.
Found by scanning every row on the channel for template markers. *Read fields back; never trust a
form.*

**Escape closed the whole upload dialog** and saved a half-filled draft, because no autocomplete
was open at the time.

**Coordinates went stale mid-session** as the page re-rendered and the window resized. A click that
does nothing is usually this.

## Claims

**Secondary sources were wrong three times on one video** — a product's price, a feature's tier,
and the contents of a data-protection statute. The vendor's own page and the instrument itself were
right each time.

**A reference video's own claim was wrong**, and two of its seven segments rested on it. *Validate
what you adapt.*

**A stale superlative.** "Fastest ever" figures are usually neither first-party nor current.

## Process

**A finished build was never announced as finished.** Work continued into adjacent tasks and the
user had to ask whether it was done or blocked. *When a deliverable is complete, say so plainly
before moving on.*

**A reference was chosen because it looked good, not because it worked** — six hours old, 5.7k
views. *Sort by popular before adapting.*
