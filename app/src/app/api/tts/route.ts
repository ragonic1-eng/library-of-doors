import { NextResponse } from "next/server";
import { mockMode, models } from "@/lib/server/gateway";
import { synthLine } from "@/lib/server/voice";

// A character's voice for one line (openings, inner voice, and any line the dialogue reply did not voice).
// The words are guaranteed to be the script: see synthLine.
/** Warm-up ping from the start gate. */
export async function GET() {
  return NextResponse.json({ ok: true, model: models.tts, mock: mockMode });
}

export async function POST(req: Request) {
  const { text, bookId, character, speaker } = (await req.json()) as { text: string; bookId: string; character: string; speaker?: string };
  if (!text?.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });
  if (mockMode) return NextResponse.json({ error: "tts offline" }, { status: 503 });
  const audio = await synthLine(bookId, character, text, speaker);
  if (!audio) return NextResponse.json({ error: "no faithful take" }, { status: 422 });
  return new Response(new Uint8Array(audio), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
