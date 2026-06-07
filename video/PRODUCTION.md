# CommandLess launch video — production kit

Everything to assemble the 60s cinematic demo. The hard parts (script, flawless
on-screen footage via the in-app demo, and the voiceover) are done — this is the
paint-by-numbers edit.

## What you already have
- **Script + shot list:** `video/SCRIPT.md`
- **In-app auto-demo:** press **⌘⇧D** in the app (or Command Palette → "Play demo
  reel") to record beats 3–6 flawlessly.
- **Voiceover clips:** `video/voiceover/01-hook.m4a … 08-cta.m4a` (macOS voice).

## Tools (all free)
- **Editor:** [CapCut](https://www.capcut.com/) desktop — easiest for beat-synced
  social video, auto-captions, zoom/punch effects. (DaVinci Resolve if you want pro.)
- **Screen capture:** macOS `⌘⇧5`. For buttery zoom-ins, [Screen Studio] is great
  but paid — CapCut's keyframe zoom is fine and free.
- **Music (royalty-free):** [Uppbeat](https://uppbeat.io) (free w/ account),
  [Pixabay Music](https://pixabay.com/music/), YouTube Audio Library. Search:
  *"tech trailer", "driving electronic", "minimal hype", "future bass".*
- **SFX:** Pixabay/Uppbeat — grab a "whoosh" (card entrances) and a "bass hit"
  (logo sting). 

## Upgrade the voiceover (optional, free, big quality jump)
The draft uses macOS **Samantha**. For a noticeably better voice:
1. System Settings → Accessibility → Spoken Content → System Voice → **Manage
   Voices** → download an English **Premium** voice (e.g. *Ava, Evan, Nathan, Zoe*).
2. Re-run: `VOICE="Ava (Premium)" bash scripts/voiceover.sh`
Or paste the VO lines into **ElevenLabs** (free tier) for the crispest result.

## Edit timeline (drop VO + footage onto music)
1. **Lay the music bed** first. Find the first big beat drop (~3–5s in) — your
   logo sting lands there.
2. **Place VO clips** in order (`01`→`08`) on an audio track; leave ~0.3–0.6s gaps.
   Total VO ≈ 36s; stretch gaps so the whole thing lands ~58–60s.
3. **Sync footage to each VO clip** per the SCRIPT.md table:
   - 01 hook → cold-open typing + card slam (whoosh on entrance)
   - 02 meet → logo sting (bass hit, glow)
   - 03 describe → find-large-files beat (punch-in on "Safe" badge)
   - 04 montage → git + disk beats (2 fast beat-synced cuts)
   - 05 ai → rename .jpeg AI card (highlight ✦ AI badge)
   - 06 risk → kill-port red card (push-in, tense swell)
   - 07 realterm → normal command in terminal
   - 08 cta → end card (logo + link), hold 2s
4. **Captions:** CapCut → Auto-captions on the VO track. Style: bold, white, thin
   green keyword highlight (#3fc07d). Keeps people watching with sound off.
5. **Motion:** add a slow 1.03–1.08× keyframe zoom to every static screen clip so
   nothing feels still. Punch-in (quick scale) on each risk badge / AI badge.
6. **Transitions:** hard cuts on the beat (best for hype). A couple of fast
   "whip"/zoom transitions max — don't overuse.
7. **Grade:** slight contrast + tiny saturation bump so the greens pop on black.

## Visual style (match the brand)
- Background: near-black `#06080a`. Accent green `#27a35f` / bright `#3fc07d`.
- Type: a clean grotesk (Inter / SF). Title case, **no all-caps** (brand rule).
- Keep it dark, green-forward, minimal. Let the product UI be the hero.

## Export
- 1080p (1920×1080), 30 fps (or 60 if your capture is 60), H.264 MP4, ~10–16 Mbps.
- Filename: `CommandLess-demo-v1.mp4`.

## LinkedIn post copy (paste-ready)

> I got tired of forgetting terminal commands — so I built a terminal that doesn't make me remember them.
>
> Meet **CommandLess**: type plain English like *"what's using port 3000?"* or *"rename all .jpeg files to .jpg"*, and it writes the exact command, explains it, flags the risk, and asks before running. Dangerous stuff needs typed confirmation — nothing runs without you. And it's still a real terminal underneath.
>
> Built solo: Tauri + Rust (real PTY), React, and an Ollama-powered command layer. Cross-platform.
>
> It's free — macOS & Windows: github.com/shivxxyy/commandless/releases/latest
>
> ⚠️ First launch (unsigned build): macOS → right-click/Settings → Open Anyway · Windows → "More info → Run anyway". Takes 5 seconds.
>
> Would love your feedback 🙏 #buildinpublic #developertools #terminal #AI

**Tips:** upload the MP4 natively (don't just link). Pick a punchy first frame
(the card slamming in) as the thumbnail — LinkedIn uses an early frame.
