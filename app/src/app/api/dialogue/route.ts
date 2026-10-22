import { NextResponse } from "next/server";
import { getBook, getCharacter } from "@/lib/story/load";
import { gatewayJson, gatewayStream, mockMode, modelHealth, modelOrder, models, reportModel } from "@/lib/server/gateway";
import { splitParts, synthLine } from "@/lib/server/voice";
import { consequenceFlag, meets, relationOf } from "@/lib/state/profile";
import type { Consequence, DialogueReply, Profile, Scene } from "@/lib/story/types";

interface Turn {
  role: "player" | "character";
  text: string;
}

interface Body {
  bookId: string;
  sceneId: string;
  mode: "talk" | "inner";
  history: Turn[];
  playerLine?: string;
  intent?: string; // set when she tapped a suggested line: that exit is her decision
  profile: Profile;
}

const MOODS = ["neutral", "warm", "wary", "hostile", "amused", "afraid", "grieving"];

const replySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    dialogue: { type: "string" },
    narration: { type: ["string", "null"] },
    inner_thought: { type: ["string", "null"] },
    mood: { type: "string", enum: MOODS },
    decision: { type: ["string", "null"] },
    consequences: { type: "array", items: { type: "string" } },
    trust_delta: { type: "integer" },
    fear_delta: { type: "integer" },
    memory_note: { type: ["string", "null"] },
  },
  required: ["dialogue", "narration", "inner_thought", "mood", "decision", "consequences", "trust_delta", "fear_delta", "memory_note"],
};

/** Exits the player can still reach, and consequences still available (not fired, requirements met). */
function available(scene: Scene, p: Profile, bookId: string) {
  const choiceById = Object.fromEntries((scene.choices ?? []).map((c) => [c.id, c]));
  const allExits = scene.conversation?.exits ?? Object.fromEntries((scene.choices ?? []).map((c) => [c.id, c.text]));
  const exits = Object.fromEntries(Object.entries(allExits).filter(([id]) => meets(p, bookId, choiceById[id]?.requires)));
  const consequences: Record<string, Consequence> = Object.fromEntries(
    Object.entries(scene.conversation?.consequences ?? {}).filter(
      ([tag, c]) => !p.flags[bookId]?.[consequenceFlag(tag)] && meets(p, bookId, c.requires),
    ),
  );
  return { exits, consequences };
}

