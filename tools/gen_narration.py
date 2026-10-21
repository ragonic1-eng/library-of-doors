"""Pre-render the narrator for every scene (narration) and every scene-ending hook.

    python -I tools/gen_narration.py --engine gateway [--voice ash] [--force] [scene-id ...]
    tools/venv/Scripts/python tools/gen_narration.py --engine kokoro [--voice bm_george] [--force]

Output: app/public/clips/sandman/audio/narration/<scene>.mp3 and audio/hooks/<scene>.mp3 (then `npm run upload` in app/).
Engines:
  gateway  gpt-audio-1.5 through the Infistar gateway, directed as an audiobook narrator (a fraction of a fen per line).
  kokoro   Kokoro-82M, open source, runs on CPU, no account.
Only lines without an existing file are rendered unless --force.
"""
import sys, os, json, base64, urllib.request, subprocess, tempfile
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOK = os.path.join(ROOT, "app", "src", "content", "books", "sandman", "book.json")
OUT = os.path.join(ROOT, "app", "public", "clips", "sandman", "audio")

DIRECTION = ("A master audiobook narrator of dark fantasy, in the manner of a BBC radio drama. Deep, hushed, unhurried; "
             "every sentence a held breath. Slow down on names and dates. A silent beat before the final sentence, "
             "then land it quietly, with menace and wonder. Never rush, never sing-song.")

def load_env():
    for f in (os.path.join(ROOT, ".env"),):
        if os.path.exists(f):
            for line in open(f, encoding="utf-8"):
                if "=" in line and not line.startswith("#"):
                    k, v = line.rstrip("\n").split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

def lines(book):
    """(kind, scene id, text) for every scene narration and hook."""
    out = []
    for sid, sc in book["scenes"].items():
        if sc.get("narration"):
            out.append(("narration", sid, sc["narration"]))
        if sc.get("hook"):
            out.append(("hooks", sid, sc["hook"]))
    return out

def gateway_tts(text, voice):
    base = os.environ["INFISTAR_BASE_URL"].rstrip("/")
    body = json.dumps({
        "model": os.environ.get("MODEL_TTS", "gpt-audio-1.5"),
        "modalities": ["text", "audio"], "audio": {"voice": voice, "format": "mp3"},
        "messages": [
            {"role": "system", "content": f"You are a voice actor recording narration for a film. Speak the user's text aloud exactly as written, word for word; add nothing, omit nothing, never comment. Performance direction: {DIRECTION}"},
            {"role": "user", "content": text},
        ],
    }).encode()
    req = urllib.request.Request(f"{base}/chat/completions", data=body, headers={"Authorization": f"Bearer {os.environ['INFISTAR_API_KEY']}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        j = json.load(r)
    b64 = j["choices"][0]["message"].get("audio", {}).get("data")
    if not b64:
        raise RuntimeError("no audio in response")
    return base64.b64decode(b64)

_kokoro = None
def kokoro_tts(text, voice):
    global _kokoro
    import numpy as np, soundfile as sf, imageio_ffmpeg
    if _kokoro is None:
        from kokoro import KPipeline
        _kokoro = KPipeline(lang_code="b" if voice.startswith("b") else "a")
    chunks = [audio for _, _, audio in _kokoro(text, voice=voice, speed=0.88)]
    wav = np.concatenate([np.asarray(c) for c in chunks])
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t:
        tmp = t.name
    sf.write(tmp, wav, 24000)
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as t:
        mp3 = t.name
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", tmp, "-codec:a", "libmp3lame", "-b:a", "96k", mp3], check=True)
    data = open(mp3, "rb").read()
    os.remove(tmp); os.remove(mp3)
    return data

def main():
    args = sys.argv[1:]
    engine = args[args.index("--engine") + 1] if "--engine" in args else "gateway"
    voice = args[args.index("--voice") + 1] if "--voice" in args else ("ash" if engine == "gateway" else "bm_george")
    force = "--force" in args
    only = {a for a in args if not a.startswith("--") and a not in (engine, voice)}
    load_env()
    book = json.load(open(BOOK, encoding="utf-8"))
    todo = [(k, s, t) for k, s, t in lines(book) if not only or s in only]
    done = skipped = failed = 0
    for kind, sid, text in todo:
        path = os.path.join(OUT, kind, f"{sid}.mp3")
        if os.path.exists(path) and not force:
            skipped += 1; continue
        os.makedirs(os.path.dirname(path), exist_ok=True)
        try:
            data = gateway_tts(text, voice) if engine == "gateway" else kokoro_tts(text, voice)
            open(path, "wb").write(data)
            done += 1
            print(f"✓ {kind}/{sid}  ({len(data)//1024} KB)", flush=True)
        except Exception as e:
            failed += 1
            print(f"✗ {kind}/{sid}: {e}", flush=True)
    print(f"rendered {done}, kept {skipped}, failed {failed}")

if __name__ == "__main__":
    main()
