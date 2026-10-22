"""Make every talking/listening loop seamless: play forward, then backward (a ping-pong), so a camera push-in
drifts in and gently back instead of snapping to the start every five seconds.

    tools/venv/Scripts/python tools/pingpong_loops.py [name.mp4 ...]

Reads the untouched renders in assets/clips/sandman/react/ and writes app/public/clips/sandman/react/
(then `npm run upload` in app/). The first and last frames are not repeated at the turns, so there is no stutter.
"""
import os, sys, json, subprocess, imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "clips", "sandman", "react")
OUT = os.path.join(ROOT, "app", "public", "clips", "sandman", "react")
FF = imageio_ffmpeg.get_ffmpeg_exe()


def frames(path):
    r = subprocess.run([FF, "-i", path, "-map", "0:v:0", "-c", "copy", "-f", "null", "-"], capture_output=True, text=True)
    lines = [l for l in r.stderr.splitlines() if "frame=" in l]
    return int(lines[-1].split("frame=")[1].split()[0])


def pingpong(src, dst):
    n = frames(src)
    graph = (f"[0:v]split[a][b];[b]reverse,trim=start_frame=1:end_frame={n - 1},setpts=PTS-STARTPTS[r];"
             "[a][r]concat=n=2:v=1:a=0[v]")
    subprocess.run([FF, "-v", "error", "-y", "-i", src, "-filter_complex", graph, "-map", "[v]", "-an",
                    "-c:v", "libx264", "-crf", "21", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", dst],
                   check=True)


names = sys.argv[1:] or sorted(n for n in os.listdir(SRC) if n.endswith(".mp4"))
for n in names:
    pingpong(os.path.join(SRC, n), os.path.join(OUT, n))
    print("ping-pong", n, flush=True)
