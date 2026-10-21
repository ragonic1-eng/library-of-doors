import { NextResponse } from "next/server";
import { getBook, getCharacter } from "@/lib/story/load";
import { gatewayJson, mockMode, models } from "@/lib/server/gateway";
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

/** Warm-up ping from the start gate: wakes this function before the first real line, no model call. */
export async function GET() {
  return NextResponse.json({ ok: true, model: models.dialogue, mock: mockMode });
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
  const mustDecide = maxTurns > 0 && turnsSoFar + 1 >= maxTurns;

  const system = buildSystem({ body, card, charKey, scene, exits, consequences, mustDecide });

  if (mockMode) return NextResponse.json(mockReply(body, card.name, exits, consequences, mustDecide));

  const messages = [
    { role: "system", content: system },
    ...body.history.map((t) => ({ role: t.role === "player" ? "user" : "assistant", content: t.text })),
    { role: "user", content: body.mode === "inner" ? "(Aurie pauses before deciding. Give her private thought.)" : body.playerLine ?? "(Aurie says nothing and waits.)" },
  ];

  try {
    const data = await gatewayJson<{ choices: { message: { content: string } }[] }>("/chat/completions", {
      model: models.dialogue,
      messages,
      temperature: 0.9,
      max_tokens: 600,
      response_format: { type: "json_schema", json_schema: { name: "reply", strict: true, schema: replySchema } },
    });
    const parsed = safeParse(data.choices?.[0]?.message?.content ?? "");
    // Never trust the model's ids: keep only exits and consequences that exist and are allowed right now.
    if (parsed.decision && !(parsed.decision in exits)) parsed.decision = null;
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
}) {
  const { body, card, charKey, scene, exits, consequences, mustDecide } = args;
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
    `SCENE: ${scene.title}. ${scene.narration ?? ""}`,
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
    `AUTHORED EXITS for this scene. When the conversation has clearly arrived at one of them, set "decision" to its id; otherwise null. ${mustDecide ? "This is the final exchange: end the scene in character and you MUST set decision to the closest exit." : "Do not rush to an exit; let her lead."}\n${exitList || "- none"}`,
    `FORMAT: JSON with dialogue (1 to 3 sentences, spoken aloud), narration (one sentence or null), inner_thought (what AURIE, the player's character, privately thinks about your words, in her voice, one line, or null; never your own thoughts), mood (${MOODS.join(", ")}), decision (exit id or null), consequences (array of tags), trust_delta, fear_delta, memory_note (one short line worth remembering about her, or null).`,
    `TONE: adult, literary, Gaiman register; horror and menace allowed; no modern slang.`,
  ].join("\n\n");
}

const clampInt = (n: unknown, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));

function safeParse(raw: string): DialogueReply {
  try {
    const j = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ""));
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
    return { dialogue: raw.slice(0, 400), narration: null, inner_thought: null, mood: "neutral", decision: null, consequences: [], trust_delta: 0, fear_delta: 0, memory_note: null };
  }
}

function mockReply(body: Body, name: string, exits: Record<string, string>, consequences: Record<string, Consequence>, mustDecide: boolean): DialogueReply {
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
    decision: mustDecide ? ids[0] ?? null : null,
    consequences: hit ? [hit] : [],
    fear_delta: hit ? 1 : 0,
    memory_note: line ? `Said to ${name}: "${line.slice(0, 80)}"` : null,
  };
}
