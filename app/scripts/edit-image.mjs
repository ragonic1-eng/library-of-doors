#!/usr/bin/env node
// Edit an approved image while keeping everything else, above all the face, identical.
// Safer than generating anew when likeness matters.
//   node scripts/edit-image.mjs <source.png> <out.png> "<what to change>" [--score aurie|alex]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
for (const f of [join(ROOT, ".env"), join(ROOT, "app", ".env.local")]) if (existsSync(f)) try { process.loadEnvFile(f); } catch { /* ignore */ }
const BASE = (process.env.INFISTAR_BASE_URL ?? "https://infistar.ai/v1").replace(/\/$/, "");
const MODEL = process.env.MODEL_IMAGE_GEMINI ?? "gemini-3-pro-image";
const [src, out, change] = process.argv.slice(2);
const who = process.argv.includes("--score") ? process.argv[process.argv.indexOf("--score") + 1] : null;
if (!src || !out || !change) { console.error('usage: edit-image.mjs <source> <out> "<change>" [--score aurie]'); process.exit(1); }

const prompt = `Edit the attached photograph. Keep it exactly the same: identical person, identical face shape and features, framing, camera, lens, lighting, background, clothing and colours, pixel for pixel wherever possible. Change ONLY this: ${change}. The face must remain an exact likeness of the person in the photograph; do not slim, reshape, beautify or age it.`;
const res = await fetch(`${new URL(BASE).origin}/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.INFISTAR_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: [{ role: "user", parts: [{ inlineData: { mimeType: "image/png", data: readFileSync(resolve(src)).toString("base64") } }, { text: prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "16:9" } },
  }),
});
const j = await res.json();
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
