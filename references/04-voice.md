# 6–8 · Record, master, and build the grid

## Generating takes through the API (the default)

Sarvam's API serves **cloned voices** (`POST /voices/clone`, with the voice's `svc-...` ID).
One command makes every beat's take, straight into the takes folder:

```
scripts/sarvam-tts.py docs/A/script.md --takes out/A/takes --voice svc-... --dry-run
scripts/sarvam-tts.py docs/A/script.md --takes out/A/takes --voice svc-...
```

Run the dry run first: it prints each take and the character count, which is what is billed:
about **₹2 per 1,000 characters** (₹0.23 for a 114-character test, 2026-10-12), so a Short is
about ₹2 and a 4-minute script about ₹7. A request took about 3 s.

**Measured on the first real build (brief B, 2026-10-13):** the clone spoke at about 150 words
a minute at pace 1.0 (the browser studio's voice ran at 179), so a Short timed by word count ran
long; pace 1.1 brought 810 characters to 51 s of speech and still sounded natural. Transcribe
every take (`word-timestamps.py` does): one take said "that rash" as "the trash", and a single
regeneration fixed it. Master with `master-audio.py --voice-eq` while the clone carries room
colour.
The script splits a beat over the 1,000-character cap between sentences (`en-01a.wav`,
`en-01b.wav`, which `build-audio-grid.py` joins), keeps takes that already have sound, retries
rate limits and server errors, and records every take's text and request ID in `tts.json`.
Requests are WAV, with Sarvam's quality check (it regenerates audio that does not match the
text) and text normalisation on. To redo one beat: `--beats 04 --force`.

The other modes on the playground are for live use: **REST Stream** (MP3 as it is generated,
no quality check) and **WebSocket** (text in, audio out, for voice agents). A video needs
neither. `sarvam-mcp`, Sarvam's MCP server, speaks with stock voices only, not clones
(checked in 0.2.12).

### Setting the API key (once)

The key is a password to the account's credits: it lives only in the shell environment, never
in a file in a project, a script, a chat or a commit.

1. On indus.sarvam.ai, open **API Keys** and create a key. Copy it.
2. In Terminal, open your shell's environment file: `open -e ~/.zshenv`. Use `.zshenv`, not
   `.zshrc`: Claude's commands run in a non-interactive shell, which reads `.zshenv` only. A
   key in `.zshrc` works in your Terminal and is invisible to the agent (2026-10-12).
3. Add one line at the end, with the key between the quotes, and save:
   `export SARVAM_API_KEY="paste-the-key-here"`
   Optionally, a second line with the default voice:
   `export SARVAM_VOICE_ID="svc-..."`
4. Load it: `source ~/.zshenv`, then restart the Claude app so its shell picks it up.
5. Check it is set without printing it: `test -n "$SARVAM_API_KEY" && echo set`.

If a key is ever pasted somewhere it should not be, delete it on the API Keys page and make a
new one.

## Fallback: the browser studio

When the API is down, or for a voice the API does not serve, drive the studio in a signed-in
Chrome.

### The order matters

A studio page typically loads defaulted to some language and stock speaker, and **selecting a
voice does not change the language**. So, before pasting:

1. Voices panel → **My Voices** → the cloned voice.
2. Language dropdown → the language.
3. Click the text field, select all, delete — it is pre-filled with sample copy.

Then paste, **check the character counter against your own count**, and generate. Download
**WAV**, never MP3: MP3 is a lossy re-encode of a file about to be limited and re-encoded again
for delivery.

### The cap that truncates silently

**Cloned voices had a 1,000-character cap per generation.** Over that, input was cut at exactly
1,000 with no error and no visible truncation in the box.

Worse, the counter beside the language dropdown advertised `2,500/line`, which was wrong for
cloned voices; a quieter line in the voices panel carried the true number. The wrong one was
believed and asserted confidently before the truncation was noticed.

**So: check the counter against your own character count on every paste.** It is the only warning
you get. Split anything longer at a paragraph boundary and record it as two takes.

### One take per beat

Not one take per video. Per-beat takes give per-beat durations — which is what the timing grid is
built from — and let a single bad beat be re-recorded for one generation instead of eleven.

### Browser settings that block a batch

- Allow automatic downloads for the studio's host, or the second download of a run is blocked by
  a "download multiple files" prompt.
