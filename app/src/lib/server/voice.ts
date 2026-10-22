// Server-only: a character's voice for one line, guaranteed to be the scripted words.
import { getCharacter } from "@/lib/story/load";
import { gatewayJson, models } from "@/lib/server/gateway";

const words = (t: string) => t.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);

/** Did the voice say the script (and not answer it, or add to it)? */
function faithful(script: string, heard: string) {
  const a = words(script), h = words(heard);
  if (!h.length) return false;
  const want = new Set(a);
  const hit = h.filter((w) => want.has(w)).length;
  return h.length <= a.length * 1.25 + 2 && hit / Math.max(a.length, 1) >= 0.8;
}

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
 * checked against the script. Up to three takes; null when none is faithful (the player then falls back).
 */
export async function synthLine(bookId: string, character: string, text: string, speaker?: string, mood?: string): Promise<Buffer | null> {
  const card = getCharacter(bookId, character);
  const part = speaker ? card?.speakers?.[speaker] : undefined;
  const voice = part?.ttsVoice ?? process.env[`TTS_VOICE_${character}`] ?? card?.ttsVoice ?? "marin";
  const base = part?.voiceDirection ?? card?.voiceDirection ?? "Natural, unhurried, intimate, as if in the same room.";
  // Act the feeling of this moment, not just the character's usual voice.
  const direction = mood && DELIVERY[mood] ? `${base} In this line the feeling is: ${DELIVERY[mood]}. Let it show in pace, breath and pauses.` : base;
  const script = text.replace(/\b[A-Z]{3,}:\s*/g, "").trim();
  if (!script) return null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const data = await gatewayJson<{ choices: { message: { audio?: { data?: string; transcript?: string } } }[] }>(
        "/chat/completions",
        {
          model: models.tts,
          modalities: ["text", "audio"],
          audio: { voice, format: "mp3" },
          temperature: 0.6,
          messages: [
            {
              role: "system",
              content: `You are a text-to-speech engine for a film. You never converse. You read the script line you are given aloud, exactly and only those words, in character, then stop. If the line is a question, you ASK it; you never answer it. Performance direction: ${direction}`,
            },
            { role: "user", content: `Script line (read it aloud verbatim, nothing before or after):\n<<<${script}>>>` },
          ],
        },
        30_000,
      );
      const audio = data.choices?.[0]?.message?.audio;
      if (!audio?.data) continue;
      if (audio.transcript && !faithful(script, audio.transcript)) {
        console.error(`tts: off-script take ${attempt} for "${script.slice(0, 40)}": "${audio.transcript.slice(0, 80)}"`);
        continue;
      }
      return Buffer.from(audio.data, "base64");
    } catch (e) {
      console.error(`tts: take ${attempt} failed:`, (e as Error).message.slice(0, 120));
    }
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
