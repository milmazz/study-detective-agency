"""Find and audition ElevenLabs voices for a new character.

    python3 voices.py search "cartoon mouse"         # shared voice library
    python3 voices.py mine                            # voices already in your account
    python3 voices.py sample <voice_id> "Line to read" out.mp3
    python3 voices.py usage                           # characters used this month

Put the chosen voice_id into the video's lines.py VOICES. Samples use the
same model and seed as gen_audio.py, so they sound like the final narration.
Skip library voices that imitate a famous character; stick to original ones.

API key: $ELEVENLABS_API_KEY (unset = placeholder, for a proxy that injects it).
Needed permissions: Text to Speech, Voices (read), User (read, for `usage`).
"""
import json, os, sys, urllib.parse, urllib.request

API = "https://api.elevenlabs.io"
KEY = os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")

def call(path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None,
                                 headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()

def main(argv):
    if not argv: sys.exit(__doc__)
    cmd = argv[0]
    if cmd == "search" and len(argv) == 2:
        q = urllib.parse.urlencode({"search": argv[1], "page_size": 10, "language": "en"})
        for v in json.loads(call(f"/v1/shared-voices?{q}"))["voices"]:
            desc = (v.get("description") or "").replace("\n", " ")[:90]
            print(f'{v["voice_id"]}  {v["name"]}  [{v.get("gender")}, {v.get("age")}, {v.get("accent")}]  {desc}')
    elif cmd == "mine":
        for v in json.loads(call("/v2/voices?page_size=100"))["voices"]:
            print(f'{v["voice_id"]}  {v["name"]}  {v.get("labels")}')
    elif cmd == "sample" and len(argv) == 4:
        audio = call(f"/v1/text-to-speech/{argv[1]}?output_format=mp3_44100_128", {"text": argv[2], "model_id": "eleven_v3", "seed": 7})
        open(argv[3], "wb").write(audio); print("wrote", argv[3])
    elif cmd == "usage":
        d = json.loads(call("/v1/user/subscription"))
        print(f'{d["character_count"]} of {d["character_limit"]} characters used ({d["tier"]})')
    else:
        sys.exit(__doc__)

if __name__ == "__main__":
    main(sys.argv[1:])
