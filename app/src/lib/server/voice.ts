// Server-only: a character voice with script/transcript validation.
import { faithful } from "@/lib/server/faithful";
import { flaw, measure } from "@/lib/server/mp3";
import { getCharacter } from "@/lib/story/load";
import { gatewayJson, modelOrder, models, reportModel } from "@/lib/server/gateway";

/** How each mood should colour the delivery. */
const DELIVERY: Record<string, string> = {
  neutral: "measured and present",
  warm: "warm and tender, a little moved",
  wary: "guarded and careful, weighing every word",
  hostile: "cold and cutting, anger held just under control",
  amused: "amused, a smile you can hear",
  afraid: "frightened, breath catching, a little too fast",
  grieving: "grief-stricken, the voice close to breaking",
};

/**
 * The key has no plain text-to-speech model, so an audio chat model (gpt-audio-1.5) reads the line.
 * Such a model can ANSWER a line instead of reading it ("Who is Rachel?" -> "I don't know Rachel"),
 * so it is told it is a text-to-speech engine, the line is fenced, and the transcript it returns is
 * checked against the script; the audio itself is measured for dead air. Up to five takes (one, then two at once,
 * then two more after a short pause); null when none is usable (the player then shows the line without a voice).
 */
export async function synthLine(bookId: string, character: string, text: string, speaker?: string, mood?: string): Promise<Buffer | null> {
  const card = getCharacter(bookId, character);
  const part = speaker ? card?.speakers?.[speaker] : undefined;
  const voice = part?.ttsVoice ?? process.env[`TTS_VOICE_${character}`] ?? card?.ttsVoice ?? "marin";
  const base = part?.voiceDirection ?? card?.voiceDirection ?? "Natural, unhurried, intimate, as if in the same room.";
  // Act the feeling of this moment, not just the character's usual voice.
  const direction = mood && DELIVERY[mood] ? `${base} In this line the feeling is: ${DELIVERY[mood]}. Let it show in pace, breath and pauses.` : base;
  const script = text.replace(/\b[A-Z]{3,}:\s*/g, "").trim();
  if (!/[a-z0-9]/i.test(script)) return null; // "…" or a pause: nothing to say aloud
  type Reply = { choices: { finish_reason?: string; message: { audio?: { data?: string; transcript?: string } } }[] };
  // The main voice model first; if its gateway channel is down, the backup (same voices) at once, and the
  // dead one is benched for a few minutes so later lines do not wait on it.
  const ask = async (n: number): Promise<Reply | null> => {
    for (const model of modelOrder(models.tts, models.ttsFallbacks)) {
      try {
        const data = await gatewayJson<Reply>(
        "/chat/completions",
        {
          model,
          modalities: ["text", "audio"],
          audio: { voice, format: "mp3" },
          temperature: 0.6,
          messages: [
            {
              role: "system",
              content: `You are a text-to-speech engine for a film. You never converse. You read the script line you are given aloud, exactly and only those words, in character, then stop. If the line is a question, you ASK it; you never answer it. Every word must be clearly audible at a steady speaking volume from the first word to the last: lower the pitch or slow down for effect, but never whisper, never fade out, and never leave a silence longer than a breath. Performance direction: ${direction}`,
            },
            { role: "user", content: `Script line (read it aloud verbatim, nothing before or after):
<<<${script}>>>` },
          ],
        },
        25_000,
        );
        reportModel(model, true);
        return data;
      } catch (e) {
        reportModel(model, false);
        console.error(`tts: take ${n} failed on ${model}:`, (e as Error).message.slice(0, 120));
      }
    }
    return null;
  };
  const oneTake = async (n: number): Promise<Buffer | null> => {
    try {
      const data = await ask(n);
      if (!data) return null;
      const audio = data.choices?.[0]?.message?.audio;
      if (!audio?.data || data.choices?.[0]?.finish_reason === "length") return null;
      if (!faithful(script, audio.transcript)) {
        console.error(`tts: off-script take ${n} for "${script.slice(0, 40)}": "${(audio.transcript ?? "missing transcript").slice(0, 80)}"`);
        return null;
      }
      // The transcript can claim every word while the audio went quiet partway through, or ran on for a minute.
      const buf = Buffer.from(audio.data, "base64");
      const take = await measure(buf).catch(() => null);
      const problem = take && flaw(take, script.split(/\s+/).length);
      if (problem) {
        console.error(`tts: take ${n} rejected, ${problem}: "${script.slice(0, 40)}"`);
        return null;
      }
      return buf;
    } catch (e) {
      console.error(`tts: take ${n} failed:`, (e as Error).message.slice(0, 120));
      return null;
    }
  };
  // One take first (each costs about 0.17 yuan, and most are good); if it fails, two at once so the
  // player is not kept waiting through a string of retries. The gateway sometimes refuses a burst of
  // requests for a second or two (401/503), so the last round waits a moment before trying again.
  const began = Date.now();
  const rounds = [[1], [2, 3], [4, 5]];
  for (let round = 0; round < rounds.length && (round === 0 || Date.now() - began < 30_000); round++) {
    if (round === 2) await new Promise((r) => setTimeout(r, 1500));
    const takes = rounds[round].map((n) => oneTake(n));
    const good = await new Promise<Buffer | null>((resolve) => {
      let left = takes.length;
      for (const t of takes) void t.then((b) => (b ? resolve(b) : --left === 0 && resolve(null)));
    });
    if (good) return good;
  }
  return null;
}

/** "MAIDEN: Hello. CRONE: Hush." -> parts per labelled speaker, when the character has speakers. */
export function splitParts(text: string, labelled: boolean): { speaker?: string; text: string }[] {
  if (!labelled) return [{ text }];
  const bits = text.split(/\b([A-Z]{3,}):\s*/);
  if (bits.length < 3) return [{ text }];
  const out: { speaker?: string; text: string }[] = [];
  if (bits[0].trim()) out.push({ text: bits[0].trim() });
  for (let i = 1; i < bits.length; i += 2) {
    const line = (bits[i + 1] ?? "").trim();
    if (line) out.push({ speaker: bits[i], text: line });
  }
  return out;
}

