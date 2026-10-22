"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Beat, Book, Choice, DialogueReply, Fx, Profile, Scene } from "@/lib/story/types";
import { adjustRelation, applyConsequence, applyEffect, loadProfile, meets, newProfile, remember, saveProfile } from "@/lib/state/profile";
import { lineFile } from "@/lib/story/lines";
import { watchPlayback, speechChunks } from "@/lib/story/audio";
import { levelVoice } from "@/lib/story/level";
import Ambience from "@/components/Ambience";
import ReactLoop from "@/components/ReactLoop";
import RotatePrompt from "@/components/RotatePrompt";

// film: narrated beats are playing. talk: a live conversation. choose: a pure decision. end: part over.
type Phase = "film" | "talk" | "choose" | "end";

interface Turn {
  role: "player" | "character" | "narration";
  text: string;
  who?: string; // on-screen speaker name when a character is several people (the Three)
}

interface Layer {
  url: string;
  key: string;
  still: boolean;
}

interface Segment {
  speaker?: string; // label as written by the model, e.g. MAIDEN
  name?: string; // on-screen name, e.g. The Maiden
  text: string;
}

type MenuView = "main" | "journal" | "lines" | "chapters" | "settings" | "sync" | "confirm-restart";

// Clips are served from Vercel Blob in production and from /public locally.
const CLIP_BASE = (process.env.NEXT_PUBLIC_CLIP_BASE ?? "/clips").replace(/\/$/, "");
const MUSIC_VOLUME = 0.45; // bed level
const DUCK_VOLUME = 0.16; // bed level while someone speaks
const FADE_MS = 2500;
const CARD_MS = 2600; // a silent time/place card
const BEAT_GAP_MS = 250; // breath between narrated lines
const HOLD_MS = 2000; // longest a clip keeps playing after its line before the next picture cuts in
const NPC_TEXT_WAIT_MS = 6000; // longest a character's line waits for its voice before it is shown anyway
const CHOICE_MS = 2600; // the "Your choice" moment
const SFX_VOLUME = 0.7; // one-shot sound effects (levelled to about -20 dBFS when made)
const AMB_VOLUME = 0.55; // looping ambience bed (made at about -26 dBFS, so it sits under the music)
const AMB_DUCK = 0.25; // ambience while someone speaks
const CURTAIN_MS = 700; // dip to black between scenes; the music starts to cross-fade with it
const RECAP_MS = 7000; // the "Previously" card when she comes back
const HOLD_SKIP_MS = 900; // holding Skip this long skips the whole narrated stretch
const OPTION_GUARD_MS = 400; // taps on freshly shown Ideas are ignored (no accidental double-tap choices)
const pref = (k: string, d: string) => { try { return localStorage.getItem(`lod.${k}`) ?? d; } catch { return d; } };
const setPref = (k: string, v: string) => { try { localStorage.setItem(`lod.${k}`, v); } catch { /* private mode */ } };

/** Fade an audio element's volume to a target over ms; resolves when done. */
function fadeTo(a: HTMLAudioElement, target: number, ms = FADE_MS): Promise<void> {
  return new Promise((resolve) => {
    const start = a.volume, t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      a.volume = start + (target - start) * k;
      if (k < 1) requestAnimationFrame(step); else resolve();
    };
    step();
  });
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/** How long a line takes to read when its audio is missing. */
const readingMs = (text: string) => Math.max(2200, text.split(/\s+/).length * 380 + 800);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** A voice that arrived inside a dialogue reply (base64 mp3) as a playable blob. */
const b64Blob = (b64: string) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "audio/mpeg" });
};
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
const SLOW_MS = 7000; // after this, the typing bubble reassures her that the reply is still coming
const titleCase = (s: string) => `The ${cap(s.toLowerCase())}`;

/** "MAIDEN: Hello. CRONE: Hush." -> one segment per speaker. Plain lines stay one segment. */
function splitSpeakers(text: string, names?: Record<string, string>): Segment[] {
  const parts = text.split(/\b([A-Z]{3,}):\s*/);
  if (parts.length < 3) return [{ text }];
  const out: Segment[] = [];
  if (parts[0].trim()) out.push({ text: parts[0].trim() });
  for (let i = 1; i < parts.length; i += 2) {
    const line = (parts[i + 1] ?? "").trim();
    if (line) out.push({ speaker: parts[i], name: names?.[parts[i]] ?? titleCase(parts[i]), text: line });
  }
  return out;
}

/** Screen facts the layout depends on: true-phone portrait gets a rotate prompt; touch devices get no autofocus. */
function useViewport() {
  const [v, setV] = useState({ w: 1920, h: 1080, touch: false });
  useEffect(() => {
    const read = () => setV({ w: window.innerWidth, h: window.innerHeight, touch: matchMedia("(pointer: coarse)").matches });
    read();
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => {
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
    };
  }, []);
  const aspect = v.w / Math.max(1, v.h);
  // Phones held upright are narrower than 0.8. The Fold's inner screen (about 0.9 upright) plays fine, letterboxed.
  return { ...v, aspect, phonePortrait: aspect < 0.8 };
}

/** Fullscreen state, kept in sync with the browser (the back gesture can leave fullscreen too). */
function useFullscreen() {
  const [on, setOn] = useState(false);
  const [can, setCan] = useState(false);
  useEffect(() => {
    setCan(!!document.fullscreenEnabled);
    const read = () => setOn(!!document.fullscreenElement);
    read();
    document.addEventListener("fullscreenchange", read);
    return () => document.removeEventListener("fullscreenchange", read);
  }, []);
  return { on, can };
}

/** One tap unlocks sound, goes fullscreen and locks landscape where the browser allows it (Android Chrome does). */
async function enterImmersive() {
  try {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
    if (!document.fullscreenElement) await (el.requestFullscreen?.({ navigationUI: "hide" }) ?? el.webkitRequestFullscreen?.());
  } catch { /* fullscreen refused: play inline */ }
  try {
    const o = screen.orientation as ScreenOrientation & { lock?: (t: string) => Promise<void> };
    await o.lock?.("landscape");
  } catch { /* orientation lock unsupported outside fullscreen or on desktop */ }
}

async function leaveFullscreen() {
  try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* already out */ }
}

/** A friendly sentence for a failed request. */
function describeFailure(kind: "offline" | "server" | "timeout"): string {
  if (kind === "offline") return "No internet connection. Check your signal, then tap Retry.";
  if (kind === "timeout") return "The reply is taking too long (the connection may be weak). Tap Retry.";
  return "The storyteller could not answer just now (server error). Tap Retry.";
}