/** Warm-up ping from the start gate: wakes this function before the first real line, no model call.
 *  `?probe=1` additionally times a one-word model call through each gateway hostname (diagnostic, tiny cost). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  // `?warm=1`: one tiny real call through the configured gateway, so the model path is open before her first line.
  if (url.searchParams.get("warm") === "1" && !mockMode) {
    const t0 = Date.now();
    try {
      await gatewayJson("/chat/completions", { model: models.dialogue, max_tokens: 16, messages: [{ role: "user", content: "Say: ready" }] }, 15_000);
      reportModel(models.dialogue, true);
      return NextResponse.json({ ok: true, warmed: true, ms: Date.now() - t0 });
    } catch {
      // The main model is down right now: bench it, so her first line goes straight to a fallback.
      reportModel(models.dialogue, false);
      return NextResponse.json({ ok: true, warmed: false, ms: Date.now() - t0 });
    }
  }
  if (url.searchParams.get("probe") !== "1" || mockMode) return NextResponse.json({ ok: true, model: models.dialogue, fallbacks: models.dialogueFallbacks, benched: modelHealth(), mock: mockMode });
  const hosts = ["https://infistar.ai/v1", "https://infistar.cc/v1"];
  const key = process.env.INFISTAR_API_KEY ?? "";
  const results: Record<string, string> = {};
  for (const base of hosts) {
    const t0 = Date.now();
    try {
      const r = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: models.dialogue, max_tokens: 5, messages: [{ role: "user", content: "Say: ready" }] }),
        signal: AbortSignal.timeout(30_000),
      });
      results[base] = `${r.status} in ${Date.now() - t0} ms`;
    } catch (e) {
      results[base] = `error after ${Date.now() - t0} ms: ${(e as Error).message}`;
    }
  }
  return NextResponse.json({ ok: true, model: models.dialogue, region: process.env.VERCEL_REGION ?? null, probe: results });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const book = getBook(body.bookId);
  const scene = book?.scenes[body.sceneId];
  if (!book || !scene) return NextResponse.json({ error: "unknown scene" }, { status: 400 });

  const charKey = body.mode === "inner" ? "dream" : scene.conversation?.character;
  const card = charKey ? getCharacter(book.id, charKey) : undefined;
  if (!card || !charKey) return NextResponse.json({ error: "no character" }, { status: 400 });

  const { exits, consequences } = available(scene, body.profile, book.id);
  const turnsSoFar = body.history.filter((t) => t.role === "player").length;
  const maxTurns = scene.conversation?.maxTurns ?? 0;
  const intent = body.intent && body.intent in exits ? body.intent : undefined;
  const mustDecide = !intent && maxTurns > 0 && turnsSoFar + 1 >= maxTurns;

  const system = buildSystem({ body, card, charKey, scene, exits, consequences, mustDecide, intent, turnsSoFar, maxTurns });

  if (mockMode) return NextResponse.json(mockReply(body, card.name, exits, consequences, mustDecide, intent));

  const messages = [
    { role: "system", content: system },
    ...body.history.map((t) => ({ role: t.role === "player" ? "user" : "assistant", content: t.text })),
    { role: "user", content: body.mode === "inner" ? "(Aurie pauses before deciding. Give her private thought.)" : body.playerLine ?? "(Aurie says nothing and waits.)" },
  ];

  try {
    // The reply streams in; the moment its spoken line is complete, the character's voice starts being made,
    // while the model is still writing the rest. Words and voice then come back together in one response.
    const T0 = Date.now(); const marks: string[] = [];
    let earlyLine: string | null = null;
    let voice: Promise<{ speaker?: string; audio: string | null }[]> | null = null;
    const watch = (soFar: string) => {
      if (voice || body.mode !== "talk") return;
      const m = soFar.match(/"dialogue"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (!m) return;
      try { earlyLine = spokenOnly(JSON.parse(`"${m[1]}"`) as string); } catch { return; }
      const line = earlyLine; marks.push(`line@${Date.now() - T0}`);
      voice = Promise.all(splitParts(line, !!card.speakers).map(async (p) => {
        const audio = await synthLine(book.id, charKey, p.text, p.speaker); marks.push(`voice@${Date.now() - T0}`);
        return { speaker: p.speaker, audio: audio ? audio.toString("base64") : null };
      }));
    };
    const call = (model: string) => gatewayStream("/chat/completions", {
      model,
      messages,
      temperature: 0.9,
      max_tokens: 1200,
      response_format: { type: "json_schema", json_schema: { name: "reply", strict: true, schema: replySchema } },
    }, 15_000, watch);
    // If the main model's upstream channel fails or stalls, answer from a fallback rather than break the scene.
    let content: string | undefined;
    let lastErr: unknown;
    for (const model of modelOrder(models.dialogue, models.dialogueFallbacks)) {
      try {
        content = await call(model);
        reportModel(model, true);
        break;
      } catch (e) {
        lastErr = e;
        reportModel(model, false);
        console.error(`dialogue: ${model} failed, benched for 3 min:`, (e as Error).message.slice(0, 160));
      }
    }
    if (content === undefined) throw lastErr;
    marks.push(`reply@${Date.now() - T0}`);
    const parsed: DialogueReply = safeParse(content);
    // Stage directions in *asterisks* are not spoken: they move to the narration line.
    const actions = [...parsed.dialogue.matchAll(/\*([^*]+)\*/g)].map((a) => a[1].trim()).filter(Boolean);
    parsed.dialogue = spokenOnly(parsed.dialogue);
    if (actions.length && !parsed.narration) parsed.narration = actions.join(" ");
    if (voice && earlyLine === parsed.dialogue) {
      const v = voice as Promise<{ speaker?: string; audio: string | null }[]>;
      parsed.voice = await Promise.race([v, new Promise<null>((r) => setTimeout(() => r(null), 20_000))]) ?? undefined;
    }
    // Never trust the model's ids: keep only exits and consequences that exist and are allowed right now.
    if (parsed.decision && !(parsed.decision in exits)) parsed.decision = null;
    if (intent) parsed.decision = intent;
    else {
      const lastCharacterLine = [...body.history].reverse().find((t) => t.role === "character")?.text ?? "";
      for (const t of scene.conversation?.triggers ?? []) {
        if (!(t.exit in exits)) continue;
        if (!new RegExp(t.player, "i").test(body.playerLine ?? "")) continue;
        if (t.afterCharacter && !new RegExp(t.afterCharacter, "i").test(lastCharacterLine)) continue;
        parsed.decision = t.exit;
        break;
      }
    }
    console.log(`dialogue timing: ${marks.join(" ")} sent@${Date.now() - T0}`);
    parsed.consequences = [...new Set(parsed.consequences)].filter((t) => t in consequences).slice(0, 2);
    parsed.trust_delta = clampInt(parsed.trust_delta, -2, 2);
    parsed.fear_delta = clampInt(parsed.fear_delta, -2, 2);
    if (body.mode === "inner") Object.assign(parsed, { decision: null, consequences: [], trust_delta: 0, fear_delta: 0 });
    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "dialogue unavailable" }, { status: 502 });
  }
}

