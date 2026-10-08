# STATUS.md — knowing where a video stands

A video takes days and several sittings. A session that resumes one needs two different kinds of
fact, and the whole convention rests on keeping them apart.

## The split

**Derived, never written down.** Does a script exist, are there takes, is there a grid, a
composition, a render. `scripts/video-status.py` reads this off the filesystem every time it runs.

A hand-maintained checklist of completed steps drifts within a day, and a status file that claims
a step is done when the artefact is missing is worse than no status file at all — it is
confidently wrong, and it is believed.

**Written down, because it cannot be derived.** The angle chosen and why. What was rejected and
why. What the owner has not decided yet. What is blocking, and on whom.

This is the part worth keeping by hand, because it is exactly what a fresh session cannot
reconstruct from the files — and what it will otherwise re-litigate, proposing again the thing
that was tried and turned down last week.

## The file

One `STATUS.md` per video, anywhere in the project. Front matter declares where the artefacts
live, so any layout works and no directory structure is imposed. Copy `templates/STATUS.md`.

Front matter also carries the video's `mode` (`tutorial`, `illustrated` or `hybrid`), which
decides what step 3 needs: captures, references, or both. A file without one is read as
`tutorial`, which is what every video before modes was.

```
./scripts/video-status.py path/to/STATUS.md --root /path/to/project
```

Output names the completed steps, the next one, the grid's real duration, the take counts, and
the prose sections a person wrote.

## Sections, and what each is for

**Where it stands** — one or two sentences of prose. Rewrite it every time you stop work. It is
the first thing the next session reads, and it should say what just happened and what happens
next, not summarise the project.

**Decided** — settled questions *with their reasons*. The reason is the load-bearing part: a
decision without one gets reopened the moment someone has a different instinct. "No presenter"
is a preference; "no presenter, an avatar was priced and declined" is a decision.

**Rejected** — things already tried or considered and turned down. Without this section they come
back, and the second session spends its budget rediscovering why the first said no.

**Blocked on** — who or what, specifically. Empty is a good answer and should be written as
"Nothing" rather than left blank, so the reader knows it was considered.

**Open questions** — decisions the owner has not made. Ask them at the moment they matter, not
all at once at the start; a list of four questions before any work is done reads as an interview.

## When to update it

At every stop, and after any decision. It is the last thing you do before finishing a stretch of
work, not something reconstructed later.

Two lines of prose written at the right moment save a session of re-deriving. A status file
updated a week late is fiction.

## What it is not

Not a log. Not a changelog — git already has one, and better. Not a place for detail that belongs
in the script, the validation notes, or a commit message.

If it grows past a screen, the excess belongs somewhere else.
