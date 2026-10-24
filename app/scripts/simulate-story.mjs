#!/usr/bin/env node
// Play a book many times with random choices and report what the map really reaches.
//   node scripts/simulate-story.mjs <bookId> [plays=3000] [--policy random|kind|cruel]
// kind always takes the option that gives the most LOYALTY (the generous player), cruel the least.
// Used in Phase 1 (the branch spine lock) before any script, picture or voice exists: every scene and every
// ending must be reachable, every flag that is set must be read somewhere, and no choice may be dead.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { applyEffect, meets, newProfile, route } from "../src/lib/state/profile.ts";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const bookId = process.argv[2];
const policy = process.argv.includes("--policy") ? process.argv[process.argv.indexOf("--policy") + 1] : "random";
const plays = policy === "random" ? Number((process.argv.slice(3).find((a) => /^\d+$/.test(a))) ?? 3000) : 1;
const loy = (c) => c.effects?.traits?.loyalty ?? 0;
if (!bookId) { console.error("usage: simulate-story.mjs <bookId> [plays]"); process.exit(1); }
const book = JSON.parse(readFileSync(join(APP, "src", "content", "books", bookId, "book.json"), "utf8"));
const S = book.scenes;

const reached = new Map(); // scene -> plays that reached it
const endings = new Map();
const deaths = new Map(); // dead ends hit (the player then goes back and plays on)
const taken = new Map(); // choice id -> times taken
const flagsSet = new Set();
let longest = 0;
const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);

// Conditions on other books ("sandman:HOB_FRIEND", "sandman:@2.6", "sandman:last=end-A|end-B"): each play gets a
// random history in those books (one of the endings or none, each named scene and flag at even odds), so every
// bridge variant and echo is exercised; the kind and cruel players have no history in other books.
const foreign = new Set();
const noteF = (f) => { if (f.includes(":")) foreign.add(f); };
for (const sc of Object.values(S)) for (const x of [sc, ...(sc.choices ?? [])]) {
  for (const f of [...(x.requires?.flags ?? []), ...(x.requires?.notFlags ?? [])]) noteF(f);
  for (const b of x.branch ?? []) for (const f of [...(b.requires?.flags ?? []), ...(b.requires?.notFlags ?? [])]) noteF(f);
  for (const b of [...(x.beats ?? []), ...(x.aftermath ?? [])]) for (const f of [...(b.if ?? []), ...(b.unless ?? [])]) noteF(f);
}
function history() {
  const visited = {}, flags = {};
  const coin = () => Math.random() < 0.5;
  const endingSets = new Map();
  for (const f of foreign) {
    const [other, rest] = [f.slice(0, f.indexOf(":")), f.slice(f.indexOf(":") + 1)];
    visited[other] ??= []; flags[other] ??= {};
    if (rest.startsWith("last=")) endingSets.set(other, new Set([...(endingSets.get(other) ?? []), ...rest.slice(5).split("|")]));
    else if (rest.startsWith("@")) { if (coin() && !visited[other].includes(rest.slice(1))) visited[other].push(rest.slice(1)); }
    else if (coin()) flags[other][rest] = true;
  }
  for (const [other, set] of endingSets) { const list = [...set]; const pick = Math.floor(Math.random() * (list.length + 1)); if (pick < list.length) visited[other].push(list[pick]); }
  const p = newProfile();
  p.flags = flags;
  p.visited = visited.sandman ?? [];
  p.visitedBy = Object.fromEntries(Object.entries(visited).filter(([k]) => k !== "sandman"));
  return p;
}

