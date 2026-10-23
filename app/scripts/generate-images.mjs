#!/usr/bin/env node
// Episode 1 image generator for The Library of Doors.
//
// Reads every prompt from ../character-prompts.md (the single source of truth),
// assembles it with the frozen Style Bible, attaches reference images where needed,
// and saves numbered candidates for review. Nothing is ever overwritten.
//
// Usage (from the app folder):
//   npm run gen -- list                 show every job and whether it is ready
//   npm run gen -- sheets [--dry]       character reference sheets
//   npm run gen -- portraits [--dry]    hero portraits (need approved sheets)
//   npm run gen -- plates [--dry]       location plates
//   npm run gen -- expressions [--dry]  six-emotion sheets (need approved sheets)
//   npm run gen -- poses [--dry]        six-action sheets (need approved sheets)
//   npm run gen -- one <job-id> [--dry] a single job, e.g. one aurie-sheet
//   add  --n 2        candidates per job (default 2)
//   add  --via openai to use /v1/images instead of Gemini generateContent
//
// Approving: copy the candidate you like to the job's "approved" path (printed by `list`),
// or just tell Claude which file you picked.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { slowFetch } from "./slow-fetch.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", ".."); // project root (EBOOK)
const PROMPTS = join(ROOT, "character-prompts.md");

// ---------- env ----------
for (const f of [join(ROOT, ".env"), join(ROOT, "app", ".env.local")]) {
  if (existsSync(f)) {
    try { process.loadEnvFile(f); } catch { /* ignore malformed lines */ }
  }
}
const BASE = (process.env.INFISTAR_BASE_URL ?? "https://infistar.ai/v1").replace(/\/$/, "");
const ORIGIN = new URL(BASE).origin;
const KEY = process.env.INFISTAR_API_KEY ?? "";
const GEMINI_MODEL = process.env.MODEL_IMAGE_GEMINI ?? "gemini-3-pro-image";
// Ranked backups, tried in order when a model's gateway channel is down (same request format).
const GEMINI_MODELS = [...new Set([GEMINI_MODEL, ...(process.env.MODEL_IMAGE_FALLBACK ?? "gemini-3.1-flash-image,gemini-nano-banana-2.1,gemini-3-pro-image").split(",").map((m) => m.trim()).filter(Boolean)])];
/** The gateway has no working channel for this model right now: retrying it is pointless, try the next one. */
const channelDown = (status, body) => status === 404 || /no available channel|model_not_found|不在当前供应目录/i.test(body);
const OPENAI_MODEL = process.env.MODEL_IMAGE ?? "gemini-nano-banana-2.1";

// ---------- args ----------
const argv = process.argv.slice(2);
const cmd = argv[0] ?? "list";
const dry = argv.includes("--dry");
const via = argv.includes("--via") ? argv[argv.indexOf("--via") + 1] : "gemini";
const perJob = argv.includes("--n") ? Math.max(1, parseInt(argv[argv.indexOf("--n") + 1], 10) || 2) : 2;
// --ref <path> (repeatable): extra reference images appended to the job's own, e.g. a candidate that already looks right.
const extraRefs = argv.flatMap((a, i) => (a === "--ref" && argv[i + 1] ? [resolve(process.cwd(), argv[i + 1])] : []));
// --note "<text>": an extra instruction appended to the prompt for this run only.
const runNote = argv.includes("--note") ? argv[argv.indexOf("--note") + 1] : "";
// Likeness gate (tools/face_score.py, OpenCV SFace, runs locally and free):
// --min 0.5 keeps generating (up to --tries) until a candidate of a real person scores at least that.
const minScore = argv.includes("--min") ? Number(argv[argv.indexOf("--min") + 1]) : null;
const maxTries = argv.includes("--tries") ? Math.max(1, parseInt(argv[argv.indexOf("--tries") + 1], 10) || 4) : 4;

// ---------- prompt extraction ----------
const md = readFileSync(PROMPTS, "utf8").split(/\r?\n/);

