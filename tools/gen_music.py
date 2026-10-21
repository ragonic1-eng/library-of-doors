"""Generate the game's music beds locally with Meta's MusicGen (free, CPU is fine, no account).

    tools/venv/Scripts/python tools/gen_music.py [track-id ...] [--seconds 30] [--model small|medium]

Writes loop-friendly MP3s to app/public/clips/sandman/audio/music/<track>.mp3 (then `npm run upload` in app/).
Each track is generated, trimmed, and given a short crossfade from tail to head so it loops without a click.
CPU time: about 1 to 3 minutes per 30 s with the small model.
"""
import sys, os, subprocess, tempfile
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "app", "public", "clips", "sandman", "audio", "music")
os.makedirs(OUT, exist_ok=True)

# Track id -> prompt. Keep every prompt in one sonic family (dark orchestral, slow, mysterious) so cross-fades feel like one score.
TRACKS = {
    "throne": "dark orchestral fantasy score, vast and mysterious, slow sustained low strings and a distant choir, celesta sparkles like stars, awe and quiet power, cinematic, 60 bpm, no drums",
    "cellar-dread": "tense mysterious underscore, low cello drone, sparse piano notes in a stone cellar, creeping dread, subtle dissonant strings, slow, cinematic horror score, no drums",
    "the-years": "melancholic slow orchestral passage of time, solo violin over soft strings, a ticking clock texture, wistful and sad, cinematic, minor key, no drums",
    "cellar-wait": "quiet suspenseful underscore, hushed strings and a faint music box, sorrow and patience, dusty and still, cinematic, very slow, no drums",
    "escape": "rising mysterious orchestral score, building tension to release, low brass swells, shimmering strings, a sense of awakening power, cinematic, 70 bpm, light percussion",
    "library": "warm mysterious wonder, soft harp and celesta, gentle strings, a vast library at night, magical and curious like a fantasy film main theme, cinematic, slow, no drums",
}

def parse():
    args = sys.argv[1:]
    secs = int(args[args.index("--seconds") + 1]) if "--seconds" in args else 30
    model = args[args.index("--model") + 1] if "--model" in args else "small"
    ids = [a for a in args if not a.startswith("--") and a not in (str(secs), model)]
    return ids or list(TRACKS), secs, model

def loopify(wav, sr, xfade_s=2.0):
    """Crossfade the last xfade_s into the first so the file loops cleanly."""
    n = int(sr * xfade_s)
    if len(wav) <= 2 * n:
        return wav
    head, tail = wav[:n], wav[-n:]
    ramp = np.linspace(0, 1, n)
    blended = tail * (1 - ramp) + head * ramp
    return np.concatenate([blended, wav[n:-n]])

def to_mp3(wav, sr, path):
    import imageio_ffmpeg, soundfile as sf
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t:
        tmp = t.name
    sf.write(tmp, wav, sr)
    subprocess.run([ff, "-y", "-loglevel", "error", "-i", tmp, "-codec:a", "libmp3lame", "-b:a", "128k", "-af", "loudnorm=I=-20:TP=-2", path], check=True)
    os.remove(tmp)

def main():
    ids, secs, size = parse()
    import torch
    from transformers import AutoProcessor, MusicgenForConditionalGeneration
    torch.set_num_threads(max(1, os.cpu_count() - 1))
    name = f"facebook/musicgen-{size}"
    print(f"loading {name} (first run downloads it)…", flush=True)
    processor = AutoProcessor.from_pretrained(name)
    model = MusicgenForConditionalGeneration.from_pretrained(name)
    model.eval()
    sr = model.config.audio_encoder.sampling_rate
    tokens = int(secs * 50)  # MusicGen: 50 tokens per second
    for tid in ids:
        prompt = TRACKS[tid]
        print(f"▶ {tid}: {secs}s  ({prompt[:60]}…)", flush=True)
        inputs = processor(text=[prompt], padding=True, return_tensors="pt")
        with torch.no_grad():
            audio = model.generate(**inputs, do_sample=True, guidance_scale=3.0, max_new_tokens=tokens)
        wav = audio[0, 0].cpu().numpy().astype(np.float32)
        wav = wav / max(1e-6, np.abs(wav).max()) * 0.9
        wav = loopify(wav, sr)
        out = os.path.join(OUT, f"{tid}.mp3")
        to_mp3(wav, sr, out)
        print(f"   saved {os.path.relpath(out, ROOT)}  ({len(wav)/sr:.1f}s)", flush=True)

if __name__ == "__main__":
    main()
