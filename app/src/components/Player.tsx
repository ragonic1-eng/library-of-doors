"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Beat, Book, Choice, DialogueReply, Profile, Scene } from "@/lib/story/types";
import { adjustRelation, applyConsequence, applyEffect, loadProfile, meets, newProfile, remember, saveProfile } from "@/lib/state/profile";
import { lineId } from "@/lib/story/lines";

// film: narrated beats are playing. talk: a live conversation. choose: a pure decision. end: episode over.
type Phase = "film" | "talk" | "choose" | "end";

interface Turn {
  role: "player" | "character" | "narration";
  text: string;
}

interface Layer {
  url: string;
  key: string;
  still: boolean;
}

// Clips are served from Vercel Blob in production and from /public locally.
const CLIP_BASE = (process.env.NEXT_PUBLIC_CLIP_BASE ?? "/clips").replace(/\/$/, "");
const MUSIC_VOLUME = 0.45; // bed level
const DUCK_VOLUME = 0.16; // bed level while someone speaks
const FADE_MS = 2500;
const CARD_MS = 2600; // a silent time/place card
const BEAT_GAP_MS = 250; // breath between narrated lines
const HOLD_MS = 2000; // longest a clip keeps playing after its line before the next picture cuts in
const NPC_TEXT_WAIT_MS = 6000; // longest a character's line waits for its voice before it is shown anyway

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

