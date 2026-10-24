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
const FX = new Set(["rain", "embers", "sparks", "ash", "dust", "glitter", "snow", "frost", "flicker", "mist"]);

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

// The gateway's voices are each a man's or a woman's; a voice direction cannot change that. A man's card on a
// woman's voice (Daniel on "sage", 2026-10-23) sounds wrong to the player, so a mismatch fails the build.
const WOMEN_VOICES = new Set(["coral", "nova", "sage", "shimmer", "marin"]);
const MEN_VOICES = new Set(["ash", "ballad", "echo", "fable", "onyx", "verse", "cedar"]);
const SAYS_MAN = /\b(man|men|boy|brother|son|husband|king|father|englishman|gentleman|nobleman|warrior)\b/i;
const SAYS_WOMAN = /\b(woman|women|girl|sister|daughter|queen|mother|lady|wife)\b/i;
function checkVoice(where, voice, direction) {
  if (!voice || !direction) return;
  const man = SAYS_MAN.test(direction), woman = SAYS_WOMAN.test(direction);
  if (man && !woman && WOMEN_VOICES.has(voice)) err(`${where}: a man's voice direction on the woman's voice "${voice}"`);
  if (woman && !man && MEN_VOICES.has(voice)) err(`${where}: a woman's voice direction on the man's voice "${voice}"`);
}

// Every book's scenes and the flags its choices can set, so one book may remember another ("sandman:HOB_FRIEND").
const ALL = {};
for (const dir of readdirSync(BOOKS)) {
  const f = join(BOOKS, dir, "book.json");
  if (!existsSync(f)) continue;
  const b = JSON.parse(readFileSync(f, "utf8"));
  const set = new Set();
  for (const sc of Object.values(b.scenes)) {
    for (const c of sc.choices ?? []) { for (const k of Object.keys(c.effects?.flags ?? {})) set.add(k); for (const e of c.effectsIf ?? []) for (const k of Object.keys(e.effects?.flags ?? {})) set.add(k); }
    for (const c of Object.values(sc.conversation?.consequences ?? {})) for (const k of Object.keys(c.effects?.flags ?? {})) set.add(k);
  }
  ALL[b.id] = { scenes: b.scenes, flags: set };
}
/** A condition naming another book must name a book, scene or flag that exists. */
function checkForeign(where, f) {
  const i = f.indexOf(":");
  const other = ALL[f.slice(0, i)], rest = f.slice(i + 1);
  if (!other) return err(`${where}: "${f}" names a book that does not exist`);
  const scenes = rest.startsWith("@") ? [rest.slice(1)] : rest.startsWith("last=") ? rest.slice(5).split("|") : [];
  for (const s of scenes) if (!other.scenes[s]) err(`${where}: "${f}": ${f.slice(0, i)} has no scene ${s}`);
  if (!scenes.length && !other.flags.has(rest)) err(`${where}: "${f}": no choice in ${f.slice(0, i)} sets ${rest}`);
}

