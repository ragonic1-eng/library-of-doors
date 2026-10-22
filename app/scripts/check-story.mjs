#!/usr/bin/env node
// Story check: runs before every build (npm "prebuild") and on demand (npm run check).
// Fails the build on anything a player would trip over: duplicate reply options, broken scene links,
// choices that are not exits, unknown characters, missing pictures or narration.
// Media checks run only where the media folder exists (a local machine), not on Vercel.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const BOOKS = join(APP, "src", "content", "books");
const CARDS = join(APP, "src", "content", "characters");
const FX = new Set(["rain", "embers", "ash", "dust", "glitter", "snow", "flicker", "mist"]);

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function lineId(text) {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(String(text).trim())) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

for (const dir of readdirSync(BOOKS)) {
  const bookFile = join(BOOKS, dir, "book.json");
  if (!existsSync(bookFile)) continue;
  const book = JSON.parse(readFileSync(bookFile, "utf8"));
  const cards = existsSync(join(CARDS, `${book.id}.json`)) ? JSON.parse(readFileSync(join(CARDS, `${book.id}.json`), "utf8")) : {};
  const media = join(APP, "public", "clips", book.id);
  const haveMedia = existsSync(media);
  const S = book.scenes;
  if (!S[book.start]) err(`${book.id}: start scene "${book.start}" does not exist`);

  for (const [sid, sc] of Object.entries(S)) {
    const at = `${book.id} ${sid}`;
    if (sc.id !== sid) err(`${at}: id "${sc.id}" does not match its key`);
    if (!Array.isArray(sc.beats)) err(`${at}: no beats`);
    if (sc.next && !S[sc.next]) err(`${at}: next "${sc.next}" does not exist`);
    if (sc.fx && !FX.has(sc.fx)) err(`${at}: unknown fx "${sc.fx}"`);

    const allBeats = [...(sc.beats ?? []), ...(sc.choices ?? []).flatMap((c) => c.aftermath ?? [])];
    for (const b of allBeats) {
      if (b.fx && !FX.has(b.fx)) err(`${at}: unknown fx "${b.fx}"`);
      if (haveMedia && b.clip && !existsSync(join(media, `${b.clip}.mp4`))) err(`${at}: clip ${b.clip}.mp4 is missing`);
      if (haveMedia && b.still && !existsSync(join(media, "stills", `${b.still}.jpg`))) err(`${at}: still ${b.still}.jpg is missing`);
      if (haveMedia && b.text && !existsSync(join(media, "audio", "lines", `${lineId(b.text)}.mp3`))) err(`${at}: no narration recording for "${b.text.slice(0, 50)}" (run tools/gen_narration.py, then tools/pace_lines.py)`);
    }

    const ids = new Set();
    for (const c of sc.choices ?? []) {
      if (ids.has(c.id)) err(`${at}: choice id ${c.id} appears twice`);
      ids.add(c.id);
      if (!S[c.next]) err(`${at}: choice ${c.id} goes to missing scene "${c.next}"`);
    }

    const cv = sc.conversation;
    if (cv) {
      if (!cards[cv.character]) err(`${at}: character "${cv.character}" has no card`);
      for (const id of ids) if (!(id in (cv.exits ?? {}))) err(`${at}: choice ${id} is not one of the conversation's exits`);
      for (const id of Object.keys(cv.exits ?? {})) if (!ids.has(id)) err(`${at}: exit ${id} has no choice to play`);
      for (const t of cv.triggers ?? []) {
        if (!(t.exit in (cv.exits ?? {}))) err(`${at}: trigger points at unknown exit ${t.exit}`);
        try { new RegExp(t.player, "i"); if (t.afterCharacter) new RegExp(t.afterCharacter, "i"); } catch { err(`${at}: trigger has an invalid pattern`); }
      }
      // Everything offered under Ideas must be distinct, so no line ever appears twice.
      const offered = [...(cv.suggestions ?? []), ...(sc.choices ?? []).map((c) => c.text)];
      const seen = new Map();
      for (const o of offered) {
        const k = norm(o);
        if (seen.has(k)) err(`${at}: the line "${o}" is offered twice under Ideas`);
        seen.set(k, o);
      }
      if (!cv.opening) warn(`${at}: conversation has no opening line`);
    } else {
      const offered = (sc.choices ?? []).map((c) => norm(c.text));
      if (new Set(offered).size !== offered.length) err(`${at}: two choices have the same text`);
    }
  }

  // Every scene must be reachable from the start.
  const reach = new Set();
  const stack = [book.start];
  while (stack.length) {
    const id = stack.pop();
    if (reach.has(id) || !S[id]) continue;
    reach.add(id);
    const sc = S[id];
    if (sc.next) stack.push(sc.next);
    for (const c of sc.choices ?? []) stack.push(c.next);
  }
  for (const id of Object.keys(S)) if (!reach.has(id)) warn(`${book.id} ${id}: no path from the start reaches this scene`);
  if (!haveMedia) warn(`${book.id}: media folder not present here, picture and narration checks skipped`);
}

for (const w of warnings) console.log(`  note: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`\nStory check failed: ${errors.length} problem(s). Fix them before building.`);
  process.exit(1);
}
console.log("✓ Story check passed.");
