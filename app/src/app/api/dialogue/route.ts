import { NextResponse } from "next/server";
import { getBook, getCharacter } from "@/lib/story/load";
import { gatewayJson, mockMode, models } from "@/lib/server/gateway";
import type { DialogueReply, Profile } from "@/lib/story/types";


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

const replySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    dialogue: { type: "string" },
    inner_thought: { type: ["string", "null"] },
    mood: { type: "string", enum: ["neutral", "warm", "wary", "hostile", "amused", "afraid", "grieving"] },
    decision: { type: ["string", "null"] },
    memory_note: { type: ["string", "null"] },
  },
  required: ["dialogue", "inner_thought", "mood", "decision", "memory_note"],
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const book = getBook(body.bookId);
  const scene = book?.scenes[body.sceneId];
  if (!book || !scene) return NextResponse.json({ error: "unknown scene" }, { status: 400 });

  const charKey = body.mode === "inner" ? "dream" : scene.conversation?.character;
  const card = charKey ? getCharacter(book.id, charKey) : undefined;
  if (!card) return NextResponse.json({ error: "no character" }, { status: 400 });

  const exits = scene.conversation?.exits ?? Object.fromEntries((scene.choices ?? []).map((c) => [c.id, c.text]));
  const turnsSoFar = body.history.filter((t) => t.role === "player").length;
  const maxTurns = scene.conversation?.maxTurns ?? 0;
  const mustDecide = maxTurns > 0 && turnsSoFar + 1 >= maxTurns;

  const system = buildSystem({ body, card, scene, exits, mustDecide });

  if (mockMode) return NextResponse.json(mockReply(body, card.name, exits, mustDecide));

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
      max_tokens: 400,
      response_format: { type: "json_schema", json_schema: { name: "reply", strict: true, schema: replySchema } },
    });
    const raw = data.choices?.[0]?.message?.content ?? "";
    const parsed = safeParse(raw);
    if (parsed.decision && !(parsed.decision in exits)) parsed.decision = null;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "dialogue unavailable" }, { status: 502 });
  }
}

function buildSystem(args: { body: Body; card: NonNullable<ReturnType<typeof getCharacter>>; scene: NonNullable<ReturnType<typeof getBook>>["scenes"][string]; exits: Record<string, string>; mustDecide: boolean }) {
  const { body, card, scene, exits, mustDecide } = args;
  const p = body.profile;
  const bookFlags = Object.entries(p.flags[body.bookId] ?? {}).filter(([, v]) => v).map(([k]) => k);
  const exitList = Object.entries(exits).map(([id, desc]) => `- ${id}: ${desc}`).join("\n");
  const memory = p.memory.slice(-12).map((m) => `- ${m}`).join("\n") || "- (nothing yet)";
  const model = JSON.stringify(p.playerModel ?? {});

  const role = body.mode === "inner"
    ? `You are the private inner voice of ${p.name}, Dream of the Endless, in an interactive film. Produce one or two sentences of her own thought at this moment. Never mention options, choices, meters or the game. Put the thought in "dialogue". Set "decision" to null.`
    : `You are ${card.name} in an interactive film. You are speaking with ${p.name}, Dream of the Endless, whom you address as "${card.address}". Stay fully in character in every reply. React to whatever she says, however unexpected; you may refuse, lie, mock, soften or change the subject only as ${card.name} would. Never say you cannot answer. Never break character. Never mention options, choices or the game.`;

  return [
    role,
    `SCENE: ${scene.title}. ${scene.narration ?? ""}`,
    `CANON (never contradict):\n${(scene.conversation?.canon ?? []).map((c) => `- ${c}`).join("\n")}`,
    `CHARACTER VOICE: ${card.voice}`,
    `WANTS: ${card.wants}`,
    `KNOWS:\n${card.knows.map((k) => `- ${k}`).join("\n")}`,
    `SECRETS (reveal only when earned):\n${card.secrets.map((k) => `- ${k}`).join("\n")}`,
    `RED LINES:\n${card.redLines.map((k) => `- ${k}`).join("\n")}`,
    `AURIE SO FAR: mercy ${p.traits.mercy}, flags ${bookFlags.join(", ") || "none"}.\nMEMORY OF HER WORDS AND DEEDS:\n${memory}\nWHAT WE HAVE LEARNED OF HOW SHE PLAYS: ${model}`,
    `AUTHORED EXITS for this scene. When the conversation has clearly arrived at one of them, set "decision" to its id; otherwise null. ${mustDecide ? "This is the final exchange: end the scene in character and you MUST set decision to the closest exit." : "Do not rush to an exit; let her lead."}\n${exitList}`,
    `FORMAT: reply as JSON with keys dialogue (1 to 3 sentences, spoken aloud), inner_thought (Aurie's one-line private reaction, or null), mood (one of neutral, warm, wary, hostile, amused, afraid, grieving), decision (exit id or null), memory_note (one short line worth remembering about her, or null).`,
    `TONE: adult, literary, Gaiman register; horror and menace allowed; no modern slang.`,
  ].join("\n\n");
}

function safeParse(raw: string): DialogueReply {
  try {
    const j = JSON.parse(raw);
    return {
      dialogue: String(j.dialogue ?? ""),
      inner_thought: j.inner_thought ?? null,
      mood: String(j.mood ?? "neutral"),
      decision: j.decision ?? null,
      memory_note: j.memory_note ?? null,
    };
  } catch {
    return { dialogue: raw.slice(0, 400), inner_thought: null, mood: "neutral", decision: null, memory_note: null };
  }
}

function mockReply(body: Body, name: string, exits: Record<string, string>, mustDecide: boolean): DialogueReply {
  const ids = Object.keys(exits);
  if (body.mode === "inner") {
    return { dialogue: "Seventy years is nothing. And yet.", inner_thought: null, mood: "neutral", decision: null, memory_note: null };
  }
  const line = body.playerLine?.trim();
  return {
    dialogue: line ? `${name} (offline voice): "${line}"... You say that as if it changes anything.` : `${name} waits, watching you through the glass.`,
    inner_thought: null,
    mood: "wary",
    decision: mustDecide ? ids[0] ?? null : null,
    memory_note: line ? `Said to ${name}: "${line.slice(0, 80)}"` : null,
  };
}
