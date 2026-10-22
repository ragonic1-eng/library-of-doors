"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Beat, Book, Choice, DialogueReply, Fx, Profile, Scene } from "@/lib/story/types";
import { adjustRelation, applyConsequence, applyEffect, loadProfile, meets, newProfile, remember, saveProfile } from "@/lib/state/profile";
import { lineId } from "@/lib/story/lines";
import Ambience from "@/components/Ambience";

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

type MenuView = "main" | "journal" | "chapters" | "sync" | "confirm-restart";

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
const RECAP_MS = 7000; // the "Previously" card when she comes back

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
  // The moment a decision is made, shown plainly so she always knows what she chose.
  const [chosen, setChosen] = useState<string | null>(null);
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
  const pausedMedia = useRef<HTMLMediaElement[]>([]);

  // ---------- audio: music bed, narrator lines, character voices ----------
  const musicRef = useRef<{ a: HTMLAudioElement | null; track: string | null; voices: number }>({ a: null, track: null, voices: 0 });
  const bedTarget = () => (musicRef.current.voices > 0 ? DUCK_VOLUME : MUSIC_VOLUME);
  const duck = () => {
    musicRef.current.voices += 1;
    if (musicRef.current.a) void fadeTo(musicRef.current.a, DUCK_VOLUME, 400);
  };
  const unduck = () => {
    musicRef.current.voices = Math.max(0, musicRef.current.voices - 1);
    if (musicRef.current.a) void fadeTo(musicRef.current.a, bedTarget(), 900);
  };
  const assetUrl = (kind: "music" | "lines", id: string) => `${CLIP_BASE}/${book.id}/audio/${kind}/${id}.mp3`;
  const lineUrl = (text: string) => assetUrl("lines", lineId(text));
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
    let finished = false, shown = false;
    const show = () => { if (!shown && !finished) { shown = true; onStart(); } };
    const finish = () => {
      if (finished) return;
      finished = true;
      stoppers.current.delete(stop);
      playing.current.delete(a);
      a.pause();
      unduck();
      resolve();
    };
    const stop = () => finish();
    stoppers.current.add(stop);
    duck();
    a.onplaying = show;
    a.onended = finish;
    // No audio for this line: show it and give time to read it.
    const silent = () => { show(); setTimeout(finish, readingMs(text)); };
    a.onerror = silent;
    a.currentTime = 0;
    playing.current.add(a);
    a.play().catch(silent);
    setTimeout(show, 2500); // a slow network must not hide the words for long
    // Never hang the story on one line (but a paused game is not a hung one).
    const guard = () => (pausedRef.current ? setTimeout(guard, 2000) : finish());
    setTimeout(guard, readingMs(text) * 2 + 4000);
  });

  /** Fetch a character's voice for one line (or one speaker's part of a line). */
  const fetchVoice = useCallback(async (text: string, character: string, speaker?: string): Promise<Blob | null> => {
    try {
      const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, bookId: book.id, character, speaker }) });
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
    let stopped = false;
    let a: HTMLAudioElement | null = null;
    const stop = () => {
      stopped = true;
      setTalking(false);
      if (a) { a.pause(); playing.current.delete(a); }
      stoppers.current.delete(stop);
      startRes();
      endRes();
    };
    stoppers.current.add(stop);
    void (async () => {
      const b = await blob;
      if (stopped) return;
      if (b) {
        a = new Audio(URL.createObjectURL(b));
        const el = a;
        duck();
        el.onplaying = () => { setTalking(true); startRes(); };
        const done = () => { setTalking(false); unduck(); playing.current.delete(el); stoppers.current.delete(stop); endRes(); };
        el.onended = done;
        el.onerror = () => { startRes(); done(); };
        await waitUnpaused();
        if (stopped) return;
        playing.current.add(el);
        el.play().catch(() => { startRes(); done(); });
        return;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.92;
        u.onstart = () => { setTalking(true); startRes(); };
        u.onend = () => { setTalking(false); endRes(); };
        u.onerror = () => { startRes(); endRes(); };
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } else {
        startRes();
        endRes();
      }
    })();
    return { started, ended };
  }, []);

  /** A whole reply, one speaker after another, each in their own voice. All voices are fetched at once. */
  const speakAll = useCallback((segments: Segment[], character: string) => {
    let startRes!: () => void, endRes!: () => void;
    const started = new Promise<void>((r) => (startRes = r));
    const ended = new Promise<void>((r) => (endRes = r));
    const chain = ++voiceChain.current;
    const blobs = segments.map((s) => fetchVoice(s.text, character, s.speaker));
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
    const url = b.clip ? clipUrl(b.clip) : b.still ? stillUrl(b.still) : null;
    if (!url || topLayer.current?.url === url) return; // nothing new, or already on screen: keep holding it
    const layer = { url, key: `${url}#${++layerSeq.current}`, still: !!b.still };
    topLayer.current = layer;
    clipDone.current.waiters.splice(0).forEach((w) => w());
    clipDone.current = { key: layer.key, done: layer.still, waiters: [] };
    setMissing(null);
    setLayers((ls) => [...ls.slice(-1), layer]);
  };
  const layerReady = (key: string) => setTimeout(() => setLayers((ls) => (ls[ls.length - 1]?.key === key ? ls.slice(-1) : ls)), 600);

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
        setUpcoming(list.slice(i + 1).find((x) => x.clip)?.clip ?? null);
        show(b);
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
          await Promise.race([playLine(b.text, () => { if (token === runRef.current) setSubtitle({ text: b.text!, hook: b.style === "hook" }); }), skipped]);
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
  const deliver = async (text: string, character: string, token: number, before: Turn[] = [], extra: Turn[] = []) => {
    const segs = splitSpeakers(text, book.scenes[sceneId]?.conversation?.speakerNames);
    const v = speakAll(segs, character);
    await Promise.race([v.started, sleep(NPC_TEXT_WAIT_MS)]);
    if (token !== runRef.current) return v;
    setBusy(false);
    setHistory([...before, ...extra, ...segs.map((s) => ({ role: "character" as const, text: s.text, who: s.name }))]);
    return v;
  };

  /** After a scene's beats: talk, decide, or move on. */
  async function afterFilm(sc: Scene, token: number) {
    if (token !== runRef.current) return;
    if (!sc.choices?.length) logJournal(sc.id);
    if (sc.type === "end") return setPhase("end");
    if (sc.conversation) {
      setPhase("talk");
      const opening = sc.conversation.opening;
      if (opening) {
        setBusy(true);
        await deliver(opening, sc.conversation.character, token);
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

  async function playScene(id: string, token: number) {
    const sc = book.scenes[id];
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
    stopAllVoices();
    setSceneId(next);
    setHistory([]);
    setMood("neutral");
    setInner(null);
    setShowOptions(false);
    setBusy(false);
    setSubtitle(null);
    setCard(null);
    setChosen(null);
    setNetError(null);
    setBeatFx(undefined);
    const p = profileRef.current;
    if (p) commit({ ...p, position: { book: book.id, scene: next } });
    void playScene(next, token);
  }

  async function choose(choice: Choice) {
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
    // Say plainly what she chose, so a decision never passes unnoticed.
    setChosen(choice.text);
    let skipRes!: () => void;
    const skipped = new Promise<void>((r) => (skipRes = r));
    skipRef.current = skipRes;
    setSkippable(true);
    await Promise.race([sleep(CHOICE_MS), skipped]);
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
    const v = await deliver(reply.dialogue, who, token, hist, extra);
    if (token !== runRef.current) return;
    if (reply.mood) setMood(reply.mood);
    if (reply.inner_thought) {
      setInner(reply.inner_thought);
      setTimeout(() => setInner((cur) => (cur === reply.inner_thought ? null : cur)), 7000);
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
      await Promise.race([v.ended, sleep(25000)]);
      await sleep(700);
      if (token === runRef.current) void choose(c);
    }
  }

  /** Her line (typed, or a tapped idea; a tapped exit carries its id as intent) goes to the character. */
  function send(line: string, intent?: string) {
    if (!line || busy || !scene.conversation) return;
    setInput("");
    setShowOptions(false);
    inputRef.current?.blur(); // drop the phone keyboard so the reaction loop is visible
    stopAllVoices();
    const hist: Turn[] = [...history, { role: "player", text: line }];
    setHistory(hist);
    void respond(hist, line, intent);
  }

  // ---------- pause menu ----------
  function openMenu(view: MenuView = "main") {
    if (!pausedRef.current) {
      pausedRef.current = true;
      const media: HTMLMediaElement[] = [...playing.current];
      if (musicRef.current.a && !musicRef.current.a.paused) media.push(musicRef.current.a);
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

  // Stop the bed when leaving the page.
  useEffect(() => () => { musicRef.current.a?.pause(); }, []);

  const talker = phase === "talk" ? scene.conversation?.character : undefined;
  const reactFor = (m: string) => (talker ? `${CLIP_BASE}/${book.id}/react/${talker}-${m}.mp4` : undefined);
  // Prefer the exact mood, then neutral; if neither exists, the scene's last frame stays on screen.
  const reactSrc = [talking ? reactFor("talking") : undefined, reactFor(mood), reactFor("neutral")].find((u) => u && !reactMissing[u]);
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

  if (!profile) return <main className="stage" />;

  // Before the first tap: a still gate. The tap is what lets a phone browser play sound and go fullscreen.
  if (!started) {
    const resuming = sceneId !== book.start;
    const begin = (from?: string) => {
      void enterImmersive();
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
    <main
      className={`stage ${vp.touch ? "touch" : ""}`}
      onClick={(e) => {
        // A tap on the picture during narration skips to the next moment.
        if (menu) return;
        if ((phase === "film" || recap) && skippable && !(e.target as HTMLElement).closest("button, input, a, .menu, .hud")) skipRef.current?.();
      }}
    >
      {vp.phonePortrait && (
        <div className="rotate">
          <div className="rotate-icon" aria-hidden="true">⟳</div>
          <div>Turn your phone sideways</div>
          <div className="rotate-sub">The story is filmed widescreen.</div>
        </div>
      )}

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
        {reactSrc && (
          <video
            key={reactSrc}
            className="film react"
            src={reactSrc}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setReactMissing((m) => ({ ...m, [reactSrc]: true }))}
          />
        )}
        <Ambience fx={fx} />
        <div className="vignette" />
      </div>
      {upcoming && <video className="prefetch" src={clipUrl(upcoming)} preload="auto" muted playsInline aria-hidden="true" />}

      {/* Top-right controls: fullscreen and the pause menu */}
      <div className="hud">
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

      {phase === "film" && skippable && !recap && !chosen && <div className="skiphint">{vp.touch ? "Tap to skip" : "Click to skip"}</div>}

      {ripple && <div key={ripple} className="ripple">{ripple}</div>}

      {inner && (phase === "talk" || phase === "choose") && <div className="inner">{inner}</div>}

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
                <span className="who">{speakerName}</span> {speakerName.startsWith("The ") ? "are" : "is"} typing<span className="dots" aria-hidden="true"><i /><i /><i /></span>
              </p>
            )}
          </div>
          {showOptions && (
            <ul className="options">
              {ideas.map((o) => (
                <li key={o.intent ?? o.text}>
                  <button onClick={() => send(o.text, o.intent)} disabled={busy}>{o.text}</button>
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
              placeholder={`Say or do anything, as ${profile.name}…`}
              autoFocus={!vp.touch}
              disabled={busy}
              enterKeyHint="send"
              autoComplete="off"
              autoCapitalize="sentences"
            />
            <button type="submit" disabled={busy || !input.trim()}>Say</button>
            {ideas.length > 0 && (
              <button type="button" className="ghost" onClick={() => setShowOptions((s) => !s)}>
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
                <button onClick={() => setMenu("journal")}>Story so far</button>
                <button onClick={() => setMenu("chapters")}>Chapters</button>
                <button onClick={() => jump(chapterOf(sceneId))}>Restart this chapter</button>
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