/** First fenced code block after the first line matching `label`, searched from the first line matching `section`. */
function block(section, label) {
  const s = md.findIndex((l) => l.startsWith(section));
  if (s < 0) throw new Error(`section not found: ${section}`);
  let i = label ? md.findIndex((l, k) => k > s && l.startsWith(label)) : s;
  if (i < 0) throw new Error(`label not found under ${section}: ${label}`);
  while (i < md.length && !md[i].startsWith("```")) i++;
  const start = ++i;
  while (i < md.length && !md[i].startsWith("```")) i++;
  return md.slice(start, i).join("\n").trim();
}

const STYLE_FULL = block("## 1. The Style Bible");
// Images do not need the video-only motion block.
const STYLE = STYLE_FULL.replace(/=== MOTION[^\n]*\n[\s\S]*?(?=\n=== )/, "").replace(/\n{3,}/g, "\n\n").trim();
const FRAME = block("## 3. Characters");

function assemble(raw, extra = "") {
  return (raw.replace("[Reference sheet frame]", FRAME).replace("[Style Bible]", STYLE) + (extra ? `\n${extra}` : "")).trim();
}

// ---------- jobs ----------
const C = (id) => join(ROOT, "characters", id);
const P = (id) => join(ROOT, "assets", "plates", id);

/** @type {{id:string, group:string, dir:string, approved:string, prompt:()=>string, refs:string[]}[]} */
const jobs = [];
function character(id, section, sheetLabel, portraitLabel, sheetRefs = []) {
  jobs.push({ id: `${id}-sheet`, group: "sheets", dir: join(C(id), "candidates"), approved: join(C(id), "sheet.png"), prompt: () => assemble(block(section, sheetLabel)), refs: sheetRefs });
  jobs.push({ id: `${id}-portrait`, group: "portraits", dir: join(C(id), "candidates"), approved: join(C(id), "portrait.png"), prompt: () => assemble(block(section, portraitLabel)), refs: [join(C(id), "sheet.png")] });
}

// Charmaine's four most consistent face crops (see tools/face_score.py); they lead every Aurie image.
const AURIE_FACES = ["face-4.jpg", "face-6.jpg", "face-5.jpg", "face.jpg"].map((f) => join(C("dream"), f));
character("aurie", "### 3.1", "**Reference sheet, Aurie", "**Hero portrait, your wife as Dream", AURIE_FACES);
{ const p = jobs.find((j) => j.id === "aurie-portrait"); p.refs = [...AURIE_FACES, ...p.refs]; }
character("burgess", "### 3.2", "**Reference sheet:**", "**Hero portrait");
character("alex-young", "### 3.3", "**Reference sheet", "**Hero portrait", [join(C("alex"), "photo.jpg"), join(C("alex"), "photo-2.jpg")]);
character("alex-old", "### 3.4", "**Reference sheet", "**Hero portrait", [join(C("alex"), "photo.jpg"), join(C("alex"), "photo-2.jpg")]);
character("paul", "### 3.5", "**Reference sheet:**", "**Hero portrait");
character("lucienne", "### 3.6", "**Reference sheet:**", "**Hero portrait");
character("guard", "### 3.7", "**Reference sheet:**", "**Hero portrait");
// Episode 2 cast: reference sheets only (they appear in keyframes and stills, never in a portrait gallery).
for (const [id, section] of [["fates", "### 3.8"], ["johanna", "### 3.9"], ["rachel", "### 3.10"], ["lucifer", "### 3.11"], ["choronzon", "### 3.12"], ["dee", "### 3.13"], ["death", "### 3.14"], ["destiny", "### 3.15"], ["desire", "### 3.16"], ["despair", "### 3.17"], ["delirium", "### 3.18"], ["norse", "### 3.19"], ["azazel", "### 3.20"], ["faerie", "### 3.21"], ["angels", "### 3.22"], ["calliope", "### 3.23"], ["madoc", "### 3.24"], ["corinthian", "### 3.25"], ["rose", "### 3.26"], ["hob", "### 3.27"], ["unity", "### 3.28"], ["lyta", "### 3.29"], ["hector", "### 3.30"], ["destruction", "### 3.31"], ["barnabas", "### 3.32"], ["matthew", "### 3.33"], ["orpheus", "### 3.34"], ["thessaly", "### 3.35"], ["daniel", "### 3.36"], ["daniel-dream", "### 3.37"], ["kindly", "### 3.38"], ["alex-child", "### 3.39"]]) {
  const refs = id === "unity" ? [join(ROOT, "assets", "keyframes", "sandman", "1.3d", "keyframe.png")]
    : id === "kindly" ? [join(C("fates"), "sheet.png")]
    : id === "daniel" ? [join(C("lyta"), "sheet.png"), join(C("hector"), "sheet.png")]
    : id === "daniel-dream" ? [join(C("daniel"), "sheet.png")] : [];
  jobs.push({ id: `${id}-sheet`, group: "sheets", dir: join(C(id), "candidates"), approved: join(C(id), "sheet.png"), prompt: () => assemble(block(section, "**Reference sheet")), refs });
}

