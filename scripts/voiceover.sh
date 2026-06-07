#!/usr/bin/env bash
# Generate the demo voiceover with the macOS `say` engine (free, on-device).
#
# Usage:
#   bash scripts/voiceover.sh                 # default voice (Samantha)
#   VOICE="Ava (Premium)" bash scripts/voiceover.sh   # nicer voice (download first)
#   RATE=180 VOICE=Daniel bash scripts/voiceover.sh
#
# Output: video/voiceover/NN-*.m4a (one clip per line) + a combined track.
# Tip for much better quality: System Settings → Accessibility → Spoken Content →
# System Voice → Manage Voices → download an English "Premium" voice (e.g. Ava,
# Evan, Nathan, Zoe), then re-run with VOICE="Ava (Premium)".

set -euo pipefail
cd "$(dirname "$0")/.."
OUT="video/voiceover"
mkdir -p "$OUT"
VOICE="${VOICE:-Samantha}"
RATE="${RATE:-178}"

# Lines must match SCRIPT.md.
LINES=(
  "You know what you want your machine to do. You just don't always remember the command."
  "So stop memorizing. Meet CommandLess."
  "Describe it in plain English, and get the exact command, explained before it runs."
  "Find what's hogging space. Check your git changes. See your disk, instantly."
  "Need something custom? The A.I. writes the command for you, right in your terminal."
  "Every command gets a risk label. Dangerous ones need typed confirmation. Nothing runs without you."
  "And it's a real terminal. Everything you already do, now with a brain."
  "CommandLess. Terminal power, no command memorization. Free for Mac and Windows. Link below."
)
NAMES=(01-hook 02-meet 03-describe 04-montage 05-ai 06-risk 07-realterm 08-cta)

echo "Voice: $VOICE   Rate: $RATE"
rm -f "$OUT"/*.aiff "$OUT"/*.m4a 2>/dev/null || true
for i in "${!LINES[@]}"; do
  base="$OUT/${NAMES[$i]}"
  say -v "$VOICE" -r "$RATE" -o "$base.aiff" "${LINES[$i]}"
  # Convert AIFF -> AAC/m4a (editor-friendly).
  afconvert -f m4af -d aac "$base.aiff" "$base.m4a" >/dev/null 2>&1 && rm -f "$base.aiff"
  echo "  ✓ ${NAMES[$i]}.m4a"
done

# Combined full-VO track (concatenate the per-line m4a clips).
echo "Building combined track…"
( cd "$OUT" && cat 0*.m4a > /dev/null 2>&1 || true )
echo "Done. Clips in $OUT/"
