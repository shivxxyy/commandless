# CommandLess — 60s launch video script

**Format:** 1920×1080 (16:9) · **Length:** ~60s · **Vibe:** cinematic hype ·
**Voiceover:** artificial (macOS `say` draft → optionally ElevenLabs) ·
**Music:** driving electronic / trailer (see PRODUCTION.md)

Tagline: **Terminal power. No command memorization.**

---

## The shot list (8 beats)

| # | Time | Voiceover (VO) | On screen | Edit notes |
|---|------|----------------|-----------|------------|
| 1 | 0:00–0:05 | "You know what you want your machine to do. You just don't always remember the command." | **Cold open.** Black screen, green cursor blinking. Type `what's using port 3000?` → the command card SLAMS in. | Start on black. Hard cut on a beat drop. Whoosh SFX as card enters. |
| 2 | 0:05–0:09 | "So stop memorizing. Meet CommandLess." | Logo sting: CommandLess wordmark + green glow on black, tagline fades in. | Quick scale-up + glow. Bass hit. |
| 3 | 0:09–0:16 | "Describe it in plain English — and get the exact command, explained before it runs." | **Demo beat 1:** `find large files here` → safe card → runs → real file list. | Zoom into the intent bar as it types. Punch-in on the green "Safe" badge. |
| 4 | 0:16–0:24 | "Find what's hogging space. Check your git changes. See your disk — instantly." | **Demo beats 2–3:** `show my git changes` (git status), `show disk usage` (df -h). Fast cuts. | Beat-synced cuts between the two. Speed-ramp the typing. |
| 5 | 0:24–0:32 | "Need something custom? The AI writes the command for you, right in your terminal." | **Demo beat 4:** `rename all .jpeg files to .jpg` → AI card appears (✦ AI badge), shows the generated command. | Highlight the ✦ AI badge. Hold on the explanation text. |
| 6 | 0:32–0:41 | "Every command gets a risk label. Dangerous ones need typed confirmation — nothing runs without you." | **Demo beat 5:** `kill the process using port 5173` → RED "Dangerous" card + risk warning. *(Optional: click Run to reveal the `RUN DANGEROUS COMMAND` gate.)* | Push-in on the red badge + warning box. Tense music swell. |
| 7 | 0:41–0:48 | "And it's a real terminal. Everything you already do — now with a brain." | Type a normal command in the terminal, e.g. `npm run dev` or `ls -la`, and run it. | Show it behaving like a normal shell. Calm beat. |
| 8 | 0:48–0:60 | "CommandLess. Terminal power, no command memorization. Free for Mac and Windows — link below." | Logo + tagline + "Free · macOS & Windows" + `github.com/shivxxyy/commandless`. | Final logo lockup, glow pulse, music outro. End card holds 2s. |

---

## How to capture the screen footage

1. Have the **real app** running with the local proxy (for the AI beat):
   ```bash
   npm run proxy        # terminal 1 (AI for beat 5's "rename" card)
   npm run tauri:dev    # terminal 2 (the app)
   ```
2. Resize the window to a clean 16:9-ish shape; hide other windows.
3. **Beats 3–6 are automated.** Trigger the demo reel:
   - Press **⌘⇧D** (or Command Palette → "Play demo reel").
   - It types each prompt, shows the card, and runs the safe ones on a clean
     cadence. Record this whole run (screen capture).
4. **Beat 1 (cold open)** and **beat 7 (real terminal)**: record separately —
   just type `what's using port 3000?` once for the cold open, and a normal
   command (`ls -la`) for beat 7.
5. Record at the highest resolution your screen allows; you'll crop/zoom in the edit.

> macOS capture: `⌘⇧5` → Record Selected Portion (or whole window). Tip: turn on
> "Show mouse clicks" on so taps read on camera.

VO audio is pre-generated in `video/voiceover/` (see PRODUCTION.md to regenerate
with a nicer voice). Word-for-word VO lines are the table above.
