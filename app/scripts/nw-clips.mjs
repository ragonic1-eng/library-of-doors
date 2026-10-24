#!/usr/bin/env node
// Neverwhere videos (Phase 5): scene clips and talking loops from approved first frames, one batch at a time.
//   node scripts/nw-clips.mjs <A|B|...|shot-id ...> [--budget 30] [--dry]
// Reads the shot list; a shot runs only when its first frame is approved (assets/keyframes/neverwhere/<id>/keyframe.png).
// Model: wan2.7-i2v (the ¥15 test, plan §6 decision 3: holds Aurie's face from a good first frame; Kling O1 has no
// image route on this gateway; the gateway ignores end frames, so talking loops are ping-ponged, rule 13 b).
// Every finished clip is checked: Aurie's likeness on sampled frames (tools/face_score.py), the seam of every loop
// (tools/loop_seam.py, under 6). Task ids go in a ledger so a rerun polls instead of paying again; nothing is
// submitted once real spend in this run would pass --budget.
// Published: clips to app/public/clips/neverwhere/<id>.mp4, loops to .../react/<key>-talking.mp4 (then `npm run upload`).
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
for (const f of [join(ROOT, ".env"), join(ROOT, "app", ".env.local")]) if (existsSync(f)) try { process.loadEnvFile(f); } catch { /* ignore */ }
const BASE = (process.env.INFISTAR_BASE_URL ?? "https://infistar.ai/v1").replace(/\/$/, ""), ORIGIN = new URL(BASE).origin;
const KEY = process.env.INFISTAR_API_KEY ?? "";
const MODEL = process.env.MODEL_VIDEO_NW ?? "wan2.7-i2v", YUAN_PER_SEC = 0.6, QUOTA_PER_CNY = 500000;
const H = () => ({ Authorization: `Bearer ${KEY}` });
const argv = process.argv.slice(2), dry = argv.includes("--dry");
const budget = argv.includes("--budget") ? Number(argv[argv.indexOf("--budget") + 1]) : 30;
const want = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--budget");

