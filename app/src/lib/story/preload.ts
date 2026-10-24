// No black screens on a slow connection, in two layers:
// - The whole book is saved on the phone (Cache Storage) in story order from the moment she opens it, so it
//   survives closing the app and later visits need no network for pictures (saveBook).
// - The next few scenes are held in memory, ready to play at once, read from the phone's copy when it has
//   one and from the network otherwise (warm). Older files leave memory above a budget, never those ahead.
import type { Book, Scene } from "./types";

const CAP_BYTES = 160e6; // a phone's comfortable share of memory for pictures
const STORE = "lod-media-v1"; // the phone's saved copy of the book's media
const cache = new Map<string, { blob: string; bytes: number }>(); // remote URL -> object URL, oldest first
const inflight = new Map<string, Promise<void>>();
let total = 0;

/** The in-memory copy of a media file when it has arrived, otherwise the file's own address. */
export const cachedUrl = (url: string) => cache.get(url)?.blob ?? url;

const store = () => (typeof caches !== "undefined" ? caches.open(STORE).catch(() => null) : Promise.resolve(null));

/** The file from the phone's saved copy, or from the network (saving it on the way). */
async function getFile(url: string): Promise<Blob> {
  const s = await store();
  const hit = await s?.match(url).catch(() => undefined);
  if (hit) return hit.blob();
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  if (s) await s.put(url, r.clone()).catch(() => undefined); // storage full or private mode: just play it
  return r.blob();
}

function fetchOne(url: string): Promise<void> {
  if (cache.has(url)) return Promise.resolve();
  let p = inflight.get(url);
  if (!p) {
    p = getFile(url)
      .then((b) => {
        cache.set(url, { blob: URL.createObjectURL(b), bytes: b.size });
        total += b.size;
      })
      .catch(() => undefined) // a file that fails here is simply streamed when its beat comes
      .finally(() => inflight.delete(url));
    inflight.set(url, p);
  }
  return p;
}

/** Downloads these files (nearest first, a few at a time); calls onProgress as each one lands. */
export async function warm(urls: string[], onProgress?: (done: number, all: number) => void, parallel = 3): Promise<void> {
  const list = [...new Set(urls)];
  let next = 0, done = 0;
  onProgress?.(0, list.length);
  const worker = async () => {
    while (next < list.length) {
      await fetchOne(list[next++]);
      onProgress?.(++done, list.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(parallel, list.length) }, worker));
  // Over budget: let go of the oldest files that are not in this window.
  const keep = new Set(list);
  for (const [url, c] of cache) {
    if (total <= CAP_BYTES) break;
    if (keep.has(url)) continue;
    URL.revokeObjectURL(c.blob);
    cache.delete(url);
    total -= c.bytes;
  }
}

/** Saves every listed file on the phone, in order, one or two at a time, skipping what is saved already;
 *  then drops saved files the book no longer uses (an older version of a picture). Reports how far it got. */
export async function saveBook(urls: string[], onProgress?: (done: number, all: number) => void, parallel = 2): Promise<void> {
  const s = await store();
  if (!s) return;
  const list = [...new Set(urls)];
  const saved = new Set((await s.keys().catch(() => [])).map((r) => r.url));
  const abs = (u: string) => new URL(u, location.href).href;
  let next = 0, done = 0;
  const worker = async () => {
    while (next < list.length) {
      const u = list[next++];
      if (inflight.has(u)) await inflight.get(u); // the scene loader is fetching it: it saves it too
      else if (!saved.has(abs(u)) && !cache.has(u)) {
        try {
          const r = await fetch(u);
          if (r.ok) await s.put(u, r);
        } catch { /* offline or storage full: it streams when its beat comes */ }
      }
      onProgress?.(++done, list.length);
    }
  };
  onProgress?.(0, list.length);
  await Promise.all(Array.from({ length: Math.min(parallel, list.length) }, worker));
  const wanted = new Set(list.map(abs));
  for (const k of saved) if (!wanted.has(k)) await s.delete(k).catch(() => undefined);
}

/** Every scene she can reach from here within `depth` steps, nearest first (any choice, any branch). */
export function scenesAhead(book: Book, from: string, depth: number): Scene[] {
  const seen = new Set([from]);
  let ring = [from];
  const out: Scene[] = book.scenes[from] ? [book.scenes[from]] : [];
  for (let d = 0; d < depth; d++) {
    const nextRing: string[] = [];
    for (const id of ring) {
      const sc = book.scenes[id];
      if (!sc) continue;
      const nexts = [sc.next, ...(sc.branch ?? []).map((b) => b.next), ...(sc.choices ?? []).flatMap((c) => [c.next, ...(c.branch ?? []).map((b) => b.next)])];
      for (const n of nexts) if (n && !seen.has(n) && book.scenes[n]) { seen.add(n); nextRing.push(n); out.push(book.scenes[n]); }
    }
    ring = nextRing;
  }
  return out;
}
