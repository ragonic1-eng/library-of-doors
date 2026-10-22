// Measures a voice take before it is sent to the phone.
// The voice model is a chat model, not a text-to-speech engine. Its transcript can claim every word
// while the audio itself went silent or faint partway through, or rambled on for a minute.
// Those takes are what make a character "stop halfway" or the game "get stuck" waiting for them.
import { MPEGDecoder } from "mpg123-decoder";

export type Take = {
  seconds: number; // whole clip
  speaking: number; // time with audible voice
  hole: number; // longest quiet stretch between the first and last audible moment
  tail: number; // quiet after the last audible moment
};

const WINDOW = 0.1; // seconds per loudness reading

export async function measure(buf: Buffer): Promise<Take | null> {
  const decoder = new MPEGDecoder();
  try {
    await decoder.ready;
    const { channelData, samplesDecoded, sampleRate } = decoder.decode(new Uint8Array(buf));
    const pcm = channelData[0];
    if (!pcm || !samplesDecoded) return null;
    const w = Math.max(1, Math.round(sampleRate * WINDOW));
    const rms: number[] = [];
    for (let i = 0; i + w <= samplesDecoded; i += w) {
      let sum = 0;
      for (let k = i; k < i + w; k++) sum += pcm[k] * pcm[k];
      rms.push(Math.sqrt(sum / w));
    }
    if (!rms.length) return null;
    // Audible = within reach of this clip's own speaking level, so a quiet voice is judged against itself.
    const level = [...rms].sort((a, b) => a - b)[Math.floor(rms.length * 0.9)];
    const audible = rms.map((r) => r > Math.max(level * 0.12, 0.004));
    const first = audible.indexOf(true), last = audible.lastIndexOf(true);
    if (first < 0) return { seconds: rms.length * WINDOW, speaking: 0, hole: rms.length * WINDOW, tail: rms.length * WINDOW };
    let hole = 0, run = 0;
    for (let i = first; i <= last; i++) {
      run = audible[i] ? 0 : run + 1;
      hole = Math.max(hole, run);
    }
    return {
      seconds: rms.length * WINDOW,
      speaking: audible.filter(Boolean).length * WINDOW,
      hole: hole * WINDOW,
      tail: (rms.length - 1 - last) * WINDOW,
    };
  } finally {
    decoder.free();
  }
}

/** Why this take cannot be used for a script of `words` words, or null when it can. */
export function flaw(t: Take, words: number): string | null {
  if (t.tail > 1.5) return `went quiet ${t.tail.toFixed(1)}s before the end`;
  // A menacing actor holds a pause for three seconds; a take that lost its words goes quiet far longer.
  if (t.hole > 3.5) return `a ${t.hole.toFixed(1)}s silence mid-line`;
  // A real reading takes about 0.4 s a word; far longer means mumbling, repeating or rambling on.
  if (t.seconds > words * 0.65 + 8) return `ran ${t.seconds.toFixed(0)}s for ${words} words`;
  // Audible-voice time undercounts soft consonants, so only an impossible rate counts as missing words.
  if (words >= 6 && t.speaking < words / 6.5) return `only ${t.speaking.toFixed(1)}s of voice for ${words} words`;
  return null;
}
