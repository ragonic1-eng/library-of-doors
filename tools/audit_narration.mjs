// Narration audit: every narrated line in every book, measured and transcribed.
//   node tools/audit_narration.mjs            (from the repo root; needs the local media and the gateway key in .env)
// For each recording in app/public/clips/<book>/audio/lines/<lineId>.mp3:
//   1. decode it and measure quiet holes, a dead tail and runaway length (app/src/lib/server/mp3.ts, the same check
//      the server applies to live character voices);
//   2. transcribe it independently (gpt-audio as a listener, up to two passes) and align the words with the script.
// Writes audit/narration-audit.json and prints every line that needs attention.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(join(ROOT, ".env"));
const BASE = process.env.INFISTAR_BASE_URL.replace(/\/$/, ""), KEY = process.env.INFISTAR_API_KEY;
const { measure, flaw } = await import(pathToFileURL(join(ROOT, "app/src/lib/server/mp3.ts")).href);

const lineId = (text) => {
  let h = 0x811c9dc5;
  for (const b of Buffer.from(text.trim())) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0");
};
const words = (t) => t.toLowerCase().replace(/[’‘]/g, "'").replace(/[-–—]/g, " ").replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);

// Every narrated line, with where it is used.
const lines = new Map();
for (const dir of readdirSync(join(ROOT, "app/src/content/books"))) {
  const book = JSON.parse(readFileSync(join(ROOT, "app/src/content/books", dir, "book.json"), "utf8"));
  for (const [sid, sc] of Object.entries(book.scenes)) {
    const groups = [["beat", sc.beats ?? []], ...(sc.choices ?? []).map((c) => [`choice ${c.id}`, c.aftermath ?? []])];
    for (const [where, beats] of groups) for (const b of beats) {
      if (!b.text) continue;
      const id = lineId(b.text);
      const row = lines.get(id) ?? { book: book.id, id, text: b.text, used: [] };
      row.used.push(`${sid} ${where}${b.if ? ` if ${b.if.join(",")}` : ""}${b.unless ? ` unless ${b.unless.join(",")}` : ""}`);
      lines.set(id, row);
    }
  }
}

async function listen(buf) {
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(`${BASE}/chat/completions`, {
        method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-audio-1.5", modalities: ["text"], messages: [{ role: "user", content: [
          { type: "text", text: "Transcribe this audio verbatim, every word from start to finish. Output only the spoken words." },
          { type: "input_audio", input_audio: { data: buf.toString("base64"), format: "mp3" } }] }] }),
      });
      let t = ((await r.json()).choices?.[0]?.message?.content ?? "").trim();
      const wrapped = t.match(/^\{\s*"[a-z_]+"\s*:\s*"([\s\S]*)"\s*\}$/i); // the listener sometimes answers in JSON
      if (wrapped) t = wrapped[1];
      t = t.replace(/^transcription:\s*/i, "");
      if (t) return t;
    } catch { /* retry */ }
  }
  return "";
}

/** Words of the script the listener did not hear, in order (longest common subsequence). */
function missingWords(script, heard) {
  const a = words(script), b = words(heard);
  const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const missing = [];
  let i = 0, j = 0;
  while (i < a.length) {
    if (j < b.length && a[i] === b[j]) { i++; j++; } else if (j < b.length && L[i][j + 1] >= L[i + 1][j]) j++; else missing.push([i, a[i++]]);
  }
  return { total: a.length, missing };
}

const rows = [...lines.values()];
const out = [];
let next = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < rows.length) {
    const row = rows[next++];
    const file = join(ROOT, "app/public/clips", row.book, "audio/lines", `${row.id}.mp3`);
    if (!existsSync(file)) { out.push({ ...row, verdict: "MISSING FILE" }); continue; }
    const buf = readFileSync(file);
    const take = await measure(buf);
    const problem = take && flaw(take, words(row.text).length);
    let heard = await listen(buf), gap = missingWords(row.text, heard);
    // One more listen before blaming the recording: the listener itself sometimes stops early.
    if (gap.missing.length) {
      const again = await listen(buf), gap2 = missingWords(row.text, again);
      if (gap2.missing.length < gap.missing.length) { heard = again; gap = gap2; }
    }
    const lostEnding = gap.missing.some(([i]) => i >= gap.total - 2);
    const verdict = problem ? `AUDIO: ${problem}` : lostEnding ? "ENDING NOT HEARD" : gap.missing.length > Math.max(1, gap.total * 0.1) ? "WORDS NOT HEARD" : gap.missing.length ? "minor" : "ok";
    out.push({ ...row, verdict, seconds: take && +take.seconds.toFixed(1), hole: take && +take.hole.toFixed(1), tail: take && +take.tail.toFixed(1), missing: gap.missing.map(([, w]) => w).join(" "), heard });
    if (out.length % 50 === 0) console.error(`${out.length}/${rows.length}`);
  }
}));

out.sort((x, y) => (x.verdict === "ok") - (y.verdict === "ok") || x.used[0].localeCompare(y.used[0]));
mkdirSync(join(ROOT, "audit"), { recursive: true });
writeFileSync(join(ROOT, "audit/narration-audit.json"), JSON.stringify({ checked: new Date().toISOString(), lines: out.length, results: out }, null, 2) + "\n");
const tally = {};
for (const r of out) tally[r.verdict.split(":")[0]] = (tally[r.verdict.split(":")[0]] ?? 0) + 1;
console.log(JSON.stringify(tally));
for (const r of out.filter((r) => r.verdict !== "ok")) console.log(`${r.verdict.padEnd(40)} ${r.id} [${r.used[0]}] "${r.text.slice(0, 70)}" | missing: ${r.missing}`);
