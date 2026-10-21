"""Pre-render the narrator for every scene (narration) and every scene-ending hook.

    python -I tools/gen_narration.py --engine gateway [--voice ash] [--force] [scene-id ...]
    tools/venv/Scripts/python tools/gen_narration.py --engine kokoro [--voice bm_george] [--force]

Output: app/public/clips/sandman/audio/narration/<scene>.mp3 and audio/hooks/<scene>.mp3 (then `npm run upload` in app/).
Engines:
  gateway  gpt-audio-1.5 through the Infistar gateway, directed as an audiobook narrator (a fraction of a fen per line).
  kokoro   Kokoro-82M, open source, runs on CPU, no account.
  chatterbox  Resemble Chatterbox (MIT), open source, emotion dial; runs on CPU (slow, ~1 min per line). Needs tools/venv-tts.
              --voice <path.wav|mp3> clones that voice; --exaggeration 0.7 --cfg 0.3 for a dramatic read.
Only lines without an existing file are rendered unless --force.
"""
import sys, os, json, base64, urllib.request, subprocess, tempfile
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOK = os.path.join(ROOT, "app", "src", "content", "books", "sandman", "book.json")
OUT = os.environ.get("NARRATION_OUT") or os.path.join(ROOT, "app", "public", "clips", "sandman", "audio")

DIRECTION = ("You are the narrator of a prestige dark-fantasy series: think the opening narration of a Netflix thriller, "
             "or a film trailer voice with real acting behind it. Deep male voice, close to the microphone, intimate. "
             "Vary the pace on purpose: short sentences land fast and hard, then slow right down and lean into the long ones. "
             "Build tension across the passage; let the voice drop to a near-whisper on the eerie beats and swell on the big ones. "
             "Take a real pause at every full stop and a longer one at an ellipsis. Place names and years are spoken with weight. "
             "The last sentence is the sting: a breath before it, then say it quietly, like a secret the listener was not meant to hear. "
             "Never flat, never sing-song, never a documentary read. Add nothing to the words.")

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

_cb = None
def chatterbox_tts(text, voice, exaggeration=0.7, cfg=0.3):
    """voice = path to a reference clip (any speaker, 6-20 s) or '' for the built-in voice."""
    global _cb
    import torch, torchaudio, imageio_ffmpeg
    if _cb is None:
        from chatterbox.tts import ChatterboxTTS
        _cb = ChatterboxTTS.from_pretrained(device="cpu")
    ref = None
    if voice and os.path.exists(voice):
        ref = voice
        if not voice.lower().endswith(".wav"):
            ref = os.path.join(tempfile.gettempdir(), "cb_ref.wav")
            subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", voice, "-ac", "1", "-ar", "24000", "-t", "20", ref], check=True)
    # one sentence at a time keeps the model's pacing honest and avoids its 40 s cap
    import re
    parts = [t.strip() for t in re.split(r"(?<=[.!?…])\s+", text) if t.strip()]
    sr = _cb.sr
    pieces = []
    for part in parts:
        wav = _cb.generate(part, audio_prompt_path=ref, exaggeration=exaggeration, cfg_weight=cfg)
        pieces.append(wav.squeeze(0))
        pieces.append(torch.zeros(int(sr * 0.45)))
    audio = torch.cat(pieces).unsqueeze(0)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t:
        tmp = t.name
    torchaudio.save(tmp, audio, sr)
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as t:
        mp3 = t.name
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", tmp, "-af", "loudnorm=I=-18:TP=-1.5:LRA=9", "-codec:a", "libmp3lame", "-b:a", "96k", mp3], check=True)
    data = open(mp3, "rb").read()
    os.remove(tmp); os.remove(mp3)
    return data

def main():
    args = sys.argv[1:]
    engine = args[args.index("--engine") + 1] if "--engine" in args else "gateway"
    voice = args[args.index("--voice") + 1] if "--voice" in args else ("ash" if engine == "gateway" else "" if engine == "chatterbox" else "bm_george")
    force = "--force" in args
    exag = float(args[args.index("--exaggeration") + 1]) if "--exaggeration" in args else 0.7
    cfg = float(args[args.index("--cfg") + 1]) if "--cfg" in args else 0.3
    flagged = {args[i + 1] for i, a in enumerate(args[:-1]) if a in ("--engine", "--voice", "--exaggeration", "--cfg")}
    only = {a for a in args if not a.startswith("--") and a not in flagged}
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
            data = (gateway_tts(text, voice) if engine == "gateway" else
                    chatterbox_tts(text, voice, exag, cfg) if engine == "chatterbox" else kokoro_tts(text, voice))
            open(path, "wb").write(data)
            done += 1
            print(f"✓ {kind}/{sid}  ({len(data)//1024} KB)", flush=True)
        except Exception as e:
            failed += 1
            print(f"✗ {kind}/{sid}: {e}", flush=True)
    print(f"rendered {done}, kept {skipped}, failed {failed}")

if __name__ == "__main__":
    main()
