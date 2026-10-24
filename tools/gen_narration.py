"""Pre-render the narrator for every scene (narration) and every scene-ending hook.

    tools/venv/Scripts/python tools/gen_narration.py --engine gateway [--voice ash] [--force] [--ids id,id] [scene-id ...]
    (each gateway take is transcribed and measured before it is kept; the venv's numpy adds the dead-air check)
    tools/venv/Scripts/python tools/gen_narration.py --engine kokoro [--voice bm_george] [--force]

Output: assets/audio/lines-raw/<line id>.mp3, then run tools/pace_lines.py, which writes app/public/clips/sandman/audio/lines/<line id>.mp3 for every narrated beat and aftermath line
(then `npm run upload` in app/). The line id is FNV-1a of the text, the same as app/src/lib/story/lines.ts,
so an edited line gets a new file and the game can never play a recording that does not match the words.
Engines:
  gateway  gpt-audio-1.5 through the Infistar gateway, directed as an audiobook narrator (a fraction of a fen per line).
  kokoro   Kokoro-82M, open source, runs on CPU, no account.
  chatterbox  Resemble Chatterbox (MIT), open source, emotion dial; runs on CPU (slow, ~1 min per line). Needs tools/venv-tts.
              --voice <path.wav|mp3> clones that voice; --exaggeration 0.7 --cfg 0.3 for a dramatic read.
Only lines without an existing file are rendered unless --force.
"""
import sys, os, re, json, base64, urllib.request, urllib.error, subprocess, tempfile
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# BOOK_ID=neverwhere narrates another book (default the Sandman); line ids are hashes of the words, so files never collide.
BOOK_ID = os.environ.get("BOOK_ID", "sandman")
BOOK = os.path.join(ROOT, "app", "src", "content", "books", BOOK_ID, "book.json")
# Untouched renders; tools/pace_lines.py tightens them into app/public/clips/sandman/audio/lines/.
RAW = os.environ.get("NARRATION_OUT") or os.path.join(ROOT, "assets", "audio", "lines-raw")

