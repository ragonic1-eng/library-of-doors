"""Publish Neverwhere stills for the player: each approved keyframe (or a picture reused from the Sandman) becomes
app/public/clips/neverwhere/stills/<id>.jpg at the Sandman's size (1376 x 768, JPEG quality 88). Then `npm run upload`.

    python -I tools/publish_stills.py [shot-id ...]      (default: every still that is ready and not yet published)
"""
import json, os, sys

import cv2
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, "app", "src", "content", "books", "neverwhere", "shots.json")
OUT = os.path.join(ROOT, "app", "public", "clips", "neverwhere", "stills")
os.makedirs(OUT, exist_ok=True)


def source(sid, sh):
    if sh.get("reuse"):
        path, _, at = sh["reuse"].partition("#")
        path = os.path.join(ROOT, path)
        if not path.endswith(".mp4"):
            return Image.open(path)
        cap = cv2.VideoCapture(path)  # a frame of a finished Sandman clip, `#0.4` = 40% of the way in
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(cap.get(cv2.CAP_PROP_FRAME_COUNT) * float(at or 0.5)))
        ok, frame = cap.read()
        cap.release()
        return Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)) if ok else None
    kf = os.path.join(ROOT, "assets", "keyframes", "neverwhere", sid, "keyframe.png")
    return Image.open(kf) if os.path.exists(kf) else None


shots = json.load(open(SHOTS, encoding="utf-8"))["shots"]
want = sys.argv[1:]
for sid, sh in shots.items():
    if sh.get("kind") != "still" or (want and sid not in want):
        continue
    dst = os.path.join(OUT, f"{sid}.jpg")
    if os.path.exists(dst) and not want:
        continue
    im = source(sid, sh)
    if im is None:
        continue
    im = im.convert("RGB")
    im = im.resize((1376, round(1376 * im.height / im.width)), Image.LANCZOS)
    im.save(dst, quality=88)
    print("published", os.path.relpath(dst, ROOT))
