# 6–8 · Record, master, and build the grid

## Generating takes through the API (the default)

Sarvam's API serves **cloned voices** (`POST /voices/clone`, with the voice's `svc-...` ID).
One command makes every beat's take, straight into the takes folder:

```
scripts/sarvam-tts.py docs/A/script.md --takes out/A/takes --voice svc-... --dry-run
scripts/sarvam-tts.py docs/A/script.md --takes out/A/takes --voice svc-...
```

Run the dry run first: it prints each take and the character count, which is what is billed.
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
2. In Terminal, open your shell profile: `open -e ~/.zshrc`.
3. Add one line at the end, with the key between the quotes, and save:
   `export SARVAM_API_KEY="paste-the-key-here"`
   Optionally, a second line with the default voice:
   `export SARVAM_VOICE_ID="svc-..."`
4. Load it: `source ~/.zshrc` (or open a new Terminal window).
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