// Angle sheets (character-prompts.md §3c): every side of the face and body, so stills and video never have to invent one.
const TURN_FRAME = block("## 3c.", "Turnaround frame");
const HEAD_FRAME = block("## 3c.", "Head-angle frame");
const ANGLE_LOCK = {
  aurie: "Her face is an exact likeness of the real woman in the first four photographs: a full, round, soft face, wider than it is long, full cheeks and a soft rounded jaw; straight thick dark brows set fairly low; almond eyes with subtle single eyelids; a broad nose with a soft rounded tip; a small mouth with a fuller lower lip. Do not slim, narrow or beautify her. Styling (pale skin, black hair, black gown) as in the reference sheet.",
  "alex-young": "His face is an exact likeness of the real man in the first two photographs: a very broad, round, full face, heavy cheeks and a wide soft jaw; narrow single-lidded eyes behind rectangular matte-black glasses; a broad nose with a rounded tip; full lips; prominent ears. Do not slim or reshape him. Costume as in the reference sheet.",
  "alex-old": "His face is the real man in the first two photographs, aged to his early seventies exactly as in the reference sheet: the same very broad, round, full face, heavy cheeks and wide soft jaw, narrow single-lidded eyes, broad nose, full lips and prominent ears, with age added only as wrinkles, grey hair and softer skin. Do not slim or reshape him. Costume as in the reference sheet.",
};
const ANGLE_FACES = { aurie: AURIE_FACES, "alex-young": [join(C("alex"), "photo.jpg"), join(C("alex"), "photo-2.jpg")], "alex-old": [join(C("alex"), "photo.jpg"), join(C("alex"), "photo-2.jpg")] };
// Group sheets (fates, norse, faerie, angels) hold several people and need splitting first; Azazel has no head to turn.
const TURNAROUND_ONLY = ["azazel"];
for (const id of ["aurie", "alex-young", "alex-old", "burgess", "paul", "guard", "lucienne", "death", "johanna", "rachel", "lucifer", "choronzon", "dee", "destiny", "desire", "despair", "delirium", "azazel", "calliope", "madoc", "corinthian", "rose", "hob", "unity", "lyta", "destruction", "orpheus", "thessaly"]) {
  for (const [kind, frame] of [["turnaround", TURN_FRAME], ["heads", HEAD_FRAME]].filter(([k]) => k === "turnaround" || !TURNAROUND_ONLY.includes(id))) {
    jobs.push({
      id: `${id}-${kind}`, group: "angles", dir: join(C(id), "candidates"), approved: join(C(id), `${kind}.png`),
      prompt: () => `${frame}
${ANGLE_LOCK[id] ?? ""}
${STYLE}`.trim(),
      refs: [...(ANGLE_FACES[id] ?? []), join(C(id), "sheet.png")],
    });
  }
}
/** A character sheet among the refs pulls in that character's angle sheets, when they exist. */
function withAngles(refs) {
  const out = [];
  for (const r of refs) {
    out.push(r);
    const m = r.replace(/\\/g, "/").match(/characters\/([^/]+)\/sheet\.png$/);
    if (m) for (const k of ["heads", "turnaround"]) { const f = join(C(m[1]), `${k}.png`); if (existsSync(f)) out.push(f); }
  }
  return [...new Set(out)].slice(0, 14);
}

