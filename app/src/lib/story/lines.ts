/** Stable id for a narrator line: FNV-1a 32-bit over the UTF-8 text, as 8 hex digits.
 *  tools/gen_narration.py computes the same id, so an edited line can never play stale audio. */
export function lineId(text: string): string {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(text.trim())) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Lines re-recorded with the same words keep their file name, and phones cache narration for a year.
 *  A revision here changes the address so every phone fetches the new recording. */
const REVISED: Record<string, number> = {
  "7133a4e2": 2, // 5.3: the take read its stage direction aloud
  "729e816f": 2, // 4.3: the take read its stage direction aloud
  "7bf5dbde": 2, // 5.0: the take repeated "a young novelist bought her"
  "d394979d": 2, // 2.7: the take skipped "Type your answer" and said "be" for "beat"
};

/** File name (and cache-busting query) for a narrator line's recording. */
export function lineFile(text: string): string {
  const id = lineId(text);
  return REVISED[id] ? `${id}.mp3?v=${REVISED[id]}` : `${id}.mp3`;
}
