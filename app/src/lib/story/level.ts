/** Every character voice is played at the same speaking loudness.
 *  The voice model records each speaker at its own level: the Crone came out about 19 dB quieter than the Maiden,
 *  so in a three-voice reply the last two were nearly inaudible. */

const TARGET = 0.08; // speech level of a voice, about -22 dBFS (the narrator sits near -24)
const MAX_GAIN = 8; // +18 dB: enough for the quietest voice measured, the Crone, at about -37 dBFS
const MIN_GAIN = 0.35;

/** Gain that brings these samples' speech (the louder windows, not the pauses) to the target level. */
export function speechGain(samples: Float32Array, sampleRate: number): number {
  const w = Math.max(1, Math.round(sampleRate * 0.05));
  const rms: number[] = [];
  for (let i = 0; i + w <= samples.length; i += w) {
    let sum = 0;
    for (let k = i; k < i + w; k++) sum += samples[k] * samples[k];
    rms.push(Math.sqrt(sum / w));
  }
  if (!rms.length) return 1;
  const loud = [...rms].sort((a, b) => a - b)[Math.floor(rms.length * 0.9)];
  const speech = rms.filter((r) => r > loud * 0.25);
  const level = Math.sqrt(speech.reduce((a, r) => a + r * r, 0) / Math.max(1, speech.length));
  return level > 1e-4 ? Math.min(MAX_GAIN, Math.max(MIN_GAIN, TARGET / level)) : 1;
}

/** Route a voice through the mixer at a level matched to the rest of the cast. Returns false when it cannot,
 *  and the element then plays on its own exactly as before. */
export async function levelVoice(ctx: AudioContext | null, el: HTMLAudioElement, blob: Blob, volume = 1): Promise<boolean> {
  if (!ctx || ctx.state !== "running") return false;
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const gain = ctx.createGain();
    gain.gain.value = speechGain(decoded.getChannelData(0), decoded.sampleRate) * volume; // the player's voice level
    // A boosted whisper must not clip: a fast limiter just under full scale.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.1;
    ctx.createMediaElementSource(el).connect(gain).connect(limiter).connect(ctx.destination);
    return true;
  } catch {
    return false;
  }
}