// Movement library (character-prompts.md §3b): expression and pose sheets, built from the approved reference sheet.
const EXPR_FRAME = block("## 3b.", "Expression frame");
const POSE_FRAME = block("## 3b.", "Pose frame");
for (const id of ["aurie", "burgess", "alex-young", "alex-old", "lucienne", "paul"]) {
  for (const [kind, frame] of [["expressions", EXPR_FRAME], ["poses", POSE_FRAME]]) {
    jobs.push({
      id: `${id}-${kind}`,
      group: kind,
      dir: join(C(id), "candidates"),
      approved: join(C(id), `${kind}.png`),
      prompt: () => `${frame}\n${block("## 3b.", `**${id} ${kind}**`)}\n${STYLE}`,
      refs: [join(C(id), "sheet.png")],
    });
  }
}

// Keyframes (production/ep1-shots.json): the exact first frame of each clip, composed from approved images.
const SHOTS_FILE = join(ROOT, "production", "ep1-shots.json");
if (existsSync(SHOTS_FILE)) {
  const shots = JSON.parse(readFileSync(SHOTS_FILE, "utf8"));
  const K = (id) => join(ROOT, "assets", "keyframes", "sandman", id);
  const single = "One single cinematic photograph in 16:9, never a collage, grid or split screen, no text.";
  // Identity locks (likeness of real people): their photo refs go FIRST and their lock text leads the prompt.
  const ids = shots.identities ?? {};
  const lockRefs = (names) => [...new Set(names.flatMap((n) => ids[n]?.refs ?? []))];
  const lockText = (names) => names.map((n) => ids[n]?.lock).filter(Boolean).join("\n");
  const withLock = (names, refs) => withAngles([...new Set([...lockRefs(names), ...refs])].map((r) => join(ROOT, r)));
  // Say what each reference image is, so the model never mixes two people up.
  const describe = (p) => {
    const f = p.replace(/\\/g, "/");
    const who = { dream: "Aurie", aurie: "Aurie", hob: "Hob Gadling", rose: "Rose Walker", madoc: "Richard Madoc", unity: "Unity Kincaid", lyta: "Lyta Hall", hector: "Hector Hall", destruction: "Destruction", orpheus: "Orphea", thessaly: "Thessaly", daniel: "Daniel as a child", "daniel-dream": "Daniel as the new Dream", kindly: "the Kindly Ones", barnabas: "Barnabas the dog", matthew: "Matthew the raven", corinthian: "the Corinthian", calliope: "Calliope", "alex-young": "Alex", "alex-child": "Alex as a boy", "alex-old": "Alex (aged)", alex: "Alex", burgess: "Roderick Burgess (a different man)", paul: "Paul McGuire (a different man)", lucienne: "Lucienne", guard: "the sleeping guard" };
    const m = f.match(/characters\/([^/]+)\/([^/.]+)/);
    if (m) {
      const name = who[m[1]] ?? m[1];
      const kind = { face: "close-up photograph of the real face of", photo: "real photograph of", "photo-2": "second real photograph of", sheet: "costume and styling sheet for", portrait: "approved still of", poses: "pose reference for", expressions: "expression reference for", heads: "head angles (same face from six camera angles) of", turnaround: "turnaround (front, side and back) of" }[m[2]] ?? "reference for";
      return `${kind} ${name}`;
    }
    const plate = f.match(/plates\/([^/]+)/);
    if (plate) return `the location (${plate[1]}), no faces to copy from it`;
    return "scene reference";
  };
  const refGuide = (paths) => `Reference images, in order: ${paths.map((p, i) => `(${i + 1}) ${describe(p)}`).join("; ")}.`;
  for (const s of shots.shots) {
    if (!s.keyframe?.prompt) continue; // shots that `use` an approved image need no keyframe
    const names = s.identity ?? [];
    const refs = withLock(names, s.keyframe.refs);
    jobs.push({
      id: `kf-${s.id}`, group: "keyframes", dir: join(K(s.id), "candidates"), approved: join(K(s.id), "keyframe.png"),
      prompt: () => `${refGuide(refs)}\n${lockText(names)}\n${s.keyframe.prompt}\nAll people must match their reference images exactly: same faces, hair, spectacles, costumes and builds. Never give one person another person's face.\n${single}\n${STYLE}`.trim(),
      refs,
    });
  }
  for (const [who, c] of Object.entries(shots.react.characters)) {
    // Once a base frame exists (assets/keyframes/sandman/react-<who>-base.png), every mood is an EDIT of it,
    // so all seven loops share one framing and the player can cross-fade between them invisibly.
    const base = join(ROOT, "assets", "keyframes", "sandman", `react-${who}-base.png`);
    const expr = c.refs.find((r) => r.includes("expressions"));
    for (const [mood, feel] of Object.entries(shots.react.moods).filter(([m]) => !c.moods || c.moods.includes(m))) {
      const id = `react-${who}-${mood}`;
      const hasBase = existsSync(base);
      const lock = c.identity ? [c.identity] : [];
      const face = lockRefs(lock)[0];
      jobs.push({
        id: `kf-${id}`, group: "react-keyframes", dir: join(K(id), "candidates"), approved: join(K(id), "keyframe.png"),
        prompt: () => hasBase
          ? `Edit the first attached photograph. Keep it exactly the same: identical framing, camera position, lens, lighting, background, pose, hands, clothing and props, pixel for pixel wherever possible. Change ONLY the facial expression of the person to: ${feel}. The expression is carried by the whole face (eyes, brows, mouth, jaw), subtle and real, never a caricature.${face ? " The face must remain an exact likeness of the real person in the second image; do not slim or reshape it." : " The second image shows how this person's face expresses emotions."}\n${STYLE}`
          : `${lockText(lock)}\n${c.setting} Expression: ${feel}, carried by the whole face, never a caricature. The person is exactly the one in the reference images.\n${single}\n${STYLE}`.trim(),
        refs: hasBase ? [base, ...(face ? [join(ROOT, face)] : expr ? [join(ROOT, expr)] : [])] : withLock(lock, c.refs),
      });
    }
  }
}

