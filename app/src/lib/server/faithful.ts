// Punctuation and typographic apostrophes do not change the spoken script.
const words = (text: string) => text.toLowerCase().replace(/[’‘]/g, "'")
  .replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);

/** Reject missing, reordered or repeated words, including an incomplete final sentence.
 * A provider transcript is a useful gate, not a substitute for listening to the bytes. */
export function faithful(script: string, heard?: string): boolean {
  if (!heard) return false;
  // *chuckles*, [sighs], (laughs): the transcript's notes on sounds are performance, not words.
  const spoken = heard.replace(/\*[^*]*\*|\[[^\]]*\]|\([^)]*\)/g, " ");
  const expected = words(script), actual = words(spoken);
  return expected.length > 0 && expected.length === actual.length
    && expected.every((word, i) => word === actual[i]);
}
