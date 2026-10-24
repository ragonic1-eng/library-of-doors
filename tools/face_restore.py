"""Face-restoring pass: put the real face back onto every frame of a clip with FaceFusion (local, free).

    tools/venv/Scripts/python tools/face_restore.py aurie|alex <clip.mp4> [more clips] [--apply]

Video models drift a face even from a perfect first frame (LIKENESS.md). For each clip this finds, in the first
frame, the face that belongs to the person (so in a shot with Burgess or Paul only Aurie or Alex is touched),
runs FaceFusion's face swapper with the person's real photos as the source, and scores the clip before and after
with tools/face_score.py. The restored clip is written to assets/clips/<book>/_ff/; with --apply it also replaces
the published clip in app/public, but only when the person's likeness improved. FaceFusion lives in
tools/facefusion with its own environment tools/venv-ff (OpenRAIL-AS licence: used only for the owner's and his
wife's own faces, with consent).
"""
import os, sys, json, shutil, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF_DIR = os.path.join(ROOT, "tools", "facefusion")
FF_PY = os.path.join(ROOT, "tools", "venv-ff", "Scripts", "python.exe")
# Each book keeps its own restored clips; the book is read from the clip's path (assets/clips/<book>/...).
OUT_OF = lambda book: os.path.join(ROOT, "assets", "clips", book, "_ff")
PUBLIC_OF = lambda book: os.path.join(ROOT, "app", "public", "clips", book)
book_of = lambda clip: "neverwhere" if os.sep + "neverwhere" + os.sep in os.path.abspath(clip) else "sandman"
SOURCES = {
    "aurie": ["characters/dream/photo-4.jpg", "characters/dream/photo-6.jpg", "characters/dream/photo-9.jpg", "characters/dream/photo-11.jpg", "characters/dream/photo-12.jpg", "characters/dream/photo-13.jpg", "characters/dream/photo-14.jpg", "characters/dream/photo-16.jpg", "characters/dream/photo-18.jpg"],
    "alex": ["characters/alex/photo.jpg", "characters/alex/photo-2.jpg", "characters/alex/face.jpg", "characters/alex/photo-7.jpg", "characters/alex/photo-8.jpg", "characters/alex/photo-9.jpg"],
}
sys.path.insert(0, os.path.join(ROOT, "tools"))
import face_score as fs  # noqa: E402  (same detector and recogniser as the likeness checks)


def score(who, path):
    r = fs.score_file(path, fs.ref_features(who))
    return r.get("score"), r.get("worst", r.get("score"))


def person_position(who, clip):
    """Rank (largest first) of the person's face in the first frame, or None when no face is theirs."""
    import cv2
    cap = cv2.VideoCapture(clip); ok, frame = cap.read(); cap.release()
    if not ok:
        return None
    found = sorted(fs.faces(frame), key=lambda f: -f[1])  # largest first, as FaceFusion's large-small order
    refs = fs.ref_features(who)
    best, best_sim = None, 0.20  # below this, none of the faces is the person
    for rank, (feat, _, _) in enumerate(found):
        sim = float(sum(fs.recognizer.match(r, feat, fs.cv2.FaceRecognizerSF_FR_COSINE) for r in refs) / len(refs))
        if sim > best_sim:
            best, best_sim = rank, sim
    return best


def restore(who, clip, apply):
    name = os.path.basename(clip)
    pos = person_position(who, clip)
    if pos is None:
        print(f"{name}: no {who} face found in the first frame, skipped"); return
    book = book_of(clip)
    os.makedirs(OUT_OF(book), exist_ok=True)
    out = os.path.join(OUT_OF(book), name)
    env = {**os.environ, "PATH": os.path.join(FF_DIR, "bin") + os.pathsep + os.environ["PATH"]}
    cmd = [FF_PY, "facefusion.py", "headless-run", "--processors", "face_swapper",
           "--source-paths", *[os.path.join(ROOT, s) for s in SOURCES[who]],
           "--target-path", os.path.abspath(clip), "--output-path", out,
           "--face-selector-mode", "reference", "--reference-frame-number", "0", "--reference-face-position", str(pos),
           "--face-selector-order", "large-small", "--execution-thread-count", "8", "--output-video-quality", "90"]
    r = subprocess.run(cmd, cwd=FF_DIR, env=env, capture_output=True, text=True, timeout=1800)
    if not os.path.exists(out):
        print(f"{name}: FaceFusion failed: {(r.stdout + r.stderr)[-200:]}"); return
    (b_avg, b_worst), (a_avg, a_worst) = score(who, clip), score(who, out)
    # A worst frame under 0.1 is a frame with no readable face (a tiny or turned figure): it cannot veto a clear gain.
    better = (a_avg or 0) > (b_avg or 0) + 0.03 and ((a_worst or 0) >= (b_worst or 0) - 0.02 or (b_worst or 0) < 0.1)
    verdict = "improved" if better else "not better, original kept"
    print(f"{name}: {who} face #{pos + 1}; likeness {b_avg:.2f} (worst {b_worst:.2f}) -> {a_avg:.2f} (worst {a_worst:.2f}): {verdict}", flush=True)
    if better and apply:
        pub = os.path.join(PUBLIC_OF(book), *(["react"] if os.sep + "react" + os.sep in os.path.abspath(clip) else []), name)
        if os.path.exists(pub):
            shutil.copyfile(out, pub); print(f"   published {os.path.relpath(pub, ROOT)}")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 2 or args[0] not in SOURCES:
        sys.exit(__doc__)
    for c in args[1:]:
        restore(args[0], c, "--apply" in sys.argv)
