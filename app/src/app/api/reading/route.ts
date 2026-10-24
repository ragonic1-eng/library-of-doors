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
// What the hero becomes in each book's own terms; a book without a lens gets the personality reading only.
const LENS: Record<string, string> = {
  sandman: `She played Dream of the Endless, the Lord (here Lady) of Dreams and Nightmares, who shapes what every sleeper sees.
- dream.title: what kind of Dream she is, as a title, for example "The Dream of Second Chances" (4 to 7 words, her own, not this example).
- dream.realm: two or three sentences on how the Dreaming looks and feels under her rule (the palace, the gates, the weather, how her servants speak of her), grown from her choices.
- dream.gifts: exactly three dreams she would send tonight, each to a different ordinary sleeper somewhere in the world today (say who and where in a few words, e.g. "a night-shift nurse in Singapore"); "dream" is two or three vivid present-tense sentences of the dream itself, in the spirit of a choice she made.
- dream.nightmare: two sentences: the nightmare she sends to those who earn one, and who earns it.`,
};

type Raw = {
  archetype: string; tagline: string; dims: unknown; moments: string[]; letter: string;
  dream?: { title?: string; realm?: string; gifts?: { to?: string; dream?: string }[]; nightmare?: string };
  depth?: { strengths?: string[]; shadow?: string; fears?: string; love?: string };
};
type Body = { bookId: string; profile: Profile; ending: string; key: string };

