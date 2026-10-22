"""Looping ambience beds (rain, Hell's fire, wind, crowds) under the scenes, generated locally and free with AudioLDM 2.

    tools/venv/Scripts/python tools/gen_ambience.py [bed-id ...] [--force] [--seed N]

Writes app/public/clips/sandman/audio/ambience/<id>.mp3 (then `npm run upload` in app/). A scene names its bed with
`"ambience": "<id>"` in book.json (a beat can switch it from that beat on); the player loops it quietly under the
music. Each bed is made seamless: its last 1.5 s is cross-faded into its start, so the loop has no seam or click.
Same model and cache as tools/gen_sfx.py (cvssp/audioldm2 in tools/models/huggingface on this drive).
"""
import os, sys, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("HF_HOME", os.path.join(ROOT, "tools", "models", "huggingface"))  # keep the 4.5 GB on D:
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUT = os.path.join(ROOT, "app", "public", "clips", "sandman", "audio", "ambience")
SECONDS, XFADE = 10, 1.5

# id: prompt. Concrete, steady sources; no events that would repeat noticeably in a loop.
BEDS = {
    "cellar": "Water dripping slowly in a stone cave, echo",
    "dreaming": "Soft wind moving through a vast empty stone hall at night, very quiet, distant and calm",
    "rain": "Steady rain falling on a city street at night, rain on pavement and in gutters, distant traffic",
    "hell": "A huge fire roaring and crackling in a vast cave, a deep low rumble",
    "ice": "Cold wind howling through an icy cave, faint creaking ice",
    "night-forest": "A quiet forest at night, gentle wind in bare trees, crickets",
    "stream": "A gentle stream flowing over stones in the evening, crickets, a light breeze",
    "tavern": "A busy old tavern, a crowd murmuring and talking, a fire crackling, mugs clinking",
    "crowd": "A large indoor crowd murmuring in a big hall, people talking quietly",
    "park": "A city park in the morning, birds singing, pigeons cooing, distant traffic",
    "sea": "Gentle ocean waves lapping on a rocky shore, a light wind",
    "diner": "A quiet late night diner, fluorescent lights humming, a coffee machine, distant traffic outside",
    "night-room": "A quiet apartment at night, a clock ticking, distant city traffic",
}
NEGATIVE = "low quality, music, speech, singing, distortion, noise, clicks"
TARGET_DB = -26.0  # a bed under the music (about -19) and the voices (-22), never competing with them


def loop_and_write(wave, sr, path, ffmpeg):
    """Cross-fade the tail into the head so the bed loops seamlessly, level it, write an MP3."""
    import numpy as np
    x = wave.astype(np.float32)
    n = int(XFADE * sr)
    head, body, tail = x[:n], x[n:len(x) - n], x[len(x) - n:]
    t = np.linspace(0, np.pi / 2, n)
    seam = tail * np.cos(t) + head * np.sin(t)  # equal-power: the end flows into the start
    x = np.concatenate([body, seam])
    rms = np.sqrt(np.mean(x ** 2)) + 1e-9
    x *= min(10 ** (TARGET_DB / 20) / rms, 10 ** (-3 / 20) / (np.abs(x).max() + 1e-9))
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run([ffmpeg, "-v", "error", "-y", "-f", "s16le", "-ar", str(sr), "-ac", "1", "-i", "pipe:0",
                    "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "96k", path], input=pcm, check=True)


def main():
    args = sys.argv[1:]
    force = "--force" in args
    seed = int(args[args.index("--seed") + 1]) if "--seed" in args else 1234
    ids = [a for a in args if not a.startswith("--") and not a.isdigit()] or list(BEDS)
    unknown = [i for i in ids if i not in BEDS]
    if unknown:
        sys.exit(f"unknown bed: {unknown}. Known: {', '.join(BEDS)}")
    os.makedirs(OUT, exist_ok=True)
    todo = [i for i in ids if force or not os.path.exists(os.path.join(OUT, f"{i}.mp3"))]
    if not todo:
        print("all requested beds exist (use --force to remake)")
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
        print(f"▶ {i}: {BEDS[i][:60]}...", flush=True)
        gen = torch.Generator("cpu").manual_seed(seed)
        result = pipe(BEDS[i], negative_prompt=NEGATIVE, num_inference_steps=100, audio_length_in_s=SECONDS,
                      num_waveforms_per_prompt=1, guidance_scale=3.5, generator=gen)
        path = os.path.join(OUT, f"{i}.mp3")
        loop_and_write(result.audios[0], 16000, path, ffmpeg)
        print(f"   saved {os.path.relpath(path, ROOT)}", flush=True)


if __name__ == "__main__":
    main()