- Turn **off** "Ask where to save each file". Left on, a native save dialog appears that browser
  automation cannot see or answer, and the download stalls in a temp file.

### Claim each download properly

A browser sometimes leaves a finished file under a temp name instead of renaming it. **Check the
RIFF header's declared length against the file size on disk** before assuming a partial download —
regenerating costs credits, and a perfectly good WAV once sat under a temp name for an hour.

### Verify a take before building on it

- A few isolated full-scale samples with a longest run of 1–2 is normal and inaudible.
- Almost no trailing silence — the file should end within ~0.02s of the last word.

A run of three full-scale samples has occurred and was inspected: 9 samples in 2.5 million,
longest run **0.062 ms**. Inaudible. Treat a clipping flag as "go and look", not "re-record".

## The speaking rate, which is the thing most often got wrong

**A cloned TTS voice ran at 179 words per minute** — not the 145 a human presenter runs at.

A 1,317-word script estimated at 9:04 came back at **7:21**. Every estimate was a quarter too
long, and 89 words had already been cut from it to "fix" a runtime that was never over.

Use word count to order material. Never to decide length.

## Mastering

Target **−14 LUFS integrated, −1.0 dBTP** for YouTube. The platform normalises loud uploads down
and never quiet ones up, so a quiet track simply plays quieter than everything around it.

Gain, then a true-peak limiter, **iterated** — one pass lands about 1.2 LU short, because the
crest factor is roughly 20 dB and peaks reach the ceiling before the integrated loudness arrives,
at which point the normaliser declines to limit them.

`scripts/master-audio.py` does this. Two bugs it exists to prevent:

**`alimiter`'s `limit` is a linear amplitude ratio, not decibels** — range 0.0625 to 1. Passing
`-1.0` is out of range and the filter fails to build. With headroom for inter-sample peaks a
sample-domain limiter cannot see:

```python
ceiling = 10 ** ((target_true_peak - 0.4) / 20)   # -1.0 dBTP -> 0.8511
```

**A wrapper that does not raise will hide the failure.** One helper returned stderr and carried
on, so the loop re-measured a *stale* output file and reported identical numbers five passes
running. Five passes of "no change" is the signature of a filter that never ran.

If narration is mono and the composition sums it to stereo, it arrives about 3 LU hotter than it
measured — apply a gain correction in the composition (`0.728` in practice).

## Building the grid

Every beat gets a **slot**, and the takes decide how long. `scripts/build-audio-grid.py` joins
per-beat takes, fits any second language, and writes `beats.json` — frame-accurate, and the only
place timing is defined.

**Never hand-edit it.** Every audio track is padded to that exact grid; a boundary moved
elsewhere desynchronises one of them against the picture.

## Two languages on one video

A dual-audio upload is **one video with alternate audio tracks**. The platform swaps the audio and
leaves the picture alone, so both tracks must agree on where every beat starts, to the frame.

Sizing each slot to the slower language is the obvious approach and it is wrong: it put **35
seconds of silence into the primary track**, audible as dead air.

**Fit the other language to the reference language per beat**, with `atempo`, which changes rate
without touching pitch:

```
tempo = clamp(other_beat / reference_beat, 1.0, 1.12)
```

- **Cap at about 1.12.** Beyond that, delivery sounds hurried rather than brisk.
- A beat where the other language is already **shorter** is left at 1.0, not slowed — padding it
  costs nothing, slowing it sounds like a fault.
- Beats needing more than the cap keep a little padding: bounded and small, rather than absent
  and unbounded.

Measured: seven of ten beats fit exactly, three capped, dead air fell from **35.4s to 3.4s**,
runtime from 8:02 to 7:29.

**Rate changes land at beat boundaries, inside the pause between beats, never mid-sentence.**

### Register, for an Indian-language second track

Write it as the audience actually speaks. Technical, legal and product terms stay **English in
Latin script**; naturalised loanwords stay in the local script. The test is whether a practitioner
would say the English word as English, not whether the word has English roots.

This was settled by ear — one beat generated both ways came back the same length (23.70s against
23.82s), and Latin script won on sound. It also does the sync work: those technical phrases are
exactly the ones that expand worst in translation.

### Announcing the second track

Put it on screen, **not in the narration**. A spoken bilingual notice means two notices of
different lengths at the head of two tracks, pushing every later beat onto a different frame in
each language. A picture-only overlay on frames that already exist changes neither track and
moves nothing.

