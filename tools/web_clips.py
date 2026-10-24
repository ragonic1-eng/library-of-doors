"""Make the published clips light enough for a weak phone connection, and give each one a poster.

    python -I tools/web_clips.py [clip.mp4 ...]      (no arguments: every clip under app/public/clips/<book>/)

Video models and the face-restoring pass write near-full-HD files at very high bitrates (up to 68 MB for 10 s),
which cannot arrive in time on a slow connection, so the player showed black. Each clip is re-encoded once to
1280x720 H.264 (CRF 24, no audio: the player always mutes clips) with the index at the front (+faststart) so it
can start playing before it has fully downloaded. The full-size original is kept in assets/clips/_hires/ and a
clip that is already light is left alone. Every clip also gets a poster: its first frame as a small JPEG in
posters/, shown at once while the video loads.
"""
import os, sys, glob, shutil, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIN = os.path.join(ROOT, "tools", "facefusion", "bin")
FFMPEG, FFPROBE = os.path.join(BIN, "ffmpeg.exe"), os.path.join(BIN, "ffprobe.exe")
PUBLIC = os.path.join(ROOT, "app", "public", "clips")
HIRES = os.path.join(ROOT, "assets", "clips", "_hires")
LIGHT_BPS = 3_000_000  # at or under this a 720p clip is already web-ready


def probe(path):
    out = subprocess.run([FFPROBE, "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=height,bit_rate", "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip()
    h, br = (out.split(",") + ["0"])[:2]
    return int(h or 0), int(br) if br.isdigit() else 0


def poster(path):
    rel = os.path.relpath(path, PUBLIC)  # sandman/1.3b.mp4 or sandman/react/x.mp4
    book, rest = rel.split(os.sep, 1)
    out = os.path.join(PUBLIC, book, "posters", os.path.splitext(rest)[0] + ".jpg")
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(path):
        return out  # still the clip's current first frame
    os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", path, "-frames:v", "1", "-vf", "scale=960:-2", "-q:v", "5", out], check=True)
    return out


def web(path):
    rel = os.path.relpath(path, PUBLIC)
    keep = os.path.join(HIRES, rel)
    h, br = probe(path)
    if h <= 720 and ((br and br <= LIGHT_BPS) or (os.path.exists(keep) and os.path.getmtime(path) >= os.path.getmtime(keep))):
        return "already light"  # light from the start, or made from its kept original already
    os.makedirs(os.path.dirname(keep), exist_ok=True)
    if not os.path.exists(keep):
        shutil.copyfile(path, keep)
    tmp = path + ".web.mp4"
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", keep, "-an", "-vf", "scale=-2:720", "-c:v", "libx264", "-preset", "slow", "-crf", "24",
                    "-pix_fmt", "yuv420p", "-movflags", "+faststart", tmp], check=True)
    before, after = os.path.getsize(keep), os.path.getsize(tmp)
    os.replace(tmp, path)
    return f"{before / 1e6:.1f} MB -> {after / 1e6:.1f} MB"


if __name__ == "__main__":
    clips = sys.argv[1:] or [p for p in glob.glob(os.path.join(PUBLIC, "*", "**", "*.mp4"), recursive=True) if not p.endswith(".web.mp4")]
    for c in clips:
        try:
            note = web(c)
            poster(c)
            if note != "already light":
                print(f"{os.path.relpath(c, PUBLIC)}: {note}", flush=True)
        except subprocess.CalledProcessError as e:
            print(f"{os.path.relpath(c, PUBLIC)}: FAILED {e}", flush=True)