export default function Player({ book }: { book: Book }) {
  const vp = useViewport();
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
  // Diegetic feedback when a consequence fires ("Somewhere above, a man begins to weep.")
  const [ripple, setRipple] = useState<string | null>(null);
  // Reaction loops: while talking, the speaking character's loop for their current mood plays over the scene.
  const [mood, setMood] = useState("neutral");
  const [reactMissing, setReactMissing] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Always-current profile: async flows (timelines, replies) must never use a stale copy.
  const profileRef = useRef<Profile | null>(null);
  const commit = useCallback((p: Profile) => {
    profileRef.current = p;
    setProfile(p);
    saveProfile(p);
  }, []);
  const showRipple = useCallback((text?: string) => {
    if (!text) return;
    setRipple(text);
    setTimeout(() => setRipple((r) => (r === text ? null : r)), 4500);
  }, []);

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
  const stopAllVoices = () => {
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
    a.play().catch(silent);
    setTimeout(show, 1200); // a slow network must not hide the words
    setTimeout(finish, readingMs(text) * 2 + 4000); // never hang the story on one line
  });

  /** A character's voice. `started` resolves when it is audible, `ended` when it is over (or stopped). */
  const speak = useCallback((text: string, character: string) => {
    let startRes!: () => void, endRes!: () => void;
    const started = new Promise<void>((r) => (startRes = r));
    const ended = new Promise<void>((r) => (endRes = r));
    let stopped = false;
    let a: HTMLAudioElement | null = null;
    const stop = () => {
      stopped = true;
      a?.pause();
      stoppers.current.delete(stop);
      startRes();
      endRes();
    };
    stoppers.current.add(stop);
    void (async () => {
      try {
        const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, bookId: book.id, character }) });
        if (!res.ok) throw new Error("tts");
        const blob = await res.blob();
        if (stopped) return;
        a = new Audio(URL.createObjectURL(blob));
        duck();
        a.onplaying = () => startRes();
        const done = () => { unduck(); stoppers.current.delete(stop); endRes(); };
        a.onended = done;
        a.onerror = () => { startRes(); done(); };
        await a.play();
      } catch {
        if (stopped) return;
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 0.92;
          u.onstart = () => startRes();
          u.onend = () => endRes();
          u.onerror = () => { startRes(); endRes(); };
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        } else {
          startRes();
          endRes();
        }
      }
    })();
    return { started, ended };
  }, [book.id]);

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

  const askAI = useCallback(
    async (sid: string, mode: "talk" | "inner", playerLine: string | undefined, hist: Turn[], intent?: string): Promise<DialogueReply | null> => {
      const p = profileRef.current;
      if (!p) return null;
      try {
        const res = await fetch("/api/dialogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: book.id, sceneId: sid, mode, history: hist.filter((t) => t.role !== "narration"), playerLine, intent, profile: p }),
        });
        if (!res.ok) return null;
        return (await res.json()) as DialogueReply;
      } catch {
        return null;
      }
    },
    [book.id],
  );

  /** After a scene's beats: talk, decide, or move on. */
  async function afterFilm(sc: Scene, token: number) {
    if (token !== runRef.current) return;
    if (sc.type === "end") return setPhase("end");
    if (sc.conversation) {
      setPhase("talk");
      const opening = sc.conversation.opening;
      if (opening) {
        setBusy(true);
        const v = speak(opening, sc.conversation.character);
        await Promise.race([v.started, sleep(NPC_TEXT_WAIT_MS)]);
        if (token !== runRef.current) return;
        setBusy(false);
        setHistory([{ role: "character", text: opening }]);
      }
      return;
    }
    if (sc.choices?.length) {
      setPhase("choose");
      if (sc.innerVoice) {
        setBusy(true);
        const r = await askAI(sc.id, "inner", undefined, []);
        setBusy(false);
        if (r?.dialogue && token === runRef.current) {
          setInner(r.dialogue);
          void speak(r.dialogue, "dream");
        }
      }
      return;
    }
    if (sc.next) goTo(sc.next);
  }

  async function playScene(id: string, token: number) {
    const sc = book.scenes[id];
    setPhase("film");
    // Lines the player may hear next (this scene and every possible aftermath) load while she watches.
    preloadLines((sc.choices ?? []).flatMap((c) => c.aftermath ?? []).filter((b) => b.text).map((b) => b.text!));
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
    const token = ++runRef.current;
    stopAllVoices();
    setShowOptions(false);
    setInner(null);
    setPhase("film");
    if (await runTimeline(choice.aftermath ?? [], token)) goTo(choice.next);
  }

  /** Her line (typed, or a tapped suggestion with its exit as intent) goes to the character, who answers aloud. */
  async function send(line: string, intent?: string) {
    const sc = scene;
    if (!line || busy || !sc.conversation) return;
    const token = runRef.current;
    setInput("");
    setShowOptions(false);
    inputRef.current?.blur(); // drop the phone keyboard so the reaction loop is visible
    stopAllVoices();
    const hist: Turn[] = [...history, { role: "player", text: line }];
    setHistory(hist);
    setBusy(true);
    const r = await askAI(sc.id, "talk", line, hist, intent);
    if (token !== runRef.current) return;
    const who = sc.conversation.character;
    if (!r) {
      setBusy(false);
      setHistory([...hist, { role: "character", text: "…" }]);
      const c = intent ? sc.choices?.find((x) => x.id === intent) : undefined;
      if (c) void choose(c);
      return;
    }
    // The words appear as the voice begins, never before it.
    const v = speak(r.dialogue, who);
    await Promise.race([v.started, sleep(NPC_TEXT_WAIT_MS)]);
    if (token !== runRef.current) return;
    setBusy(false);
    setHistory([...hist, ...(r.narration ? [{ role: "narration" as const, text: r.narration }] : []), { role: "character", text: r.dialogue }]);
    if (r.mood) setMood(r.mood);
    if (r.inner_thought) {
      setInner(r.inner_thought);
      setTimeout(() => setInner((cur) => (cur === r.inner_thought ? null : cur)), 7000);
    }
    // Consequences: her words change the story. Apply fired consequences, the speaker's feelings and memory together.
    let p = profileRef.current;
    if (p) {
      for (const tag of r.consequences ?? []) {
        const c = sc.conversation.consequences?.[tag];
        if (!c) continue;
        p = applyConsequence(p, book.id, who, tag, c);
        showRipple(c.ripple);
      }
      p = adjustRelation(p, who, r.trust_delta ?? 0, r.fear_delta ?? 0);
      p = remember(p, r.memory_note);
      commit(p);
    }
    // Her words decided the scene: let the character finish speaking, then the story moves on.
    const c = r.decision ? sc.choices?.find((x) => x.id === r.decision) : undefined;
    if (c) {
      await Promise.race([v.ended, sleep(20000)]);
      await sleep(700);
      if (token === runRef.current) void choose(c);
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

  // The first tap starts the current scene.
  useEffect(() => {
    if (!started) return;
    const token = ++runRef.current;
    void playScene(sceneId, token);
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

  function playAgain() {
    const p = profileRef.current;
    commit({ ...newProfile(p?.name), playerModel: p?.playerModel ?? {} });
    goTo(book.start);
  }

  const talker = phase === "talk" ? scene.conversation?.character : undefined;
  const reactFor = (m: string) => (talker ? `${CLIP_BASE}/${book.id}/react/${talker}-${m}.mp4` : undefined);
  // Prefer the exact mood, then neutral; if neither exists, the scene's last frame stays on screen.
  const reactSrc = [reactFor(mood), reactFor("neutral")].find((u) => u && !reactMissing[u]);
  // Choices closed off by earlier events are hidden (and the AI cannot steer to them either).
  const options = useMemo(() => (scene.choices ?? []).filter((c) => !profile || meets(profile, book.id, c.requires)), [scene, profile, book.id]);
  const speakerName = scene.conversation ? cap(scene.conversation.character.split("-")[0]) : "";

  if (!profile) return <main className="stage" />;

  // Before the first tap: a still gate. The tap is what lets a phone browser play sound and go fullscreen.
  if (!started) {
    const resuming = sceneId !== book.start;
    return (
      <main className="stage">
        <div
          className="gate"
          role="button"
          tabIndex={0}
          onClick={() => {
            void enterImmersive();
            // Wake the dialogue and voice functions now, so the first real reply is not a cold start.
            void fetch("/api/dialogue?warm=1").catch(() => undefined);
            void fetch("/api/tts").catch(() => undefined);
            setStarted(true);
          }}
        >
          <div className="gate-title">{book.title}</div>
          <div className="gate-sub">{resuming ? `Resume: ${scene.title}` : "for Aurie"}</div>
          <div className="gate-cta">{vp.touch ? "Touch the glass to begin" : "Click to begin"}</div>
          <div className="gate-hint">Sound on. Best with your phone sideways.</div>
        </div>
      </main>
    );
  }

  const top = layers[layers.length - 1];
  return (
    <main
      className={`stage ${vp.touch ? "touch" : ""}`}
      onClick={(e) => {
        // A tap on the picture during narration skips to the next moment.
        if (phase === "film" && skippable && !(e.target as HTMLElement).closest("button, input, a")) skipRef.current?.();
      }}
    >
      {vp.phonePortrait && (
        <div className="rotate">
          <div className="rotate-icon" aria-hidden="true">⟳</div>
          <div>Turn your phone sideways</div>
          <div className="rotate-sub">The story is filmed widescreen.</div>
        </div>
      )}

      <div className="sway">
        {layers.map((l) => {
          const isTop = l === top;
          if (l.still) {
            return <img key={l.key} className={`film still ${isTop ? "" : "prev"}`} src={l.url} alt="" onLoad={() => isTop && layerReady(l.key)} onError={() => isTop && setMissing(l.key)} />;
          }
          return (
            <video
              key={l.key}
              className={`film ${isTop ? "" : "prev"}`}
              src={l.url}
              autoPlay={isTop}
              playsInline
              muted
              preload="auto"
              onPlaying={() => isTop && layerReady(l.key)}
              onEnded={() => markClipDone(l.key)}
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
        <div className="vignette" />
      </div>
      {upcoming && <video className="prefetch" src={clipUrl(upcoming)} preload="auto" muted playsInline aria-hidden="true" />}

      {scene.episodeTitle && <div key={`ep-${scene.id}`} className="eptag">{scene.episodeTitle}</div>}

      {card && <div key={card} className="timecard">{card}</div>}

      {subtitle && !subtitle.hook && <div key={subtitle.text} className="subtitle">{subtitle.text}</div>}
      {subtitle?.hook && <div key={subtitle.text} className="hook">{subtitle.text}</div>}

      {phase === "film" && skippable && <div className="skiphint">{vp.touch ? "Tap to skip" : "Click to skip"}</div>}

      {ripple && <div key={ripple} className="ripple">{ripple}</div>}

      {inner && (phase === "talk" || phase === "choose") && <div className="inner">{inner}</div>}

      {phase === "talk" && scene.conversation && (
        <section className="talk">
          <div className="transcript">
            {history.slice(vp.h < 520 ? -2 : -4).map((t, i) => (
              <p key={i} className={t.role === "narration" ? "aside" : t.role}>
                {t.role === "character" ? <span className="who">{speakerName}</span> : t.role === "player" ? <span className="who">{profile.name}</span> : null}
                {t.text}
              </p>
            ))}
            {busy && <p className="character thinking">…</p>}
          </div>
          {showOptions && (
            <ul className="options">
              {options.map((c) => (
                <li key={c.id}>
                  <button onClick={() => void send(c.text, c.id)} disabled={busy}>{c.text}</button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="say"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input.trim());
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
            {options.length > 0 && (
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
            <button onClick={playAgain}>Play again, choose differently</button>
            <a href="/">Return to the library</a>
          </div>
        </section>
      )}
    </main>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