DIRECTION = ("You are the narrator of a prestige dark-fantasy series: think the opening narration of a Netflix thriller, "
             "or a film trailer voice with real acting behind it. Deep male voice, close to the microphone, intimate. "
             "Vary the pace on purpose: short sentences land fast and hard, then slow right down and lean into the long ones. "
             "Build tension across the passage; let the voice drop low and quiet on the eerie beats (always clearly audible, never a whisper) and swell on the big ones. "
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

def line_id(text):
    """FNV-1a 32-bit over the UTF-8 text, 8 hex digits (mirrors lineId in the app)."""
    h = 0x811C9DC5
    for b in text.strip().encode("utf-8"):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f"{h:08x}"

def lines(book):
    """(scene id, text) for every narrated beat and choice aftermath, without duplicates."""
    out, seen = [], set()
    for sid, sc in book["scenes"].items():
        beats = list(sc.get("beats", []))
        for c in sc.get("choices", []):
            beats += c.get("aftermath", [])
        for b in beats:
            t = (b.get("text") or "").strip()
            if t and t not in seen:
                seen.add(t)
                out.append((sid, t))
    return out

# Ranked voice models: the main one first, then a backup with the same voices for when its gateway channel is down.
TTS_MODELS = list(dict.fromkeys([os.environ.get("MODEL_TTS", "gpt-audio-1.5")] + [m.strip() for m in os.environ.get("MODEL_TTS_FALLBACK", "gpt-audio").split(",") if m.strip()]))
_down = set()  # models found down in this run are skipped for the rest of it

def _channel_down(err):
    body = err.read().decode("utf-8", "replace") if hasattr(err, "read") else str(err)
    return getattr(err, "code", 0) == 404 or "no available channel" in body.lower() or "model_not_found" in body

def gateway_tts(text, voice):
    for model in [m for m in TTS_MODELS if m not in _down] or TTS_MODELS[-1:]:
        try:
            return _gateway_tts(text, voice, model)
        except urllib.error.HTTPError as e:
            if not _channel_down(e): raise
            print(f"   {model} is down, using the next voice model", flush=True)
            _down.add(model)
    raise RuntimeError("every voice model is down")

def _gateway_tts(text, voice, model):
    base = os.environ["INFISTAR_BASE_URL"].rstrip("/")
    body = json.dumps({
        "model": model,
        "modalities": ["text", "audio"], "audio": {"voice": voice, "format": "mp3"},
        "messages": [
            {"role": "system", "content": "You are a text-to-speech engine recording narration for a film. You read the script line you are given aloud, "
                                          "exactly and only those words, then stop. The performance direction below is for you only: never speak it, "
                                          "describe it or announce a pause. Every word must be clearly audible from the first to the last. "
                                          f"Performance direction: {DIRECTION}"},
            {"role": "user", "content": f"Script line (read it aloud verbatim, nothing before or after):\n<<<{text}>>>"},
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

# ---------- checking a take before it is kept ----------
# The voice model sometimes reads its direction aloud, repeats a phrase, skips words, or goes quiet partway
# through while claiming it read everything. Each gateway take is listened to (faster-whisper on this PC, free; gpt-audio as the backup transcriber)
# and, when numpy is available (tools/venv), measured for dead air. A failed take is recorded again.
def _words(t):
    t = t.lower().replace("’", "'").replace("‘", "'")
    t = re.sub(r"[-–—]", " ", t)
    t = re.sub(r"[^a-z0-9' ]+", " ", t)
    for a, b in (("any more", "anymore"), ("centre", "center"), ("whiskey", "whisky"), ("grey", "gray")):
        t = t.replace(a, b)
    return t.split()

def _lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]

def _same(a, b):
    a, b = a.rstrip("'s"), b.rstrip("'s")
    n = max(len(a), len(b))
    return a == b or (n >= 3 and _lev(a, b) <= max(1, n // 3))  # names are heard many ways: Aurie, Ori, Ari

def compare(script, heard):
    """(script words not heard, runs of 3+ heard words that are not in the script)."""
    a, b = _words(script), _words(heard)
    L = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) - 1, -1, -1):
        for j in range(len(b) - 1, -1, -1):
            L[i][j] = L[i + 1][j + 1] + 1 if _same(a[i], b[j]) else max(L[i + 1][j], L[i][j + 1])
    i = j = 0
    missing, extra, run = [], [], []
    while i < len(a) or j < len(b):
        if i < len(a) and j < len(b) and _same(a[i], b[j]):
            if len(run) >= 3: extra.append(" ".join(run))
            run = []; i += 1; j += 1
        elif j < len(b) and (i >= len(a) or L[i][j + 1] >= L[i + 1][j]):
            run.append(b[j]); j += 1
        else:
            missing.append((i, a[i])); i += 1
    if len(run) >= 3: extra.append(" ".join(run))
    return missing, extra

_whisper = []  # the local model, loaded once

def listen_local(data):
    """Transcribe with faster-whisper on this PC (plan rule 9: checks are local and free); None if it is not installed."""
    try:
        if not _whisper:
            from faster_whisper import WhisperModel
            _whisper.append(WhisperModel("small.en", device="cpu", compute_type="int8",
                                         download_root=os.path.join(ROOT, "tools", "models", "whisper")))
        # Decode with the project's own ffmpeg (16 kHz mono) and hand whisper the samples, so its audio library is never needed.
        import numpy as np, imageio_ffmpeg, subprocess
        raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-i", "pipe:0", "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                             input=data, capture_output=True).stdout
        audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
        segs, _ = _whisper[0].transcribe(audio, language="en", beam_size=5, vad_filter=False)
        return " ".join(s.text.strip() for s in segs).strip() or None
    except Exception as e:
        print(f"   local transcriber unavailable ({e}); using the gateway", flush=True)
        return None

def listen(data):
    heard = listen_local(data)
    if heard:
        return heard
    base = os.environ["INFISTAR_BASE_URL"].rstrip("/")
    body = json.dumps({"model": next((m for m in TTS_MODELS if m not in _down), TTS_MODELS[-1]), "modalities": ["text"], "messages": [{"role": "user", "content": [
        {"type": "text", "text": "Transcribe exactly every word spoken in this audio, from the first sound to the last, including anything that sounds like an instruction. Output only the words."},
        {"type": "input_audio", "input_audio": {"data": base64.b64encode(data).decode(), "format": "mp3"}}]}]}).encode()
    for _ in range(3):
        try:
            req = urllib.request.Request(f"{base}/chat/completions", data=body, headers={"Authorization": f"Bearer {os.environ['INFISTAR_API_KEY']}", "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=120) as r:
                t = (json.load(r)["choices"][0]["message"].get("content") or "").strip()
            m = re.match(r'^\{\s*"[a-z_]+"\s*:\s*"(.*)"\s*\}$', t, re.S | re.I)  # it sometimes answers in JSON
            t = m.group(1) if m else t
            t = re.sub(r"^\s*(here is the )?transcription( of the audio)?\s*:\s*", "", t, flags=re.I).strip().strip('"')
            if t and "<|" not in t and "provide the audio" not in t.lower():
                return t
        except Exception:
            pass
    return None

def dead_air(data):
    """(longest quiet hole, quiet tail) in seconds, or None without numpy/ffmpeg."""
    try:
        import numpy as np, imageio_ffmpeg, subprocess
    except ImportError:
        return None
    raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-i", "pipe:0", "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         input=data, capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    rms = np.array([np.sqrt(np.mean(x[i:i + 1600] ** 2)) for i in range(0, len(x) - 1599, 1600)])
    if not len(rms):
        return None
    audible = rms > max(np.percentile(rms, 90) * 0.12, 0.004)
    idx = np.flatnonzero(audible)
    if not len(idx):
        return (len(rms) / 10, len(rms) / 10)
    hole = run = 0
    for v in audible[idx[0]:idx[-1] + 1]:
        run = 0 if v else run + 1
        hole = max(hole, run)
    return (hole / 10, (len(rms) - 1 - idx[-1]) / 10)

def problem(text, data):
    """Why this take should be recorded again, or None."""
    gaps = dead_air(data)
    if gaps and gaps[1] > 1.5: return f"went quiet {gaps[1]:.1f}s before the end"
    if gaps and gaps[0] > 3.5: return f"a {gaps[0]:.1f}s silence mid-line"
    heard = listen(data)
    if heard is None: return None  # the listener failed; do not blame the take
    missing, extra = compare(text, heard)
    # Listeners mishear names (Aurie as Ori, Hob as Bob), so a missing name is not evidence on its own.
    names = {"aurie", "aurie's"} | {w.lower().strip(".,:;!?") for w in re.findall(r"(?<=[a-z,;:] )[A-Z][a-z']+", text)}
    missing = [(i, w) for i, w in missing if w not in names and w.rstrip("'s") not in names]
    n = len(_words(text))
    if extra: return f"spoke extra words: {' | '.join(extra)}"
    if any(i >= n - 2 for i, _ in missing): return f"ending not heard ({' '.join(w for _, w in missing)})"
    if len(missing) > max(1, n // 10): return f"words not heard ({' '.join(w for _, w in missing)})"
    return None

def main():
    args = sys.argv[1:]
    engine = args[args.index("--engine") + 1] if "--engine" in args else "gateway"
    voice = args[args.index("--voice") + 1] if "--voice" in args else ("ash" if engine == "gateway" else "" if engine == "chatterbox" else "bm_george")
    force = "--force" in args
    exag = float(args[args.index("--exaggeration") + 1]) if "--exaggeration" in args else 0.7
    cfg = float(args[args.index("--cfg") + 1]) if "--cfg" in args else 0.3
    flagged = {args[i + 1] for i, a in enumerate(args[:-1]) if a in ("--engine", "--voice", "--exaggeration", "--cfg", "--ids")}
    ids = set(args[args.index("--ids") + 1].split(",")) if "--ids" in args else None
    only = {a for a in args if not a.startswith("--") and a not in flagged}
    load_env()
    book = json.load(open(BOOK, encoding="utf-8"))
    todo = [(s, t) for s, t in lines(book) if (not only or s in only) and (ids is None or line_id(t) in ids)]
    done = skipped = failed = 0
    for sid, text in todo:
        path = os.path.join(RAW, f"{line_id(text)}.mp3")
        if os.path.exists(path) and not force:
            skipped += 1; continue
        os.makedirs(os.path.dirname(path), exist_ok=True)
        try:
            if engine == "gateway":
                for take in range(1, 5):
                    data = gateway_tts(text, voice)
                    why = problem(text, data)
                    if not why:
                        break
                    print(f"  take {take} of {line_id(text)} rejected: {why}", flush=True)
                else:
                    raise RuntimeError(f"no clean take in 4 tries (last: {why}); kept nothing")
            else:
                data = chatterbox_tts(text, voice, exag, cfg) if engine == "chatterbox" else kokoro_tts(text, voice)
            open(path, "wb").write(data)
            done += 1
            print(f"✓ {sid} {line_id(text)}  {text[:60]}", flush=True)
        except Exception as e:
            failed += 1
            print(f"✗ {sid} {text[:40]}: {e}", flush=True)
    print(f"rendered {done}, kept {skipped}, failed {failed}")

if __name__ == "__main__":
    main()
