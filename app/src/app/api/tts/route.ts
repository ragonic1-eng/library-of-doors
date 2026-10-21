import { NextResponse } from "next/server";
import { getCharacter } from "@/lib/story/load";
import { gatewayBinary, mockMode, models } from "@/lib/server/gateway";


// Text-to-speech through the gateway (MiniMax speech-2.8-turbo, OpenAI-compatible /audio/speech).
// Voice ids per character live on the character card; override with env TTS_VOICE_<character>.
export async function POST(req: Request) {
  const { text, bookId, character } = (await req.json()) as { text: string; bookId: string; character: string };
  if (!text?.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });
  if (mockMode) return NextResponse.json({ error: "tts offline" }, { status: 503 });

  const card = getCharacter(bookId, character);
  const voice = process.env[`TTS_VOICE_${character}`] ?? card?.ttsVoice ?? "English_Graceful_Lady";
  try {
    const upstream = await gatewayBinary("/audio/speech", {
      model: models.tts,
      input: text,
      voice,
      response_format: "mp3",
      speed: 0.95,
    });
    return new Response(upstream.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "tts unavailable" }, { status: 502 });
  }
}
