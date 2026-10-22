import { NextResponse } from "next/server";
import { getCharacter } from "@/lib/story/load";
import { gatewayJson, mockMode, models } from "@/lib/server/gateway";

// Voice through the gateway. The key has no dedicated TTS model, so an audio chat model
// (gpt-audio-1.5) is directed like a voice actor: it speaks the line verbatim, in character.
// Voice and direction live on the character card; override the voice with env TTS_VOICE_<character>.
/** Warm-up ping from the start gate. */
export async function GET() {
  return NextResponse.json({ ok: true, model: models.tts, mock: mockMode });
}

export async function POST(req: Request) {
  const { text, bookId, character, speaker } = (await req.json()) as { text: string; bookId: string; character: string; speaker?: string };
  if (!text?.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });
  if (mockMode) return NextResponse.json({ error: "tts offline" }, { status: 503 });

  const card = getCharacter(bookId, character);
  const part = speaker ? card?.speakers?.[speaker] : undefined;
  const voice = part?.ttsVoice ?? process.env[`TTS_VOICE_${character}`] ?? card?.ttsVoice ?? "marin";
  const direction = part?.voiceDirection ?? card?.voiceDirection ?? "Natural, unhurried, intimate, as if in the same room.";

  try {
    const data = await gatewayJson<{ choices: { message: { audio?: { data?: string } } }[] }>(
      "/chat/completions",
      {
        model: models.tts,
        modalities: ["text", "audio"],
        audio: { voice, format: "mp3" },
        messages: [
          {
            role: "system",
            content: `You are a voice actor recording one line for a film. Speak the user's text aloud exactly as written, word for word. Add nothing, omit nothing, never answer or comment on it. Performance direction: ${direction}`,
          },
          // Speaker labels ("MAIDEN:", "CRONE:") are for the reader's eyes, not the voice.
          { role: "user", content: text.replace(/\b[A-Z]{3,}:\s*/g, "") },
        ],
      },
      45_000,
    );
    const b64 = data.choices?.[0]?.message?.audio?.data;
    if (!b64) throw new Error("no audio in response");
    return new Response(Buffer.from(b64, "base64"), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "tts unavailable" }, { status: 502 });
  }
}