export async function POST(req: Request) {
  const { bookId, profile, ending, key } = (await req.json()) as Body;
  const book = getBook(bookId);
  if (!book || !profile) return NextResponse.json({ error: "unknown book" }, { status: 400 });
  const journal = (profile.journal ?? []).filter((j) => book.scenes[j.scene]);
  const choices = journal.filter((j) => j.choice).map((j) => j.choice!);
  const mercy = profile.traits?.mercy ?? 0;
  const lens = LENS[bookId];

  let raw: Raw | null = null;
  if (mockMode) {
    raw = {
      archetype: "The Penitent", tagline: "You learned, late and at great cost, that a crown can bend without breaking.",
      dims: Object.fromEntries(DIMS.map((d) => [d.name, { score: 60, because: `You chose "${choices[0] ?? "to go on"}".` }])),
      moments: choices.slice(0, 3), letter: "My lady, I have shelved your book. It is shorter than I hoped and better than I feared. Come back soon; the doors are waiting. Lucienne",
      dream: {
        title: "The Dream of Late Kindness", realm: "Under you the Dreaming is quieter. The gates stand half open, and the ravens gossip less.",
        gifts: [{ to: "a night-shift nurse in Singapore", dream: "She is walking home along a beach that was never there. Every shell she lifts is warm." }, { to: "a boy in Leeds who is afraid of the dark", dream: "The dark sits beside him like a large, polite dog. It wants to be scratched behind the ears." }, { to: "an old man in Lisbon", dream: "His wife is laughing in the next room. He does not go in; he does not need to." }],
        nightmare: "To the cruel you send a long corridor of doors that all open onto their own faces. Only those who hurt the helpless ever see it.",
      },
      depth: { strengths: ["You keep promises", "You can change your mind"], shadow: "You wait too long to forgive.", fears: "Being needed and failing.", love: "Quietly, by staying." },
    };
  } else {
    const story = journal.map((j, i) => `${i + 1}. ${book.scenes[j.scene].title}: ${j.recap ?? ""}${j.choice ? `\n   SHE CHOSE: "${j.choice}"` : ""}`).join("\n");
    const relations = Object.entries(profile.relations ?? {}).map(([who, r]) => `${who}: trust ${r.trust}, fear ${r.fear}`).join("; ");
    const system = `You are Lucienne, librarian of the Dreaming, writing the last pages of ${profile.name ?? "Aurie"}'s book "${book.title}": a warm, perceptive, deep personality reading, like the result pages of a very good personality test, based ONLY on the choices she made below.
Rules:
- Every judgement rests on her actual choices; never invent events, people or choices from her story that are not listed.
- archetype: the one from the list that fits her choices best. tagline: one sentence, second person, why it fits.
- dims: score each 0 to 100 (50 is balanced). "because": one short second-person sentence naming a specific choice she made. Her Mercy in the game is ${mercy} on a scale of -10 to 10; let the Mercy sentence agree with that.
- depth.strengths: three short phrases (3 to 6 words each). depth.shadow: one or two sentences, her blind spot, frank but kind. depth.fears: one sentence, what she is most afraid of underneath. depth.love: one sentence, how she shows love.
${lens ?? ""}
- moments: the three choices that defined her most, copied WORD FOR WORD from the lines marked SHE CHOSE.
- letter: 60 to 90 words from you to her, addressed "My lady", British English, warm and dry, specific to two or three of her choices, ending with a hint that other doors in the library are waiting. Sign it "Lucienne".
- Second person throughout ("you"). Plain, vivid, kind, honest. Flattering where earned, gently frank where not. No headings or lists inside strings.
Answer with this JSON object only, nothing before or after it:
{"archetype": "one of: ${ARCHETYPES.join(" | ")}", "tagline": "...", "dims": {${DIMS.map((d) => `"${d.name}": {"score": 0-100, "because": "..."}`).join(", ")}}, "depth": {"strengths": ["...", "...", "..."], "shadow": "...", "fears": "...", "love": "..."},${lens ? ` "dream": {"title": "...", "realm": "...", "gifts": [{"to": "...", "dream": "..."}, {"to": "...", "dream": "..."}, {"to": "...", "dream": "..."}], "nightmare": "..."},` : ""} "moments": ["...", "...", "..."], "letter": "..."}`;
    const user = `Her story, in order:\n${story || "(she made no recorded choices)"}\n\nHow the people she met feel about her now: ${relations || "unknown"}.\nAllies who came when she needed them: ${profile.vars?.[bookId]?.allies ?? 0}.\nHer ending: ${book.scenes[ending]?.title ?? ending}.`;
    for (const model of modelOrder(models.dialogue, models.dialogueFallbacks)) {
      let text: string;
      try {
        const j = await gatewayJson<{ choices: { message: { content: string } }[] }>("/chat/completions", {
          model,
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
          temperature: 0.8,
          max_tokens: 2400,
          response_format: { type: "json_object" },
        }, 60_000);
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
  // Some gateway models ignore the requested shape, so accept dims as {Name: {...}} in any case, or as [{name, ...}].
  const dimOf = (name: string): { score?: number; because?: string } | undefined => {
    const d = raw!.dims;
    if (Array.isArray(d)) return d.find((x) => String(x?.name ?? x?.dimension ?? "").toLowerCase() === name.toLowerCase());
    if (d && typeof d === "object") return Object.entries(d).find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1] as { score?: number; because?: string };
  };
  const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 50)));
  const str = (s: unknown) => (typeof s === "string" ? s.trim() : "");
  const real = new Set(choices);
  const moments = [...new Set((raw.moments ?? []).filter((m) => real.has(m)))];
  for (const c of [choices[0], choices[Math.floor(choices.length / 2)], choices[choices.length - 1]]) if (moments.length < 3 && c && !moments.includes(c)) moments.push(c);
  const gifts = (Array.isArray(raw.dream?.gifts) ? raw.dream.gifts : []).map((g) => ({ to: str(g?.to), dream: str(g?.dream) })).filter((g) => g.to && g.dream).slice(0, 3);
  const reading: Reading = {
    key,
    archetype: ARCHETYPES.includes(raw.archetype) ? raw.archetype : ARCHETYPES[0],
    tagline: str(raw.tagline),
    dims: DIMS.map((d) => ({ ...d, score: d.name === "Mercy" ? clamp((mercy + 10) * 5) : clamp(dimOf(d.name)?.score), because: str(dimOf(d.name)?.because) })),
    depth: { strengths: (Array.isArray(raw.depth?.strengths) ? raw.depth.strengths : []).map(str).filter(Boolean).slice(0, 3), shadow: str(raw.depth?.shadow), fears: str(raw.depth?.fears), love: str(raw.depth?.love) },
    ...(lens && str(raw.dream?.title) ? { dream: { title: str(raw.dream?.title), realm: str(raw.dream?.realm), gifts, nightmare: str(raw.dream?.nightmare) } } : {}),
    moments: moments.slice(0, 3),
    letter: str(raw.letter),
  };
  return NextResponse.json(reading);
}
