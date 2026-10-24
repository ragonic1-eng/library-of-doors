import { NextResponse } from "next/server";
import { getBook } from "@/lib/story/load";
import { gatewayJson, mockMode, modelOrder, models, reportModel } from "@/lib/server/gateway";
import type { Profile, Reading } from "@/lib/story/types";

// Her Reading: the personality report at the end of a book, written once from the choices she actually made.
// Mercy is the game's own measure and is set here, not by the model; every quoted moment must be one of her choices.

const ARCHETYPES = [
  "The Merciful Sovereign", "The Iron Queen", "The Guardian", "The Seeker",
  "The Penitent", "The Wanderer", "The Judge", "The Keeper of Promises",
];
const DIMS = [
  { name: "Mercy", low: "Stern", high: "Merciful" },
  { name: "Courage", low: "Cautious", high: "Bold" },
  { name: "Loyalty", low: "Independent", high: "Devoted" },
  { name: "Curiosity", low: "Focused", high: "Curious" },
  { name: "Pride", low: "Humble", high: "Proud" },
];

const dimSchema = { type: "object", additionalProperties: false, properties: { score: { type: "integer" }, because: { type: "string" } }, required: ["score", "because"] };
const readingSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    archetype: { type: "string", enum: ARCHETYPES },
    tagline: { type: "string" },
    dims: { type: "object", additionalProperties: false, properties: Object.fromEntries(DIMS.map((d) => [d.name, dimSchema])), required: DIMS.map((d) => d.name) },
    moments: { type: "array", items: { type: "string" } },
    letter: { type: "string" },
  },
  required: ["archetype", "tagline", "dims", "moments", "letter"],
};

type Body = { bookId: string; profile: Profile; ending: string; key: string };
type Raw = { archetype: string; tagline: string; dims: Record<string, { score: number; because: string }>; moments: string[]; letter: string };

export async function POST(req: Request) {
  const { bookId, profile, ending, key } = (await req.json()) as Body;
  const book = getBook(bookId);
  if (!book || !profile) return NextResponse.json({ error: "unknown book" }, { status: 400 });
  const journal = (profile.journal ?? []).filter((j) => book.scenes[j.scene]);
  const choices = journal.filter((j) => j.choice).map((j) => j.choice!);
  const mercy = profile.traits?.mercy ?? 0;

  let raw: Raw | null = null;
  if (mockMode) {
    raw = {
      archetype: "The Penitent", tagline: "You learned, late and at great cost, that a crown can bend without breaking.",
      dims: Object.fromEntries(DIMS.map((d) => [d.name, { score: 60, because: `You chose "${choices[0] ?? "to go on"}".` }])),
      moments: choices.slice(0, 3), letter: "My lady, I have shelved your book. It is shorter than I hoped and better than I feared. Come back soon; the doors are waiting. Lucienne",
    };
  } else {
    const story = journal.map((j, i) => `${i + 1}. ${book.scenes[j.scene].title}: ${j.recap ?? ""}${j.choice ? `\n   SHE CHOSE: "${j.choice}"` : ""}`).join("\n");
    const relations = Object.entries(profile.relations ?? {}).map(([who, r]) => `${who}: trust ${r.trust}, fear ${r.fear}`).join("; ");
    const system = `You are Lucienne, librarian of the Dreaming, writing the last page of ${profile.name ?? "Aurie"}'s book "${book.title}": a warm, perceptive personality reading, like the result page of a good personality test, based ONLY on the choices she made below.
Rules:
- Every judgement rests on her actual choices; never invent events, people or choices that are not listed.
- archetype: the one from the list that fits her choices best. tagline: one sentence, second person, why it fits.
- dims: score each 0 to 100 (50 is balanced). "because": one short second-person sentence naming a specific choice she made. Her Mercy in the game is ${mercy} on a scale of -10 to 10; let the Mercy sentence agree with that.
- moments: the three choices that defined her most, copied WORD FOR WORD from the lines marked SHE CHOSE.
- letter: 60 to 90 words from you to her, addressed "My lady", British English, warm and dry, specific to two or three of her choices, ending with a hint that other doors in the library are waiting. Sign it "Lucienne".
- Plain, kind, honest. Flattering where earned, gently frank where not. No headings, no lists inside strings.
Answer with this JSON object only, nothing before or after it:
{"archetype": "one of: ${ARCHETYPES.join(" | ")}", "tagline": "...", "dims": {${DIMS.map((d) => `"${d.name}": {"score": 0-100, "because": "..."}`).join(", ")}}, "moments": ["...", "...", "..."], "letter": "..."}`;
    const user = `Her story, in order:\n${story || "(she made no recorded choices)"}\n\nHow the people she met feel about her now: ${relations || "unknown"}.\nAllies who came when she needed them: ${profile.vars?.[bookId]?.allies ?? 0}.\nHer ending: ${book.scenes[ending]?.title ?? ending}.`;
    for (const model of modelOrder(models.dialogue, models.dialogueFallbacks)) {
      let text: string;
      try {
        const j = await gatewayJson<{ choices: { message: { content: string } }[] }>("/chat/completions", {
          model,
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
          temperature: 0.7,
          max_tokens: 1400,
          response_format: { type: "json_schema", json_schema: { name: "reading", strict: true, schema: readingSchema } },
        }, 45_000);
        text = j.choices?.[0]?.message?.content ?? "";
        reportModel(model, true);
      } catch (e) {
        reportModel(model, false); // the channel failed: benched for the dialogue too
        console.error(`reading: ${model} failed:`, (e as Error).message.slice(0, 160));
        continue;
      }
      try {
        raw = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as Raw;
        break;
      } catch {
        console.error(`reading: ${model} answered without usable JSON:`, text.slice(0, 160)); // a bad answer, not a dead channel
      }
    }
  }
  if (!raw) return NextResponse.json({ error: "reading unavailable" }, { status: 502 });

  // Never trust the model's numbers or quotes: clamp the scores, set Mercy from the game, keep only real choices.
  // Some gateway models ignore the schema, so accept dims as {Name: {...}} in any case, or as [{name, ...}].
  const dimOf = (name: string): { score?: number; because?: string } | undefined => {
    const d = raw!.dims as unknown;
    if (Array.isArray(d)) return d.find((x) => String(x?.name ?? x?.dimension ?? "").toLowerCase() === name.toLowerCase());
    if (d && typeof d === "object") return Object.entries(d).find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1] as { score?: number; because?: string };
  };
  const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 50)));
  const real = new Set(choices);
  const moments = [...new Set((raw.moments ?? []).filter((m) => real.has(m)))];
  for (const c of [choices[0], choices[Math.floor(choices.length / 2)], choices[choices.length - 1]]) if (moments.length < 3 && c && !moments.includes(c)) moments.push(c);
  const reading: Reading = {
    key,
    archetype: ARCHETYPES.includes(raw.archetype) ? raw.archetype : ARCHETYPES[0],
    tagline: String(raw.tagline ?? ""),
    dims: DIMS.map((d) => ({ ...d, score: d.name === "Mercy" ? clamp((mercy + 10) * 5) : clamp(dimOf(d.name)?.score), because: String(dimOf(d.name)?.because ?? "") })),
    moments: moments.slice(0, 3),
    letter: String(raw.letter ?? ""),
  };
  return NextResponse.json(reading);
}
