"""Check that the picture on screen fits every narrated line, across the whole book.

    tools/venv/Scripts/python tools/audit_pictures.py [scene-id ...]

Walks each scene the way the player shows it (a beat's still or clip stays on screen until another picture is
named; a clip that ends holds its last frame; choice aftermaths start on the scene's last picture), groups the
lines spoken over each picture, and asks a vision model (claude-haiku-5-5) to score each line 1-5 against what the
picture actually shows. Writes audit/picture-audit.json; prints every line scored 2 or below.
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
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()
TMP = tempfile.mkdtemp(prefix="picaudit-")

book = json.load(open(os.path.join(ROOT, "app", "src", "content", "books", "sandman", "book.json"), encoding="utf-8"))
only = set(sys.argv[1:])


def frames(pic):
    """JPEG bytes the player shows for this picture: a still, or a clip's middle and last frames."""
    kind, pid = pic
    if kind == "still":
        return [open(os.path.join(MEDIA, "stills", pid + ".jpg"), "rb").read()]
    out = []
    for tag, args in (("mid", ["-ss", "2.5"]), ("end", ["-sseof", "-0.2"])):
        dst = os.path.join(TMP, f"{pid}-{tag}.jpg")
        if not os.path.exists(dst):
            subprocess.run([FF, "-v", "error", "-y", *args, "-i", os.path.join(MEDIA, pid + ".mp4"), "-frames:v", "1", "-vf", "scale=768:-1", dst], check=False)
        if os.path.exists(dst):
            out.append(open(dst, "rb").read())
    return out


def runs():
    """(scene, picture, [lines]) in play order; a conditional line is listed with its condition."""
    for sid, sc in book["scenes"].items():
        if only and sid not in only:
            continue
        pic = None; groups = []

        def take(beats, start_pic, label):
            p = start_pic; cur = None
            for b in beats:
                if b.get("clip"): p = ("clip", b["clip"])
                elif b.get("still"): p = ("still", b["still"])
                text = b.get("text") or (("CARD: " + b["card"]) if b.get("card") else None)
                if not text or p is None:
                    continue
                cond = ("only if " + ",".join(b["if"])) if b.get("if") else ("unless " + ",".join(b["unless"])) if b.get("unless") else ""
                if cur is None or cur["pic"] != p:
                    cur = {"scene": sid, "where": label, "pic": p, "lines": []}; groups.append(cur)
                cur["lines"].append({"text": text, "cond": cond})
            return p
        pic = take(sc["beats"], None, "beats")
        for c in sc.get("choices", []):
            take(c.get("aftermath", []), pic, f"after {c['id']}")
        for g in groups:
            yield g


PROMPT = """You check an illustrated audio story. A picture is on screen while the narrator speaks the numbered lines below.
Scene: {title}. For EACH line, does the picture show what the line is describing at that moment?
5 = shows exactly that; 4 = clearly fits; 3 = acceptable (right place and mood, the line just adds detail);
2 = weak (the line describes a different moment, person, action or place than the picture); 1 = contradicts it
(wrong person, wrong place, wrong time, an action that is clearly not happening, someone who should not be there).
Judge only what is visible. Lines marked CARD are short time/place captions. If two frames are given they are the
middle and the last frame of a short video shown during the lines.
Lines:
{lines}
Reply with ONLY a JSON array, one object per line: [{{"i": 1, "score": 4, "issue": "short reason when 2 or below, else empty"}}]"""


def judge(g):
    imgs = frames(g["pic"])
    if not imgs:
        return g, [{"i": i + 1, "score": 0, "issue": "picture file missing"} for i in range(len(g["lines"]))]
    lines = "\n".join(f"{i + 1}. {l['text']}" + (f"  ({l['cond']})" if l["cond"] else "") for i, l in enumerate(g["lines"]))
    parts = [{"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + base64.b64encode(b).decode()}} for b in imgs]
    parts.append({"type": "text", "text": PROMPT.format(title=book["scenes"][g["scene"]]["title"], lines=lines)})
    body = {"model": "claude-haiku-5-5", "temperature": 0.1, "max_tokens": 1500, "messages": [{"role": "user", "content": parts}]}
    for attempt in range(3):
        try:
            req = urllib.request.Request(f"{ORIGIN}/v1/chat/completions", data=json.dumps(body).encode(),
                                         headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
            j = json.load(urllib.request.urlopen(req, timeout=120))
            text = j["choices"][0]["message"]["content"].strip()
            text = text[text.index("["):text.rindex("]") + 1]
            return g, json.loads(text)
        except Exception as e:
            err = str(e)
    return g, [{"i": i + 1, "score": 0, "issue": "judge failed: " + err[:80]} for i in range(len(g["lines"]))]


groups = list(runs())
print(f"{len(groups)} picture runs, {sum(len(g['lines']) for g in groups)} lines", flush=True)
report = []
with cf.ThreadPoolExecutor(8) as ex:
    for g, scores in ex.map(judge, groups):
        by = {s.get("i"): s for s in scores if isinstance(s, dict)}
        for i, l in enumerate(g["lines"]):
            s = by.get(i + 1, {"score": 0, "issue": "no score"})
            report.append({"scene": g["scene"], "where": g["where"], "picture": f"{g['pic'][0]}:{g['pic'][1]}", "line": l["text"], "cond": l["cond"],
                           "score": s.get("score", 0), "issue": s.get("issue", "")})
json.dump(report, open(os.path.join(ROOT, "audit", "picture-audit.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
bad = [r for r in report if r["score"] <= 2]
for r in bad:
    print(f"[{r['scene']} {r['where']}] {r['score']} {r['picture']} | {r['line'][:90]} | {r['issue']}")
print(f"{len(bad)} of {len(report)} lines scored 2 or below; saved audit/picture-audit.json")
