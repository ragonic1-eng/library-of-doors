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
