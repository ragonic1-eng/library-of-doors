// Server-only helper for the Infistar gateway (OpenAI-compatible). Never import from client code.

const BASE = (process.env.INFISTAR_BASE_URL ?? "https://infistar.ai/v1").replace(/\/$/, "");
const KEY = process.env.INFISTAR_API_KEY ?? "";

export const models = {
  dialogue: process.env.MODEL_DIALOGUE ?? "claude-haiku-5-5",
  tts: process.env.MODEL_TTS ?? "gpt-audio-1.5",
};

export const mockMode = !KEY || process.env.MOCK_AI === "1";

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

