/** Own one performance, including narration and hooks. Late responses cannot speak in a later scene. */
export class VoicePlayback {
  private request: AbortController | null = null;
  private audio: HTMLAudioElement | null = null;
  private url: string | null = null;
  private generation = 0;
  private onActivity: (active: boolean) => void;

  constructor(onActivity: (active: boolean) => void = () => {}) {
    this.onActivity = onActivity;
  }

  stop() {
    this.generation += 1;
    this.request?.abort();
    this.request = null;
    if (this.audio) {
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.pause();
      this.audio = null;
      this.onActivity(false);
    }
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
  }

  private async play(url: string, generation: number): Promise<"playing" | "unavailable" | "cancelled"> {
    if (generation !== this.generation) return "cancelled";
    const audio = new Audio(url);
    this.audio = audio;
    this.onActivity(true);
    audio.onended = () => { if (generation === this.generation) this.stop(); };
    audio.onerror = () => { if (generation === this.generation) this.stop(); };
    try {
      await audio.play();
      return generation === this.generation ? "playing" : "cancelled";
    } catch {
      if (generation !== this.generation) return "cancelled";
      this.stop();
      return "unavailable";
    }
  }

  /** Pre-rendered narration and hooks share cancellation and music ducking with live dialogue. */
  playUrl(url: string) {
    this.stop();
    return this.play(url, this.generation);
  }

  async speak(text: string, bookId: string, character: string): Promise<"playing" | "unavailable" | "cancelled"> {
    this.stop();
    const generation = this.generation;
    const request = new AbortController();
    this.request = request;
    try {
      const res = await fetch("/api/tts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, bookId, character }), signal: request.signal,
      });
      if (!res.ok) throw new Error("Voice unavailable");
      const blob = await res.blob();
      if (generation !== this.generation) return "cancelled";
      this.url = URL.createObjectURL(blob);
      return await this.play(this.url, generation);
    } catch {
      if (generation !== this.generation) return "cancelled";
      this.stop();
      return "unavailable";
    }
  }
}
