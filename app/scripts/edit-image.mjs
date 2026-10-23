#!/usr/bin/env node
// Edit an approved image while keeping everything else, above all the face, identical.
// Safer than generating anew when likeness matters.
//   node scripts/edit-image.mjs <source.png> <out.png> "<what to change>" [--score aurie|alex] [--ref <image> ...]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { slowFetch } from "./slow-fetch.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
for (const f of [join(ROOT, ".env"), join(ROOT, "app", ".env.local")]) if (existsSync(f)) try { process.loadEnvFile(f); } catch { /* ignore */ }
const BASE = (process.env.INFISTAR_BASE_URL ?? "https://infistar.ai/v1").replace(/\/$/, "");
const MODEL = process.env.MODEL_IMAGE_GEMINI ?? "gemini-3-pro-image";
const [src, out, change] = process.argv.slice(2);
const who = process.argv.includes("--score") ? process.argv[process.argv.indexOf("--score") + 1] : null;
// Extra reference images (a character sheet for someone the edit adds), sent after the photograph.
const refs = process.argv.flatMap((a, i) => (a === "--ref" ? [process.argv[i + 1]] : []));
if (!src || !out || !change) { console.error('usage: edit-image.mjs <source> <out> "<change>" [--score aurie]'); process.exit(1); }

const prompt = `Edit the first attached photograph. Keep it exactly the same: identical person, identical face shape and features, framing, camera, lens, lighting, background, clothing and colours, pixel for pixel wherever possible. Change ONLY this: ${change}. The face must remain an exact likeness of the person in the photograph; do not slim, reshape, beautify or age it.${refs.length ? " The other attached images are only references for the look of anyone or anything the change adds." : ""}`;
// Ranked backups, tried in order when a model's gateway channel is down (same request format).
const MODELS = [...new Set([MODEL, ...(process.env.MODEL_IMAGE_FALLBACK ?? "gemini-3.1-flash-image,gemini-nano-banana-2.1,gemini-3-pro-image").split(",").map((m) => m.trim()).filter(Boolean)])];
let j;
for (const model of MODELS) {
  let res;
  try {
    res = await slowFetch(`${new URL(BASE).origin}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.INFISTAR_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [src, ...refs].map((f) => ({ inlineData: { mimeType: "image/png", data: readFileSync(resolve(f)).toString("base64") } })).concat({ text: prompt }) }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "16:9" } },
    }),
  });
  } catch (e) {
    if (e.silent) { console.error(`${model} is silent (${e.message}), trying the next model`); continue; }
    throw e;
  }
  const text = await res.text();
  if (res.status === 404 || /no available channel|model_not_found|不在当前供应目录/i.test(text)) { console.error(`${model} is down, trying the next model`); continue; }
  j = JSON.parse(text);
  if (model !== MODEL) console.error(`(made with backup model ${model})`);
  break;
}
if (!j) { console.error("every image model is down"); process.exit(1); }
const part = (j.candidates ?? []).flatMap((c) => c.content?.parts ?? []).find((p) => p.inlineData?.data || p.inline_data?.data);
if (!part) { console.error("no image returned", JSON.stringify(j).slice(0, 300)); process.exit(1); }
writeFileSync(resolve(out), Buffer.from((part.inlineData ?? part.inline_data).data, "base64"));
let score = "";
if (who) {
  try {
    score = execFileSync("python", ["-I", join(ROOT, "tools", "face_score.py"), who, resolve(out)], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().split("\n").pop();
  } catch { score = "(scoring failed)"; }
}
console.log(`saved ${out} ${score}`);
