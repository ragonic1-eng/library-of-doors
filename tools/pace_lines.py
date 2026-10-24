"""Tighten narrator lines so the story never drags.

    tools/venv/Scripts/python tools/pace_lines.py [--target 2.7] [--max 1.3]

Reads the untouched renders in assets/audio/lines-raw/<id>.mp3 (gen_narration.py writes them there),
and writes app/public/clips/sandman/audio/lines/<id>.mp3:
  - trims silence before and after the voice,
  - shortens any pause longer than 0.7 s to 0.45 s (a breath, not dead air),
  - speeds the line up (pitch kept) only if it is still slower than --target words per second, never by more than --max.
Then `npm run upload` in app/.
"""
import sys, os, io, json, subprocess, glob
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import numpy as np, soundfile as sf, imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets", "audio", "lines-raw")
BOOK_ID = os.environ.get("BOOK_ID", "sandman")  # BOOK_ID=neverwhere paces another book's narration
OUT = os.path.join(ROOT, "app", "public", "clips", BOOK_ID, "audio", "lines")
BOOK = os.path.join(ROOT, "app", "src", "content", "books", BOOK_ID, "book.json")
FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 24000


def line_id(text):
    h = 0x811C9DC5
    for b in text.strip().encode("utf-8"):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f"{h:08x}"


def texts():
    b = json.load(open(BOOK, encoding="utf-8"))
    out = {}
    for sc in b["scenes"].values():
        beats = list(sc.get("beats", []))
        for c in sc.get("choices", []):
            beats += c.get("aftermath", [])
        for x in beats:
            if x.get("text"):
                out[line_id(x["text"])] = x["text"]
    return out


def decode(path):
    raw = subprocess.run([FF, "-loglevel", "error", "-i", path, "-f", "wav", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    a, _ = sf.read(io.BytesIO(raw), dtype="float32")
    return a


def tighten(a):
    """Trim the ends and shorten long pauses. Works on 20 ms frames with a level relative to the loudest part."""
    f = int(0.02 * SR)
    n = len(a) // f
    if n == 0:
        return a
    rms = np.sqrt(np.mean(a[: n * f].reshape(n, f) ** 2, axis=1)) + 1e-9
    db = 20 * np.log10(rms)
    voiced = db > db.max() - 38
    idx = np.flatnonzero(voiced)
    if len(idx) == 0:
        return a
    first, last = idx[0], idx[-1]
    keep = []
    gap = 0
    for i in range(max(0, first - 4), min(n, last + 8)):  # 80 ms lead-in, 160 ms tail
        if voiced[i] or i < first or i > last:
            gap = 0
            keep.append(i)
        else:
            gap += 1
            if gap <= 22:  # pauses up to 0.45 s survive; longer ones are cut down to that
                keep.append(i)
    return np.concatenate([a[i * f:(i + 1) * f] for i in keep])


def encode(a, tempo, path):
    buf = io.BytesIO()
    sf.write(buf, a, SR, format="WAV")
    af = f"atempo={tempo:.3f}" if tempo > 1.001 else "anull"
    subprocess.run([FF, "-loglevel", "error", "-y", "-f", "wav", "-i", "-", "-af", af, "-codec:a", "libmp3lame", "-b:a", "96k", path],
                   input=buf.getvalue(), check=True)


def main():
    args = sys.argv[1:]
    target = float(args[args.index("--target") + 1]) if "--target" in args else 2.7
    cap = float(args[args.index("--max") + 1]) if "--max" in args else 1.3
    words_of = texts()
    os.makedirs(OUT, exist_ok=True)
    total_before = total_after = 0.0
    for raw in sorted(glob.glob(os.path.join(RAW, "*.mp3"))):
        lid = os.path.splitext(os.path.basename(raw))[0]
        text = words_of.get(lid)
        if not text:
            continue  # a line no longer in the book
        a = decode(raw)
        t = tighten(a)
        w = len(text.split())
        dur = len(t) / SR
        tempo = min(cap, max(1.0, dur / (w / target + 0.4)))
        encode(t, tempo, os.path.join(OUT, f"{lid}.mp3"))
        before, after = len(a) / SR, dur / tempo
        total_before += before
        total_after += after
        print(f"{lid}  {before:5.1f}s -> {after:5.1f}s  x{tempo:.2f}  {w / after:.1f} w/s  {text[:50]}")
    print(f"total {total_before:.0f}s -> {total_after:.0f}s")


if __name__ == "__main__":
    main()