const plates = [
  ["cellar-1916", "**4.1 "],
  ["cellar-1970s", "**4.2 "],
  ["cellar-1988", "**4.3 "],
  ["sphere-pov", "**4.4 "],
  ["palace-crumbling", "**4.5 "],
  ["gates-ruined", "**4.6 ", "Render only the RUINED version described above."],
  ["gates-strained", "**4.6 ", "Render only the STRAINED version described above."],
  ["guard-dream", "**4.7 "],
  ["library-hub", "**4.8 "],
  ["throne-room", "**4.9 "],
  ["crossroads", "**4.10 "],
  ["london-rain", "**4.11 "],
  ["rachel-room", "**4.12 "],
  ["hell-gates", "**4.13 "],
  ["hell-arena", "**4.14 "],
  ["diner", "**4.15 "],
  ["park", "**4.16 "],
  ["destiny-garden", "**4.17 "],
  ["convocation", "**4.18 "],
  ["hell-empty", "**4.19 "],
  ["suitors-hall", "**4.20 "],
  ["white-room", "**4.21 "],
  ["madoc-room", "**4.22 "],
  ["convention", "**4.23 "],
  ["boarding-house", "**4.24 "],
  ["vortex", "**4.25 "],
  ["tavern-1389", "**4.26 "],
  ["tavern-1989", "**4.27 "],
  ["false-house", "**4.28 "],
  ["destruction-island", "**4.29 "],
  ["orpheus-shrine", "**4.30 "],
  ["dream-stream", "**4.31 "],
  ["desert-road", "**4.32 "],
  ["lyta-nursery", "**4.33 "],
  ["witch-crossroads", "**4.34 "],
  ["dreaming-siege", "**4.35 "],
  ["faerie-glade", "**4.36 "],
  ["litharge", "**4.37 "],
];
for (const [id, label, extra] of plates) {
  jobs.push({ id, group: "plates", dir: join(P(id), "candidates"), approved: join(P(id), "plate.png"), prompt: () => assemble(block("## 4. Location plates", label), extra), refs: [] });
}

