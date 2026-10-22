// Original locally composed beds, served with the app rather than the remote clip store.
const scenes: Record<string, string> = {
  "2.2": "crossroads-v1", "3.1": "crossroads-v1", "3.2": "crossroads-v1",
  "2.5": "hell-v1", "2.6": "hell-v1", "2.8": "hell-v1", "4.1": "hell-v1",
  "2.9": "ruby-v1", "2.10": "ruby-v1",
  "2.12": "wings-v1", "5.2c": "wings-v1",
  "5.3": "friend-v1", "5.3c": "friend-v1", "end-ep5": "friend-v1",
};

export function sceneScore(book: string, scene: string, original?: string): string | undefined {
  if (original === "none") return original;
  return book === "sandman" && scenes[scene] ? `local:${scenes[scene]}` : original;
}

export function localScoreUrl(track: string): string | null {
  const id = track.replace(/^local:/, "");
  return track.startsWith("local:") && Object.values(scenes).includes(id)
    ? `/audio/music/${id}.mp3` : null;
}
