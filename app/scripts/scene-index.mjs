#!/usr/bin/env node
// Write the scene index of a book: every chapter, every scene id, what kind of scene it is, its choices and where
// they lead. Generated from book.json, so it is always the game as it stands.
//   node scripts/scene-index.mjs <bookId>      -> ../story-index-<bookId>.md
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..");
const bookId = process.argv[2];
if (!bookId) { console.error("usage: scene-index.mjs <bookId>"); process.exit(1); }
const book = JSON.parse(readFileSync(join(APP, "src", "content", "books", bookId, "book.json"), "utf8"));
const S = book.scenes;

const kind = (sc) => sc.retryFrom ? "dead end" : sc.type === "end" ? "ending" : /^Cutaway/.test(sc.title) ? "cutaway" : sc.conversation ? "live talk" : sc.choices?.length > 1 ? "choice" : "scene";
const pics = (sc) => {
  const all = [...sc.beats, ...(sc.choices ?? []).flatMap((c) => c.aftermath ?? [])];
  const v = new Set(all.filter((b) => b.clip).map((b) => b.clip)).size, s = new Set(all.filter((b) => b.still).map((b) => b.still)).size;
  return [v && `${v} video`, s && `${s} still`].filter(Boolean).join(", ") || "none";
};
const cond = (r) => {
  if (!r) return "";
  const out = [];
  for (const [k, v] of Object.entries(r.traits ?? {})) out.push(`${k} ≥ ${v}`);
  for (const [k, v] of Object.entries(r.vars ?? {})) out.push(`${k} ≥ ${v}`);
  for (const f of r.flags ?? []) out.push(f);
  for (const f of r.notFlags ?? []) out.push(`not ${f}`);
  return out.join(", ");
};
const leads = (sc) => {
  const out = [];
  for (const c of sc.choices ?? []) {
    const alt = (c.branch ?? []).map((b) => ` (or ${b.next} if ${cond(b.requires)})`).join("");
    out.push(`**${c.id}** “${c.text}”${c.requires ? ` *[needs ${cond(c.requires)}]*` : ""} → ${c.next}${alt}`);
  }
  if (sc.next) out.push(`→ ${sc.next}${(sc.branch ?? []).map((b) => ` (or ${b.next} if ${cond(b.requires)})`).join("")}`);
  if (sc.retryFrom) out.push(`↺ goes back to ${sc.retryFrom} (${S[sc.retryFrom]?.title})`);
  return out.join("<br>");
};

const lines = [
  `# ${book.title}: scene index`,
  "",
  `Generated from \`app/src/content/books/${bookId}/book.json\` by \`app/scripts/scene-index.mjs\`; do not edit by hand. Every scene id is **chapter.position**: 9.4 is the fourth scene of Chapter 9. To ask for a change, name the id (\"change 9.4\", \"cut choice 9.4.C\"). Picture ids carry the same number (\`nw-9.4-...\`).`,
  "",
];
const ids = Object.keys(S);
const count = { scenes: ids.length, chapters: ids.filter((i) => S[i].episodeTitle).length, talks: ids.filter((i) => S[i].conversation).length, dead: ids.filter((i) => S[i].retryFrom).length, endings: ids.filter((i) => S[i].type === "end" && !S[i].retryFrom).length };
lines.push(`${count.chapters} chapters · ${count.scenes} scenes · ${count.talks} live talks · ${count.dead} dead ends · ${count.endings} endings and credits`, "");
let open = false;
for (const id of ids) {
  const sc = S[id];
  if (sc.episodeTitle) {
    if (open) lines.push("");
    lines.push(`## ${sc.episodeTitle}`, "", "| ID | Scene | Kind | Pictures | Choices and where they lead | Map ref |", "|---|---|---|---|---|---|");
    open = true;
  }
  lines.push(`| **${id}** | ${sc.title} | ${kind(sc)} | ${pics(sc)} | ${leads(sc)} | ${(sc.source ?? "").replace("story map ", "")} |`);
}
lines.push("");
const out = join(APP, "..", `story-index-${bookId}.md`);
writeFileSync(out, lines.join("\n"));
console.log(`wrote ${out}: ${count.chapters} chapters, ${count.scenes} scenes`);