// ---------- gateway calls ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mimeOf = (f) => ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" })[extname(f).toLowerCase()] ?? "image/png";
const extOf = (mime) => ({ "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" })[mime] ?? ".png";

async function post(url, init, label) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    let res;
    try {
      // JSON requests (the image model) may legitimately take over 5 minutes; form uploads use plain fetch.
      res = await (typeof init.body === "string" ? slowFetch : fetch)(url, { ...init, headers: { Authorization: `Bearer ${KEY}`, ...(init.headers ?? {}) } });
    } catch (netErr) {
      // A model that stays silent is treated like one that is down: move to the next backup model, do not wait again.
      if (netErr.silent) throw Object.assign(new Error(`${label}: ${netErr.message}`), { channelDown: true });
      // A dropped connection: retry like a 5xx.
      if (attempt < 4) {
        const wait = 5000 * attempt;
        console.log(`   ${label}: network error (${netErr.cause?.code ?? netErr.message}), retrying in ${wait / 1000}s`);
        await sleep(wait);
        continue;
      }
      throw netErr;
    }
    if (res.ok) return res;
    const body = (await res.text()).slice(0, 400);
    if (channelDown(res.status, body)) throw Object.assign(new Error(`${label}: channel down (${res.status})`), { status: res.status, channelDown: true });
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      const wait = 5000 * attempt;
      console.log(`   ${label}: ${res.status}, retrying in ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    const err = new Error(`${label}: HTTP ${res.status} ${body}`);
    err.status = res.status;
    throw err;
  }
}

async function viaGemini(prompt, refs) {
  let last;
  for (const model of GEMINI_MODELS) {
    try {
      const out = await viaGeminiModel(model, prompt, refs);
      if (model !== GEMINI_MODEL) console.log(`   (made with backup model ${model})`);
      return out;
    } catch (e) {
      if (!e.channelDown) throw e;
      console.log(`   ${model} is down or silent (${e.message}), trying the next model`);
      last = e;
    }
  }
  throw last;
}

async function viaGeminiModel(GEMINI_MODEL, prompt, refs) {
  const parts = refs.map((f) => ({ inlineData: { mimeType: mimeOf(f), data: readFileSync(f).toString("base64") } }));
  parts.push({ text: prompt });
  const url = `${ORIGIN}/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;
  const body = (withAspect) => JSON.stringify({
    contents: [{ role: "user", parts }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], ...(withAspect ? { imageConfig: { aspectRatio: "16:9" } } : {}) },
  });
  let res;
  try {
    res = await post(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body(true) }, GEMINI_MODEL);
  } catch (e) {
    if (e.status !== 400) throw e;
    console.log("   aspect setting rejected, retrying without it (prompt still asks for 16:9)");
    res = await post(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body(false) }, GEMINI_MODEL);
  }
  const j = await res.json();
  const out = (j.candidates ?? []).flatMap((c) => c.content?.parts ?? []).find((p) => p.inlineData?.data || p.inline_data?.data);
  if (!out) {
    const text = (j.candidates ?? []).flatMap((c) => c.content?.parts ?? []).map((p) => p.text).filter(Boolean).join(" ");
    const reason = j.candidates?.[0]?.finishReason ?? j.promptFeedback?.blockReason ?? "no image returned";
    throw new Error(`${GEMINI_MODEL}: ${reason}${text ? ` (model said: ${text.slice(0, 200)})` : ""}`);
  }
  const d = out.inlineData ?? out.inline_data;
  return { buf: Buffer.from(d.data, "base64"), mime: d.mimeType ?? d.mime_type ?? "image/png" };
}

