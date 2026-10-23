"""One-sentence description of every still and clip the book uses, for matching narration to pictures.

    tools/venv/Scripts/python tools/caption_pictures.py [--force]

Writes audit/picture-captions.json ({"still:id" | "clip:id": "what is visible"}); clips are described from their
middle and last frames. Existing captions are kept unless --force. Uses claude-haiku-5-5 (vision) via the gateway.
"""
import os, sys, json, base64, subprocess, tempfile, urllib.request, concurrent.futures as cf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
for f in (os.path.join(ROOT, ".env"), os.path.join(ROOT, "app", ".env.local")):
    if os.path.exists(f):
        for line in open(f, encoding="utf-8"):
            if "=" in line and not line.startswith("#"):
                k, v = line.rstrip("\n").split("=", 1); os.environ.setdefault(k.strip(), v.strip())
ORIGIN = os.environ["INFISTAR_BASE_URL"].split("/v1")[0]; KEY = os.environ["INFISTAR_API_KEY"]
MEDIA = os.path.join(ROOT, "app", "public", "clips", "sandman")
OUT = os.path.join(ROOT, "audit", "picture-captions.json")
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe(); TMP = tempfile.mkdtemp(prefix="caption-")
book = json.load(open(os.path.join(ROOT, "app", "src", "content", "books", "sandman", "book.json"), encoding="utf-8"))

pics = set()
for sc in book["scenes"].values():
    for b in sc["beats"] + [a for c in sc.get("choices", []) for a in c.get("aftermath", [])]:
        if b.get("clip"): pics.add(("clip", b["clip"]))
        if b.get("still"): pics.add(("still", b["still"]))
# every published still is a candidate too, even if no beat uses it yet
for f in os.listdir(os.path.join(MEDIA, "stills")):
    if f.endswith(".jpg"): pics.add(("still", f[:-4]))

caps = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) and "--force" not in sys.argv else {}


def frames(kind, pid):
    if kind == "still":
        p = os.path.join(MEDIA, "stills", pid + ".jpg"); return [open(p, "rb").read()] if os.path.exists(p) else []
    out = []
    for tag, args in (("mid", ["-ss", "2.5"]), ("end", ["-sseof", "-0.2"])):
        dst = os.path.join(TMP, f"{pid}-{tag}.jpg")
        subprocess.run([FF, "-v", "error", "-y", *args, "-i", os.path.join(MEDIA, pid + ".mp4"), "-frames:v", "1", "-vf", "scale=768:-1", dst], check=False)
        if os.path.exists(dst): out.append(open(dst, "rb").read())
    return out


def caption(pic):
    imgs = frames(*pic)
    if not imgs: return pic, None
    parts = [{"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + base64.b64encode(b).decode()}} for b in imgs]
    parts.append({"type": "text", "text": "Describe exactly what is visible in one plain sentence of at most 35 words: who (appearance), where, doing what, light and mood. If two frames are given they are the middle and end of a short clip: describe what happens. No interpretation, no names."})
    body = {"model": "claude-haiku-5-5", "temperature": 0.1, "max_tokens": 200, "messages": [{"role": "user", "content": parts}]}
    for _ in range(3):
        try:
            req = urllib.request.Request(f"{ORIGIN}/v1/chat/completions", data=json.dumps(body).encode(), headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
            return pic, json.load(urllib.request.urlopen(req, timeout=120))["choices"][0]["message"]["content"].strip()
        except Exception:
            pass
    return pic, None


todo = [p for p in sorted(pics) if f"{p[0]}:{p[1]}" not in caps]
print(f"{len(pics)} pictures, {len(todo)} to describe", flush=True)
with cf.ThreadPoolExecutor(8) as ex:
    for pic, text in ex.map(caption, todo):
        if text: caps[f"{pic[0]}:{pic[1]}"] = text
json.dump(caps, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2, sort_keys=True)
print(f"saved {len(caps)} captions to audit/picture-captions.json")
