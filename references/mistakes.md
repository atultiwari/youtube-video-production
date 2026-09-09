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