async function viaOpenAI(prompt, refs) {
  let res;
  if (refs.length) {
    const fd = new FormData();
    fd.append("model", OPENAI_MODEL);
    fd.append("prompt", prompt);
    for (const f of refs) fd.append("image", new Blob([readFileSync(f)], { type: mimeOf(f) }), f.split(/[\\/]/).pop());
    res = await post(`${BASE}/images/edits`, { method: "POST", body: fd }, OPENAI_MODEL);
  } else {
    res = await post(`${BASE}/images/generations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OPENAI_MODEL, prompt, n: 1, size: "1792x1024", response_format: "b64_json" }),
    }, OPENAI_MODEL);
  }
  const j = await res.json();
  const d = j.data?.[0];
  if (d?.b64_json) return { buf: Buffer.from(d.b64_json, "base64"), mime: "image/png" };
  if (d?.url) {
    const img = await fetch(d.url);
    return { buf: Buffer.from(await img.arrayBuffer()), mime: img.headers.get("content-type") ?? "image/png" };
  }
  throw new Error(`${OPENAI_MODEL}: no image in response`);
}

// ---------- likeness ----------
// Which real person (if any) a job must look like, from its id.
const identityOf = (id) => (/(^|-)aurie-|kf-(0\.0a|0\.0c|1\.1a|1\.1b|1\.2b-A|1\.2b-B|1\.5b|5\.3a)(-v\d+)?$/.test(id) ? "aurie"
  : /(^|-)alex-|kf-(1\.4a|1\.4b-[ABC]|1\.5c|1\.5d-[AB])$/.test(id) ? "alex" : null);
function scoreFace(identity, file) {
  try {
    const out = execFileSync("python", ["-I", join(ROOT, "tools", "face_score.py"), identity, file, "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const r = JSON.parse(out.slice(out.indexOf("[")))[0];
    return r.score;
  } catch {
    return null; // scorer unavailable: never block generation on it
  }
}

// ---------- runner ----------
function nextVersion(dir, id) {
  // Count rejected candidates too, so a rejected file never shares (and overwrites) a version number.
  const names = [dir, join(dir, "rejected")].filter(existsSync).flatMap((d) => readdirSync(d));
  const used = names.map((f) => f.match(new RegExp(`^${id}-v(\\d+)\\.`))?.[1]).filter(Boolean).map(Number);
  return used.length ? Math.max(...used) + 1 : 1;
}

function readiness(job) {
  const missing = job.refs.filter((f) => !existsSync(f));
  return missing.length ? `waiting for ${missing.map((f) => f.replace(ROOT, "").replace(/^[\\/]/, "")).join(", ")}` : "ready";
}

async function run(job) {
  if (extraRefs.length) job = { ...job, refs: [...job.refs, ...extraRefs] };
  const prompt = runNote ? `${job.prompt()}\n${runNote}` : job.prompt();
  const state = readiness(job);
  const rel = (f) => f.replace(ROOT, "").replace(/^[\\/]/, "");
  console.log(`\n▶ ${job.id}  (${job.refs.length ? `${job.refs.length} reference image(s)` : "text only"})`);
  if (state !== "ready") {
    console.log(`   skipped: ${state}`);
    return;
  }
  if (dry) {
    console.log(`   would make ${perJob} candidate(s) in ${rel(job.dir)}`);
    console.log(`   prompt: ${prompt.length} chars. First line: ${prompt.split("\n")[0].slice(0, 110)}…`);
    return;
  }
  mkdirSync(job.dir, { recursive: true });
  const who = identityOf(job.id);
  let kept = 0;
  const budgetTries = minScore != null && who ? Math.max(perJob, maxTries) : perJob;
  for (let attempt = 0; attempt < budgetTries && kept < perJob; attempt++) {
    const v = nextVersion(job.dir, job.id);
    try {
      const { buf, mime } = via === "openai" ? await viaOpenAI(prompt, job.refs) : await viaGemini(prompt, job.refs);
      const file = join(job.dir, `${job.id}-v${v}${extOf(mime)}`);
      writeFileSync(file, buf);
      const score = who ? scoreFace(who, file) : null;
      const tag = score == null ? "" : `  likeness ${score.toFixed(3)}`;
      if (minScore != null && who && (score == null || score < minScore)) {
        const rejected = join(job.dir, "rejected");
        mkdirSync(rejected, { recursive: true });
        renameSync(file, join(rejected, file.split(/[\\/]/).pop()));
        console.log(`   rejected v${v}${tag} (below ${minScore})`);
        continue;
      }
      kept++;
      console.log(`   saved ${rel(file)}  (${Math.round(buf.length / 1024)} KB)${tag}`);
    } catch (e) {
      console.log(`   FAILED: ${e.message}`);
      return;
    }
  }
  if (minScore != null && who && kept < perJob) console.log(`   only ${kept} of ${perJob} passed the likeness gate in ${budgetTries} tries`);
}

// Face refine: keep a composed scene image, replace ONLY the face with the real person's face.
// npm run gen -- refine <image> <aurie|alex> [--n 2]   (saves <image>-face-vN.png next to it, scored)
const FACE_REFS = {
  aurie: ["face-4.jpg", "face-6.jpg", "face-5.jpg", "face.jpg"].map((f) => join(C("dream"), f)),
  alex: [join(C("alex"), "face.jpg"), join(C("alex"), "photo-2.jpg")],
};
const FACE_TEXT = {
  aurie: "a full, round, soft face, wider than it is long, full cheeks and a soft rounded jaw; straight thick dark brows set fairly low; almond eyes with subtle single eyelids and slightly downturned outer corners; a broad nose with a soft rounded tip; a small mouth with a fuller lower lip",
  alex: "a very broad, round, full face, heavy cheeks and a wide soft jaw; narrow single-lidded eyes behind rectangular matte-black glasses; a broad nose with a rounded tip; full lips with a prominent upper lip; prominent ears",
};
async function refine(file, who) {
  const src = resolve(process.cwd(), file);
  const refs = [src, ...FACE_REFS[who]];
  const prompt = `Edit the FIRST image only. Keep it identical in every way: composition, framing, camera angle, lighting and its colour and direction, pose, hands, hair styling, costume, props, background, film grain. Change ONLY the face of the ${who === "aurie" ? "woman" : "man"} so that it is an exact likeness of the real person in images 2 to ${refs.length}: ${FACE_TEXT[who]}. Match the scene's lighting on the new face so it blends perfectly, same skin texture and grain. Do not slim, narrow, beautify or age the face. Do not change anything else.`;
  for (let n = 0; n < perJob; n++) {
    const base = src.replace(/\.(png|jpg|jpeg|webp)$/i, "");
    let v = 1; while (existsSync(`${base}-face-v${v}.png`)) v++;
    const { buf } = await viaGemini(prompt, refs);
    const out = `${base}-face-v${v}.png`;
    writeFileSync(out, buf);
    const score = scoreFace(who, out);
    console.log(`   refined ${out.replace(ROOT, "").replace(/^[\\/]/, "")}  likeness ${score == null ? "n/a" : score.toFixed(3)}`);
  }
}

async function main() {
  if (cmd === "refine") {
    if (!KEY) { console.error("No INFISTAR_API_KEY found."); process.exit(1); }
    return refine(argv[1], argv[2] ?? "aurie");
  }
  if (cmd === "list") {
    for (const j of jobs) {
      const done = existsSync(j.approved) ? "approved" : readiness(j);
      console.log(`${j.group.padEnd(9)} ${j.id.padEnd(20)} ${done}`);
    }
    console.log(`\nApproved files go here, e.g. ${jobs[0].approved.replace(ROOT, "").replace(/^[\\/]/, "")}`);
    return;
  }
  if (!KEY && !dry) {
    console.error("No INFISTAR_API_KEY found in the project .env. Nothing was sent.");
    process.exit(1);
  }
  const selected = cmd === "one" ? jobs.filter((j) => j.id === argv[1]) : jobs.filter((j) => j.group === cmd);
  if (!selected.length) {
    console.error(`Nothing matches "${argv.slice(0, 2).join(" ")}". Try: list, sheets, portraits, plates, one <job-id>.`);
    process.exit(1);
  }
  console.log(`${dry ? "DRY RUN, nothing sent. " : ""}${selected.length} job(s), ${perJob} candidate(s) each, via ${via === "openai" ? `/v1/images (${OPENAI_MODEL})` : `Gemini generateContent (${GEMINI_MODEL})`}`);
  for (const j of selected) await run(j);
  console.log("\nDone. Review the candidates, then copy the one you like to its approved path (see `npm run gen -- list`).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
