"""Face likeness scorer for The Library of Doors.

Uses OpenCV's YuNet (face detection) and SFace (face recognition), running locally.
Compares every face found in a candidate image or video against the real photos of a person
and reports the best cosine similarity. Higher is more alike.

    python -I tools/face_score.py <identity> <file-or-folder> [more ...]
    identity: aurie | alex

Guide (OpenCV's published SFace threshold): cosine >= 0.363 means "same person".
For this project we use stricter bands: >= 0.50 strong likeness, 0.40 to 0.50 acceptable, below 0.40 reject.
Videos are sampled at 6 points; the worst frame is reported too, which catches drift during motion.
"""
import os
import sys
import glob
import json
import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, "tools", "models")
DET = os.path.join(MODELS, "face_detection_yunet_2023mar.onnx")
REC = os.path.join(MODELS, "face_recognition_sface_2021dec.onnx")

REFS = {
    # Charmaine's four most mutually consistent photos (pairwise 0.62 to 0.77); photo-7 is excluded (glare breaks alignment).
    "aurie": ["characters/dream/photo.jpg", "characters/dream/photo-4.jpg", "characters/dream/photo-5.jpg", "characters/dream/photo-6.jpg"],
    "alex": ["characters/alex/photo.jpg", "characters/alex/photo-2.jpg"],
}
# Score = MEAN similarity over all reference photos (stricter than the best single match).
STRONG, OK = 0.50, 0.40

detector = cv2.FaceDetectorYN.create(DET, "", (320, 320), 0.6, 0.3, 5000)
recognizer = cv2.FaceRecognizerSF.create(REC, "")


def faces(img):
    """All detected faces as (feature, face_width_px, box)."""
    h, w = img.shape[:2]
    scale = 1.0
    if max(h, w) > 1600:  # YuNet is happiest under ~1600 px
        scale = 1600 / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))
    detector.setInputSize((img.shape[1], img.shape[0]))
    _, found = detector.detect(img)
    out = []
    if found is None:
        return out
    for f in found:
        aligned = recognizer.alignCrop(img, f)
        feat = recognizer.feature(aligned)
        out.append((feat, int(f[2] / scale), [int(v / scale) for v in f[:4]]))
    return out


def ref_features(identity):
    feats = []
    for rel in REFS[identity]:
        img = cv2.imread(os.path.join(ROOT, rel))
        fs = sorted(faces(img), key=lambda x: -x[1])
        if fs:
            feats.append(fs[0][0])  # the largest face in a reference photo
    if not feats:
        sys.exit(f"no face found in the reference photos for {identity}")
    return feats


def best_match(img, refs):
    """Best similarity of any face in img to the person; also its width."""
    best, width = -1.0, 0
    for feat, w, _ in faces(img):
        s = float(np.mean([recognizer.match(r, feat, cv2.FaceRecognizerSF_FR_COSINE) for r in refs]))
        if s > best:
            best, width = s, w
    return best, width


def score_file(path, refs):
    if path.lower().endswith((".mp4", ".mov", ".webm")):
        cap = cv2.VideoCapture(path)
        n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        scores = []
        for t in (0.02, 0.2, 0.4, 0.6, 0.8, 0.98):
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(n * t))
            ok, frame = cap.read()
            if ok:
                scores.append(best_match(frame, refs))
        seen = [s for s in scores if s[0] > -1]
        if not seen:
            return {"file": path, "score": None, "note": "no face found"}
        return {"file": path, "score": round(float(np.mean([s[0] for s in seen])), 3),
                "worst": round(float(min(s[0] for s in seen)), 3), "face_px": max(s[1] for s in seen),
                "frames_with_face": f"{len(seen)}/{len(scores)}"}
    img = cv2.imread(path)
    if img is None:
        return {"file": path, "score": None, "note": "unreadable"}
    s, w = best_match(img, refs)
    return {"file": path, "score": None if s < 0 else round(float(s), 3), "face_px": w, **({} if s >= 0 else {"note": "no face found"})}


def verdict(r):
    s = r.get("worst", r.get("score"))
    if s is None:
        return "NO FACE"
    return "STRONG" if s >= STRONG else "OK" if s >= OK else "REJECT"


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] not in REFS:
        sys.exit(__doc__)
    refs = ref_features(sys.argv[1])
    paths = []
    for a in sys.argv[2:]:
        paths += sorted(glob.glob(os.path.join(a, "*.*"))) if os.path.isdir(a) else [a]
    results = [score_file(p, refs) for p in paths]
    as_json = "--json" in sys.argv
    for r in results:
        if as_json:
            continue
        rel = os.path.relpath(r["file"], ROOT)
        extra = f" worst {r['worst']:.3f}" if "worst" in r else ""
        sc = "  n/a" if r["score"] is None else f"{r['score']:.3f}"
        print(f"{verdict(r):7} {sc}{extra}  face {r.get('face_px', 0):>4}px  {rel}")
    if as_json:
        print(json.dumps(results, indent=1))
