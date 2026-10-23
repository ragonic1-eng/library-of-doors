// Benchmark dialogue models on every conversation scene, with the game's own system prompt (mirrors
// buildSystem in app/src/app/api/dialogue/route.ts; keep the two in step). Text only: no voice is made.
//   node tools/bench_dialogue.mjs model-a,model-b [--scenes 2.1,6.3] [--out audit/dialogue-bench.json]
// Per model: time to the spoken line, total time, valid replies, and whether a turn that clearly does what
// an exit describes is closed on that exit.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const f of [join(ROOT, ".env"), join(ROOT, "app", ".env.local")]) if (existsSync(f)) try { process.loadEnvFile(f); } catch { /* ignore */ }
const BASE = (process.env.INFISTAR_BASE_URL ?? "https://infistar.ai/v1").replace(/\/$/, "");
const KEY = process.env.INFISTAR_API_KEY;
const argv = process.argv.slice(2);
const MODELS = (argv[0] ?? "claude-haiku-5-5").split(",");
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const onlyScenes = opt("--scenes", "") ? opt("--scenes", "").split(",") : null;
const OUT = join(ROOT, opt("--out", "audit/dialogue-bench.json"));

const book = JSON.parse(readFileSync(join(ROOT, "app/src/content/books/sandman/book.json"), "utf8"));
const cards = JSON.parse(readFileSync(join(ROOT, "app/src/content/characters/sandman.json"), "utf8"));
const MOODS = ["neutral", "warm", "wary", "hostile", "amused", "afraid", "grieving"];
const schema = {
  type: "object", additionalProperties: false,
  properties: { subtext: { type: "string" }, mood: { type: "string", enum: MOODS }, dialogue: { type: "string" }, narration: { type: ["string", "null"] },
    inner_thought: { type: ["string", "null"] }, decision: { type: ["string", "null"] }, consequences: { type: "array", items: { type: "string" } },
    trust_delta: { type: "integer" }, fear_delta: { type: "integer" }, memory_note: { type: ["string", "null"] } },
  required: ["subtext", "mood", "dialogue", "narration", "inner_thought", "decision", "consequences", "trust_delta", "fear_delta", "memory_note"],
};

