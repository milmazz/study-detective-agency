"""Narrate a video: generate each line with ElevenLabs (cached), then lay out the timeline.

    python3 gen_audio.py <video-dir>

Reads <video-dir>/lines.py (SCRIPT, VOICES, optional TEMPO). For every line not
already in <video-dir>/audio/, calls ElevenLabs text-to-speech with word
timestamps and caches <id>.mp3 + <id>.json there; cached lines cost nothing,
so delete a line's two files to regenerate just that line.

Writes to <video-dir>/build/:
  timeline.json / timeline.js   per line: start time, duration, speaker, caption,
                                word timings (absolute), mouth envelope at FPS
  narration.wav                 every line placed on the timeline

API key: $ELEVENLABS_API_KEY. If unset, a placeholder is sent, which is what
a Claude Code cloud session wants (its proxy injects the saved key).
"""
import base64, importlib.util, json, os, re, subprocess, sys, urllib.request, wave
import numpy as np

FPS = 30
SR = 44100
GAP = 0.25          # silence between back-to-back lines
TAG = re.compile(r"\[[^\]]*\]\s*")   # eleven_v3 audio tags: spoken-only, not captioned
MODEL = "eleven_v3"

def load_lines(vdir):
    spec = importlib.util.spec_from_file_location("lines", os.path.join(vdir, "lines.py"))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod.SCRIPT, mod.VOICES, getattr(mod, "TEMPO", {})

def tts(aud, lid, voice, text):
    mp3, aj = f"{aud}/{lid}.mp3", f"{aud}/{lid}.json"
    if os.path.exists(mp3) and os.path.exists(aj):
        return
    body = {"text": text, "model_id": MODEL, "seed": 7}
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")})
    with urllib.request.urlopen(req, timeout=120) as r:
        d = json.load(r)
    open(mp3, "wb").write(base64.b64decode(d["audio_base64"]))
    json.dump(d.get("alignment") or d.get("normalized_alignment"), open(aj, "w"))
    print("generated", lid, flush=True)

def pcm(mp3, tempo=1.0):
    af = ["-af", f"atempo={tempo}"] if tempo != 1.0 else []
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", mp3, *af, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768

def words_from_alignment(al):
    """Group aligned characters into words, dropping [audio tags]."""
    chars, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur, t0, t1, depth = [], "", None, None, 0
    for c, a, b in zip(chars, st, en):
        if c == "[": depth += 1; continue
        if c == "]": depth -= 1; continue
        if depth: continue
        if c.isspace():
            if cur: words.append((cur, t0, t1)); cur = ""
            continue
        if not cur: t0 = a
        cur += c; t1 = b
    if cur: words.append((cur, t0, t1))
    return words

def main(vdir):
    vdir = os.path.abspath(vdir)
    SCRIPT, VOICES, TEMPO = load_lines(vdir)
    aud = os.path.join(vdir, "audio"); out_dir = os.path.join(vdir, "build")
    os.makedirs(aud, exist_ok=True); os.makedirs(out_dir, exist_ok=True)
    for item in SCRIPT:
        if item[0] != "pause":
            tts(aud, item[0], VOICES[item[1]], item[2])

    t, lines, track, scenes = 0.0, [], [], {}
    prev_line = False
    for item in SCRIPT:
        if item[0] == "pause":
            scenes.setdefault(item[2], t)
            t += item[1]; prev_line = False
            continue
        lid, spk, text, scene = item
        if prev_line: t += GAP
        scenes.setdefault(scene, t)
        tempo = TEMPO.get(spk, 1.0)
        y = pcm(f"{aud}/{lid}.mp3", tempo)
        dur = len(y) / SR
        al = json.load(open(f"{aud}/{lid}.json"))
        words = [{"w": w, "s": round(t + a / tempo, 3), "e": round(t + b / tempo, 3)} for w, a, b in words_from_alignment(al)]
        # mouth envelope: RMS per video frame, normalised per line
        hop = SR // FPS
        n = int(np.ceil(len(y) / hop))
        rms = np.array([np.sqrt(np.mean(y[i*hop:(i+1)*hop] ** 2)) if len(y[i*hop:(i+1)*hop]) else 0 for i in range(n)])
        peak = np.percentile(rms, 95) or 1
        mouth = [round(float(min(1, v / peak)), 2) for v in rms]
        lines.append({"id": lid, "speaker": spk, "scene": scene, "start": round(t, 3), "dur": round(dur, 3),
                      "caption": TAG.sub("", text).strip(), "words": words, "mouth": mouth})
        track.append((t, y))
        t += dur; prev_line = True

    total = round(t, 3)
    mix = np.zeros(int(total * SR) + SR, dtype=np.float32)
    for st, y in track:
        i = int(st * SR); mix[i:i+len(y)] += y
    with wave.open(os.path.join(out_dir, "narration.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())

    tl = {"fps": FPS, "total": total, "scenes": {str(k): round(v, 3) for k, v in scenes.items()}, "lines": lines}
    json.dump(tl, open(os.path.join(out_dir, "timeline.json"), "w"))
    open(os.path.join(out_dir, "timeline.js"), "w").write("window.TL=" + json.dumps(tl) + ";")
    print(f"narration: {total}s, {len(lines)} lines, {len(scenes)} scenes")

if __name__ == "__main__":
    if len(sys.argv) != 2: sys.exit(__doc__)
    main(sys.argv[1])
