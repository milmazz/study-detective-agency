# Lesson videos

The pipeline behind the narrated cartoon on each bonus study page ("Watch the
lesson" on Mochi's Energy Lab and Pepita's Texas Trail). A video is:

- a **script**: who says what, with pauses for the animation to breathe
- **voices**: one ElevenLabs voice per character
- **scenes**: an SVG animation drawn as a pure function of time, keyed to
  the words as they're spoken

The pipeline turns those into a 720p MP4 with captions that highlight each
word, mouths that move with the audio, and sound effects made in code.
None of this is part of the site build: `npm run build` never touches
`tools/`. Only the finished MP4 and poster under `assets/video/` ship.

```
tools/video/
  make.sh                One command: narrate, render, encode, install
  pipeline/
    gen_audio.py         ElevenLabs text-to-speech per line (cached), word timings,
                         mouth envelope -> build/timeline.json + narration.wav
    sfx.py               Sound effects synthesized in code, mixed under the narration
    meta.cjs             Reads the page's duration and sound cues
    render.cjs           Captures frames with headless Chromium -> H.264 segment
    preview.cjs          Stills at chosen times, for checking layout
    voices.py            Search the voice library, make samples, check usage
  lib/lib.js             Shared runtime for every video: timing helpers (W, pop,
                         fade, ...), captions, drawing primitives, the frame loop
  videos/<name>/
    script.md            The approved script, readable (scene notes in italics)
    lines.py             The same script as data: SCRIPT, VOICES, TEMPO, POSTER_AT
    video.html           This video's palette, characters and scenes
    audio/               Cached narration: <line>.mp3 + <line>.json (word timings).
                         Committed, so re-rendering never spends credits
    build/               Generated, git-ignored
```

## Setup

- **Node** (the repo's pinned version) and **Playwright** with Chromium:
  `cd tools/video && npm install && npx playwright install chromium`.
  Kept out of the root `package.json` on purpose, so the site's
  `npm ci` and CI don't download a browser.
- **Python 3** with numpy: `pip install -r tools/video/requirements.txt`.
- **ffmpeg** on your PATH.
- **An ElevenLabs API key** in `ELEVENLABS_API_KEY`, needed only for lines
  that aren't cached yet. The key needs *Text to Speech*, *Voices (read)*, and
  optionally *User (read)* for `voices.py usage`. In a Claude Code cloud
  session, leave the variable unset: the session's proxy injects the saved key.

## Commands

```bash
tools/video/make.sh tools/video/videos/mochi-energy-lab preview 5 60 150   # stills -> build/preview.png
tools/video/make.sh tools/video/videos/mochi-energy-lab                    # -> build/mochi-energy-lab.mp4
tools/video/make.sh tools/video/videos/mochi-energy-lab install            # -> assets/video/ (MP4 + poster)
```

A full render takes a few minutes: about 2½ for a 4½-minute video with the
default `WORKERS=4` browser processes. The final encode keeps a 5–7 minute
video near 18 MB, under Cloudflare's 25 MiB per-file limit.

## Making a new video

1. **Write the script** as `videos/<name>/script.md`, from the teacher's
   study guide. Two characters work well: a narrator, and a sidekick whose
   mix-ups match the wrong answer choices on the practice questions, so the
   narrator gets to correct them. Aim for 4–6 minutes and end with a pop quiz
   built from the guide's own practice questions.
2. **Pick voices**:
   ```bash
   python3 tools/video/pipeline/voices.py search "cartoon cat"
   python3 tools/video/pipeline/voices.py sample <voice_id> "A line from the script" /tmp/sample.mp3
   ```
   Prefer original character voices over ones that imitate a famous cartoon.
3. **Turn the script into `lines.py`**: copy an existing video's file. Each
   entry is `(id, speaker, text, scene)` or `("pause", seconds, scene)`. A
   leading `[excited]`-style tag steers the delivery and is left out of the
   captions. If a voice reads slower than the others, set
   `TEMPO = {speaker: 1.15}` to speed it up without changing pitch; it reuses
   the cached audio, so it costs nothing.
4. **Write the scenes in `video.html`**: copy an existing video's file and
   replace its palette, characters and `scenes[n]` functions. This is the
   creative part, and the part an AI assistant can draft from the script.
   Key every animation to the narration, never to hard-coded seconds:
   `S('m4')` / `E('m4')` are a line's start and end, `W('m4', 'bumps')` is
   when that word is spoken, and `pop`, `fade` and `prog` turn those into
   motion. That way a re-recorded line moves its animation with it.
5. **Preview, then render**: `make.sh <dir> preview <times...>` until the
   layout is right, then `make.sh <dir>` and watch the MP4.
6. **Install**: `make.sh <dir> install`, then add a "Watch the lesson"
   section to the page. Copy the `<video class="lesson-video">` block from
   `games/science/energy-lab.html`.

To change one line, edit its text in `lines.py`, delete its two files from
`audio/`, and run `make.sh` again: only that line is re-narrated.