function system(scene, card, exits, mustDecide) {
  const conv = scene.conversation;
  const summary = scene.summary ?? scene.beats.filter((b) => b.text && !b.if).map((b) => b.text).join(" ");
  const ending = mustDecide
    ? "This is the final exchange. End the scene in character, and you MUST set decision to the exit closest to what she has said and done so far."
    : `Asking a question, or talking about something, never ends the scene by itself. When her latest input does what one exit describes (in her own words, not necessarily the same ones), set "decision" to that exit id NOW, even if your character hesitates or refuses: the outcome is hers to decide, and your reaction (hesitation included) is the closing moment of the scene. Only when she does something that matches no exit, react to it fully and keep the scene alive with decision null.`;
  const exitList = Object.entries(exits).map(([id, d]) => `- ${id}: ${d}`).join("\n");
  const menu = Object.entries(conv.consequences ?? {}).map(([t, c]) => `- ${t}: ${c.when}`).join("\n");
  return [
    `You are ${card.name} in an interactive film, playing opposite Aurie, Dream of the Endless, whom you address as "${card.address}". The player IS Aurie; everything she types is what Aurie says or does inside the story. Stay fully in character. React to whatever she says or does, however unexpected; you may refuse, lie, mock, soften or change the subject only as ${card.name} would. Never say you cannot answer. Never break character. Never mention options, choices, meters or the game.`,
    `SCENE: ${scene.title}. What the audience has just seen: ${summary}`,
    `CANON (never contradict):\n${(conv.canon ?? []).map((c) => `- ${c}`).join("\n")}`,
    `CHARACTER VOICE: ${card.voice}`, `WANTS: ${card.wants}`,
    `KNOWS:\n${(card.knows ?? []).map((k) => `- ${k}`).join("\n")}`,
    `SECRETS (reveal only when earned, more readily the more you trust her):\n${(card.secrets ?? []).map((k) => `- ${k}`).join("\n")}`,
    `RED LINES:\n${(card.redLines ?? []).map((k) => `- ${k}`).join("\n")}`,
    `WHAT HAS ALREADY HAPPENED THAT YOU KNOW OF (use it; it is your history with her):\n- nothing beyond the canon`,
    `YOUR FEELINGS TOWARD HER (scale -5 to 5): trust 0, fear 0. Let them colour every line: high fear makes you placate or flee; low trust makes you guarded; high trust makes you honest.`,
    `HOW THIS SCENE CAN BEND (likely approaches; follow her lead, improvising within the story):\n${(conv.possibilities ?? []).map((x) => `- ${x}`).join("\n") || "- follow her lead"}`,
    `READ HER FIRST. Before you speak, write in "subtext" (private, one line) what Aurie is really feeling and wanting beneath her words: fear, pride, grief, guilt, longing, anger, mischief, testing you, hiding something. Notice what she did NOT say. Then answer THAT, the way someone who truly sees her would: name it or hint at it, press on it, comfort it, or use it against her, exactly as your character would. Pick up a word or phrase she actually used and turn it back to her. Never answer only the literal question.`,
    `SOUND LIKE A PERSON IN THIS MOMENT, NOT AN INFORMATION DESK. Let feeling show in the words themselves: a pause (...), a sentence that breaks off, a sudden softness, a flash of anger, a laugh, a hard truth said quietly. Vary the rhythm: a short blow, then one longer line. One concrete physical or sensory detail when it helps (the cold, a smell, your hands). Never generic, never polite filler, never "I understand" or "That is a good question". Your feelings toward her (trust, fear, history) should be audible.`,
    `HER INPUT CAN BE SPEECH OR ACTION. If she describes doing something (for example in *asterisks*, or "I press my palm to the glass"), treat it as happening in the scene: put its visible physical effect in "narration" (one sentence, present tense, second person, e.g. "The candle flames lean away from the glass.") and react to it in "dialogue". Otherwise narration may be null, or one short line of what changes in the room.`,
    `CONSEQUENCES. Her words and actions have consequences in this story. When her LATEST input clearly earns one of these, include its tag in "consequences" (at most two; only ones she has truly earned; never fire one just because it is listed):\n${menu || "- (none remaining)"}`,
    `RELATIONSHIP. Set trust_delta and fear_delta (integers -2 to 2) for how her latest input changes YOUR trust in her and fear of her. Usually 0 or 1; 2 only for something remarkable.`,
    `AURIE SO FAR: mercy 3, flags none.\nMEMORY OF HER WORDS AND DEEDS:\n- (nothing yet)`,
    `STEERING (invisible; never mention options, ideas, buttons, menus or the game): Let the scene breathe, but keep it moving toward one of the exits below: answer her, then end on something that invites her to decide (a question, a challenge, an offer, a plea), the way your character would.`,
    `HOW THE SCENE ENDS. Her words decide the story; she must never have to repeat herself or pick from a menu. ${ending}\n${exitList || "- none"}`,
    `FORMAT: Reply with ONLY a JSON object, no code fences, no text before or after. Keys, in this order: subtext (your private read of what she feels and wants, one line, never shown), mood (${MOODS.join(", ")}: what YOU feel as you answer), dialogue (1 to 3 sentences, at most 40 words, spoken aloud; like a line in a film, never a speech; only spoken words, no *actions*), narration (one sentence or null), inner_thought (AURIE's own private thought about this moment, first person, as the Queen of Dreams: calm, ancient, proud; one short line, or null. It must NEVER be in your character's voice, words or slang, and never repeat your dialogue), decision (exit id or null), consequences (array of tags), trust_delta, fear_delta, memory_note (one short line worth remembering about her, or null).`,
    `TONE: adult, literary, Gaiman register; horror and menace allowed; no modern slang.`,
  ].join("\n\n");
}

