import { NextResponse } from "next/server";
import { head, put } from "@vercel/blob";

// Cloud save, no login: the game keeps a random code and mirrors the save to Vercel Blob under it.
// Typing the same code on another phone continues the same story there.
// Uses BLOB_READ_WRITE_TOKEN, which the linked Blob store provides to the project.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const VALID = /^[a-z2-9]{10}$/;
const normal = (code: string | null | undefined) => (code ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const path = (code: string) => `saves/${code}.json`;

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { code?: string; profile?: unknown } | null;
  if (!body?.profile || typeof body.profile !== "object") return NextResponse.json({ error: "no save" }, { status: 400 });
  const json = JSON.stringify(body.profile);
  if (json.length > 200_000) return NextResponse.json({ error: "save too large" }, { status: 413 });
  const given = normal(body.code);
  const code = VALID.test(given) ? given : newCode();
  try {
    await put(path(code), json, { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60 });
    return NextResponse.json({ code });
  } catch (e) {
    console.error("save failed:", (e as Error).message);
    return NextResponse.json({ error: "cloud save unavailable" }, { status: 502 });
  }
}

export async function GET(req: Request) {
  const code = normal(new URL(req.url).searchParams.get("code"));
  if (!VALID.test(code)) return NextResponse.json({ error: "That code does not look right." }, { status: 400 });
  try {
    const meta = await head(path(code));
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`blob ${res.status}`);
    return NextResponse.json({ code, profile: await res.json(), savedAt: meta.uploadedAt });
  } catch {
    return NextResponse.json({ error: "No save found for that code." }, { status: 404 });
  }
}
