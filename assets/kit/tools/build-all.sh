#!/usr/bin/env bash
# Build and check one video, in the order the checks depend on each other (11-visual-qa.md).
#
#   tools/build-all.sh <composition> <key> [--narration public/<key>/grid/en-narration.wav] [--deliver-4k]
#                      [--max-static 10] [--force]
#
#   1. QA probe on a frame every second: text overlap, size, outside the frame. Stops on failure.
#   2. measure render (decorative motion held still) -> event gaps, and one focus at a time.
#      Stops before sound and the full render when more than --max-static % (default 10) of the
#      runtime is static, and lists the words spoken in each gap so fixes land on cue words
#      (E01: 43% static was found only after a 20-minute full render). --force goes on anyway.
#   3. sound design from the measure render (ducked under the narration, if given)
#   4. full render, muxed with the mix; with --deliver-4k (Shorts) also the 2160x3840 upload
#   5. stills: beat midpoints, beat ends (fully built) and every 2 s, contact sheets, phone sheet, frame fill
set -euo pipefail
comp=$1; key=$2; shift 2
narration=(); deliver4k=0; maxstatic=10; force=0
PY=${YVP_PYTHON:-$HOME/.local/share/youtube-video-production/venv/bin/python3}
[[ -x $PY ]] || PY=python3   # tools need numpy + Pillow; install-kit.mjs makes the venv
while [[ $# -gt 0 ]]; do
  case "$1" in
    --narration)
      if [[ $# -lt 2 ]]; then echo "--narration needs a wav path" >&2; exit 2; fi
      narration=(--narration "$2"); shift 2 ;;
    --deliver-4k) deliver4k=1; shift ;;
    --max-static) maxstatic=$2; shift 2 ;;
    --force) force=1; shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done
grid=public/$key/grid/beats.json; lines=public/$key/lines.json; out=out/$key
mkdir -p "$out"

echo "== QA"
# Every issue is printed; the run stops here if there are any.
node tools/qa.mjs "$comp" --every 1 --json "$out/qa.json" | grep -v '^\[Tab' 
echo "== measure render"
npx remotion render "$comp" "$out/measure.mp4" --scale=0.25 --muted --props='{"measure":true}' --log=error
echo "== event gaps"
"$PY" -I tools/event-gaps.py "$out/measure.mp4" "$grid" "$lines" | tee "$out/event-gaps.txt" | tail -1
static=$(tail -1 "$out/event-gaps.txt" | sed -n 's/.*(\([0-9]*\)%).*/\1/p')
if [[ -n $static && $static -gt $maxstatic ]]; then
  echo "   $static% static is over $maxstatic%: words spoken in each gap (put an event on one of them):"
  "$PY" -I tools/gap-words.py "$out/event-gaps.txt" "$grid" "$lines"
  if [[ $force == 0 ]]; then echo "Stopped before sound and render. Fix the gaps, or re-run with --force." >&2; exit 4; fi
fi
echo "== one focus at a time"
"$PY" -I tools/focus-check.py "$out/measure.mp4" --grid "$grid" --lines "$lines" --sheet "$out/far.png" | tee "$out/focus.txt" | tail -2
echo "== sound"
"$PY" -I tools/sound-design.py "$out/measure.mp4" --out "$out/sound" --beats "$grid" ${narration[@]+"${narration[@]}"}
echo "== full render"
npx remotion render "$comp" "$out/$comp-silent.mp4" --muted --log=error
ffmpeg -v error -y -i "$out/$comp-silent.mp4" -i "$out/sound/mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k \
  -shortest -movflags +faststart "$out/$comp.mp4"
if [[ $deliver4k == 1 ]]; then
  # 06-publish.md: a Short uploads at 2160x3840, which platforms give more bitrate.
  echo "== 4K delivery render"
  npx remotion render "$comp" "$out/$comp-4k-silent.mp4" --scale=2 --muted --log=error
  size=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$out/$comp-4k-silent.mp4")
  if [[ $size != "2160x3840" ]]; then echo "warning: the 4K render is $size, not 2160x3840 (is $comp a 1080x1920 Short?)" >&2; fi
  ffmpeg -v error -y -i "$out/$comp-4k-silent.mp4" -i "$out/sound/mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac \
    -b:a 192k -shortest -movflags +faststart "$out/$comp-$size.mp4"
fi
echo "== stills"
rm -rf "$out/stills"
node tools/stills.mjs "$comp" "$grid" "$out/stills/midpoints" midpoints | tail -1
node tools/stills.mjs "$comp" "$grid" "$out/stills/ends" ends | tail -1
node tools/stills.mjs "$comp" "$grid" "$out/stills/every2s" every:2 | tail -1
"$PY" -I tools/contact-sheet.py "$out/stills/midpoints" "$out/stills/sheet-midpoints.png" --tile 640 --columns 4
"$PY" -I tools/contact-sheet.py "$out/stills/ends" "$out/stills/sheet-ends.png" --tile 640 --columns 4
"$PY" -I tools/contact-sheet.py "$out/stills/every2s" "$out/stills/sheet-every2s.png"
"$PY" -I tools/contact-sheet.py "$out/stills/midpoints" "$out/stills/sheet-phone.png" --phone
"$PY" -I tools/frame-fill.py "$out/stills/every2s" | tee "$out/frame-fill.txt"
echo "== done: $out/$comp.mp4"
