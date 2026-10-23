#!/usr/bin/env node
// Episode 1 clip generator: approved keyframe -> image-to-video -> mp4.
//
// Reads production/ep1-shots.json. Each clip animates its approved keyframe
// (assets/keyframes/sandman/<id>/keyframe.png, or the image a shot `use`s).
// Finished clips land in assets/clips/sandman/ and are never regenerated or re-charged
// unless --force. Submitted task ids are kept in a ledger so an interrupted run resumes
// by polling instead of paying again.
//
// Usage (from the app folder):
//   npm run clips -- list                     status of every clip
//   npm run clips -- scenes [--dry]           all scene clips that are ready
//   npm run clips -- react  [--dry]           all reaction loops that are ready
//   npm run clips -- one <clip-id> [--dry]    one clip, e.g. one 1.5b or one react-burgess-hostile
//   npm run clips -- spend                    real spend since the baseline, against the cap
//   options: --model <id> overrides the model for this run; --force regenerates; --parallel 3;
//            --budget <yuan> (default 200, or CLIP_BUDGET_CNY) stops before real spend would exceed it

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
for (const f of [join(ROOT, ".env"), join(ROOT, "app", ".env.local")]) {
  if (existsSync(f)) try { process.loadEnvFile(f); } catch { /* ignore */ }
}
const BASE = (process.env.INFISTAR_BASE_URL ?? "https://infistar.ai/v1").replace(/\/$/, "");
const KEY = process.env.INFISTAR_API_KEY ?? "";
const MODELS = { video: process.env.MODEL_VIDEO ?? "kling-v2-6", hero: process.env.MODEL_VIDEO_HERO ?? "kling-video-o1" };

const argv = process.argv.slice(2);
const cmd = argv[0] ?? "list";
const dry = argv.includes("--dry");
const force = argv.includes("--force");
const modelOverride = argv.includes("--model") ? argv[argv.indexOf("--model") + 1] : null;
const parallel = argv.includes("--parallel") ? Math.max(1, parseInt(argv[argv.indexOf("--parallel") + 1], 10) || 2) : 2;
// Budget cap in yuan, enforced on REAL charges read from the gateway's usage counter.
// The baseline is recorded once (first run) in assets/clips/<book>/_spend.json.
const budget = argv.includes("--budget") ? Number(argv[argv.indexOf("--budget") + 1]) : Number(process.env.CLIP_BUDGET_CNY ?? 200);
const QUOTA_PER_CNY = Number(process.env.QUOTA_PER_CNY ?? 500000); // gateway quota units per yuan (verify with `npm run clips -- spend`)
const RATE_CNY_PER_SEC = Number(process.env.CLIP_RATE_CNY_PER_SEC ?? 0.6); // used only to look ahead one clip

const book = "sandman";
const spec = JSON.parse(readFileSync(join(ROOT, "production", "ep1-shots.json"), "utf8"));
const KF = (id) => join(ROOT, "assets", "keyframes", book, id, "keyframe.png");
const OUT = join(ROOT, "assets", "clips", book);
const LEDGER = join(OUT, "_tasks.json");
mkdirSync(join(OUT, "react"), { recursive: true });
const ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")) : {};
const saveLedger = () => writeFileSync(LEDGER, JSON.stringify(ledger, null, 2));
const rel = (f) => f.replace(ROOT, "").replace(/^[\\/]/, "");

// ---------- clip list ----------
/** @type {{id:string, kind:string, model:string, seconds:number, keyframe:string, prompt:string, out:string}[]} */
const clips = [];
for (const s of spec.shots) {
  if (s.still) continue; // a still is shown as an image with a slow push-in, never animated
  clips.push({
    id: s.id, kind: "scenes", model: s.model, seconds: s.seconds,
    keyframe: s.keyframe.use ? join(ROOT, s.keyframe.use) : KF(s.id),
    prompt: `${s.motion} ${spec.camera} ${spec.keep}`,
    out: join(OUT, `${s.id}.mp4`),
  });
}
for (const [who, rc] of Object.entries(spec.react.characters)) {
  for (const [mood, feel] of Object.entries(spec.react.moods).filter(([m]) => !rc.moods || rc.moods.includes(m))) {
    const id = `react-${who}-${mood}`;
    clips.push({
      id, kind: "react", model: "video", seconds: spec.react.seconds, keyframe: KF(id),
      prompt: `The character is ${feel}. ${spec.react.motion} ${spec.camera} ${spec.keep}`,
      out: join(OUT, "react", `${who}-${mood}.mp4`),
    });
  }
}