function buildSystem(args: {
  body: Body;
  card: NonNullable<ReturnType<typeof getCharacter>>;
  charKey: string;
  scene: Scene;
  exits: Record<string, string>;
  consequences: Record<string, Consequence>;
  mustDecide: boolean;
  intent?: string;
  turnsSoFar: number;
  maxTurns: number;
}) {
  const { body, card, charKey, scene, exits, consequences, mustDecide, intent, turnsSoFar, maxTurns } = args;
  // How hard to steer: gently at first, plainly near the end of the scene.
  const left = maxTurns > 0 ? maxTurns - (turnsSoFar + 1) : 99;
  const steering = left >= 2
    ? "Let the scene breathe, but keep it moving toward one of the exits below: answer her, then end on something that invites her to decide (a question, a challenge, an offer, a plea), the way your character would."
    : "The scene is nearly over. In character, put the decision squarely in front of her: name what she must choose between, the way your character would (a demand, a dare, a heartfelt ask).";
  const summary = scene.summary ?? scene.beats.filter((b) => b.text && !b.if).map((b) => b.text).join(" ");
  const ending = intent
    ? `She has made her decision: ${exits[intent]} React to it in character as the closing moment of the scene, and set "decision" to "${intent}".`
    : mustDecide
      ? "This is the final exchange. End the scene in character, and you MUST set decision to the exit closest to what she has said and done so far."
      : `Asking a question, or talking about something, never ends the scene by itself. When her latest input does what one exit describes (in her own words, not necessarily the same ones), set "decision" to that exit id NOW, even if your character hesitates or refuses: the outcome is hers to decide, and your reaction (hesitation included) is the closing moment of the scene. Only when she does something that matches no exit, react to it fully and keep the scene alive with decision null.`;
  const p = body.profile;
  const bookFlags = Object.entries(p.flags[body.bookId] ?? {}).filter(([, v]) => v).map(([k]) => k);
  const exitList = Object.entries(exits).map(([id, desc]) => `- ${id}: ${desc}`).join("\n");
  const memory = p.memory.slice(-12).map((m) => `- ${m}`).join("\n") || "- (nothing yet)";
  const rel = relationOf(p, charKey);
  const known = (p.echoes ?? []).filter((e) => e.knownBy.includes(charKey)).map((e) => `- ${e.text}`).join("\n");
  const menu = Object.entries(consequences).map(([tag, c]) => `- ${tag}: ${c.when}`).join("\n");

  const role = body.mode === "inner"
    ? `You are the private inner voice of ${p.name}, Dream of the Endless, in an interactive film. Produce one or two sentences of her own thought at this moment, shaped by what she has done so far. Never mention options, choices, meters or the game. Put the thought in "dialogue". Set narration, decision and memory_note to null, consequences to [], deltas to 0.`
    : `You are ${card.name} in an interactive film, playing opposite ${p.name}, Dream of the Endless, whom you address as "${card.address}". The player IS ${p.name}; everything she types is what ${p.name} says or does inside the story. Stay fully in character. React to whatever she says or does, however unexpected; you may refuse, lie, mock, soften or change the subject only as ${card.name} would. Never say you cannot answer. Never break character. Never mention options, choices, meters or the game.`;

  return [
    role,
    `SCENE: ${scene.title}. What the audience has just seen: ${summary}`,
    `CANON (never contradict):\n${(scene.conversation?.canon ?? []).map((c) => `- ${c}`).join("\n")}`,
    `CHARACTER VOICE: ${card.voice}`,
    `WANTS: ${card.wants}`,
    `KNOWS:\n${card.knows.map((k) => `- ${k}`).join("\n")}`,
    `SECRETS (reveal only when earned, more readily the more you trust her):\n${card.secrets.map((k) => `- ${k}`).join("\n")}`,
    `RED LINES:\n${card.redLines.map((k) => `- ${k}`).join("\n")}`,
    `WHAT HAS ALREADY HAPPENED THAT YOU KNOW OF (use it; it is your history with her):\n${known || "- nothing beyond the canon"}`,
    `YOUR FEELINGS TOWARD HER (scale -5 to 5): trust ${rel.trust}, fear ${rel.fear}. Let them colour every line: high fear makes you placate or flee; low trust makes you guarded; high trust makes you honest.`,
    `HOW THIS SCENE CAN BEND (likely approaches; follow her lead, improvising within the story):\n${(scene.conversation?.possibilities ?? []).map((x) => `- ${x}`).join("\n") || "- follow her lead"}`,
    `HER INPUT CAN BE SPEECH OR ACTION. If she describes doing something (for example in *asterisks*, or "I press my palm to the glass"), treat it as happening in the scene: put its visible physical effect in "narration" (one sentence, present tense, second person, e.g. "The candle flames lean away from the glass.") and react to it in "dialogue". Otherwise narration may be null, or one short line of what changes in the room.`,
    `CONSEQUENCES. Her words and actions have consequences in this story. When her LATEST input clearly earns one of these, include its tag in "consequences" (at most two; only ones she has truly earned; never fire one just because it is listed):\n${menu || "- (none remaining)"}`,
    `RELATIONSHIP. Set trust_delta and fear_delta (integers -2 to 2) for how her latest input changes YOUR trust in her and fear of her. Usually 0 or 1; 2 only for something remarkable.`,
    `AURIE SO FAR: mercy ${p.traits.mercy}, flags ${bookFlags.join(", ") || "none"}.\nMEMORY OF HER WORDS AND DEEDS:\n${memory}`,
    `STEERING (invisible; never mention options, ideas, buttons, menus or the game): ${steering}`,
    `HOW THE SCENE ENDS. Her words decide the story; she must never have to repeat herself or pick from a menu. ${ending}\n${exitList || "- none"}`,
    `FORMAT: Reply with ONLY a JSON object, no code fences, no text before or after. Keys: dialogue (1 or 2 short sentences, at most 30 words, spoken aloud; like a line in a film, never a speech), narration (one sentence or null), inner_thought (AURIE's own private thought about this moment, first person, as the Queen of Dreams: calm, ancient, proud; one short line, or null. It must NEVER be in your character's voice, words or slang, and never repeat your dialogue), mood (${MOODS.join(", ")}), decision (exit id or null), consequences (array of tags), trust_delta, fear_delta, memory_note (one short line worth remembering about her, or null).`,
    `TONE: adult, literary, Gaiman register; horror and menace allowed; no modern slang.`,
  ].join("\n\n");
}

