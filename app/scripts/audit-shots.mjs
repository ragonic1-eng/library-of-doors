#!/usr/bin/env node
// Audit a book's video prompts before anything is generated (plan rule: no clip is rendered from an unaudited prompt).
//   node scripts/audit-shots.mjs <bookId> [--strict]
// Reads the shot list (src/content/books/<book>/shots.json), the story (book.json) and the cast record
// (../production/<book>-cast.json). Every clip beat in the story must have a shot, and every shot must pass:
//   - it belongs to a real clip beat, and its people are exactly the beat's cast
//   - every person has an approved sheet in the cast record, and is named in the keyframe
//   - Aurie: the outfit the story has her in at that scene; medium framing, calm face (likeness rules)
//   - continuity: Door filthy before she washes, the marquis's blanket and cut throat after he comes back,
//     Hunter's spear after the betrayal, the Beast always huge
//   - a novel passage (lines) to check it against, a location, a duration within reason
// Exit code 1 if any shot fails, so it can gate generate-clips. --strict also fails on warnings.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(APP, "..");
const bookId = process.argv[2];
const strict = process.argv.includes("--strict");
if (!bookId) { console.error("usage: audit-shots.mjs <bookId> [--strict]"); process.exit(1); }
const book = JSON.parse(readFileSync(join(APP, "src", "content", "books", bookId, "book.json"), "utf8"));
const shotsFile = join(APP, "src", "content", "books", bookId, "shots.json");
const castFile = join(ROOT, "production", `${bookId}-cast.json`);
const shots = existsSync(shotsFile) ? JSON.parse(readFileSync(shotsFile, "utf8")).shots ?? {} : {};
const cast = existsSync(castFile) ? JSON.parse(readFileSync(castFile, "utf8")) : { characters: {}, background: {} };
const S = book.scenes;

// Scene order: "9.4" -> [9, 4]
const ord = (id) => id.split(".").map(Number);
const cmp = (a, b) => { const [x1, y1] = ord(a), [x2, y2] = ord(b); return x1 - x2 || y1 - y2; };
const within = (id, from, to) => cmp(id, from) >= 0 && (!to || cmp(id, to) <= 0);

// Every clip and still beat in the story, with its scene and cast; every talk's loop key.
const clipBeats = new Map(), stillBeats = new Map(), talkLoops = new Map();
for (const [sid, sc] of Object.entries(S)) {
  for (const b of [...sc.beats, ...(sc.choices ?? []).flatMap((c) => c.aftermath ?? [])]) {
    if (b.clip && !clipBeats.has(b.clip)) clipBeats.set(b.clip, { scene: sid, cast: b.cast ?? [], text: b.text ?? "" });
    if (b.still && !stillBeats.has(b.still)) stillBeats.set(b.still, { scene: sid, cast: b.cast ?? [], text: b.text ?? "" });
  }
  if (sc.conversation?.loop) talkLoops.set(sc.conversation.loop, sid);
}

const problems = [], warnings = [];
const fail = (id, m) => problems.push(`${id}: ${m}`);
const warn = (id, m) => warnings.push(`${id}: ${m}`);
const has = (text, words) => words.some((w) => new RegExp(w, "i").test(text));

for (const [clip, beat] of clipBeats) if (!shots[clip]) warn(clip, `clip beat in ${beat.scene} has no shot yet`);

