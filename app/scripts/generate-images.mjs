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

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

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

character("aurie", "### 3.1", "**Reference sheet, Aurie", "**Hero portrait, your wife as Dream", [join(C("dream"), "photo.jpg")]);
character("burgess", "### 3.2", "**Reference sheet:**", "**Hero portrait");
character("alex-young", "### 3.3", "**Reference sheet", "**Hero portrait", [join(C("alex"), "photo.jpg"), join(C("alex"), "photo-2.jpg")]);
character("alex-old", "### 3.4", "**Reference sheet", "**Hero portrait", [join(C("alex"), "photo.jpg"), join(C("alex"), "photo-2.jpg")]);
character("paul", "### 3.5", "**Reference sheet:**", "**Hero portrait");
character("lucienne", "### 3.6", "**Reference sheet:**", "**Hero portrait");
character("guard", "### 3.7", "**Reference sheet:**", "**Hero portrait");

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
      res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${KEY}`, ...(init.headers ?? {}) } });
    } catch (netErr) {
      // Dropped connection or timeout: retry like a 5xx.
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

// ---------- runner ----------
function nextVersion(dir, id) {
  if (!existsSync(dir)) return 1;
  const used = readdirSync(dir).map((f) => f.match(new RegExp(`^${id}-v(\\d+)\\.`))?.[1]).filter(Boolean).map(Number);
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
  for (let n = 0; n < perJob; n++) {
    const v = nextVersion(job.dir, job.id);
    try {
      const { buf, mime } = via === "openai" ? await viaOpenAI(prompt, job.refs) : await viaGemini(prompt, job.refs);
      const file = join(job.dir, `${job.id}-v${v}${extOf(mime)}`);
      writeFileSync(file, buf);
      console.log(`   saved ${rel(file)}  (${Math.round(buf.length / 1024)} KB)`);
    } catch (e) {
      console.log(`   FAILED: ${e.message}`);
      return;
    }
  }
}

async function main() {
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
