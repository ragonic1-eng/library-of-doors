"""One-shot sound effects for the story, generated locally and free with AudioLDM 2.

    tools/venv/Scripts/python tools/gen_sfx.py [sfx-id ...] [--force] [--seed N]

Writes app/public/clips/sandman/audio/sfx/<id>.mp3 (then `npm run upload` in app/). Beats name a cue with
`"sfx": "<id>"` in book.json; the player plays it when that beat starts.
The model (cvssp/audioldm2, about 4.5 GB, CC BY-NC-SA 4.0: fine for this private, non-commercial gift) is cached in
tools/models/huggingface on this drive, never in the user profile on C:. CPU only; a few minutes per effect.
"""
import os, sys, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("HF_HOME", os.path.join(ROOT, "tools", "models", "huggingface"))  # keep the 4.5 GB on D:
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUT = os.path.join(ROOT, "app", "public", "clips", "sandman", "audio", "sfx")

# id: (seconds, prompt). Written for AudioLDM 2: concrete sources, a place, a distance.
SFX = {
    "glass-break": (4, "A large glass sphere shattering in a stone cellar, glass breaking and shards falling onto a stone floor, echo"),
    "sand-magic": (4, "Fine dry sand pouring and hissing onto stone, then blown away by a soft gust of wind"),
    "door-creak": (4, "A wooden door creaking slowly open in a quiet room"),
    "hell-gates": (6, "A heavy metal gate creaks open slowly, chains rattling, a deep rumble echoing in a large hall"),
    "arena-roar": (5, "A large crowd roars and cheers loudly in a stadium"),
    "ruby-shatter": (4, "A crystal gem smashed on a table, sharp crystal shattering with a bright magical ringing burst"),
    "pigeons": (4, "A flock of pigeons flapping their wings and taking off in a city park, cooing"),
    "feathers": (5, "A large flock of birds flapping their wings and taking off at once, feathers fluttering"),
    "raven": (4, "A raven cawing and flapping its wings as it lands on a wooden table, papers rustling"),
    "church-bell": (6, "A single deep church bell tolling once over a medieval town, long reverberating decay"),
    "tavern-laughter": (5, "People laughing and talking loudly in a crowded pub, glasses clinking"),
    "thunder": (6, "Distant rolling thunder during heavy rain on a city street at night"),
    "ice-creak": (5, "Thick ice cracking and creaking in a vast frozen cavern, deep resonant groan"),
}
NEGATIVE = "low quality, music, speech, talking, singing, distortion, noise"
TARGET_DB = -20.0  # speech-like level, between the music beds (about -19) and the voices (-22)


def finish(wave, sr, path, ffmpeg):
    """Trim silence, fade, level, and write an MP3."""
    import numpy as np
    x = wave.astype(np.float32)
    env = np.convolve(np.abs(x), np.ones(400) / 400, mode="same")
    loud = np.flatnonzero(env > env.max() * 0.03)
    if len(loud):
        x = x[max(0, loud[0] - int(0.02 * sr)): min(len(x), loud[-1] + int(0.4 * sr))]
    fade_in, fade_out = int(0.01 * sr), min(len(x) // 3, int(0.35 * sr))
    x[:fade_in] *= np.linspace(0, 1, fade_in)
    x[-fade_out:] *= np.linspace(1, 0, fade_out)
    rms = np.sqrt(np.mean(x ** 2)) + 1e-9
    x *= min(10 ** (TARGET_DB / 20) / rms, 10 ** (-1 / 20) / (np.abs(x).max() + 1e-9))  # level, never above -1 dBFS peak
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run([ffmpeg, "-v", "error", "-y", "-f", "s16le", "-ar", str(sr), "-ac", "1", "-i", "pipe:0",
                    "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "128k", path], input=pcm, check=True)


def main():
    args = sys.argv[1:]
    force = "--force" in args
    seed = int(args[args.index("--seed") + 1]) if "--seed" in args else 1234
    ids = [a for a in args if not a.startswith("--") and not a.isdigit()] or list(SFX)
    unknown = [i for i in ids if i not in SFX]
    if unknown:
        sys.exit(f"unknown sfx: {unknown}. Known: {', '.join(SFX)}")
    os.makedirs(OUT, exist_ok=True)
    todo = [i for i in ids if force or not os.path.exists(os.path.join(OUT, f"{i}.mp3"))]
    if not todo:
        print("all requested effects exist (use --force to remake)")
        return
    import torch, imageio_ffmpeg
    from diffusers import AudioLDM2Pipeline
    print(f"loading cvssp/audioldm2 (cache: {os.environ['HF_HOME']}) ...", flush=True)
    pipe = AudioLDM2Pipeline.from_pretrained("cvssp/audioldm2", torch_dtype=torch.float32)
    # diffusers 0.41 calls a helper that transformers 5 keeps on GenerationMixin rather than on GPT2Model.
    from transformers import GenerationMixin
    lm = pipe.language_model
    if not hasattr(lm, "_update_model_kwargs_for_generation"):
        lm._update_model_kwargs_for_generation = GenerationMixin._update_model_kwargs_for_generation.__get__(lm)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    for i in todo:
        secs, prompt = SFX[i]
        print(f"▶ {i}: {secs}s  ({prompt[:60]}...)", flush=True)
        gen = torch.Generator("cpu").manual_seed(seed)
        # Two candidates; the pipeline ranks them with CLAP against the prompt and returns the best first.
        result = pipe(prompt, negative_prompt=NEGATIVE, num_inference_steps=100, audio_length_in_s=secs,
                      num_waveforms_per_prompt=2, guidance_scale=3.5, generator=gen)
        path = os.path.join(OUT, f"{i}.mp3")
        finish(result.audios[0], 16000, path, ffmpeg)
        print(f"   saved {os.path.relpath(path, ROOT)}", flush=True)


if __name__ == "__main__":
    main()
