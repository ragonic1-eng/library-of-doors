"""Propose a better picture for every narrated line the picture audit scored 2 or below.

    tools/venv/Scripts/python tools/match_pictures.py

Reads audit/picture-audit.json and audit/picture-captions.json; for each scene, a text model (claude-haiku-5-5)
picks the existing picture that best shows each weak line, keeps the current one when it is acceptable, or
describes a new picture to make. Writes audit/picture-plan.json for review; nothing in the book is changed.
"""
import os, sys, json, urllib.request, concurrent.futures as cf, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
for f in (os.path.join(ROOT, ".env"), os.path.join(ROOT, "app", ".env.local")):
    if os.path.exists(f):
        for line in open(f, encoding="utf-8"):
            if "=" in line and not line.startswith("#"):
                k, v = line.rstrip("\n").split("=", 1); os.environ.setdefault(k.strip(), v.strip())
ORIGIN = os.environ["INFISTAR_BASE_URL"].split("/v1")[0]; KEY = os.environ["INFISTAR_API_KEY"]
audit = json.load(open(os.path.join(ROOT, "audit", "picture-audit.json"), encoding="utf-8"))
caps = json.load(open(os.path.join(ROOT, "audit", "picture-captions.json"), encoding="utf-8"))
book = json.load(open(os.path.join(ROOT, "app", "src", "content", "books", "sandman", "book.json"), encoding="utf-8"))
catalog = "\n".join(f"- {k}: {v}" for k, v in sorted(caps.items()))

bad = [r for r in audit if r["score"] <= 2 and not r["line"].startswith("CARD")]
by = collections.defaultdict(list)
for r in bad: by[r["scene"]].append(r)

PROMPT = """You fix an illustrated audio story (The Sandman, with Aurie as Dream of the Endless) where the picture on screen does not match the narrated line.
Scene {sid} "{title}". What happens in this scene: {summary}

Weak lines (current picture, and why it is weak):
{lines}

All existing pictures (id: what is visible):
{catalog}

For EACH weak line choose one action:
- "use": an existing picture that clearly shows this line's moment (right people, place, time; for a recap of an earlier event, the picture from that event). Do not pick a picture whose content would contradict the line.
- "keep": the current picture is acceptable for a still (right people and place; only a small action or an abstract thought is missing).
- "new": nothing fits; describe ONE new still to make in "new_prompt" (concrete: who, where, doing what, light; at most 60 words; Aurie, if present, is a woman with long straight black hair in a long black high-collared gown with a faint shimmer of stars) and set "aurie" true if Aurie's face must be visible.
Reply with ONLY a JSON array: [{{"i": 1, "action": "use", "picture": "still:id or clip:id", "new_prompt": "", "aurie": false, "why": "few words"}}]"""


def plan(sid):
    rows = by[sid]; sc = book["scenes"][sid]
    summary = " ".join(b.get("text", "") for b in sc["beats"] if b.get("text") and not b.get("if"))[:900]
    lines = "\n".join(f"{i + 1}. \"{r['line']}\" ({r['where']}{', ' + r['cond'] if r['cond'] else ''}) | now: {r['picture']} | {r['issue']}" for i, r in enumerate(rows))
    body = {"model": "claude-haiku-5-5", "temperature": 0.1, "max_tokens": 3000,
            "messages": [{"role": "user", "content": PROMPT.format(sid=sid, title=sc["title"], summary=summary, lines=lines, catalog=catalog)}]}
    for _ in range(3):
        try:
            req = urllib.request.Request(f"{ORIGIN}/v1/chat/completions", data=json.dumps(body).encode(), headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
            text = json.load(urllib.request.urlopen(req, timeout=180))["choices"][0]["message"]["content"]
            out = json.loads(text[text.index("["):text.rindex("]") + 1])
            return [{**rows[o["i"] - 1], **{k: o.get(k) for k in ("action", "picture", "new_prompt", "aurie", "why")}} for o in out if 1 <= o.get("i", 0) <= len(rows)]
        except Exception as e:
            err = e
    return [{**r, "action": "error", "why": str(err)[:80]} for r in rows]


result = []
with cf.ThreadPoolExecutor(6) as ex:
    for rows in ex.map(plan, list(by)):
        result += rows
json.dump(result, open(os.path.join(ROOT, "audit", "picture-plan.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
c = collections.Counter(r["action"] for r in result)
print(dict(c), "-> audit/picture-plan.json")
