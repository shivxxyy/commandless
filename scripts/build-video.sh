#!/usr/bin/env bash
# Assemble the demo MP4 from scene frames + voiceover clips using ffmpeg.
# Output: video/CommandLess-demo.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
F=video/frames
VO=video/voiceover
TMP=video/.tmp
OUT=video/CommandLess-demo.mp4
mkdir -p "$TMP"
rm -f "$TMP"/*.mp4 "$TMP"/*.m4a "$TMP"/list.txt 2>/dev/null || true

# scene : frame : duration(s)  — durations tuned to the voiceover clips
SCENES=(
  "00-title:6.9"
  "01-large:4.8"
  "02-git:2.4"
  "03-disk:2.4"
  "04-ai:4.4"
  "05-danger:5.8"
  "06-realterm:4.0"
  "99-end:6.4"
)

i=0
last=$((${#SCENES[@]} - 1))
for entry in "${SCENES[@]}"; do
  name="${entry%%:*}"; dur="${entry##*:}"
  clip="$TMP/$(printf '%02d' $i).mp4"
  # gentle zoom-in (Ken Burns) + fade in; fade out only on the final scene
  fade="fade=t=in:st=0:d=0.4"
  if [ "$i" -eq "$last" ]; then
    fade="$fade,fade=t=out:st=$(echo "$dur-0.8" | bc):d=0.8"
  fi
  # d=1: one output frame per (looped) input frame, so the clip is exactly
  # $dur seconds; z animates over the cumulative output frame index `on`.
  ffmpeg -y -loglevel error -loop 1 -t "$dur" -i "$F/$name.png" -r 30 \
    -vf "scale=2112:1188:flags=lanczos,zoompan=z='min(1.0+0.00035*on,1.05)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30,$fade,format=yuv420p" \
    -c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p "$clip"
  echo "file '$(basename "$clip")'" >> "$TMP/list.txt"
  echo "  ✓ scene $name (${dur}s)"
  i=$((i + 1))
done

echo "Concatenating video…"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$TMP/list.txt" -c copy "$TMP/silent.mp4"

echo "Building voiceover track…"
ffmpeg -y -loglevel error \
  -i "$VO/01-hook.m4a" -i "$VO/02-meet.m4a" -i "$VO/03-describe.m4a" -i "$VO/04-montage.m4a" \
  -i "$VO/05-ai.m4a" -i "$VO/06-risk.m4a" -i "$VO/07-realterm.m4a" -i "$VO/08-cta.m4a" \
  -filter_complex "[0:a][1:a][2:a][3:a][4:a][5:a][6:a][7:a]concat=n=8:v=0:a=1[a]" \
  -map "[a]" -c:a aac -b:a 192k "$TMP/vo.m4a"

echo "Muxing…"
ffmpeg -y -loglevel error -i "$TMP/silent.mp4" -i "$TMP/vo.m4a" \
  -c:v copy -c:a aac -b:a 192k -map 0:v:0 -map 1:a:0 "$OUT"

echo "Done → $OUT"
ffprobe -v error -show_entries format=duration:stream=width,height -of default=noprint_wrappers=1 "$OUT" 2>/dev/null | head -6
