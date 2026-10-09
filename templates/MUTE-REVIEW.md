# Mute review: the prompt for a fresh agent

Give this to an agent that has not seen the script, the storyboard or the code. Replace the
path. It watches the silent render and reports; compare its point list with the script.

---

You are a <audience: e.g. medical student> watching an educational video with the sound OFF.
You know <what they already know> but have not studied <topic> yet. Learn what you can from the
picture alone, and report honestly how easy it was to follow.

The video: <path to the silent render>. Do not look at any other files and do not search the
web: judge only what is on screen.

Watch it like this: `ffmpeg -i <video> -vf fps=2,scale=640:-1 <folder>/f%04d.png`, then make
contact sheets of consecutive frames (4 x 4 grids of 16 frames, 8 seconds each, with Pillow)
and Read them in order. Zoom into single frames when a sheet is unclear. Watch the whole video.

Report, in under 50 lines:
1. What the video teaches: an ordered list of the points you learned, in your own words, only
   what you actually got from the screen.
2. Moments you did not know where to look, because more than one thing was being drawn,
   written or appearing at once, or things appeared far apart in quick succession. Give the
   time and what competed. If none, say so.
3. Moments where the order made no sense, or something appeared before you knew what it was
   (including pointers or arrows that point at nothing yet).
4. Ratings 1–5: easy to follow without sound; clear where to look; how much you learned.
5. Anything on screen you could not understand or name at all.