export default function Player({ book }: { book: Book }) {
  const vp = useViewport();
  const fs = useFullscreen();
  const [started, setStarted] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sceneId, setSceneId] = useState(book.start);
  const [phase, setPhase] = useState<Phase>("film");
  const [history, setHistory] = useState<Turn[]>([]);
  const [inner, setInner] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  // What is on screen: picture layers (the outgoing one stays under the new one until it is ready),
  // a time/place card, and the narrator's subtitle, which exists only while its line is being spoken.
  const [layers, setLayers] = useState<Layer[]>([]);
  const [missing, setMissing] = useState<string | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const [subtitle, setSubtitle] = useState<{ text: string; hook: boolean } | null>(null);
  const [upcoming, setUpcoming] = useState<string | null>(null);
  const [beatFx, setBeatFx] = useState<Fx | undefined>(undefined);
  const [beatAmb, setBeatAmb] = useState<string | undefined>(undefined);
  // The moment a decision is made, shown plainly so she always knows what she chose.
  const [chosen, setChosen] = useState<string | null>(null);
  const [curtain, setCurtain] = useState(false); // black between scenes
  // "Previously..." when she comes back to a saved story.
  const [recap, setRecap] = useState<string[] | null>(null);
  // Diegetic feedback when a consequence fires ("Somewhere above, a man begins to weep.")
  const [ripple, setRipple] = useState<string | null>(null);
  // Reaction loops: while talking, the speaking character's loop for their current mood plays over the scene.
  const [mood, setMood] = useState("neutral");
  const [reactMissing, setReactMissing] = useState<Record<string, boolean>>({});
  // True while a character's voice is audible: their "talking" loop plays instead of the listening mood.
  const [talking, setTalking] = useState(false);
  // The clip that has played out and is holding its last frame (it keeps a slow push-in so it never looks frozen).
  const [held, setHeld] = useState<string | null>(null);
  // Connection problems are said plainly, with a way to try again.
  const [netError, setNetError] = useState<string | null>(null);
  const retryRef = useRef<(() => void) | null>(null);
  const [offline, setOffline] = useState(false);
  // The pause menu.
  const [menu, setMenu] = useState<MenuView | null>(null);
  // Comfort settings, remembered on this phone.
  const [textScale, setTextScale] = useState(1);
  const [musicOn, setMusicOn] = useState(true);
  const musicOnRef = useRef(true);
  const [sfxOn, setSfxOn] = useState(true);
  const sfxOnRef = useRef(true);
  const sfxPlaying = useRef(new Set<HTMLAudioElement>()); // one-shot sound effects still sounding
  const ambRef = useRef<{ a: HTMLAudioElement | null; id: string | null }>({ a: null, id: null }); // the looping ambience bed
  // Everything said recently (narrator and characters), to reread in the menu.
  const backlog = useRef<{ who: string; text: string }[]>([]);
  const logLine = (who: string, text: string) => {
    const b = backlog.current;
    if (b[b.length - 1]?.text === text) return;
    b.push({ who, text });
    if (b.length > 80) b.splice(0, b.length - 80);
  };
  // Skip: tap for one line, hold for the whole stretch.
  const skipAllRef = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressing = useRef(false);
  const holdFired = useRef(false);
  const [holding, setHolding] = useState(false);
  // Undo for a choice made by mistake, while its card is showing.
  const undoRef = useRef<(() => void) | null>(null);
  // First conversation: a hint in the input and a glowing Ideas button (never a box over the talk).
  const [tip, setTip] = useState(false);
  const optionsOpenedAt = useRef(0);
  const [slow, setSlow] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Always-current profile: async flows (timelines, replies) must never use a stale copy.
  const profileRef = useRef<Profile | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commit = useCallback((p: Profile) => {
    profileRef.current = p;
    setProfile(p);
    saveProfile(p);
    // Mirror to the cloud a few seconds after the last change, if she has a save code.
    if (p.syncCode) {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        const cur = profileRef.current;
        if (cur?.syncCode) void fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: cur.syncCode, profile: cur }) }).catch(() => undefined);
      }, 4000);
    }
  }, []);
  const showRipple = useCallback((text?: string) => {
    if (!text) return;
    setRipple(text);
    setTimeout(() => setRipple((r) => (r === text ? null : r)), 4500);
  }, []);

  // ---------- pause ----------
  const pausedRef = useRef(false);
  const resumeWaiters = useRef<(() => void)[]>([]);
  const waitUnpaused = () => new Promise<void>((r) => (pausedRef.current ? resumeWaiters.current.push(r) : r()));
  const playing = useRef(new Set<HTMLAudioElement>()); // every voice currently audible
  const mixer = useRef<AudioContext | null>(null); // evens out voice levels; unlocked by the first tap
  const pausedMedia = useRef<HTMLMediaElement[]>([]);

  // ---------- audio: music bed, narrator lines, character voices ----------
  const musicRef = useRef<{ a: HTMLAudioElement | null; track: string | null; voices: number }>({ a: null, track: null, voices: 0 });
  const bedTarget = () => (!musicOnRef.current ? 0 : musicRef.current.voices > 0 ? DUCK_VOLUME : MUSIC_VOLUME);
  const ambTarget = () => (!sfxOnRef.current ? 0 : musicRef.current.voices > 0 ? AMB_DUCK : AMB_VOLUME);
  const duck = () => {
    musicRef.current.voices += 1;
    if (musicRef.current.a) void fadeTo(musicRef.current.a, Math.min(DUCK_VOLUME, bedTarget()), 400);
    if (ambRef.current.a) void fadeTo(ambRef.current.a, ambTarget(), 400);
  };
  const unduck = () => {
    musicRef.current.voices = Math.max(0, musicRef.current.voices - 1);
    if (musicRef.current.a) void fadeTo(musicRef.current.a, bedTarget(), 900);
    if (ambRef.current.a) void fadeTo(ambRef.current.a, ambTarget(), 900);
  };
  /** A one-shot sound for the moment a beat starts (a door, glass, wings). Never blocks the story. */
  const playSfx = (id: string) => {
    if (!sfxOnRef.current) return;
    const a = new Audio(`${CLIP_BASE}/${book.id}/audio/sfx/${id}.mp3`);
    a.volume = SFX_VOLUME;
    const done = () => sfxPlaying.current.delete(a);
    a.onended = done;
    a.onerror = done;
    sfxPlaying.current.add(a);
    void a.play().catch(done);
  };
  /** Sounds from the last scene fade under the curtain instead of carrying into the next one. */
  const fadeOutSfx = () => {
    for (const a of sfxPlaying.current) void fadeTo(a, 0, 600).then(() => a.pause());
    sfxPlaying.current.clear();
  };
  const assetUrl = (kind: "music" | "lines", id: string) => `${CLIP_BASE}/${book.id}/audio/${kind}/${id}.mp3`;
  const lineUrl = (text: string) => `${CLIP_BASE}/${book.id}/audio/lines/${lineFile(text)}`;
  const clipUrl = (clip: string) => `${CLIP_BASE}/${book.id}/${clip}.mp4`;
  const stillUrl = (still: string) => `${CLIP_BASE}/${book.id}/stills/${still}.jpg`;

  // Preloaded narrator lines, so each starts the instant its subtitle appears.
  const lineCache = useRef(new Map<string, HTMLAudioElement>());
  const preloadLines = (texts: string[]) => {
    for (const t of texts) {
      const url = lineUrl(t);
      if (lineCache.current.has(url)) continue;
      const a = new Audio();
      a.preload = "auto";
      a.src = url;
      lineCache.current.set(url, a);
    }
  };

  // Everything currently speaking, so a scene change silences it at once.
  const stoppers = useRef(new Set<() => void>());
  const voiceChain = useRef(0); // bumping it stops a multi-speaker reply between speakers
  const stopAllVoices = () => {
    voiceChain.current++;
    for (const s of [...stoppers.current]) s();
    stoppers.current.clear();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  };

  /** Speak one narrator line. Calls onStart when the voice is audible (or after a short grace if the file is slow
   *  or missing) and resolves when the line has been fully heard, or read at reading speed if there is no audio. */
  const playLine = (text: string, onStart: () => void) => new Promise<void>((resolve) => {
    const url = lineUrl(text);
    const a = lineCache.current.get(url) ?? new Audio(url);
    lineCache.current.delete(url);
    let finished = false, shown = false, silentMode = false;
    let readTimer: ReturnType<typeof setInterval> | undefined;
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let unwatch = () => {};
    const show = () => { if (!shown && !finished) { shown = true; onStart(); } };
    const finish = () => {
      if (finished) return;
      finished = true;
      unwatch();
      clearInterval(readTimer);
      clearTimeout(showTimer);
      a.onplaying = a.onended = a.onerror = null;
      stoppers.current.delete(stop);
      playing.current.delete(a);
      a.pause();
      unduck();
      resolve();
    };
    const stop = () => finish();
    stoppers.current.add(stop);
    duck();
    a.onplaying = () => { if (silentMode) a.pause(); else show(); };
    a.onended = finish;
    // No audio for this line: show it and give time to read it.
    const silent = () => {
      if (finished || silentMode) return;
      silentMode = true;
      unwatch();
      a.pause();
      show();
      let remaining = readingMs(text);
      readTimer = setInterval(() => {
        if (!pausedRef.current) remaining -= 250;
        if (remaining <= 0) finish();
      }, 250);
    };
    a.onerror = silent;
    a.currentTime = 0;
    playing.current.add(a);
    unwatch = watchPlayback(a, () => pausedRef.current, silent);
    a.play().catch(silent);
    showTimer = setTimeout(show, 2500); // a slow network must not hide the words for long
    // Healthy playback finishes only on ended; slow delivery and pauses have no deadline.
  });

  /** Fetch a character's voice for one line (or one speaker's part of a line). */
  const fetchVoice = useCallback(async (text: string, character: string, speaker?: string): Promise<Blob | null> => {
    try {
      const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, bookId: book.id, character, speaker }), signal: AbortSignal.timeout(95_000) });
      return res.ok ? await res.blob() : null;
    } catch {
      return null;
    }
  }, [book.id]);

  /** Play one fetched voice. `started` resolves when it is audible, `ended` when it is over (or stopped). */
  const playVoice = useCallback((blob: Promise<Blob | null>, text: string) => {
    let startRes!: () => void, endRes!: () => void;
    const started = new Promise<void>((r) => (startRes = r));
    const ended = new Promise<void>((r) => (endRes = r));
    let stopped = false, ducked = false;
    let a: HTMLAudioElement | null = null;
    let objectUrl: string | null = null;
    let utterance: SpeechSynthesisUtterance | null = null;
    let unwatch = () => {};
    const stop = () => {
      if (stopped) return;
      stopped = true;
      unwatch();
      setTalking(false);
      if (a) {
        a.onplaying = a.onended = a.onerror = null;
        a.pause();
        playing.current.delete(a);
      }
      if (utterance) {
        utterance.onstart = utterance.onend = utterance.onerror = utterance.onboundary = null;
        window.speechSynthesis.cancel();
        utterance = null;
      }
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (ducked) unduck();
      stoppers.current.delete(stop);
      startRes();
      endRes();
    };
    const begin = () => {
      if (stopped) return;
      if (!ducked) { ducked = true; duck(); }
      setTalking(true);
      startRes();
    };
    stoppers.current.add(stop);
    void (async () => {
      const b = await blob.catch(() => null);
      await waitUnpaused();
      if (stopped) return;
      if (b) {
        objectUrl = URL.createObjectURL(b);
        a = new Audio(objectUrl);
        const el = a;
        await levelVoice(mixer.current, el, b);
        if (stopped) return;
        el.onplaying = begin;
        el.onended = stop;
        el.onerror = stop;
        playing.current.add(el);
        const unwatchStall = watchPlayback(el, () => pausedRef.current, stop);
        // Backstop for a take the server's check missed: no real reading of these words lasts this long.
        // Measured in playback time, so a paused game never trips it.
        const longest = text.split(/\s+/).length / 1.1 + 8;
        const overrun = setInterval(() => { if (el.currentTime > longest) stop(); }, 500);
        unwatch = () => { unwatchStall(); clearInterval(overrun); };
        el.play().catch(stop);
        return;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const chunks = speechChunks(text);
        let index = 0;
        const progress = { currentTime: 0 };
        unwatch = watchPlayback(progress, () => pausedRef.current, stop);
        const next = async () => {
          await waitUnpaused();
          if (stopped) return;
          if (index >= chunks.length) { stop(); return; }
          // Keep a strong reference until end: mobile browsers may otherwise drop it.
          utterance = new SpeechSynthesisUtterance(chunks[index++]);
          utterance.lang = "en-GB";
          utterance.rate = 0.92;
          utterance.onstart = () => { progress.currentTime++; begin(); };
          utterance.onboundary = () => { progress.currentTime++; };
          utterance.onend = () => { progress.currentTime++; void next(); };
          utterance.onerror = stop;
          window.speechSynthesis.speak(utterance);
        };
        void next();
      } else stop();
    })();
    return { started, ended };
  }, []);

  /** A whole reply, one speaker after another, each in their own voice. All voices are fetched at once. */
  const speakAll = useCallback((segments: Segment[], character: string, given?: (Promise<Blob | null> | undefined)[]) => {
    let startRes!: () => void, endRes!: () => void;
    const started = new Promise<void>((r) => (startRes = r));
    const ended = new Promise<void>((r) => (endRes = r));
    const chain = ++voiceChain.current;
    const blobs = segments.map((s, i) => given?.[i] ?? fetchVoice(s.text, character, s.speaker));
    void (async () => {
      for (let i = 0; i < segments.length; i++) {
        if (chain !== voiceChain.current) break;
        const v = playVoice(blobs[i], segments[i].text);
        if (i === 0) void v.started.then(startRes);
        await v.ended;
        if (i < segments.length - 1) await sleep(250);
      }
      startRes();
      endRes();
    })();
    return { started, ended };
  }, [fetchVoice, playVoice]);

  // ---------- pictures ----------
  // Whether the clip on screen has finished, so a narrated line never cuts a clip off mid-move.
  const clipDone = useRef<{ key: string | null; done: boolean; waiters: (() => void)[] }>({ key: null, done: true, waiters: [] });
  const markClipDone = (key: string) => {
    const c = clipDone.current;
    if (c.key !== key) return;
    c.done = true;
    c.waiters.splice(0).forEach((w) => w());
  };
  const waitClip = () => new Promise<void>((r) => {
    if (clipDone.current.done) r(); else clipDone.current.waiters.push(r);
  });
  const layerSeq = useRef(0);
  const topLayer = useRef<Layer | null>(null);
  const show = (b: Beat) => {
    if (b.fx) setBeatFx(b.fx);
    if (b.ambience) setBeatAmb(b.ambience);
    const url = b.clip ? clipUrl(b.clip) : b.still ? stillUrl(b.still) : null;
    if (!url || topLayer.current?.url === url) return; // nothing new, or already on screen: keep holding it
    const layer = { url, key: `${url}#${++layerSeq.current}`, still: !!b.still };
    topLayer.current = layer;
    clipDone.current.waiters.splice(0).forEach((w) => w());
    clipDone.current = { key: layer.key, done: layer.still, waiters: [] };
    setMissing(null);
    setLayers((ls) => [...ls.slice(-1), layer]);
  };
  const layerReady = (key: string) => setTimeout(() => setLayers((ls) => (ls[ls.length - 1]?.key === key ? ls.slice(-1) : ls)), 1000);

  // ---------- the timeline: beats played in order, words and voice together ----------
  const runRef = useRef(0); // bumping it cancels whatever timeline is running
  const skipRef = useRef<(() => void) | null>(null);
  const [skippable, setSkippable] = useState(false);

  const passes = (b: Beat, p: Profile | null) => {
    const flags = p?.flags[book.id] ?? {};
    if (b.if && !b.if.every((f) => flags[f])) return false;
    if (b.unless && b.unless.some((f) => flags[f])) return false;
    return true;
  };

  /** Plays beats in order. Resolves true when finished, false when cancelled by a newer timeline. */
  const runTimeline = async (beats: Beat[], token: number): Promise<boolean> => {
    const list = beats.filter((b) => passes(b, profileRef.current));
    preloadLines(list.filter((b) => b.text).map((b) => b.text!));
    setSkippable(true);
    try {
      for (let i = 0; i < list.length; i++) {
        await waitUnpaused();
        if (token !== runRef.current) return false;
        const b = list[i];
        const next = list[i + 1];
        // Held Skip: run straight through to the end of this stretch, keeping the last picture.
        if (skipAllRef.current) {
          show(b);
          if (b.text) logLine("Narrator", b.text);
          continue;
        }
        setUpcoming(list.slice(i + 1).find((x) => x.clip)?.clip ?? null);
        show(b);
        if (b.sfx) playSfx(b.sfx);
        // A tap skips the rest of this beat.
        let skipRes!: () => void;
        const skipped = new Promise<void>((r) => (skipRes = r));
        skipRef.current = () => { skipRes(); stopAllVoices(); };
        if (b.card) {
          setCard(b.card);
          await Promise.race([sleep(CARD_MS), skipped]);
          setCard(null);
        }
        if (b.text && token === runRef.current) {
          await Promise.race([playLine(b.text, () => { if (token === runRef.current) { setSubtitle({ text: b.text!, hook: b.style === "hook" }); logLine("Narrator", b.text!); } }), skipped]);
          setSubtitle(null);
        }
        if (token !== runRef.current) return false;
        // Let the clip breathe a moment before the next picture replaces it, but never leave dead air:
        // a silent beat plays its clip in full; after a spoken line the picture holds at most HOLD_MS more.
        const pictureChanges = !next || !!next.clip || !!next.still;
        if (!b.text && !b.card) await Promise.race([waitClip(), skipped, sleep(15000)]);
        else if (pictureChanges) await Promise.race([waitClip(), skipped, sleep(HOLD_MS)]);
        if (next) await sleep(BEAT_GAP_MS);
      }
      return token === runRef.current;
    } finally {
      skipAllRef.current = false;
      if (token === runRef.current) { setSkippable(false); skipRef.current = null; }
    }
  };

  // ---------- story flow ----------
  const scene: Scene = book.scenes[sceneId];
  const order = useMemo(() => Object.keys(book.scenes), [book]);
  /** The chapter a scene belongs to: the nearest scene at or before it that opens a chapter. */
  const chapterOf = useCallback((id: string) => {
    for (let i = order.indexOf(id); i >= 0; i--) if (book.scenes[order[i]].episodeTitle) return order[i];
    return book.start;
  }, [order, book]);

  /** Remember what happened here, for "Story so far". */
  const logJournal = (sid: string, choice?: string) => {
    const p = profileRef.current;
    const sc = book.scenes[sid];
    if (!p || !sc?.recap) return;
    const journal = [...(p.journal ?? []).filter((j) => j.scene !== sid), { scene: sid, recap: sc.recap, ...(choice ? { choice } : {}) }];
    commit({ ...p, journal });
  };

  type Ask = { reply: DialogueReply } | { error: "offline" | "server" | "timeout" };
  const askAI = useCallback(
    async (sid: string, mode: "talk" | "inner", playerLine: string | undefined, hist: Turn[], intent?: string): Promise<Ask> => {
      const p = profileRef.current;
      if (!p) return { error: "server" };
      if (typeof navigator !== "undefined" && !navigator.onLine) return { error: "offline" };
      try {
        const res = await fetch("/api/dialogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: book.id, sceneId: sid, mode, history: hist.filter((t) => t.role !== "narration").map((t) => ({ role: t.role, text: t.who ? `${(Object.entries(book.scenes[sid]?.conversation?.speakerNames ?? {}).find(([, n]) => n === t.who)?.[0]) ?? t.who.replace(/^The /, "").toUpperCase()}: ${t.text}` : t.text })), playerLine, intent, profile: p }),
          signal: AbortSignal.timeout(45_000),
        });
        if (!res.ok) return { error: "server" };
        return { reply: (await res.json()) as DialogueReply };
      } catch (e) {
        if ((e as Error).name === "TimeoutError") return { error: "timeout" };
        return { error: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "server" };
      }
    },
    [book.id],
  );

  /** Show a character's reply: their voice starts, and the words appear with it (one line per speaker). */
  const deliver = async (text: string, character: string, token: number, before: Turn[] = [], extra: Turn[] = [], voiced?: DialogueReply["voice"], pre?: Promise<Blob | null>[]) => {
    const segs = splitSpeakers(text, book.scenes[sceneId]?.conversation?.speakerNames);
    // Voices already made on the server (with the reply) or fetched ahead (openings) play at once.
    const given = voiced && voiced.length === segs.length
      ? voiced.map((v) => (v.audio ? Promise.resolve(b64Blob(v.audio)) : undefined))
      : pre && pre.length === segs.length ? pre : undefined;
    const v = speakAll(segs, character, given);
    await Promise.race([v.started, sleep(NPC_TEXT_WAIT_MS)]);
    if (token !== runRef.current) return v;
    setBusy(false);
    setHistory([...before, ...extra, ...segs.map((s) => ({ role: "character" as const, text: s.text, who: s.name }))]);
    const fallback = book.scenes[sceneId]?.conversation?.name ?? cap(character.split("-")[0]);
    for (const sg of segs) logLine(sg.name ?? fallback, sg.text);
    return v;
  };

  /** After a scene's beats: talk, decide, or move on. */
  async function afterFilm(sc: Scene, token: number) {
    if (token !== runRef.current) return;
    if (!sc.choices?.length) logJournal(sc.id);
    if (sc.type === "end") return setPhase("end");
    if (sc.conversation) {
      setPhase("talk");
      if (pref("tipSeen", "") !== "1") {
        setPref("tipSeen", "1");
        setTip(true); // first conversation: the hint lives in the input and on the Ideas button, never over the talk
        setTimeout(() => setTip(false), 25000);
      }
      const opening = sc.conversation.opening;
      if (opening) {
        setBusy(true);
        const pre = openingVoice.current?.scene === sc.id ? openingVoice.current.blobs : undefined;
        await deliver(opening, sc.conversation.character, token, [], [], undefined, pre);
      }
      return;
    }
    if (sc.choices?.length) {
      setPhase("choose");
      if (sc.innerVoice) {
        setBusy(true);
        const r = await askAI(sc.id, "inner", undefined, []);
        setBusy(false);
        if ("reply" in r && r.reply.dialogue && token === runRef.current) {
          setInner(r.reply.dialogue);
          void speakAll([{ text: r.reply.dialogue }], "dream");
        }
      }
      return;
    }
    if (sc.next) goTo(sc.next);
  }

  const openingVoice = useRef<{ scene: string; blobs: Promise<Blob | null>[] } | null>(null);
  async function playScene(id: string, token: number) {
    const sc = book.scenes[id];
    // The opening line of the coming conversation is voiced while she watches, so it plays the instant the talk begins.
    if (sc.conversation?.opening && openingVoice.current?.scene !== id) {
      const segs = splitSpeakers(sc.conversation.opening, sc.conversation.speakerNames);
      openingVoice.current = { scene: id, blobs: segs.map((sg) => fetchVoice(sg.text, sc.conversation!.character, sg.speaker)) };
    }
    setPhase("film");
    const p = profileRef.current;
    if (p) commit({ ...p, position: { book: book.id, scene: id }, visited: (p.visited ?? []).includes(id) ? p.visited : [...(p.visited ?? []), id] });
    // Lines the player may hear next (every possible aftermath, and the opening of every scene that can follow)
    // load while she watches, so no line ever waits on the network.
    const following = [sc.next, ...(sc.choices ?? []).map((c) => c.next)].filter((x): x is string => !!x && !!book.scenes[x]);
    const ahead = [
      ...(sc.choices ?? []).flatMap((c) => c.aftermath ?? []),
      ...[...new Set(following)].flatMap((nid) => book.scenes[nid].beats.slice(0, 4)),
    ];
    setTimeout(() => preloadLines(ahead.filter((b) => b.text).map((b) => b.text!)), 1500);
    if (await runTimeline(sc.beats, token)) await afterFilm(sc, token);
  }

  function goTo(next: string) {
    const token = ++runRef.current;
    fadeOutSfx();
    undoRef.current = null; // the last choice can no longer be taken back once the next scene begins
    stopAllVoices();
    setSkippable(false);
    setChosen(null);
    setShowOptions(false);
    setBusy(false);
    // Dip to black. If the music changes with the scene, it starts to leave with the picture.
    setCurtain(true);
    const m = musicRef.current;
    const nextTrack = book.scenes[next]?.music;
    if (m.a && nextTrack && nextTrack !== m.track) void fadeTo(m.a, 0, CURTAIN_MS + 600);
    const amb = ambRef.current;
    if (amb.a && (book.scenes[next]?.ambience ?? null) !== amb.id) void fadeTo(amb.a, 0, CURTAIN_MS + 600);
    void sleep(CURTAIN_MS).then(() => {
      if (token !== runRef.current) return;
      setSceneId(next);
      setHistory([]);
      setMood("neutral");
      setInner(null);
      setSubtitle(null);
      setCard(null);
      setNetError(null);
      setBeatFx(undefined);
      setBeatAmb(undefined);
      const p = profileRef.current;
      if (p) commit({ ...p, position: { book: book.id, scene: next } });
      void playScene(next, token);
      setTimeout(() => { if (token === runRef.current) setCurtain(false); }, 350);
    });
  }

  async function choose(choice: Choice) {
    const sc0 = scene;
    const current = profileRef.current;
    if (!current) return;
    let p = applyEffect(current, book.id, choice.effects);
    // Earlier deeds change what this choice costs or earns (a broken promise, a remembered confession).
    for (const e of choice.effectsIf ?? []) {
      if (current.flags[book.id]?.[e.flag]) {
        p = applyEffect(p, book.id, e.effects);
        showRipple(e.ripple);
      }
    }
    commit(p);
    logJournal(sceneId, choice.text);
    const token = ++runRef.current;
    stopAllVoices();
    setShowOptions(false);
    setInner(null);
    setPhase("film");
    // Say plainly what she chose, so a decision never passes unnoticed, and let a mistaken tap be undone.
    const backTo: Phase = sc0.conversation ? "talk" : "choose";
    setChosen(choice.text);
    let skipRes!: () => void;
    const skipped = new Promise<void>((r) => (skipRes = r));
    skipRef.current = skipRes;
    setSkippable(true);
    undoRef.current = () => {
      undoRef.current = null;
      runRef.current++;
      stopAllVoices();
      commit(current);
      setChosen(null);
      setSubtitle(null);
      setCard(null);
      setSkippable(false);
      skipRef.current = null;
      setPhase(backTo);
    };
    await Promise.race([sleep(CHOICE_MS + 1400), skipped]);
    setChosen(null);
    if (token !== runRef.current) return;
    if (await runTimeline(choice.aftermath ?? [], token)) goTo(choice.next);
  }

  /** Ask the character to answer what she just said (also used by Retry, without repeating her line). */
  async function respond(hist: Turn[], line: string, intent?: string) {
    const sc = scene;
    if (!sc.conversation) return;
    const token = runRef.current;
    setNetError(null);
    retryRef.current = null;
    setBusy(true);
    const r = await askAI(sc.id, "talk", line, hist, intent);
    if (token !== runRef.current) return;
    const who = sc.conversation.character;
    if ("error" in r) {
      setBusy(false);
      setNetError(describeFailure(r.error));
      retryRef.current = () => void respond(hist, line, intent);
      return;
    }
    const reply = r.reply;
    const extra: Turn[] = reply.narration ? [{ role: "narration", text: reply.narration }] : [];
    const v = await deliver(reply.dialogue, who, token, hist, extra, reply.voice);
    if (token !== runRef.current) return;
    if (reply.mood) setMood(reply.mood);
    if (reply.inner_thought) {
      setInner(reply.inner_thought); // stays until she answers, or taps it away
    }
    // Consequences: her words change the story. Apply fired consequences, the speaker's feelings and memory together.
    let p = profileRef.current;
    if (p) {
      for (const tag of reply.consequences ?? []) {
        const c = sc.conversation.consequences?.[tag];
        if (!c) continue;
        p = applyConsequence(p, book.id, who, tag, c);
        showRipple(c.ripple);
      }
      p = adjustRelation(p, who, reply.trust_delta ?? 0, reply.fear_delta ?? 0);
      p = remember(p, reply.memory_note);
      commit(p);
    }
    // Her words decided the scene: let the character finish speaking, then the story moves on.
    const c = reply.decision ? sc.choices?.find((x) => x.id === reply.decision) : undefined;
    if (c) {
      await v.ended;
      await waitUnpaused();
      await sleep(700);
      if (token === runRef.current) void choose(c);
    }
  }

  /** Her line (typed, or a tapped idea; a tapped exit carries its id as intent) goes to the character. */
  function send(line: string, intent?: string) {
    if (!line || busy || !scene.conversation) return;
    setInput("");
    setShowOptions(false);
    setTip(false);
    setInner(null);
    inputRef.current?.blur(); // drop the phone keyboard so the reaction loop is visible
    stopAllVoices();
    const hist: Turn[] = [...history, { role: "player", text: line }];
    setHistory(hist);
    logLine(profileRef.current?.name ?? "Aurie", line);
    void respond(hist, line, intent);
  }

  // ---------- pause menu ----------
  function openMenu(view: MenuView = "main") {
    if (!pausedRef.current) {
      pausedRef.current = true;
      const media: HTMLMediaElement[] = [...playing.current, ...sfxPlaying.current];
      if (musicRef.current.a && !musicRef.current.a.paused) media.push(musicRef.current.a);
      if (ambRef.current.a && !ambRef.current.a.paused) media.push(ambRef.current.a);
      document.querySelectorAll("video").forEach((v) => { if (!v.paused) media.push(v); });
      media.forEach((m) => m.pause());
      pausedMedia.current = media;
      if ("speechSynthesis" in window) window.speechSynthesis.pause();
    }
    setMenu(view);
  }
  function closeMenu() {
    setMenu(null);
    setSyncNote(null);
    if (!pausedRef.current) return;
    pausedRef.current = false;
    pausedMedia.current.forEach((m) => void m.play().catch(() => undefined));
    pausedMedia.current = [];
    if ("speechSynthesis" in window) window.speechSynthesis.resume();
    resumeWaiters.current.splice(0).forEach((r) => r());
  }
  function jump(to: string) {
    closeMenu();
    goTo(to);
  }
  function playAgain() {
    const p = profileRef.current;
    commit({ ...newProfile(p?.name), playerModel: p?.playerModel ?? {}, syncCode: p?.syncCode });
    jump(book.start);
  }
  async function makeCode() {
    const p = profileRef.current;
    if (!p) return;
    setSyncNote("Making your code…");
    try {
      const res = await fetch("/api/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: p.syncCode, profile: p }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      commit({ ...p, syncCode: j.code });
      setSyncNote(null);
    } catch {
      setSyncNote(navigator.onLine ? "Could not reach the cloud save. Try again in a moment." : "No internet connection. Connect, then try again.");
    }
  }
  async function loadCode(raw: string) {
    setSyncNote("Looking for your story…");
    try {
      const res = await fetch(`/api/save?code=${encodeURIComponent(raw.trim())}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      const loaded = { ...newProfile(), ...(j.profile as Profile), syncCode: j.code };
      commit(loaded);
      setSyncNote(null);
      setCodeInput("");
      const to = loaded.position?.book === book.id && book.scenes[loaded.position.scene] ? loaded.position.scene : book.start;
      return to;
    } catch (e) {
      setSyncNote((e as Error).message || "No save found for that code.");
      return null;
    }
  }

  // ---------- lifecycle ----------
  // Load the saved profile and resume position once.
  useEffect(() => {
    const p = loadProfile();
    if (p.position?.book === book.id && book.scenes[p.position.scene]) setSceneId(p.position.scene);
    profileRef.current = p;
    setProfile(p);
  }, [book]);

  // A reply that takes a while gets a reassuring word, so a wait never looks like a freeze.
  useEffect(() => {
    if (!busy) { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(t);
  }, [busy]);

  // A tab left open keeps running the old game; when a newer version is live, say so and offer to update.
  useEffect(() => {
    if (BUILD_ID === "dev") return;
    const check = () => {
      void fetch("/api/version", { cache: "no-store" }).then((r) => r.json()).then((j: { id?: string }) => {
        if (j.id && j.id !== "dev" && j.id !== BUILD_ID) setUpdateReady(true);
      }).catch(() => undefined);
    };
    check();
    const every = setInterval(check, 5 * 60_000);
    const onShow = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onShow);
    return () => { clearInterval(every); document.removeEventListener("visibilitychange", onShow); };
  }, []);

  // Comfort settings from this phone.
  useEffect(() => {
    setTextScale(Number(pref("textScale", "1")) || 1);
    const on = pref("music", "on") !== "off";
    setMusicOn(on);
    musicOnRef.current = on;
    const fx = pref("sfx", "on") !== "off";
    setSfxOn(fx);
    sfxOnRef.current = fx;
  }, []);

  // Online and offline are shown as they happen.
  useEffect(() => {
    const read = () => setOffline(!navigator.onLine);
    read();
    window.addEventListener("online", read);
    window.addEventListener("offline", read);
    return () => { window.removeEventListener("online", read); window.removeEventListener("offline", read); };
  }, []);

  // The first tap starts the current scene; coming back to a saved story opens with "Previously...".
  const resumeFrom = useRef<string | null>(null);
  useEffect(() => {
    if (!started) return;
    const token = ++runRef.current;
    void (async () => {
      const id = resumeFrom.current ?? sceneId;
      const lines = (profileRef.current?.journal ?? []).slice(-3).map((j) => j.recap);
      if (id !== book.start && lines.length) {
        setRecap(lines);
        let skipRes!: () => void;
        const skipped = new Promise<void>((r) => (skipRes = r));
        skipRef.current = skipRes;
        setSkippable(true);
        await Promise.race([sleep(RECAP_MS), skipped]);
        setRecap(null);
        if (token !== runRef.current) return;
      }
      if (id !== sceneId) setSceneId(id);
      void playScene(id, token);
    })();
    return () => { runRef.current++; stopAllVoices(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  // Music follows the scene; a scene without a track keeps the previous one, "none" stops it.
  const wantedTrack = scene.music ?? musicRef.current.track;
  useEffect(() => {
    if (!started) return;
    const m = musicRef.current;
    const next = wantedTrack === "none" ? null : wantedTrack ?? null;
    if (next === m.track) return;
    const old = m.a;
    if (old) void fadeTo(old, 0).then(() => { old.pause(); old.src = ""; });
    m.track = next;
    m.a = null;
    if (!next) return;
    const a = new Audio(assetUrl("music", next));
    a.loop = true;
    a.volume = 0;
    a.play().then(() => void fadeTo(a, bedTarget())).catch(() => { /* missing track or blocked: silence */ });
    m.a = a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantedTrack, started]);

  // Ambience belongs to a place: it plays only where the scene (or a beat) names it, and cross-fades between places.
  const wantedAmb = beatAmb ?? scene.ambience ?? null;
  useEffect(() => {
    if (!started) return;
    const m = ambRef.current;
    const next = wantedAmb === "none" ? null : wantedAmb;
    if (next === m.id) return;
    const old = m.a;
    if (old) void fadeTo(old, 0, 1500).then(() => { old.pause(); old.src = ""; });
    m.id = next;
    m.a = null;
    if (!next) return;
    const a = new Audio(`${CLIP_BASE}/${book.id}/audio/ambience/${next}.mp3`);
    a.loop = true;
    a.volume = 0;
    a.play().then(() => void fadeTo(a, ambTarget(), 2000)).catch(() => { /* missing bed or blocked: silence */ });
    m.a = a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantedAmb, started]);

  // Keep the screen awake while the story plays: long clips and narration go by with no touches,
  // and a phone that dims mid-scene breaks the spell. The phone drops the lock whenever the page is
  // hidden, so it is asked for again each time the game comes back into view.
  useEffect(() => {
    if (!started || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let gone = false;
    const hold = async () => {
      if (document.visibilityState === "visible") void mixer.current?.resume().catch(() => {});
      if (gone || document.visibilityState !== "visible" || (lock && !lock.released)) return;
      try { lock = await navigator.wakeLock.request("screen"); } catch { /* low battery or not allowed: the phone may dim as usual */ }
    };
    void hold();
    document.addEventListener("visibilitychange", hold);
    return () => {
      gone = true;
      document.removeEventListener("visibilitychange", hold);
      void lock?.release().catch(() => {});
    };
  }, [started]);

  // Stop the bed when leaving the page.
  useEffect(() => () => { musicRef.current.a?.pause(); ambRef.current.a?.pause(); }, []);

  const talker = phase === "talk" ? scene.conversation?.character : undefined;
  const reactFor = (m: string) => (talker ? `${CLIP_BASE}/${book.id}/react/${talker}-${m}.mp4` : undefined);
  // Prefer the exact mood, then neutral; if neither exists, the scene's last frame stays on screen.
  // Two layers: the listening loop (mood, else neutral) and the talking loop, which cross-fades in while the voice is
  // audible. A character with only a talking loop keeps it on screen, held still, between lines.
  const okSrc = (u?: string) => (u && !reactMissing[u] ? u : undefined);
  const restSrc = okSrc(reactFor(mood)) ?? okSrc(reactFor("neutral"));
  const talkSrc = okSrc(reactFor("talking"));
  const missReact = (u: string) => setReactMissing((m) => ({ ...m, [u]: true }));
  // Choices closed off by earlier events are hidden (and the AI cannot steer to them either).
  const options = useMemo(() => (scene.choices ?? []).filter((c) => !profile || meets(profile, book.id, c.requires)), [scene, profile, book.id]);
  // Ideas: questions first, then the lines that decide the scene; never the same words twice.
  const ideas = useMemo(() => {
    const seen = new Set<string>();
    const out: { text: string; intent?: string }[] = [];
    for (const c of options) seen.add(norm(c.text));
    for (const q of scene.conversation?.suggestions ?? []) {
      const k = norm(q);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ text: q });
    }
    return [...out, ...options.map((c) => ({ text: c.text, intent: c.id }))];
  }, [options, scene]);
  const speakerName = scene.conversation?.name ?? (scene.conversation ? cap(scene.conversation.character.split("-")[0]) : "");
  const fx = beatFx ?? scene.fx;
  const chapters = useMemo(() => order.filter((id) => book.scenes[id].episodeTitle), [order, book]);

  const skipDown = () => {
    if (!skipRef.current) return;
    pressing.current = true;
    holdFired.current = false;
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      holdFired.current = true;
      setHolding(false);
      skipAllRef.current = true;
      skipRef.current?.();
    }, HOLD_SKIP_MS);
  };
  const skipUp = () => {
    if (!pressing.current) return;
    pressing.current = false;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setHolding(false);
    if (!holdFired.current) skipRef.current?.();
  };
  const skipCancel = () => {
    if (!pressing.current) return;
    pressing.current = false;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setHolding(false);
  };
  const toggleMusic = () => {
    const on = !musicOnRef.current;
    musicOnRef.current = on;
    setMusicOn(on);
    setPref("music", on ? "on" : "off");
    if (musicRef.current.a) void fadeTo(musicRef.current.a, bedTarget(), 600);
  };
  const toggleSfx = () => {
    const on = !sfxOnRef.current;
    sfxOnRef.current = on;
    setSfxOn(on);
    setPref("sfx", on ? "on" : "off");
    if (!on) fadeOutSfx();
    if (ambRef.current.a) void fadeTo(ambRef.current.a, ambTarget(), 600);
  };
  const changeText = (v: number) => { setTextScale(v); setPref("textScale", String(v)); };

  if (!profile) return <main className="stage" />;

  // Before the first tap: a still gate. The tap is what lets a phone browser play sound and go fullscreen.
  if (!started) {
    const resuming = sceneId !== book.start;
    const begin = (from?: string) => {
      void enterImmersive();
      // The tap that starts the story is what lets a phone open the audio mixer.
      try {
        mixer.current ??= new AudioContext();
        void mixer.current.resume();
      } catch { /* no Web Audio: voices play at their recorded level */ }
      // Wake the dialogue and voice functions now, so the first real reply is not a cold start.
      void fetch("/api/dialogue?warm=1").catch(() => undefined);
      void fetch("/api/tts").catch(() => undefined);
      resumeFrom.current = from ?? null;
      setStarted(true);
    };
    const chapterTitle = book.scenes[chapterOf(sceneId)]?.episodeTitle ?? scene.title;
    return (
      <main className="stage">
        <div className="gate">
          <div className="gate-title">{book.title}</div>
          <div className="gate-sub">for Aurie</div>
          <div className="dedication">Specially prepared and programmed for Charmaine Lim</div>
          {resuming ? (
            <>
              <button className="gate-cta" onClick={() => begin()}>Continue · {chapterTitle}</button>
              <div className="gate-links">
                <button className="ghost" onClick={() => begin(chapterOf(sceneId))}>Restart this chapter</button>
                <button className="ghost" onClick={() => { const p = profileRef.current; commit({ ...newProfile(p?.name), playerModel: p?.playerModel ?? {}, syncCode: p?.syncCode }); setSceneId(book.start); begin(book.start); }}>Start from the beginning</button>
              </div>
            </>
          ) : (
            <button className="gate-cta" onClick={() => begin()}>{vp.touch ? "Touch the glass to begin" : "Click to begin"}</button>
          )}
          <details className="gate-code">
            <summary>Playing on another phone? Enter your save code</summary>
            <form onSubmit={async (e) => { e.preventDefault(); const to = await loadCode(codeInput); if (to) { setSceneId(to); begin(to); } }}>
              <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="e.g. abcde-fghjk" autoCapitalize="none" autoComplete="off" />
              <button type="submit" disabled={!codeInput.trim()}>Load</button>
            </form>
            {syncNote && <p className="gate-note">{syncNote}</p>}
          </details>
          <div className="gate-hint">Sound on. Best with your phone sideways.</div>
        </div>
      </main>
    );
  }

  const top = layers[layers.length - 1];
  const code = profile.syncCode ? `${profile.syncCode.slice(0, 5)}-${profile.syncCode.slice(5)}` : null;
  return (
    <main className={`stage ${vp.touch ? "touch" : ""}`} style={{ ["--ts" as string]: textScale }}>
      {vp.phonePortrait && <RotatePrompt />}

      <div className={`sway ${top?.still ? "handheld" : ""}`}>
        {layers.map((l) => {
          const isTop = l === top;
          if (l.still) {
            return <img key={l.key} className={`film still ${isTop ? "" : "prev"}`} src={l.url} alt="" onLoad={() => isTop && layerReady(l.key)} onError={() => isTop && setMissing(l.key)} />;
          }
          return (
            <video
              key={l.key}
              className={`film ${isTop ? "" : "prev"} ${held === l.key ? "held" : ""}`}
              src={l.url}
              autoPlay={isTop}
              playsInline
              muted
              preload="auto"
              onPlaying={() => isTop && layerReady(l.key)}
              onEnded={() => { markClipDone(l.key); setHeld(l.key); }}
              onError={() => { markClipDone(l.key); if (isTop) setMissing(l.key); }}
            />
          );
        })}
        {top && missing === top.key && <div className="film placeholder"><div className="placeholder-title">{scene.title}</div></div>}
        {restSrc && <ReactLoop src={restSrc} onMissing={missReact} />}
        {talkSrc && <ReactLoop src={talkSrc} className={`talk ${talking || !restSrc ? "on" : ""}`} paused={!talking && !restSrc} onMissing={missReact} />}
        <Ambience fx={fx} />
        <div className="vignette" />
      </div>
      <div className={`curtain ${curtain ? "on" : ""}`} aria-hidden="true" />
      {upcoming && <video className="prefetch" src={clipUrl(upcoming)} preload="auto" muted playsInline aria-hidden="true" />}

      {/* Top-right controls: fullscreen and the pause menu */}
      <div className="hud">
        {skippable && !menu && (
          <button
            className={`hud-btn skip ${holding ? "holding" : ""}`}
            aria-label="Skip. Hold to skip this whole part."
            title="Tap: next line. Hold: skip this part."
            onPointerDown={skipDown}
            onPointerUp={skipUp}
            onPointerLeave={skipCancel}
            onPointerCancel={skipCancel}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span>Skip</span>
          </button>
        )}
        {fs.can && (
          <button className="hud-btn" aria-label={fs.on ? "Exit full screen" : "Full screen"} title={fs.on ? "Exit full screen" : "Full screen"} onClick={() => void (fs.on ? leaveFullscreen() : enterImmersive())}>
            {fs.on ? "⤡" : "⤢"}
          </button>
        )}
        <button className="hud-btn" aria-label="Menu" title="Menu" onClick={() => openMenu()}>☰</button>
      </div>

      {scene.episodeTitle && <div key={`ep-${scene.id}`} className="eptag">{scene.episodeTitle}</div>}

      {card && <div key={card} className="timecard">{card}</div>}

      {subtitle && !subtitle.hook && <div key={subtitle.text} className="subtitle">{subtitle.text}</div>}
      {subtitle?.hook && <div key={subtitle.text} className="hook">{subtitle.text}</div>}

      {chosen && (
        <div className="chosen" key={chosen}>
          <div className="chosen-label">Your choice</div>
          <div className="chosen-text">{chosen}</div>
        </div>
      )}

      {recap && (
        <div className="recapcard">
          <div className="chosen-label">Previously</div>
          {recap.map((r, i) => <p key={i}>{r}</p>)}
        </div>
      )}

      {ripple && <div key={ripple} className="ripple">{ripple}</div>}

      {inner && (phase === "talk" || phase === "choose") && (
        <div className="inner" role="button" tabIndex={0} title="Tap to dismiss" onClick={() => setInner(null)}>
          <span className="inner-who">{profile.name}, thinking</span>{inner}
        </div>
      )}

      {updateReady && (
        <div className="updatebar" role="status">
          <span>A new version of the game is ready. Your progress is saved.</span>
          <button onClick={() => location.reload()}>Update now</button>
        </div>
      )}

      {(netError || offline) && (
        <div className="netbar" role="alert">
          <span>{offline ? "You are offline. The story will carry on when the connection comes back." : netError}</span>
          {netError && !offline && retryRef.current && <button onClick={() => retryRef.current?.()}>Retry</button>}
        </div>
      )}

      {phase === "talk" && scene.conversation && (
        <section className="talk">
          <div className="transcript">
            {history.slice(vp.h < 520 ? -3 : -5).map((t, i) => (
              <p key={i} className={t.role === "narration" ? "aside" : t.role}>
                {t.role === "character" ? <span className="who">{t.who ?? speakerName}</span> : t.role === "player" ? <span className="who">{profile.name}</span> : null}
                {t.text}
              </p>
            ))}
            {busy && (
              <p className="typing" aria-live="polite">
                <span className="who">{speakerName}</span> {speakerName.startsWith("The ") ? "are" : "is"} thinking<span className="dots" aria-hidden="true"><i /><i /><i /></span>
                {slow && <span className="slow">still coming, one moment…</span>}
              </p>
            )}
          </div>
          {showOptions && (
            <ul className="options">
              {ideas.map((o) => (
                <li key={o.intent ?? o.text}>
                  <button onClick={() => { if (performance.now() - optionsOpenedAt.current > OPTION_GUARD_MS) send(o.text, o.intent); }} disabled={busy}>{o.text}</button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="say"
            onSubmit={(e) => {
              e.preventDefault();
              send(input.trim());
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tip ? `Type what ${profile.name} says or does… or tap Ideas` : `Say or do anything, as ${profile.name}…`}
              autoFocus={!vp.touch}
              disabled={busy}
              enterKeyHint="send"
              autoComplete="off"
              autoCapitalize="sentences"
            />
            <button type="submit" disabled={busy || !input.trim()}>Say</button>
            {ideas.length > 0 && (
              <button type="button" className={`ghost ${tip && !showOptions ? "glow" : ""}`} onClick={() => { optionsOpenedAt.current = performance.now(); setTip(false); setShowOptions((v) => !v); }}>
                {showOptions ? "Hide" : "Ideas"}
              </button>
            )}
          </form>
        </section>
      )}

      {phase === "choose" && (
        <section className="choose">
          <ul className="options">
            {options.map((c) => (
              <li key={c.id}>
                <button onClick={() => void choose(c)}>{c.text}</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {phase === "end" && (
        <section className="endcard">
          <h2>{scene.title}</h2>
          <p className="meta">What the world remembers about you</p>
          <ul className="echoes">
            {(profile.echoes ?? []).length
              ? profile.echoes.map((e, i) => <li key={i}>{e.text}</li>)
              : <li>You passed through quietly. No one remembers you yet.</li>}
          </ul>
          <p className="meta">Mercy {profile.traits.mercy > 0 ? `+${profile.traits.mercy}` : profile.traits.mercy}</p>
          <div className="endactions">
            {scene.next && book.scenes[scene.next] && <button className="primary" onClick={() => goTo(scene.next!)}>Continue the story</button>}
            <button onClick={playAgain}>Play again, choose differently</button>
            <a href="/">Return to the library</a>
          </div>
        </section>
      )}

      {menu && (
        <div className="menu" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) closeMenu(); }}>
          <div className="menu-panel">
            {menu === "main" && (
              <>
                <h2>Paused</h2>
                <p className="menu-where">{book.scenes[chapterOf(sceneId)]?.episodeTitle}</p>
                <button className="primary" onClick={closeMenu}>Resume</button>
                {undoRef.current && <button onClick={() => { const undo = undoRef.current; closeMenu(); undo?.(); }}>Undo my last choice</button>}
                <button onClick={() => setMenu("journal")}>Story so far</button>
                <button onClick={() => setMenu("lines")}>Recent lines</button>
                <button onClick={() => setMenu("chapters")}>Chapters</button>
                <button onClick={() => jump(chapterOf(sceneId))}>Restart this chapter</button>
                <button onClick={() => setMenu("settings")}>Text size and music</button>
                <button onClick={() => setMenu("sync")}>Play on another phone</button>
                <button className="ghost" onClick={() => setMenu("confirm-restart")}>Start over from the beginning</button>
              </>
            )}
            {menu === "journal" && (
              <>
                <h2>Story so far</h2>
                <ol className="journal">
                  {(profile.journal ?? []).length
                    ? profile.journal!.map((j) => (
                        <li key={j.scene}>
                          {j.recap}
                          {j.choice && <span className="journal-choice">You: {j.choice}</span>}
                        </li>
                      ))
                    : <li>Nothing yet. The story has only just begun.</li>}
                </ol>
                <button onClick={() => setMenu("main")}>Back</button>
              </>
            )}
            {menu === "lines" && (
              <>
                <h2>Recent lines</h2>
                <ul className="backlog">
                  {backlog.current.length
                    ? backlog.current.slice(-40).map((l, i) => <li key={i}><span className="who">{l.who}</span> {l.text}</li>)
                    : <li>Nothing has been said yet.</li>}
                </ul>
                <button onClick={() => setMenu("main")}>Back</button>
              </>
            )}
            {menu === "settings" && (
              <>
                <h2>Text size and music</h2>
                <p className="menu-note">Text size</p>
                <div className="seg">
                  {([[1, "Normal"], [1.15, "Large"], [1.3, "Larger"]] as const).map(([v, label]) => (
                    <button key={label} className={textScale === v ? "primary" : ""} onClick={() => changeText(v)}>{label}</button>
                  ))}
                </div>
                <p className="sample">The Dreaming remembers everything.</p>
                <button onClick={toggleMusic}>Background music: {musicOn ? "On" : "Off"}</button>
                <button onClick={toggleSfx}>Sound effects and ambience: {sfxOn ? "On" : "Off"}</button>
                <button onClick={() => setMenu("main")}>Back</button>
              </>
            )}
            {menu === "chapters" && (
              <>
                <h2>Chapters</h2>
                <ul className="chapters">
                  {chapters.map((id) => {
                    const open = id === book.start || (profile.visited ?? []).includes(id);
                    return (
                      <li key={id}>
                        <button disabled={!open} onClick={() => jump(id)}>{book.scenes[id].episodeTitle}{open ? "" : " · locked"}</button>
                      </li>
                    );
                  })}
                </ul>
                <button onClick={() => setMenu("main")}>Back</button>
              </>
            )}
            {menu === "sync" && (
              <>
                <h2>Play on another phone</h2>
                {code ? (
                  <>
                    <p>Your save code. Type it on the other phone, on the start screen:</p>
                    <p className="sync-code">{code}</p>
                    <p className="menu-note">Your story is saved to it automatically as you play.</p>
                  </>
                ) : (
                  <>
                    <p>Make a save code, then type it on the other phone to carry on from exactly here.</p>
                    <button className="primary" onClick={() => void makeCode()}>Make my save code</button>
                  </>
                )}
                <form className="sync-load" onSubmit={async (e) => { e.preventDefault(); const to = await loadCode(codeInput); if (to) jump(to); }}>
                  <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="Or enter a code from another phone" autoCapitalize="none" autoComplete="off" />
                  <button type="submit" disabled={!codeInput.trim()}>Load</button>
                </form>
                {syncNote && <p className="menu-note">{syncNote}</p>}
                <button onClick={() => setMenu("main")}>Back</button>
              </>
            )}
            {menu === "confirm-restart" && (
              <>
                <h2>Start over?</h2>
                <p>Your choices and what the characters remember will be forgotten.</p>
                <button className="primary" onClick={playAgain}>Yes, start over</button>
                <button onClick={() => setMenu("main")}>No, go back</button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