/** Only the words a character says aloud: no *stage directions*. */
function spokenOnly(line: string) {
  return line.replace(/\*[^*]*\*/g, " ").replace(/\s{2,}/g, " ").replace(/\s+([,.!?;:])/g, "$1").trim();
}

const clampInt = (n: unknown, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));

function safeParse(raw: string): DialogueReply {
  const empty: DialogueReply = { dialogue: "", narration: null, inner_thought: null, mood: "neutral", decision: null, consequences: [], trust_delta: 0, fear_delta: 0, memory_note: null };
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = text.indexOf("{");
  const candidate = start >= 0 ? text.slice(start) : text;
  try {
    const j = JSON.parse(candidate);
    return {
      dialogue: String(j.dialogue ?? ""),
      narration: j.narration ?? null,
      inner_thought: j.inner_thought ?? null,
      mood: MOODS.includes(j.mood) ? j.mood : "neutral",
      decision: j.decision ?? null,
      consequences: Array.isArray(j.consequences) ? j.consequences.map(String) : [],
      trust_delta: Number(j.trust_delta) || 0,
      fear_delta: Number(j.fear_delta) || 0,
      memory_note: j.memory_note ?? null,
    };
  } catch {
    // Truncated or malformed JSON: salvage the spoken line and nothing else, so raw structure never reaches the screen.
    const m = candidate.match(/"dialogue"\s*:\s*"((?:[^"\\]|\\.)*)"?/);
    const line = m ? m[1].replace(/\\"/g, '"').replace(/\\n/g, " ").trim() : "";
    const mood = candidate.match(/"mood"\s*:\s*"([a-z]+)"/)?.[1];
    return { ...empty, dialogue: line || "…", mood: mood && MOODS.includes(mood) ? mood : "neutral" };
  }
}

function mockReply(body: Body, name: string, exits: Record<string, string>, consequences: Record<string, Consequence>, mustDecide: boolean, intent?: string): DialogueReply {
  const ids = Object.keys(exits);
  const base = { narration: null, inner_thought: null, consequences: [] as string[], trust_delta: 0, fear_delta: 0, memory_note: null };
  if (body.mode === "inner") return { ...base, dialogue: "Seventy years is nothing. And yet.", mood: "neutral", decision: null };
  const line = body.playerLine?.trim() ?? "";
  // Offline mode: fire the first consequence whose tag words appear in what she typed, so the engine can be tested without the API.
  const hit = Object.keys(consequences).find((t) => t.split("_").some((w) => w.length > 3 && line.toLowerCase().includes(w.toLowerCase())));
  return {
    ...base,
    dialogue: line ? `${name} (offline voice): "${line}"... You say that as if it changes anything.` : `${name} waits, watching you.`,
    narration: line.startsWith("*") ? "The candle flames lean away from the glass." : null,
    mood: "wary",
    decision: intent ?? (mustDecide ? ids[0] ?? null : null),
    consequences: hit ? [hit] : [],
    fear_delta: hit ? 1 : 0,
    memory_note: line ? `Said to ${name}: "${line.slice(0, 80)}"` : null,
  };
}