async function call(model, messages) {
  const t0 = Date.now(); let tLine = null, tFirst = null, text = "";
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(`${BASE}/chat/completions`, { method: "POST", signal: ctrl.signal,
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: 0.9, max_tokens: 1200, stream: true,
        response_format: { type: "json_schema", json_schema: { name: "reply", strict: true, schema } } }) });
    if (!res.ok) return { error: `${res.status} ${(await res.text()).slice(0, 120)}`, ms: Date.now() - t0 };
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true }); let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
        if (!line.startsWith("data:") || line.includes("[DONE]")) continue;
        try { const d = JSON.parse(line.slice(5)).choices?.[0]?.delta?.content; if (d) { text += d; tFirst ??= Date.now() - t0;
          if (tLine === null && /"dialogue"\s*:\s*"(?:[^"\\]|\\.)*"/.test(text)) tLine = Date.now() - t0; } } catch { /* partial */ }
      }
    }
  } catch (e) { return { error: e.name === "AbortError" ? "timeout 30s" : e.message.slice(0, 120), ms: Date.now() - t0 }; }
  finally { clearTimeout(timer); }
  const ms = Date.now() - t0;
  let j = null; try { j = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")); } catch { /* invalid */ }
  return { ms, tFirst, tLine, ok: !!(j && typeof j.dialogue === "string" && j.dialogue), dialogue: j?.dialogue ?? text.slice(0, 160), decision: j?.decision ?? null, mood: j?.mood };
}

const scenes = Object.values(book.scenes).filter((s) => s.conversation && cards[s.conversation.character] && (!onlyScenes || onlyScenes.includes(s.id)));
const jobs = [];
for (const s of scenes) {
  const card = cards[s.conversation.character];
  const exits = s.conversation.exits ?? Object.fromEntries((s.choices ?? []).map((c) => [c.id, c.text]));
  const history = s.conversation.opening ? [{ role: "assistant", content: s.conversation.opening }] : [];
  const talk = (s.conversation.suggestions ?? [])[0] ?? "Tell me the truth.";
  const target = Object.keys(exits)[0];
  const decisive = (s.choices ?? []).find((c) => c.id === target)?.text ?? exits[target];
  for (const model of MODELS) {
    jobs.push({ model, scene: s.id, kind: "talk", messages: [{ role: "system", content: system(s, card, exits, false) }, ...history, { role: "user", content: talk }] });
    if (target) jobs.push({ model, scene: s.id, kind: "decide", target, messages: [{ role: "system", content: system(s, card, exits, false) }, ...history, { role: "user", content: decisive }] });
  }
}
console.log(`${scenes.length} conversation scenes, ${MODELS.length} models, ${jobs.length} calls`);
const results = []; let i = 0;
async function worker() { for (;;) { const j = jobs[i++]; if (!j) return; const r = await call(j.model, j.messages); results.push({ model: j.model, scene: j.scene, kind: j.kind, target: j.target, ...r }); } }
await Promise.all(Array.from({ length: 8 }, worker));
writeFileSync(OUT, JSON.stringify(results, null, 2));
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
const p90 = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length * 0.9)] : null; };
for (const m of MODELS) {
  const r = results.filter((x) => x.model === m); const ok = r.filter((x) => x.ok);
  const dec = r.filter((x) => x.kind === "decide"); const hit = dec.filter((x) => x.decision === x.target);
  const long = ok.filter((x) => x.dialogue.split(/\s+/).length > 45).length;
  console.log(`${m.padEnd(24)} valid ${ok.length}/${r.length}  line median ${med(ok.map((x) => x.tLine))}ms p90 ${p90(ok.map((x) => x.tLine))}ms  total median ${med(ok.map((x) => x.ms))}ms  exits hit ${hit.length}/${dec.length}  over-long ${long}  errors ${r.filter((x) => x.error).map((x) => x.error).slice(0, 2).join(" | ")}`);
}
console.log(`saved ${OUT}`);
