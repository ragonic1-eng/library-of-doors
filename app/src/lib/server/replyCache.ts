// Server-only: a character's reply to a suggested line (an Idea she tapped), saved the first time it is made
// and replayed instantly, with its voice, every time after. Only the first exchange of a conversation is
// saved, and the key includes everything that shapes that reply (the scene, the character card, the line,
// and whichever of her story flags this scene mentions), so a saved reply never contradicts her story.
import { createHash } from "node:crypto";
import { put } from "@vercel/blob";
import type { DialogueReply, Profile, Scene } from "@/lib/story/types";
import { faithful } from "@/lib/server/faithful";
import { gatewayJson, modelOrder, models } from "@/lib/server/gateway";
import { splitParts } from "@/lib/server/voice";

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
// The Blob store's origin, from the public media base (".../clips"). Unset locally: nothing is cached there.
const ORIGIN = process.env.NEXT_PUBLIC_CLIP_BASE?.replace(/\/clips\/?$/, "");

export function replyKey(bookId: string, scene: Scene, card: unknown, profile: Profile, playerLine: string | undefined, intent: string | undefined, turnsSoFar: number): string | null {
  const conv = scene.conversation;
  if (!conv || !playerLine || turnsSoFar !== 0 || !TOKEN || !ORIGIN) return null;
  const line = playerLine.trim();
  const ideas = [...(conv.suggestions ?? []), ...(scene.choices ?? []).map((c) => c.text)];
  if (!ideas.includes(line)) return null; // typed in her own words: always a live reply
  const sceneText = JSON.stringify({ conv, choices: scene.choices, beats: scene.beats });
  const flags = Object.entries(profile.flags[bookId] ?? {}).filter(([k, v]) => v && sceneText.includes(k)).map(([k]) => k).sort();
  return createHash("sha1").update(JSON.stringify([bookId, scene.id, line, intent ?? "", flags, sceneText, card])).digest("hex").slice(0, 24);
}

const path = (bookId: string, key: string) => `replies/${bookId}/${key}.json`;

export async function savedReply(bookId: string, key: string): Promise<DialogueReply | null> {
  try {
    const res = await fetch(`${ORIGIN}/${path(bookId, key)}`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
    return res.ok ? ((await res.json()) as DialogueReply) : null;
  } catch {
    return null;
  }
}

/** What is actually said in a take, heard by a separate listening call (not the transcript the voice model claimed). */
async function hear(audio: string): Promise<string | null> {
  for (const model of modelOrder(models.tts, models.ttsFallbacks)) {
    try {
      const data = await gatewayJson<{ choices: { message: { content?: string } }[] }>("/chat/completions", {
        model,
        modalities: ["text"],
        messages: [{ role: "user", content: [
          { type: "text", text: "Transcribe exactly every word spoken in this audio, from the first sound to the last. Output only the words." },
          { type: "input_audio", input_audio: { data: audio, format: "mp3" } },
        ] }],
      }, 30_000);
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch {
      /* next model */
    }
  }
  return null;
}

/**
 * Keep a reply only when it is complete and every speaker's voice, listened to again from the start, says
 * every word of the line. A saved reply replays forever, so it gets this second, independent check on top of
 * the checks every live take already passes (transcript against the script, dead air, length).
 */
export async function saveReply(bookId: string, key: string, reply: DialogueReply, labelled: boolean) {
  if (!reply.dialogue || !reply.voice?.length || reply.voice.some((v) => !v.audio)) return;
  const parts = splitParts(reply.dialogue, labelled);
  if (parts.length !== reply.voice.length) return;
  for (let i = 0; i < parts.length; i++) {
    const heard = await hear(reply.voice[i].audio!);
    if (!heard || !faithful(parts[i].text, heard)) {
      console.error(`reply cache: not saved, take ${i + 1} did not say the whole line: "${(heard ?? "nothing heard").slice(0, 80)}"`);
      return;
    }
  }
  try {
    await put(path(bookId, key), JSON.stringify(reply), { access: "public", token: TOKEN, addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
  } catch (e) {
    console.error("reply cache: save failed:", (e as Error).message.slice(0, 120));
  }
}
