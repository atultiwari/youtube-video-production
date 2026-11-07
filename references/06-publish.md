# 12–13 · Render and publish

## Render

Shorts render at 2× — 2160×3840 — because platforms allocate more bitrate to a 4K upload and
type-heavy content starves first.

Verify the delivered file against the loudness target rather than trusting the master: the
encode is the thing the viewer hears.

## Upload through the Data API: the `youtube-uploader` skill

The old rule here ("unaudited API projects are locked to private, so upload in the browser") is
**out of date**. Google's videos.insert page, checked 2026-11-07, says videos uploaded from
unverified API projects are *not* restricted to private, and E01 went up through the API, was
scheduled, and published normally. Uploads now go through `youtube-uploader`:

1. Finished files go to the project's `ready-to-upload/<project>/` with one name stem:
   `<code>_<slug>_<16x9|9x16>.mp4`, `.jpg` (thumbnail), `.srt` (`scripts/captions-srt.py`),
   `_description.txt`, `_youtube.md`, and `_upload.json` (the uploader's manifest, with the
   channel ID so a sign-in to the wrong channel stops it).
2. Dry run, show the owner the summary; upload with `--confirm` only after their explicit yes.
   Private, or scheduled with `publishAt`; `containsSyntheticMedia: true` for the cloned voice.
3. After a verified upload, move the files to `ready-to-upload/_uploaded/<project>/` with the
   receipt. Thumbnail swaps and scheduling later: `yt-update.mjs` in that skill.
4. **Unsaved edits in an open YouTube Studio tab overwrite API changes when the owner clicks
   Save.** After an API change, ask them to reload the Studio page first.
5. The API does not echo `containsSyntheticMedia` back; the owner confirms "AI use: Yes" in
   Studio (Details → AI use).

The browser recipe below (and in video-promo-kit) stays as the fallback when the API is down
or not set up.

## Read every field back

**A typed description can fail silently.** One upload went live carrying the channel's default
template, placeholder text and all — title, tags and the AI-disclosure radio all landed; only the
description did not, so nothing looked wrong.

The field is a rich-text div that must be focused and ready before select-all-and-type reaches it.
A click that lands early is accepted silently and the text goes nowhere. There is no error.

**After filling any form, read the values back out of the DOM and assert on them.** One scripted
call can check every row on the channel list at once — scan the whole channel for template markers
before calling an upload run finished, not just the video you were watching.

The same applies to radio buttons: confirm `aria-checked`, not the click's return value. Label
text is often ambiguous.

## Things that break a batch upload

- **Never press Escape in the upload dialog.** With no autocomplete open it closes the whole
  dialog and saves a half-filled draft. Click an inert area instead.
- **Element refs go stale** as the page re-renders, and the window may resize mid-session. Re-find
  after every navigation or generation rather than reusing coordinates. A click that silently does
  nothing is usually this.
- Set the AI-generated-content disclosure on every upload where it applies. Decide it once as a
  policy rather than per video.

## Metadata

Generate it from a per-video data file rather than writing it by hand, so it cannot drift from the
video after an edit.

**Every platform limit fails silently rather than rejecting.** Titles over 100 characters are
truncated in feeds. More than 15 hashtags makes the platform ignore **all** of them, not just the
excess. Captions are cut mid-sentence at 2,200 characters. The first three hashtags render above
the title, so their order is a decision. Different platforms want different routing tags, and
carrying the wrong one signals cross-posting.

## Scheduling and comparisons

If two publishing slots are being compared, hold everything else constant. One comparison ran two
time slots against each other while the *content* also differed between the groups — the newer
group's scripts had been rewritten. That gives a signal, not an experiment, and it should be
reported that way rather than as a finding.

## After publishing

Check the live listing rather than the upload confirmation: scheduled date, visibility, and that
the description survived. The confirmation dialog reports what was submitted, not what stuck.

## Studio through the Chrome extension (Oct 2026): full recipe in `video-promo-kit`

- The extension's `file_upload` only passes files **under 10 MB**. Reveal the MP4 in Finder and have the owner drag it into the upload dialog; the agent fills in everything else.
- The description again arrived with the channel template ("In this video, [add …]"). Select-all, replace, and read it back through JS (length, `[add`, chapter count, links).
- A hashtag suggestion popup opens while typing; dismiss it by clicking an inert label, **never Escape**.
- The schedule date picker shifted under a click and saved **Nov** 14 for Oct 14. Read the date and time fields back before clicking Schedule; pick the time from the list with `find`.
- Generate chapters from the real take timings, never by hand, and check that the total equals the rendered duration.
- A cloned-voice narration gets **AI use / altered content: Yes**, and a line in the description notes.
- After scheduling, verify on `studio.youtube.com/video/<id>/edit`, not on the confirmation dialog.