for (const dir of readdirSync(BOOKS)) {
  const bookFile = join(BOOKS, dir, "book.json");
  if (!existsSync(bookFile)) continue;
  const book = JSON.parse(readFileSync(bookFile, "utf8"));
  const cards = existsSync(join(CARDS, `${book.id}.json`)) ? JSON.parse(readFileSync(join(CARDS, `${book.id}.json`), "utf8")) : {};
  const media = join(APP, "public", "clips", book.id);
  const haveMedia = existsSync(media);
  // A book still being built is missing most of its media by design: count it as progress, not as failures.
  let notYet = 0;
  const want = (m) => (book.status === "planning" ? notYet++ : err(m));
  const S = book.scenes;
  for (const [id, card] of Object.entries(cards)) {
    if (!card || typeof card !== "object") continue;
    checkVoice(`${book.id} card ${id}`, card.ttsVoice, card.voiceDirection);
    for (const [label, sp] of Object.entries(card.speakers ?? {})) checkVoice(`${book.id} card ${id} ${label}`, sp?.ttsVoice, sp?.voiceDirection);
  }
  if (!S[book.start]) err(`${book.id}: start scene "${book.start}" does not exist`);

  for (const [sid, sc] of Object.entries(S)) {
    const at = `${book.id} ${sid}`;
    if (sc.id !== sid) err(`${at}: id "${sc.id}" does not match its key`);
    if (!Array.isArray(sc.beats)) err(`${at}: no beats`);
    if (sc.next && !S[sc.next]) err(`${at}: next "${sc.next}" does not exist`);
    for (const b of [...(sc.branch ?? []), ...(sc.choices ?? []).flatMap((c) => c.branch ?? [])]) if (!S[b.next]) err(`${at}: branch to missing scene "${b.next}"`);
    if (sc.fx && !FX.has(sc.fx)) err(`${at}: unknown fx "${sc.fx}"`);
    if (sc.retryFrom) {
      if (sc.type !== "end") err(`${at}: retryFrom is only for dead ends (type "end")`);
      if (!S[sc.retryFrom]) err(`${at}: retryFrom "${sc.retryFrom}" does not exist`);
      else {
        // The scene she goes back to must be able to lead here again, or the dead end can never be undone.
        const seen = new Set(); const st = [sc.retryFrom];
        while (st.length) { const x = st.pop(); if (seen.has(x) || !S[x]) continue; seen.add(x); const s = S[x]; if (s.next) st.push(s.next); for (const c of s.choices ?? []) st.push(c.next, ...(c.branch ?? []).map((b) => b.next)); for (const b of s.branch ?? []) st.push(b.next); }
        if (!seen.has(sid)) err(`${at}: going back to ${sc.retryFrom} cannot lead to this dead end again`);
      }
    }
    // Owner's rule: endings and dead ends play on video.
    if (sc.type === "end" && book.status === "planning" && !(sc.beats ?? []).some((b) => b.clip) && !/credits/i.test(sc.title ?? "")) err(`${at}: an ending or dead end must have a video, not only stills`);
    const bed = (id) => haveMedia && id && id !== "none" && !existsSync(join(media, "audio", "ambience", `${id}.mp3`));
    if (bed(sc.ambience)) err(`${at}: ambience ${sc.ambience}.mp3 is missing (run tools/gen_ambience.py)`);

    const allBeats = [...(sc.beats ?? []), ...(sc.choices ?? []).flatMap((c) => c.aftermath ?? [])];
    for (const b of allBeats) {
      if (b.fx && !FX.has(b.fx)) err(`${at}: unknown fx "${b.fx}"`);
      if (haveMedia && b.clip && !existsSync(join(media, `${b.clip}.mp4`))) want(`${at}: clip ${b.clip}.mp4 is missing`);
      if (haveMedia && b.still && !existsSync(join(media, "stills", `${b.still}.jpg`))) want(`${at}: still ${b.still}.jpg is missing`);
      if (bed(b.ambience)) err(`${at}: ambience ${b.ambience}.mp3 is missing (run tools/gen_ambience.py)`);
      if (haveMedia && b.sfx && !existsSync(join(media, "audio", "sfx", `${b.sfx}.mp3`))) want(`${at}: sound effect ${b.sfx}.mp3 is missing (run tools/gen_sfx.py)`);
      if (haveMedia && b.text && !existsSync(join(media, "audio", "lines", `${lineId(b.text)}.mp3`))) want(`${at}: no narration recording for "${b.text.slice(0, 50)}" (run tools/gen_narration.py, then tools/pace_lines.py)`);
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

  // Flags: everything read (requires, if/unless, effectsIf, branches) must be settable; in a planning skeleton
  // everything set must also be read somewhere, or the choice that sets it changes nothing (56 of the Sandman's
  // 99 flags were set and never read, which is why Neverwhere locks its branch map first).
  const setFlags = new Set(), readFlags = new Set();
  const noteReq = (r) => { for (const f of [...(r?.flags ?? []), ...(r?.notFlags ?? [])]) readFlags.add(f); };
  for (const sc of Object.values(S)) {
    for (const b of sc.branch ?? []) noteReq(b.requires);
    for (const b of [...(sc.beats ?? []), ...(sc.choices ?? []).flatMap((c) => c.aftermath ?? [])]) for (const f of [...(b.if ?? []), ...(b.unless ?? [])]) readFlags.add(f);
    for (const c of sc.choices ?? []) {
      noteReq(c.requires);
      for (const b of c.branch ?? []) noteReq(b.requires);
      for (const e of c.effectsIf ?? []) { readFlags.add(e.flag); for (const f of Object.keys(e.effects?.flags ?? {})) setFlags.add(f); }
      for (const f of Object.keys(c.effects?.flags ?? {})) setFlags.add(f);
    }
    for (const c of Object.values(sc.conversation?.consequences ?? {})) { noteReq(c.requires); for (const f of Object.keys(c.effects?.flags ?? {})) setFlags.add(f); }
  }
  for (const f of [...readFlags].filter((x) => x.includes(":"))) { checkForeign(book.id, f); readFlags.delete(f); }
  for (const f of readFlags) if (!setFlags.has(f) && !f.startsWith("C_")) err(`${book.id}: flag ${f} is read but nothing ever sets it`);
  if (book.status === "planning") for (const f of setFlags) if (!readFlags.has(f)) err(`${book.id}: flag ${f} is set but never read (a choice that changes nothing)`);

  // The hero on screen (planning rule 2): where beats say who is in the picture, every scene except the
  // cutaways and endings must show Aurie at least once, and no cutaway may follow another.
  const hasCast = Object.values(S).some((sc) => (sc.beats ?? []).some((b) => b.cast));
  if (hasCast) {
    const isCut = (sc) => /^Cutaway/.test(sc.title ?? "");
    for (const [sid, sc] of Object.entries(S)) {
      const beats = [...(sc.beats ?? []), ...(sc.choices ?? []).flatMap((c) => c.aftermath ?? [])];
      if (!isCut(sc) && sc.type !== "end" && beats.some((b) => b.cast) && !beats.some((b) => b.cast?.some((c) => c === "aurie" || c.startsWith("aurie-")))) err(`${book.id} ${sid}: no picture of Aurie in this scene`);
      if (isCut(sc) && sc.next && S[sc.next] && isCut(S[sc.next])) err(`${book.id} ${sid}: two cutaways in a row (${sc.next})`);
    }
  }

  // The cast record (production/<book>-cast.json, where it exists: not on Vercel): every person or creature named in
  // a beat's cast must be there, as a character with a sheet or as background, so no one is drawn without a reference.
  const castFile = join(APP, "..", "production", `${book.id}-cast.json`);
  if (existsSync(castFile)) {
    const rec = JSON.parse(readFileSync(castFile, "utf8"));
    const known = new Set([...Object.keys(rec.characters ?? {}), ...Object.keys(rec.background ?? {})]);
    const missing = new Map();
    for (const [sid, sc] of Object.entries(S)) for (const b of [...(sc.beats ?? []), ...(sc.choices ?? []).flatMap((c) => c.aftermath ?? [])]) for (const w of b.cast ?? []) if (!known.has(w)) missing.set(w, sid);
    for (const [w, sid] of missing) err(`${book.id} ${sid}: "${w}" is in the picture but not in production/${book.id}-cast.json`);
    for (const [id, c] of Object.entries(rec.characters ?? {})) if (c.sheet && !existsSync(join(APP, "..", c.sheet)) && existsSync(join(APP, "..", "characters"))) warn(`${book.id}: ${id} has no sheet yet (${c.sheet})`);
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
    for (const c of sc.choices ?? []) stack.push(c.next, ...(c.branch ?? []).map((b) => b.next));
    for (const b of sc.branch ?? []) stack.push(b.next);
  }
  for (const id of Object.keys(S)) if (!reach.has(id)) warn(`${book.id} ${id}: no path from the start reaches this scene`);
  if (!haveMedia) warn(`${book.id}: media folder not present here, picture and narration checks skipped`);
  if (notYet) warn(`${book.id}: still being built, ${notYet} pictures, recordings or sounds not made yet`);
}

for (const w of warnings) console.log(`  note: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`\nStory check failed: ${errors.length} problem(s). Fix them before building.`);
  process.exit(1);
}
console.log("✓ Story check passed.");