for (const [id, sh] of Object.entries(shots)) {
  const kind = sh.kind ?? "clip", moving = kind !== "still";
  // A talking loop belongs to a talk scene; its people are the ones who speak there.
  const beat = kind === "clip" ? clipBeats.get(id) : kind === "still" ? stillBeats.get(id)
    : talkLoops.get(sh.key) ? { scene: talkLoops.get(sh.key), cast: sh.cast ?? [] } : null;
  if (!beat) { fail(id, kind === "loop" ? `no talk scene has loop "${sh.key}"` : `no ${kind} beat in the story uses this shot`); continue; }
  if (kind === "loop" && !S[beat.scene].conversation.character.split("-").every((c) => !cast.characters?.[c] || (sh.cast ?? []).includes(c))) fail(id, "the loop must show the character who talks");
  const sid = sh.scene ?? beat.scene;
  // A finished picture reused from an earlier book: only who is in it is checked.
  if (sh.reuse) {
    if (!existsSync(join(ROOT, sh.reuse.split("#")[0]))) fail(id, `reused picture ${sh.reuse} is missing`);
    const w = new Set(beat.cast), g = new Set(sh.cast ?? []);
    if ([...w].some((x) => !g.has(x)) || [...g].some((x) => !w.has(x))) fail(id, `cast [${[...g]}] differs from the beat's cast [${[...w]}]`);
    continue;
  }
  const kf = sh.keyframe ?? "", mo = sh.motion ?? "", all = `${kf}\n${mo}`;
  for (const f of ["keyframe", ...(moving ? ["motion"] : []), "location", "source"]) if (!sh[f]) fail(id, `missing ${f}`);
  if (sh.source && !/lines?\s*\d+/i.test(sh.source) && !/bridge|added|dead end|ending/i.test(sh.source)) fail(id, "source must name the novel lines it is checked against");
  if ((sh.seconds ?? 5) > 10) fail(id, "longer than 10 seconds");
  const want = new Set(beat.cast), got = new Set(sh.cast ?? []);
  if ([...want].some((w) => !got.has(w)) || [...got].some((g) => !want.has(g))) fail(id, `cast [${[...got]}] differs from the beat's cast [${[...want]}]`);
  for (const w of got) {
    const c = cast.characters?.[w];
    if (!c) { if (!cast.background?.[w]) fail(id, `${w} is not in the cast record`); continue; }
    if (!c.approved) warn(id, `${w}'s sheet is not approved yet`);
    const first = c.name.replace(/^The /, "").split(/[ ,]/)[0];
    const named = has(kf, [first, c.name]) || (w.startsWith("aurie") && /Aurie/.test(kf));
    if (!named) fail(id, `${c.name} is in the shot but not named in the keyframe`);
  }
  // Aurie: her outfit at this point in the story, and the likeness rules.
  if (got.has("aurie")) {
    const look = (cast.characters.aurie.looks ?? []).find((l) => within(sid, l.from, l.to));
    if (look && !kf.toLowerCase().includes(look.key.split(" ")[0])) fail(id, `Aurie's look here is "${look.key}" (${look.look}); the keyframe must say so`);
    if (moving && has(kf, ["extreme close", "close-up of (her|aurie)", "macro"])) fail(id, "Aurie in a close-up: keep her at medium shot in video (LIKENESS rule 2)");
    if (moving && has(mo, ["turns? (her head )?to(ward)? (the )?camera", "screams?", "laughs? (out loud|loudly)", "whips? (her )?head", "spins? round"]) && !/from behind|back to (the )?camera|silhouette/i.test(all)) fail(id, "Aurie's face moves too much for video (LIKENESS rules 3 and 4): calm her, or show her from behind");
  }
  // Continuity from the cast record.
  const door = cast.characters?.door?.continuity, mq = cast.characters?.marquis?.continuity, hu = cast.characters?.hunter?.continuity;
  if (got.has("door") && door && cmp(sid, door.filthyUntil) < 0 && !has(kf, ["filthy", "grim", "blood", "dirt"])) fail(id, `Door is ${door.filthy} until ${door.filthyUntil}`);
  if (got.has("marquis") && mq && cmp(sid, mq.afterDeathFrom) >= 0 && !has(kf, ["blanket", "cloth round his throat", "throat"])) fail(id, `after ${mq.afterDeathFrom} the marquis is ${mq.afterDeath}`);
  if (got.has("hunter") && hu && within(sid, hu.spearFrom, hu.spearTo) && !has(kf, ["spear"])) warn(id, `Hunter carries ${hu.spear} here`);
  if (got.has("beast") && !has(kf, ["huge", "enormous", "towering", "size of", "dwarfs", "colossal", "elephant"])) fail(id, "the Beast must read huge against people and tunnels: say its scale");
  if (got.has("islington") && /\bit\b(?! (is|was|has))/.test(kf) && !/\bshe\b|\bher\b/i.test(kf)) warn(id, "Islington is a woman: 'she', not 'it'");
  // Owner's rules 15 and 16: one locked look per place, and true sizes for people and objects.
  const pl = cast.places?.[sh.place];
  if (!pl) fail(id, `place "${sh.place ?? ""}" is not in the cast record's places`);
  else {
    if (sh.location !== pl.look) fail(id, `location has drifted from the place's locked look (${sh.place})`);
    if (!pl.approved) warn(id, `place ${sh.place} has no approved reference plate yet`);
    if (!(sh.scale ?? "").includes(pl.scale)) fail(id, `scale line must carry the place's size anchors (${sh.place})`);
  }
  for (const w of got) {
    const c = cast.characters?.[w];
    if (c && typeof c.height !== "number") fail(id, `${c.name} has no height in the cast record`);
    else if (c && !(sh.scale ?? "").includes(`${c.height} m`)) fail(id, `scale line must give ${c.name}'s height (${c.height} m)`);
  }
  // Faces turned to camera for minor characters are fine; a talking character speaking to camera belongs in a talking loop.
  if (kind === "clip" && has(mo, ["talks? to (the )?camera", "speaks? to (the )?camera", "lip ?sync"])) warn(id, "talking to camera belongs in a talking loop, not a scene clip");
}

// No accidental jumps: a picture whose place differs from the picture before it (same scene, same run of beats)
// must say why in `newPlace` (travel, a variant opening, a dream); otherwise the set has drifted.
for (const [sid, sc] of Object.entries(S)) for (const list of [sc.beats, ...(sc.choices ?? []).map((c) => c.aftermath ?? [])]) {
  let prev = null;
  for (const b of list) {
    const pic = b.clip ?? b.still; if (!pic) continue;
    const sh = shots[pic];
    if (!sh || sh.reuse || !sh.place) { prev = null; continue; }
    if (prev && sh.place !== prev && !sh.newPlace) fail(pic, `in ${sid} the place jumps from ${prev} to ${sh.place}: give newPlace (why the set changes) or keep the set`);
    prev = sh.place;
  }
}

const n = Object.keys(shots).length;
console.log(`${book.title}: ${clipBeats.size} clip beats, ${stillBeats.size} still beats, ${talkLoops.size} talks; ${n} shots written`);
for (const w of warnings) console.log(`  note: ${w}`);
for (const p of problems) console.log(`  ✗ ${p}`);
if (problems.length || (strict && warnings.length)) { console.log(`\nShot audit failed: ${problems.length} problem(s)${strict ? `, ${warnings.length} warning(s)` : ""}.`); process.exit(1); }
console.log("✓ Shot audit passed.");
