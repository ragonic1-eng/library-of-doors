#!/usr/bin/env node
// Upload finished clips to the Vercel Blob store under their exact names
// (the CLI's --add-random-suffix flag does not take effect in this version).
//
//   npm run upload                 upload every clip in app/public/clips not yet in the store (or changed in size)
//   npm run upload -- --force      re-upload everything
//   npm run upload -- --list       show what the store holds
//
// Needs BLOB_READ_WRITE_TOKEN: `vercel env pull .env.local` in the project root provides it.

import { readdirSync, statSync, createReadStream, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { put, list } from "@vercel/blob";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
for (const f of [join(ROOT, ".env.local"), join(ROOT, "app", ".env.local")]) {
  if (existsSync(f)) try { process.loadEnvFile(f); } catch { /* ignore */ }
}
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) { console.error("BLOB_READ_WRITE_TOKEN missing. Run `vercel env pull .env.local` in the project root."); process.exit(1); }

const LOCAL = join(ROOT, "app", "public", "clips");
const force = process.argv.includes("--force");

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : /\.(mp4|mp3|ogg|wav)$/i.test(d.name) ? [join(dir, d.name)] : []));
}

async function remote() {
  const seen = new Map();
  let cursor;
  do {
    const page = await list({ token, prefix: "clips/", cursor, limit: 1000 });
    for (const b of page.blobs) seen.set(b.pathname, b);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return seen;
}

const have = await remote();
if (process.argv.includes("--list")) {
  for (const [p, b] of have) console.log(`${(b.size / 1e6).toFixed(1).padStart(6)} MB  ${p}`);
  console.log(`${have.size} files`);
  process.exit(0);
}

const files = walk(LOCAL);
let up = 0, skipped = 0, failed = 0;
for (const f of files) {
  const pathname = "clips/" + relative(LOCAL, f).split("\\").join("/");
  const size = statSync(f).size;
  const existing = have.get(pathname);
  if (!force && existing && existing.size === size) { skipped++; continue; }
  try {
    const r = await put(pathname, createReadStream(f), {
      access: "public", token, addRandomSuffix: false, allowOverwrite: true,
      contentType: f.endsWith(".mp4") ? "video/mp4" : f.endsWith(".ogg") ? "audio/ogg" : f.endsWith(".wav") ? "audio/wav" : "audio/mpeg", cacheControlMaxAge: 31536000,
    });
    up++;
    console.log(`↑ ${pathname} -> ${r.url}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${pathname}: ${e.message}`);
  }
}
console.log(`uploaded ${up}, unchanged ${skipped}, failed ${failed}`);
process.exit(failed ? 1 : 0);
