import { NextResponse } from "next/server";

// Which deployment is live, so a tab left open can tell its player that a newer game is ready.
export async function GET(req: Request) {
  void new URL(req.url); // reading the request keeps this answer live, never cached at build time
  const id = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";
  return NextResponse.json({ id }, { headers: { "Cache-Control": "no-store" } });
}