// Reaction loops render in priority order, so a budget stop leaves only the least-used moods missing
// (the player falls back to neutral for any missing mood).
const MOOD_PRIORITY = ["neutral", "hostile", "warm", "afraid", "wary", "grieving", "amused"];
const moodRank = (c) => (c.kind === "react" ? MOOD_PRIORITY.indexOf(c.id.split("-").pop()) : -1);
clips.sort((a, b) => (a.kind === b.kind && a.kind === "react" ? moodRank(a) - moodRank(b) : 0));

const status = (c) => existsSync(c.out) ? "done" : ledger[c.id] ? `submitted (${ledger[c.id].model})` : existsSync(c.keyframe) ? "ready" : `waiting for ${rel(c.keyframe)}`;

// ---------- gateway ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const H = () => ({ Authorization: `Bearer ${KEY}` });

// ---------- budget ----------
const SPEND = join(OUT, "_spend.json");
async function usedQuota() {
  const r = await fetch(`${new URL(BASE).origin}/api/usage/token`, { headers: H() });
  const j = await r.json();
  const used = j?.data?.total_used;
  if (typeof used !== "number") throw new Error("gateway did not report usage; refusing to spend without a working cap");
  return used;
}
async function spentCny() {
  const now = await usedQuota();
  let s = existsSync(SPEND) ? JSON.parse(readFileSync(SPEND, "utf8")) : null;
  if (!s) { s = { baselineQuota: now, at: new Date().toISOString(), budgetCny: budget }; writeFileSync(SPEND, JSON.stringify(s, null, 2)); }
  return (now - s.baselineQuota) / QUOTA_PER_CNY;
}
let budgetHit = false;
async function canAfford(c) {
  if (budgetHit) return false;
  const spent = await spentCny();
  const next = c.seconds * RATE_CNY_PER_SEC * 1.5; // 1.5x headroom in case 1080p bills above the listed 720p rate
  if (spent + next > budget) {
    budgetHit = true;
    console.log(`■ budget stop: spent ¥${spent.toFixed(2)} of ¥${budget}; next clip (${c.id}) could cost up to ¥${next.toFixed(2)}. Nothing more will be submitted.`);
    return false;
  }
  return true;
}
const mimeOf = (f) => ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" })[extname(f).toLowerCase()] ?? "image/png";

// Ranked backups for each kind of clip, tried in order when a model's gateway channel is down.
const FALLBACK = (process.env.MODEL_VIDEO_FALLBACK ?? "wan2.7-i2v,kling-v2-6").split(",").map((m) => m.trim()).filter(Boolean);
const channelDown = (status, text) => status === 404 || /no available channel|model_not_found|不在当前供应目录/i.test(text);

/** Submit to the first model whose channel is up; returns [task id, model used]. */
async function submitRanked(c, model) {
  let last;
  for (const m of [...new Set([model, ...FALLBACK])]) {
    try {
      const id = await submit(c, m);
      if (m !== model) console.log(`   ${c.id}: made with backup model ${m}`);
      return [id, m];
    } catch (e) {
      if (!e.channelDown) throw e;
      console.log(`   ${c.id}: ${m} is down, trying the next model`);
      last = e;
    }
  }
  throw last;
}