It also reads in both languages at once, which a spoken version cannot — that has to choose which
language goes first.

## Measured again on a longform (Oct 2026, fridge-hack): see 14-lessons-2026-10.md

- `--pace 1.1` ran at ≈160 wpm over 1,663 words (10:29 of speech). Use it to budget words.
- **Check every take with Whisper** before mastering: `scripts/check-takes.py --script <script.md> --takes <takes>`.
  Sarvam's quality check passed a take that dropped "and eighty". After 2 failed takes, re-word the line.
- Respell hard names for the voice only (a text → spoken map applied when writing the TTS script); captions keep the real spelling.
- For per-scene builds (`motion` mode), master the joined narration as dual-mono stereo once, then split it back per scene, so every scene shares one gain.

## Measured on E01 (Nov 2026, Sarvam clone, pace 1.1)

- **1,471 words → 8:54** of narration across 11 beats: about 165 wpm. Budget 1,450–1,500 words
  for a 9-minute longform.
- **Bare letter pairs are swallowed.** "PA chest film" came back as "PHS film"; spelled out
  ("taken back to front") it was clean. `check-script.py` flags two-capital pairs (AI and a few
  others allowed; `--allow` more after hearing a take).
- **Respell once, per series.** `sarvam-tts.py --respell docs/respell.json` maps written words to
  spoken forms (`{"MYCIN": "My-sin", "JAMA": "Jama"}`) for the TTS text only; the script,
  captions and on-screen text keep the real spelling. No second copy of the script to drift.
- **Whisper invents repeats at the end of long takes** ("The Stanford faculty scored…" three
  times on a clean take). `check-takes.py` now passes `--condition-on-previous-text False` and
  joins split takes (`en-04a.wav` + `en-04b.wav`) itself. Before re-recording a flagged take,
  look at the segment times: a repeat with no audio under it is Whisper, not the voice.
- **One real drop**: beat 01 lost a whole sentence ("The other one might be."); the Whisper check
  caught it and one `--force` regeneration fixed it.

## Measured on E08 (Nov 2026)

