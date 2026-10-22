/** A stall is lack of playback progress, never elapsed reading time. */
export function watchPlayback(
  media: Pick<HTMLMediaElement, "currentTime">,
  paused: () => boolean,
  stalled: () => void,
  timeoutMs = 30_000,
) {
  let lastTime = media.currentTime;
  let lastProgress = performance.now();
  const timer = setInterval(() => {
    const now = performance.now();
    if (paused() || media.currentTime !== lastTime) lastProgress = now;
    lastTime = media.currentTime;
    if (now - lastProgress >= timeoutMs) {
      clearInterval(timer);
      stalled();
    }
  }, 500);
  return () => clearInterval(timer);
}

/** Short utterances avoid Android/Chrome's long-utterance speech cutoff. */
export function speechChunks(text: string): string[] {
  const chunks: string[] = [];
  for (const sentence of text.match(/[^.!?]+[.!?]*\s*/g) ?? []) {
    let chunk = "";
    for (const word of sentence.trim().split(/\s+/)) {
      if (chunk && chunk.length + word.length + 1 > 140) {
        chunks.push(chunk);
        chunk = "";
      }
      chunk += (chunk ? " " : "") + word;
    }
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}
