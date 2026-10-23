// Server-only helper for the Infistar gateway (OpenAI-compatible). Never import from client code.

const BASE = (process.env.INFISTAR_BASE_URL ?? "https://infistar.ai/v1").replace(/\/$/, "");
const KEY = process.env.INFISTAR_API_KEY ?? "";

export const models = {
  // Claude Haiku 5.5 by the owner's choice: the richest character writing. Gemini 3 Flash is about 3x faster but plainer (tools/bench_dialogue.mjs).
  dialogue: process.env.MODEL_DIALOGUE ?? "claude-haiku-5-5",
  // Tried in order when the main dialogue model fails upstream (a gateway channel can drop out for a while).
  // Different providers on purpose, so one provider's outage cannot silence the characters.
  dialogueFallbacks: (process.env.MODEL_DIALOGUE_FALLBACK ?? "gemini-3-flash,gpt-5.4-mini").split(",").map((m) => m.trim()).filter(Boolean),
  tts: process.env.MODEL_TTS ?? "gpt-audio-1.5",
  // Same voices (marin, verse, ...), used when the main voice model's channel is down.
  ttsFallbacks: (process.env.MODEL_TTS_FALLBACK ?? "gpt-audio").split(",").map((m) => m.trim()).filter(Boolean),
};

export const mockMode = !KEY || process.env.MOCK_AI === "1";

// ---------- circuit breaker ----------
// When a model's upstream channel fails, it is benched for a while so players never wait on a dead channel;
// after the bench time it gets one live try again, and goes straight back to first place if it answers.
const BENCH_MS = 3 * 60_000;
const benchedUntil = new Map<string, number>();
export function modelOrder(primary: string, fallbacks: string[]): string[] {
  const now = Date.now();
  const all = [primary, ...fallbacks.filter((m) => m !== primary)];
  const healthy = all.filter((m) => (benchedUntil.get(m) ?? 0) <= now);
  const benched = all.filter((m) => (benchedUntil.get(m) ?? 0) > now);
  return [...healthy, ...benched]; // benched models stay last, as a final resort
}
export function reportModel(model: string, ok: boolean) {
  if (ok) benchedUntil.delete(model);
  else benchedUntil.set(model, Date.now() + BENCH_MS);
}
export function modelHealth() {
  const now = Date.now();
  return Object.fromEntries([...benchedUntil].filter(([, t]) => t > now).map(([m, t]) => [m, `benched ${Math.round((t - now) / 1000)}s`]));
}

export async function gatewayJson<T>(path: string, body: unknown, timeoutMs = 60_000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`gateway ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** A streamed chat completion: calls onText with the text so far as it arrives; resolves with the whole text. */
export async function gatewayStream(path: string, body: Record<string, unknown>, timeoutMs: number, onText: (soFar: string) => void): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, stream: true }),
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) throw new Error(`gateway ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta) {
            text += delta;
            onText(text);
          }
        } catch { /* keep-alive or partial line */ }
      }
    }
    if (!text) throw new Error(`gateway ${path}: empty stream`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function gatewayBinary(path: string, body: unknown, timeoutMs = 60_000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`gateway ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}