async function submit(c, model) {
  const fd = new FormData();
  fd.append("model", model);
  fd.append("prompt", c.prompt);
  fd.append("seconds", String(c.seconds));
  fd.append("size", "1280x720");
  fd.append("input_reference", new Blob([readFileSync(c.keyframe)], { type: mimeOf(c.keyframe) }), "keyframe" + extname(c.keyframe));
  for (let attempt = 1; attempt <= 3; attempt++) {
    let res;
    try { res = await fetch(`${BASE}/videos`, { method: "POST", headers: H(), body: fd }); }
    catch (e) { if (attempt < 3) { await sleep(5000 * attempt); continue; } throw e; }
    const text = await res.text();
    if (res.ok) return JSON.parse(text).id;
    if (channelDown(res.status, text)) throw Object.assign(new Error(`${model}: channel down`), { channelDown: true });
    // 429 = route restricted or busy: worth one or two slow retries. Other errors: report, do not retry.
    if (res.status === 429 && attempt < 3) { console.log(`   ${c.id}: 429 busy/restricted, retrying in ${20 * attempt}s`); await sleep(20000 * attempt); continue; }
    throw new Error(`HTTP ${res.status} ${text.slice(0, 220)}`);
  }
}

async function waitAndSave(c, taskId) {
  for (let i = 0; i < 120; i++) {
    let j;
    try { j = await (await fetch(`${BASE}/videos/${taskId}`, { headers: H() })).json(); }
    catch { await sleep(10000); continue; }
    if (j.status === "completed") {
      const url = j.metadata?.url ?? j.video_url ?? j.url;
      const res = url ? await fetch(url) : await fetch(`${BASE}/videos/${taskId}/content`, { headers: H() });
      if (!res.ok) throw new Error(`download HTTP ${res.status}`);
      writeFileSync(c.out, Buffer.from(await res.arrayBuffer()));
      delete ledger[c.id]; saveLedger();
      return;
    }
    if (j.status === "failed") { delete ledger[c.id]; saveLedger(); throw new Error(`task failed: ${JSON.stringify(j.error ?? j).slice(0, 220)}`); }
    await sleep(10000);
  }
  throw new Error("still running after 20 minutes; rerun the same command later to resume");
}

async function run(c) {
  const model = modelOverride ?? MODELS[c.model];
  if (existsSync(c.out) && !force) return console.log(`✓ ${c.id} already done`);
  if (!existsSync(c.keyframe)) return console.log(`… ${c.id} skipped: no approved keyframe yet`);
  if (dry) return console.log(`▶ ${c.id}  ${model}, ${c.seconds}s, from ${rel(c.keyframe)}`);
  try {
    let taskId = ledger[c.id]?.task;
    if (taskId) console.log(`↻ ${c.id} resuming task ${taskId}`);
    else {
      if (!(await canAfford(c))) return;
      let used;
      [taskId, used] = await submitRanked(c, model);
      ledger[c.id] = { task: taskId, model: used, at: new Date().toISOString() }; saveLedger();
      console.log(`▶ ${c.id} submitted to ${used} (${c.seconds}s)`);
    }
    await waitAndSave(c, taskId);
    console.log(`✓ ${c.id} saved ${rel(c.out)}`);
  } catch (e) {
    console.log(`✗ ${c.id} FAILED: ${e.message}`);
  }
}

async function main() {
  if (cmd === "list") {
    for (const c of clips) console.log(`${c.kind.padEnd(7)} ${c.id.padEnd(26)} ${status(c)}`);
    return;
  }
  if (cmd === "spend") {
    const spent = await spentCny();
    console.log(`Spent on clips since baseline: ¥${spent.toFixed(2)} of ¥${budget} (raw quota now ${await usedQuota()}).`);
    return;
  }
  if (!KEY && !dry) { console.error("No INFISTAR_API_KEY in the project .env. Nothing was sent."); process.exit(1); }
  const selected = cmd === "one" ? clips.filter((c) => c.id === argv[1]) : clips.filter((c) => c.kind === cmd);
  if (!selected.length) { console.error(`Nothing matches "${argv.slice(0, 2).join(" ")}". Try: list, scenes, react, one <clip-id>.`); process.exit(1); }
  console.log(`${dry ? "DRY RUN, nothing sent. " : ""}${selected.length} clip(s), ${parallel} at a time.`);
  const queue = [...selected];
  await Promise.all(Array.from({ length: parallel }, async () => { while (queue.length) await run(queue.shift()); }));
}

main().catch((e) => { console.error(e); process.exit(1); });
