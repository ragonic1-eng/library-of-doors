// Server-only helper for the Infistar gateway (OpenAI-compatible). Never import from client code.

const BASE = (process.env.INFISTAR_BASE_URL ?? "https://infistar.ai/v1").replace(/\/$/, "");
const KEY = process.env.INFISTAR_API_KEY ?? "";

export const models = {
  dialogue: process.env.MODEL_DIALOGUE ?? "grok-4.7",
  // Tried in order when the main dialogue model fails upstream (a gateway channel can drop out for a while).
  // Different providers on purpose, so one provider's outage cannot silence the characters.
  dialogueFallbacks: (process.env.MODEL_DIALOGUE_FALLBACK ?? "gpt-5.4-mini,gemini-3-flash").split(",").map((m) => m.trim()).filter(Boolean),
  tts: process.env.MODEL_TTS ?? "gpt-audio-1.5",
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
