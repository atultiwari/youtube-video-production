#!/usr/bin/env bash
# Build and check one video, in the order the checks depend on each other (11-visual-qa.md).
#
#   tools/build-all.sh <composition> <key> [--narration public/<key>/grid/en-narration.wav] [--deliver-4k]
#
#   1. QA probe on a frame every second: text overlap, size, outside the frame. Stops on failure.
#   2. measure render (decorative motion held still) -> event gaps, and one focus at a time
#   3. sound design from the measure render (ducked under the narration, if given)
#   4. full render, muxed with the mix; with --deliver-4k (Shorts) also the 2160x3840 upload
#   5. stills: beat midpoints and every 2 s, contact sheets, phone sheet, frame fill
set -euo pipefail
comp=$1; key=$2; shift 2
narration=(); deliver4k=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --narration)
      if [[ $# -lt 2 ]]; then echo "--narration needs a wav path" >&2; exit 2; fi
      narration=(--narration "$2"); shift 2 ;;
    --deliver-4k) deliver4k=1; shift ;;
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
python3 -I tools/event-gaps.py "$out/measure.mp4" "$grid" "$lines" | tee "$out/event-gaps.txt" | tail -1
echo "== one focus at a time"
python3 -I tools/focus-check.py "$out/measure.mp4" --grid "$grid" --lines "$lines" --sheet "$out/far.png" | tee "$out/focus.txt" | tail -2
echo "== sound"
python3 -I tools/sound-design.py "$out/measure.mp4" --out "$out/sound" --beats "$grid" ${narration[@]+"${narration[@]}"}
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
node tools/stills.mjs "$comp" "$grid" "$out/stills/every2s" every:2 | tail -1
python3 -I tools/contact-sheet.py "$out/stills/midpoints" "$out/stills/sheet-midpoints.png" --tile 640 --columns 4
python3 -I tools/contact-sheet.py "$out/stills/every2s" "$out/stills/sheet-every2s.png"
python3 -I tools/contact-sheet.py "$out/stills/midpoints" "$out/stills/sheet-phone.png" --phone
python3 -I tools/frame-fill.py "$out/stills/every2s" | tee "$out/frame-fill.txt"
echo "== done: $out/$comp.mp4"