- **Short standalone sentences get dropped.** A Short's beat "…blocked. The cause was mundane. The
  new images were saved in a different file format." lost "The cause was mundane" on one take and
  the whole last sentence on the next; joined into one sentence ("And the cause was mundane, because
  the new images had been saved…") it came back whole. After one drop, merge the short sentence
  into its neighbour rather than regenerating again.
- **Spaced letters in the script fail the Whisper check against correct audio.** "F D A" / "C D S C O"
  in the script were heard as "FDA" / "CDSCO" (93% on a clean take). Write the acronym normally and
  put the spacing in `docs/respell.json` (`"FDA": "F D A"`), then `--allow` it in `check-script.py`.

- **Years 2001–2009 and coined names** (E09): "twenty zero one" is spoken correctly but Whisper writes
  "two thousand one", which fails check-takes (S2 beat 2 at 90.6%); write "two thousand and one".
  A coined name the respell map spells out (NegEx → "Neg Ex") is heard as "negx": pass
  `--heard-as heard-as.json` with `{"NegEx": ["negx"]}` rather than rewording.
- **Final short phrases slur** (E09): "…share a word, and little else." came back as "it helps" on
  two takes; a fuller ending ("but nothing more") was 100% on the next take.
- **A trailing "…, or ACRONYM." gets dropped** (E10): "…learning from human feedback, or RLHF." came
  back without "or R L H F" (a 0.6 s gap, 97.5% overall, so the beat still passed): read the gap
  between words, not just the score. "…, which is shortened to RLHF." was 99.2% and audible. The
  same shape worked for "or LLM" and "or SLMs" mid-paragraph; it fails at a sentence end.
- **Model names with digits** (E10): respelling "Phi" as "Fye" made "Phi three mini" sound like
  "fifty-three mini"; "Fie" came back as "fee three", which is how many people say it. Write the
  digit as a word in the script ("GPT three", "R one") and respell only the name.

- **Short last words and acronyms at a sentence end, again** (E11): "…are how we make it rarer." lost
  "rarer" (Whisper still scored the beat 98.4%: the drop shows only as `[rarer] → []`, so read every
  `→ []`); "…which is shortened to RAG." came back as "ragged." Both fixed by giving the sentence a
  fuller ending ("…make it happen far less often."; "…shortened to RAG, and it works in two steps.").
- **The respell map skips words joined by hyphens** (E11): its pattern ignores a key with a hyphen
  next to it, so `"LLM"` does not touch "LLM-as-judge". Add the compound as its own key
  (`"LLM-as-judge": "L L M, as judge"`; the comma stops "L L Ms judge").
- **Whisper writes "eighty six and a half percent" as "86.5%"** and "Med-PaLM two" as "MedPalm 2"
  (S4 at 90.5% on a correct take). Check the transcript before regenerating a beat full of numbers.

- **A short sentence-final clause, again** (E12): "…between the three. Only the prompt did." came
  back as "prompted tit" (97% overall). Merged into one sentence with a fuller ending ("…between
  the three, only the wording of the prompt.") it was 99%. Whisper also writes "few-shot" as "few
  short", "vignette" as "vignet" and "sulfate" as "sulphate" on correct audio (a Short at 94.4%):
  list them in `--heard-as` rather than re-recording.

- **Sentence ends, a fourth time** (E13): every one of these came back wrong while Whisper still
  scored the beat 97–99%: "…what data is collected and why." lost "and why" (`→ []`); "…a doctor's
  signature at the end." became "there"; "…a human signs at the end." became "science"; "…because a
  board summary…" slurred into "It took because of"; "…and the oncologists decide." came back as
  "oncologist decides". Fixed by fuller endings ("…and for what purpose.", "…as the final step.",
  "…signs off before anything is final.", "…make the decision."). "Commonest" was read as
  "communist" in one Short (correct in the episode): "most common" is safer. Read every `→ []` and
  every changed last word, not just the score.

- **"a GAN" is heard as "again"** (E14): with `"GAN": "Gan"` in the respell map, "A GAN trained on…" and
  "Train a GAN on…" both came back as "again" (98.8%, so the score hid it); "one of these GANs" was clean,
  and a Short opening "GANs, a kind of AI…" was heard as "gangs". Never put the article "a" straight
  before a respelled acronym that starts with a vowel-like sound; say "one of these GANs", "the GAN", or
  the full name. Medical words at a list start slurred too: "Optic disc with clear margins." came back
  as "optic tests", then a fuller "…clear margins and a normal cup to disc ratio." dropped its last three
  words; one long joined sentence ("The optic disc looks healthy, with clear margins and a normal cup, and
  there are…") was 99%. "the side wrong" was heard as "the sight wrong": say "left and right".

- **A second number in a list slurs, and so do near-words** (B1): "About sixty three percent were white,
  twenty nine percent African American, and under two percent Asian." came back with "two thousand"
  for "twenty nine percent" (97.2%, so the score hid it); "nearly thirty percent were African American,
  and fewer than two percent were Asian" (a verb in each clause) was clean. "Here is our worked
  example" became "a workbook example"; "measured time saved, while" became "time shift"; "only one in
  ten has" became "one intent" in a Short (93.5%); "…reported with CONSORT-AI. That is the habit" became
  "consort i.e. the habit" (a sentence-final acronym, again: "…with the CONSORT-AI checklist." fixed it).
  Guideline names read well as words with the respell map (`"TRIPOD": "Try-pod"`, `"CONSORT": "Con-sort"`,
  `"STARD": "Starred"`, plus compound keys such as `"STARD-AI": "Starred A I"` because hyphenated names
  are skipped); Whisper writes STARD as "start" or "tart" on correct audio, so list it in `--heard-as`.
  Whisper writes "that is" as "i.e." on correct audio: read the take before re-recording.
- **One-syllable key words swap, and a passing score hides it** (E15): "dark skin" came back as "tar
  skin", "risk score" as "risk or", "asthma" as "esna" or "estoma", "If they had labelled a training
  set" as "had developed", and "in twenty twenty" as "in twenty ten" in a Short, all at 96–99%. When the
  swapped word is the point of the line (the skin tone, the year, the disease), regenerate even if the
  beat passes. Two failed takes of "picked for extra help … not who is sick" ("health", "seek") were
  fixed by rewording to "extra care … not how ill a patient is" (a sentence ending on two short words
  drops them). Whisper writes "nineteen nineties" as "one thousand nine hundred and ninety s", which
  scores 87–91% in a short beat on correct audio; "Decades ago" avoided it in a Short.