for (let n = 0; n < plays; n++) {
  let p = policy === "random" ? history() : newProfile();
  let id = book.start;
  const seen = new Set();
  const snaps = new Map(); // scene -> her state on arriving, as the player keeps for dead ends
  let steps = 0, retries = 0;
  while (id && S[id] && steps++ < 600) {
    const sc = S[id];
    if (!seen.has(id)) { seen.add(id); bump(reached, id); }
    snaps.set(id, p);
    if (sc.type === "end") {
      bump(endings, id);
      if (sc.retryFrom && retries++ < 12) { bump(deaths, id); p = snaps.get(sc.retryFrom) ?? p; id = sc.retryFrom; continue; }
      if (sc.next && S[sc.next]?.type === "end") { id = sc.next; continue; }
      break;
    }
    const options = (sc.choices ?? []).filter((c) => meets(p, bookId, c.requires));
    if (options.length) {
      const c = policy === "kind" ? options.reduce((a, b) => (loy(b) > loy(a) ? b : a)) : policy === "cruel" ? options.reduce((a, b) => (loy(b) < loy(a) ? b : a)) : options[Math.floor(Math.random() * options.length)];
      bump(taken, c.id);
      p = applyEffect(p, bookId, c.effects);
      for (const e of c.effectsIf ?? []) if (p.flags[bookId]?.[e.flag]) p = applyEffect(p, bookId, e.effects);
      for (const f of Object.keys(c.effects?.flags ?? {})) flagsSet.add(f);
      id = route(p, bookId, c) ?? c.next;
    } else if (sc.choices?.length) {
      console.log(`  ✗ ${id}: no choice is available to this player (flags ${JSON.stringify(p.flags[bookId] ?? {})})`);
      break;
    } else {
      id = route(p, bookId, sc) ?? sc.next;
    }
  }
  longest = Math.max(longest, steps);
}

const pct = (k) => `${Math.round(((reached.get(k) ?? 0) / plays) * 100)}%`;
console.log(`${book.title}: ${plays} ${policy} play(s), ${Object.keys(S).length} scenes, longest play ${longest} scenes`);
console.log("Dead ends hit (then played on from the retry scene):", [...Object.keys(S)].filter((k) => S[k].retryFrom).map((k) => `${k} ${Math.round(((deaths.get(k) ?? 0) / plays) * 100)}%`).join("  ") || "none");
console.log("Final endings:", [...Object.keys(S)].filter((k) => S[k].type === "end" && !S[k].retryFrom).map((k) => `${k} ${Math.round(((endings.get(k) ?? 0) / plays) * 100)}%`).join("  "));
const never = Object.keys(S).filter((k) => !reached.has(k));
console.log(never.length ? `✗ never reached: ${never.join(" ")}` : "✓ every scene was reached");
const rare = Object.keys(S).filter((k) => reached.has(k) && (reached.get(k) ?? 0) / plays < 0.02);
if (rare.length) console.log(`  rare (under 2% of plays): ${rare.map((k) => `${k} ${pct(k)}`).join("  ")}`);
const dead = Object.values(S).flatMap((sc) => sc.choices ?? []).filter((c) => !taken.has(c.id)).map((c) => c.id);
console.log(dead.length ? `✗ choices never available: ${dead.join(" ")}` : "✓ every choice was taken at least once");

// Flags: set anywhere vs read anywhere (requires, beat if/unless, effectsIf, branches).
const read = new Set();
const noteReq = (r) => { for (const f of [...(r?.flags ?? []), ...(r?.notFlags ?? [])]) read.add(f); };
const declared = new Set();
for (const sc of Object.values(S)) {
  noteReq(sc.requires);
  for (const b of sc.branch ?? []) noteReq(b.requires);
  for (const b of [...sc.beats, ...(sc.choices ?? []).flatMap((c) => c.aftermath ?? [])]) for (const f of [...(b.if ?? []), ...(b.unless ?? [])]) read.add(f);
  for (const c of sc.choices ?? []) {
    noteReq(c.requires);
    for (const b of c.branch ?? []) noteReq(b.requires);
    for (const e of c.effectsIf ?? []) { read.add(e.flag); for (const f of Object.keys(e.effects?.flags ?? {})) declared.add(f); }
    for (const f of Object.keys(c.effects?.flags ?? {})) declared.add(f);
  }
  for (const c of Object.values(sc.conversation?.consequences ?? {})) { noteReq(c.requires); for (const f of Object.keys(c.effects?.flags ?? {})) declared.add(f); }
}
for (const f of [...read]) if (f.includes(":")) read.delete(f); // other books' flags are checked by check-story
const unread = [...declared].filter((f) => !read.has(f));
const unset = [...read].filter((f) => !declared.has(f));
console.log(unread.length ? `✗ flags set but never read: ${unread.join(" ")}` : "✓ every flag that is set is read somewhere");
console.log(unset.length ? `✗ flags read but never set: ${unset.join(" ")}` : "✓ every flag that is read can be set");
const neverSet = [...declared].filter((f) => !flagsSet.has(f));
if (neverSet.length) console.log(`  flags no random play ever set: ${neverSet.join(" ")}`);
