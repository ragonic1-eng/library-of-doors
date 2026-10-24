#!/usr/bin/env node
// The ¥15 video test (plan-neverwhere.md §6 decision 3). Go/no-go lines were written before it ran:
//   loop: a talking loop rendered with the same picture as first AND last frame must measure a seam under 6 (tools/loop_seam.py)
//   face: kling-video-o1 joins the ranked list ahead of wan2.7-i2v only if the same Aurie shot scores 0.45 or better on its
//         worst frame where wan2.7 scores under 0.35 (tools/face_score.py)
// Both first frames are real 21.3 shots on the approved Westminster plate. Task ids are kept in a ledger, so a rerun
// polls instead of paying again. Hard stop: nothing is submitted if real spend since the first run would pass ¥14.75 (¥15 with the two first frames).
//   node scripts/video-test.mjs [loop-kling26] [face-wan27] [face-o1] [loop-o1]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
for (const f of [join(ROOT, ".env"), join(ROOT, "app", ".env.local")]) if (existsSync(f)) try { process.loadEnvFile(f); } catch { /* ignore */ }
const BASE = (process.env.INFISTAR_BASE_URL ?? "https://infistar.ai/v1").replace(/\/$/, ""), ORIGIN = new URL(BASE).origin;
const KEY = process.env.INFISTAR_API_KEY ?? "";
const H = () => ({ Authorization: `Bearer ${KEY}` });
const OUT = join(ROOT, "assets", "clips", "neverwhere", "test");
mkdirSync(OUT, { recursive: true });
const LEDGER = join(OUT, "_tasks.json");
const ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")) : {};
// Merge with the file on disk, so two runs at once never drop each other's task ids (a lost id means paying twice).
const save = () => writeFileSync(LEDGER, JSON.stringify({ ...(existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")) : {}), ...ledger }, null, 2));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CAP = 14.75, QUOTA_PER_CNY = 500000;

const DOOR = join(ROOT, "assets", "keyframes", "neverwhere", "talk-door-21.3", "keyframe.png");
const AURIE = join(ROOT, "assets", "keyframes", "neverwhere", "still-aurie-21.3", "keyframe.png");
const FACES = ["face-4.jpg", "face-6.jpg"].map((f) => join(ROOT, "characters", "dream", f));
const b64 = (f) => readFileSync(f).toString("base64");
const blob = (f) => new Blob([readFileSync(f)], { type: f.endsWith(".jpg") ? "image/jpeg" : "image/png" });

const LOOP = "Door speaks softly to someone just beside the camera, a few calm sentences: small natural head movements, she blinks, a breath of wind moves her hair and the frosted grass. At the end she returns exactly to the starting pose, mouth closed, eyes where they began. Locked-off camera, no zoom, no cut.";
const STILL = "Aurie listens to someone just beside the camera, calm, the faint warmth she always has; she blinks, breathes, her hair stirs in the dawn wind, gulls far off over the river. She does not turn her head toward the camera; her face stays still and recognisable. Locked-off camera, no zoom, no cut.";

const TESTS = {
  // Kling's own route takes a tail frame: the same picture at both ends should close the loop by itself.
  "loop-kling26": { est: 1.5, route: "kling", submit: () => postJSON(`${ORIGIN}/kling/v1/videos/image2video`, { model: "kling-v2-6", mode: "std", duration: "5", prompt: LOOP, image: b64(DOOR), image_tail: b64(DOOR) }), poll: (id) => `${ORIGIN}/kling/v1/videos/image2video/${id}` },
  // The face pair: the same first frame, wan2.7 (the Sandman's model) against Kling O1 with two of her real face photos added.
  "face-wan27": { est: 3.0, route: "videos", submit: () => postForm("wan2.7-i2v", STILL, [AURIE]), poll: (id) => `${BASE}/videos/${id}` },
  // The gateway refused O1 with extra reference photos (no route for reference-image mode): try the first frame alone.
  "face-o1-single": { est: 3.0, route: "videos", submit: () => postForm("kling-video-o1", STILL, [AURIE]), poll: (id) => `${BASE}/videos/${id}` },
  "face-o1": { est: 3.0, route: "videos", submit: () => postForm("kling-video-o1", STILL, [AURIE, ...FACES]), poll: (id) => `${BASE}/videos/${id}` },
  // Kling's route is restricted on this key: wan2.7 through the task route, first and last frame in wan's own media list.
  "loop-wan27": { est: 3.0, route: "generations", submit: () => postJSON(`${BASE}/video/generations`, { model: "wan2.7-i2v", prompt: LOOP, image: `data:image/png;base64,${b64(DOOR)}`, duration: 5, size: "1280x720", metadata: { input: { media: [{ type: "first_frame", url: `data:image/png;base64,${b64(DOOR)}` }, { type: "last_frame", url: `data:image/png;base64,${b64(DOOR)}` }] } } }), poll: (id) => `${BASE}/video/generations/${id}` },
  // Only if Kling's route refuses a tail frame: Kling O1 through the gateway's task route, tail frame in metadata.
  "loop-o1": { est: 3.0, route: "generations", submit: () => postJSON(`${BASE}/video/generations`, { model: "kling-video-o1", prompt: LOOP, image: `data:image/png;base64,${b64(DOOR)}`, duration: 5, size: "1280x720", metadata: { image_tail: b64(DOOR) } }), poll: (id) => `${BASE}/video/generations/${id}` },
};

async function postJSON(url, body) {
  const r = await fetch(url, { method: "POST", headers: { ...H(), "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const t = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${t.slice(0, 300)}`);
  const j = JSON.parse(t);
  return j.data?.task_id ?? j.task_id ?? j.id ?? j.data?.id;
}
async function postForm(model, prompt, images) {
  const fd = new FormData();
  fd.append("model", model); fd.append("prompt", prompt); fd.append("seconds", "5"); fd.append("size", "1280x720");
  images.forEach((f, i) => fd.append("input_reference", blob(f), `ref-${i}${f.slice(-4)}`));
  const r = await fetch(`${BASE}/videos`, { method: "POST", headers: H(), body: fd });
  const t = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${t.slice(0, 300)}`);
  return JSON.parse(t).id;
}
async function used() {
  const j = await (await fetch(`${ORIGIN}/api/usage/token`, { headers: H() })).json();
  if (typeof j?.data?.total_used !== "number") throw new Error("no usage reading; refusing to spend without the cap");
  return j.data.total_used;
}

async function run(name) {
  const t = TESTS[name], out = join(OUT, `${name}.mp4`);
  if (existsSync(out)) return report(name, out);
  let id = ledger[name]?.task;
  if (!id) {
    const spent = (await used() - ledger._baseline) / QUOTA_PER_CNY;
    if (spent + t.est > CAP) return console.log(`■ ${name}: not sent, spent ¥${spent.toFixed(2)} of ¥${CAP} and it could cost ¥${t.est}`);
    try { id = await t.submit(); } catch (e) { return console.log(`✗ ${name} refused: ${e.message}`); }
    ledger[name] = { task: id, at: new Date().toISOString() }; save();
    console.log(`▶ ${name} submitted (${id})`);
  }
  for (let i = 0; i < 90; i++) {
    let j; try { j = await (await fetch(t.poll(id), { headers: H() })).json(); } catch { await sleep(10000); continue; }
    const st = String(j.data?.task_status ?? j.status ?? j.data?.status ?? "").toLowerCase();
    if (["succeed", "completed", "success"].includes(st)) {
      const url = j.data?.task_result?.videos?.[0]?.url ?? j.data?.result_url ?? j.metadata?.url ?? j.video_url ?? j.url ?? j.data?.url;
      const res = url ? await fetch(url) : await fetch(`${t.poll(id)}/content`, { headers: H() });
      if (!res.ok) return console.log(`✗ ${name}: download HTTP ${res.status}`);
      writeFileSync(out, Buffer.from(await res.arrayBuffer()));
      ledger[name].done = true; ledger[name].reply = JSON.stringify(j).slice(0, 1500); save();
      return report(name, out);
    }
    if (["failed", "fail", "error"].includes(st)) { ledger[name].failed = JSON.stringify(j).slice(0, 600); save(); return console.log(`✗ ${name} failed: ${ledger[name].failed}`); }
    await sleep(10000);
  }
  console.log(`… ${name} still running after 15 minutes; run again later to resume`);
}
function report(name, out) {
  const py = (tool, ...a) => { try { return execFileSync("python", ["-I", join(ROOT, "tools", tool), ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().split("\n").pop(); } catch { return "could not run"; } };
  console.log(`✓ ${name}: ${out.replace(ROOT, "").replace(/^[\\/]/, "")}`);
  console.log(`   ${name.startsWith("loop") ? py("loop_seam.py", out) : `likeness ${py("face_score.py", "aurie", out)}`}`);
}

if (!KEY) { console.error("No INFISTAR_API_KEY. Nothing sent."); process.exit(1); }
if (ledger._baseline == null) { ledger._baseline = await used(); save(); }
const pick = process.argv.slice(2).filter((a) => TESTS[a]);
await Promise.all((pick.length ? pick : ["loop-kling26", "face-wan27", "face-o1"]).map(run));
console.log(`Spent since the test began: ¥${((await used() - ledger._baseline) / QUOTA_PER_CNY).toFixed(2)} of ¥${CAP}`);