const shots = JSON.parse(readFileSync(join(ROOT, "app", "src", "content", "books", "neverwhere", "shots.json"), "utf8")).shots;
const KF = (id) => join(ROOT, "assets", "keyframes", "neverwhere", id, "keyframe.png");
const RAW = join(ROOT, "assets", "clips", "neverwhere"), PUB = join(ROOT, "app", "public", "clips", "neverwhere");
for (const d of [RAW, join(PUB, "react")]) mkdirSync(d, { recursive: true });
const LEDGER = join(RAW, "_tasks.json");
const ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")) : {};
const save = () => writeFileSync(LEDGER, JSON.stringify({ ...(existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")) : {}), ...ledger }, null, 2));
// Every clip's checks (restore verdict, likeness, seam), read by check-story: a published Aurie clip with no restore record fails it.
const CHECKS = join(RAW, "_checks.json");
const record = (id, k, v) => { const c = existsSync(CHECKS) ? JSON.parse(readFileSync(CHECKS, "utf8")) : {}; (c[id] ??= {})[k] = v; writeFileSync(CHECKS, JSON.stringify(c, null, 2)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const batchOf = (s) => "AAAABBBCCCDDEEEFFFGGGHHH"[Math.min(Number(s.split(".")[0]), 23)];
const rel = (f) => f.replace(ROOT, "").replace(/^[\\/]/, "");

const selected = Object.entries(shots).filter(([id, sh]) => (sh.kind === "clip" || sh.kind === "loop") && !sh.made && !sh.reuse
  && (want.includes(id) || want.includes(batchOf(sh.scene))));
const published = (id, sh) => sh.kind === "loop" ? join(PUB, "react", `${sh.key}-talking.mp4`) : join(PUB, `${id}.mp4`);

async function used() {
  // The gateway sometimes drops a connection: retry a few times rather than crash a run that has tasks in flight.
  let j;
  for (let i = 0; i < 4 && !j; i++) try { j = await (await fetch(`${ORIGIN}/api/usage/token`, { headers: H(), signal: AbortSignal.timeout(30000) })).json(); } catch { await sleep(5000 * (i + 1)); }
  if (typeof j?.data?.total_used !== "number") throw new Error("no usage reading; refusing to spend without the cap");
  return j.data.total_used;
}
const py = (tool, ...a) => { try { return execFileSync("python", ["-I", join(ROOT, "tools", tool), ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().split("\n").pop(); } catch { return "could not run"; } };
// Ping-pong with the project's own ffmpeg (tools/venv has imageio-ffmpeg): forward, then backward without repeating the turn frames.
function pingpong(src, dst) {
  execFileSync(join(ROOT, "tools", "venv", "Scripts", "python"), ["-c", `
import subprocess, imageio_ffmpeg, sys
FF = imageio_ffmpeg.get_ffmpeg_exe(); src, dst = sys.argv[1], sys.argv[2]
r = subprocess.run([FF, "-i", src, "-map", "0:v:0", "-c", "copy", "-f", "null", "-"], capture_output=True, text=True)
n = int([l for l in r.stderr.splitlines() if "frame=" in l][-1].split("frame=")[1].split()[0])
g = f"[0:v]split[a][b];[b]reverse,trim=start_frame=1:end_frame={n - 1},setpts=PTS-STARTPTS[r];[a][r]concat=n=2:v=1:a=0[v]"
subprocess.run([FF, "-v", "error", "-y", "-i", src, "-filter_complex", g, "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "21", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", dst], check=True)
`, src, dst], { stdio: "inherit" });
}

let baseline;
async function run(id, sh) {
  const raw = join(RAW, `${id}.mp4`), pub = published(id, sh), secs = Math.min(sh.seconds ?? 5, 10);
  if (existsSync(pub)) return console.log(`✓ ${id} already published`);
  if (!existsSync(KF(id))) return console.log(`… ${id} waits for its approved first frame`);
  if (dry) return console.log(`▶ ${id} ${MODEL} ${secs}s (about ¥${(secs * YUAN_PER_SEC).toFixed(2)})`);
  if (!existsSync(raw)) {
    let task = ledger[id]?.task;
    if (!task) {
      const spent = (await used() - baseline) / QUOTA_PER_CNY;
      if (spent + secs * YUAN_PER_SEC > budget) return console.log(`■ ${id} not sent: ¥${spent.toFixed(2)} spent of ¥${budget}`);
      const fd = new FormData();
      fd.append("model", MODEL); fd.append("seconds", String(secs)); fd.append("size", "1280x720");
      fd.append("prompt", `${sh.motion} Keep every face, costume and the set exactly as in the first frame; people stay at their true sizes.`);
      fd.append("input_reference", new Blob([readFileSync(KF(id))], { type: "image/png" }), "keyframe.png");
      let r; try { r = await fetch(`${BASE}/videos`, { method: "POST", headers: H(), body: fd, signal: AbortSignal.timeout(120000) }); } catch (e) { return console.log(`✗ ${id} not submitted: ${e.message}`); }
      const t = await r.text();
      if (!r.ok) return console.log(`✗ ${id} refused: HTTP ${r.status} ${t.slice(0, 200)}`);
      task = JSON.parse(t).id; ledger[id] = { task, at: new Date().toISOString() }; save();
      console.log(`▶ ${id} submitted (${secs}s)`);
    }
    for (let i = 0; ; i++) {
      if (i > 90) return console.log(`… ${id} still running after 15 minutes; run again to resume`);
      let j; try { j = await (await fetch(`${BASE}/videos/${task}`, { headers: H(), signal: AbortSignal.timeout(60000) })).json(); } catch { await sleep(10000); continue; }
      if (j.status === "completed") {
        // Every network call has a time limit: a hung connection becomes a retry on the next run, never a silent stop.
        let res; try { res = j.metadata?.url ? await fetch(j.metadata.url, { signal: AbortSignal.timeout(180000) }) : await fetch(`${BASE}/videos/${task}/content`, { headers: H(), signal: AbortSignal.timeout(180000) }); } catch (e) { return console.log(`✗ ${id}: download failed (${e.message}); run again to collect it`); }
        if (!res.ok) return console.log(`✗ ${id}: download HTTP ${res.status}`);
        writeFileSync(raw, Buffer.from(await res.arrayBuffer())); ledger[id].done = true; save(); break;
      }
      if (j.status === "failed") { delete ledger[id]; save(); return console.log(`✗ ${id} failed: ${JSON.stringify(j.error ?? j).slice(0, 200)}`); }
      await sleep(10000);
    }
  }
  // LIKENESS rule 8: every clip with Aurie in it goes through the free FaceFusion restore before any check;
  // the restored copy (assets/clips/neverwhere/_ff/) is used only when her likeness improved.
  let clip = raw;
  if ((sh.cast ?? []).some((c) => c.startsWith("aurie"))) {
    const verdict = py("face_restore.py", "aurie", raw);
    record(id, "restore", verdict);
    console.log(`   ${id} restore: ${verdict.replace(/^.*?: /, "")}`);
    if (/improved/.test(verdict)) clip = join(RAW, "_ff", `${id}.mp4`);
  }
  // Checks, then publish.
  const aurie = (sh.cast ?? []).some((c) => c.startsWith("aurie")) && !/from behind|back to (the )?camera|seen from behind/i.test(sh.keyframe);
  if (aurie) {
    const line = py("face_score.py", "aurie", clip), worst = Number(line.match(/worst\s+(-?[\d.]+)/)?.[1]);
    console.log(`   ${id} likeness: ${line.split(/\s{2,}/).slice(0, 3).join("  ")}`);
    // Rule 7: a clip that fails its checks is not published; the beat keeps its still. The owner may still pass it by eye.
    record(id, "likeness", line.split(/\s{2,}/).slice(0, 3).join("  "));
    if (!(worst >= 0.3)) return console.log(`✗ ${id} held back: her face drifts (worst frame ${worst}); kept in ${rel(raw)} for review`);
  }
  if (sh.kind === "loop") {
    pingpong(clip, pub);
    const seam = py("loop_seam.py", pub);
    record(id, "seam", seam);
    console.log(`   ${id} loop ${seam}${Number(seam.match(/seam ([\d.]+)/)?.[1]) >= 6 ? "  ✗ seam over 6: not for play" : ""}`);
  } else copyFileSync(clip, pub);
  console.log(`✓ ${id} published ${rel(pub)}`);
}

if (!selected.length) { console.error(`Nothing matches ${want.join(" ")}.`); process.exit(1); }
if (!KEY && !dry) { console.error("No INFISTAR_API_KEY. Nothing sent."); process.exit(1); }
if (!dry) baseline = await used();
console.log(`${dry ? "DRY RUN. " : ""}${selected.length} video shot(s), cap ¥${budget}`);
const queue = [...selected];
await Promise.all([0, 1].map(async () => { while (queue.length) { const [id, sh] = queue.shift(); await run(id, sh); } }));
if (!dry) console.log(`Spent in this run: ¥${((await used() - baseline) / QUOTA_PER_CNY).toFixed(2)} of ¥${budget}`);
