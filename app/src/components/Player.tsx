"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Book, Choice, DialogueReply, Profile, Scene } from "@/lib/story/types";
import { adjustRelation, applyConsequence, arrive, commitChoice, loadProfile, meets, remember, saveProfile } from "@/lib/state/profile";
import { VoicePlayback } from "@/lib/audio/voice";
import Journal from "@/components/Journal";

type Phase = "clips" | "talk" | "choose" | "consequence" | "end";
interface Turn { role: "player" | "character" | "narration"; text: string }

// Clips are served from Vercel Blob in production and from /public locally.
const CLIP_BASE = (process.env.NEXT_PUBLIC_CLIP_BASE ?? "/clips").replace(/\/$/, "");
const MUSIC_VOLUME = 0.45; // bed level
const DUCK_VOLUME = 0.16; // bed level while someone speaks
const FADE_MS = 2500;

const activeFades = new WeakMap<HTMLAudioElement, () => void>();
/** A new fade supersedes an older fade on the same player. */
function fadeTo(a: HTMLAudioElement, target: number, ms = FADE_MS): Promise<void> {
  activeFades.get(a)?.();
  return new Promise((resolve) => {
    const start = a.volume, t0 = performance.now();
    let frame = 0;
    const cancel = () => { cancelAnimationFrame(frame); activeFades.delete(a); resolve(); };
    activeFades.set(a, cancel);
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      a.volume = start + (target - start) * k;
      if (k < 1) frame = requestAnimationFrame(step);
      else { activeFades.delete(a); resolve(); }
    };
    step();
  });
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
  const [prevSrc, setPrevSrc] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sceneId, setSceneId] = useState(book.start);
  const [clipIndex, setClipIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("clips");
  const [history, setHistory] = useState<Turn[]>([]);
  const [inner, setInner] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const [suggestedChoice, setSuggestedChoice] = useState<Choice | null>(null);
  const [input, setInput] = useState("");
  const [clipMissing, setClipMissing] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  const [ripple, setRipple] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [mood, setMood] = useState("neutral");
  const [reactMissing, setReactMissing] = useState<Record<string, boolean>>({});
  const profileRef = useRef<Profile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const voiceRef = useRef<VoicePlayback | null>(null);
  const voiceEnabledRef = useRef(true);
  const dialogueRef = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const choosing = useRef(false);
  const sending = useRef(false);
  const advancedClip = useRef<string | null>(null);

  const musicPlayers = useRef(new Set<HTMLAudioElement>());
  const musicRef = useRef<{ a: HTMLAudioElement | null; track: string | null; voices: number }>({ a: null, track: null, voices: 0 });
  const audioUrl = (kind: "music" | "narration" | "hooks", id: string) => `${CLIP_BASE}/${book.id}/audio/${kind}/${id}.mp3`;
  const bedTarget = () => musicRef.current.voices > 0 ? DUCK_VOLUME : MUSIC_VOLUME;
  const playVoice = useCallback((url: string) => voiceRef.current?.playUrl(url), []);

  const scene: Scene = book.scenes[sceneId];
  const currentClip = phase === "consequence" ? pendingChoice?.clip : scene.clips[clipIndex];
  const src = currentClip ? `${CLIP_BASE}/${book.id}/${currentClip}.mp4` : undefined;
  const nextClip = phase === "clips" && clipIndex + 1 < scene.clips.length ? scene.clips[clipIndex + 1]
    : phase === "clips" && scene.next ? book.scenes[scene.next]?.clips[0] : undefined;
  const talker = phase === "talk" ? scene.conversation?.character : undefined;
  const reactFor = (m: string) => talker ? `${CLIP_BASE}/${book.id}/react/${talker}-${m}.mp4` : undefined;
  const reactSrc = [reactFor(mood), reactFor("neutral")].find((u) => u && !reactMissing[u]);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [history, busy]);

  const commit = useCallback((p: Profile) => {
    profileRef.current = p;
    setProfile(p);
    setSaveFailed(!saveProfile(p));
  }, []);

  const cancelPending = useCallback(() => {
    generation.current += 1;
    dialogueRef.current?.abort();
    voiceRef.current?.stop();
    sending.current = false;
  }, []);

  useEffect(() => {
    const p = loadProfile();
    const saved = p.position?.book === book.id && book.scenes[p.position.scene] ? p.position.scene : book.start;
    setSceneId(saved);
    commit(arrive(p, book, saved));
    voiceRef.current = new VoicePlayback((active) => {
      musicRef.current.voices = active ? 1 : 0;
      if (musicRef.current.a) void fadeTo(musicRef.current.a, bedTarget(), active ? 400 : 900);
    });
    return cancelPending;
  }, [book, commit, cancelPending]);

  // Music follows the scene; a scene without a track keeps the previous one, "none" stops it.
  const wantedTrack = scene.music ?? musicRef.current.track;
  useEffect(() => {
    if (!started) return;
    const m = musicRef.current;
    const next = wantedTrack === "none" ? null : wantedTrack ?? null;
    if (next === m.track) return;
    const old = m.a;
    if (old) void fadeTo(old, 0).then(() => { old.pause(); old.src = ""; musicPlayers.current.delete(old); });
    m.track = next;
    m.a = null;
    if (!next) return;
    const a = new Audio(audioUrl("music", next));
    musicPlayers.current.add(a);
    a.loop = true;
    a.volume = 0;
    a.muted = !voiceEnabledRef.current;
    a.play().then(() => { if (musicPlayers.current.has(a)) void fadeTo(a, bedTarget()); }).catch(() => { /* missing track or blocked: silence */ });
    m.a = a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantedTrack, started]);

  // Stop the bed when leaving the page.
  useEffect(() => () => { for (const a of musicPlayers.current) { activeFades.get(a)?.(); a.pause(); a.src = ""; } musicPlayers.current.clear(); }, []);

  // Narration audio at the start of a scene (pre-rendered file; silent if absent).
  useEffect(() => {
    if (!started || !voiceEnabledRef.current || scene.narrationAudio === false || phase !== "clips" || clipIndex !== 0 || !scene.narration) return;
    void playVoice(audioUrl("narration", scene.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, started]);

  // Remember the outgoing clip for the cross-fade.
  const lastSrc = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (lastSrc.current && lastSrc.current !== src) setPrevSrc(lastSrc.current);
    lastSrc.current = src;
  }, [src]);

  const speak = useCallback(async (text: string, character: string) => {
    if (!voiceEnabledRef.current) return;
    const turn = generation.current;
    setVoiceStatus("Preparing voice…");
    const result = await voiceRef.current?.speak(text, book.id, character);
    if (turn !== generation.current || result === "cancelled" || !voiceEnabledRef.current) return;
    setVoiceStatus(result === "unavailable" ? "Voice unavailable. You can keep reading, or replay the line." : null);
  }, [book.id]);

  const askAI = useCallback(async (mode: "talk" | "inner", playerLine?: string, hist: Turn[] = []): Promise<DialogueReply | null> => {
    if (!profileRef.current) return null;
    dialogueRef.current?.abort();
    const request = new AbortController();
    dialogueRef.current = request;
    try {
      const res = await fetch("/api/dialogue", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: request.signal,
        body: JSON.stringify({ bookId: book.id, sceneId, mode, history: hist.filter((t) => t.role !== "narration"), playerLine, profile: profileRef.current }),
      });
      if (!res.ok) return null;
      return await res.json() as DialogueReply;
    } catch { return null; }
  }, [book.id, sceneId]);

  const finishTransition = useCallback((next: string) => {
    if (!book.scenes[next]) return;
    cancelPending();
    if (profileRef.current) commit(arrive(profileRef.current, book, next));
    setDestination(null);
    setSceneId(next);
    setClipIndex(0);
    setPhase("clips");
    setHistory([]);
    setMood("neutral");
    setInner(null);
    setShowOptions(false);
    setPendingChoice(null);
    setSuggestedChoice(null);
    setClipMissing(false);
    setBusy(false);
    setInput("");
    setError(null);
    setVoiceStatus(null);
    setRipple(null);
    choosing.current = false;
    advancedClip.current = null;
  }, [book, cancelPending, commit]);

  const goTo = useCallback((next: string) => {
    if (!book.scenes[next]) return;
    cancelPending();
    if (scene.hook) {
      setDestination(next);
      if (voiceEnabledRef.current) void playVoice(`${CLIP_BASE}/${book.id}/audio/hooks/${scene.id}.mp3`);
    }
    else finishTransition(next);
  }, [book.scenes, book.id, scene.hook, scene.id, cancelPending, finishTransition, playVoice]);

  const afterClips = useCallback(async () => {
    if (!profileRef.current) return;
    if (scene.type === "end") { setPhase("end"); return; }
    if (scene.conversation) {
      setPhase("talk");
      if (scene.conversation.opening) {
        setHistory([{ role: "character", text: scene.conversation.opening }]);
        void speak(scene.conversation.opening, scene.conversation.character);
      }
    } else if (scene.choices?.length) {
      setPhase("choose");
      if (scene.innerVoice) {
        const turn = generation.current;
        setBusy(true);
        const reply = await askAI("inner");
        if (turn !== generation.current) return;
        setBusy(false);
        if (reply?.dialogue) { setInner(reply.dialogue); void speak(reply.dialogue, "dream"); }
      }
    } else if (scene.next) goTo(scene.next);
  }, [scene, speak, askAI, goTo]);

  useEffect(() => {
    if (started && profile && phase === "clips" && scene.clips.length === 0) void afterClips();
  }, [started, profile, phase, scene.clips.length, afterClips]);

  function advanceClip() {
    if (destination || (phase !== "clips" && phase !== "consequence")) return;
    const key = `${sceneId}:${phase}:${clipIndex}`;
    if (advancedClip.current === key) return;
    advancedClip.current = key;
    setClipMissing(false);
    if (phase === "consequence") {
      if (pendingChoice) goTo(pendingChoice.next);
    } else if (clipIndex + 1 < scene.clips.length) setClipIndex((i) => i + 1);
    else void afterClips();
  }

  function choose(choice: Choice) {
    const current = profileRef.current;
    if (!current || choosing.current || sending.current || busy || destination) return;
    const next = commitChoice(current, book, sceneId, choice);
    if (next === current) return;
    choosing.current = true;
    cancelPending();
    commit(next);
    setSuggestedChoice(null);
    setVoiceStatus(null);
    setRipple(choice.effectsIf?.filter((e) => current.flags[book.id]?.[e.flag]).map((e) => e.ripple).filter(Boolean).join(" ") || null);
    if (choice.clip) {
      setPendingChoice(choice);
      setPhase("consequence");
      setClipMissing(false);
    } else goTo(choice.next);
  }

  async function send() {
    const line = input.trim();
    if (!line || busy || sending.current || choosing.current || !scene.conversation || destination) return;
    sending.current = true;
    inputRef.current?.blur();
    voiceRef.current?.stop();
    setVoiceStatus(null);
    setInput("");
    setError(null);
    setSuggestedChoice(null);
    const hist: Turn[] = [...history, { role: "player", text: line }];
    setHistory(hist);
    setBusy(true);
    const turn = generation.current;
    const reply = await askAI("talk", line, history);
    if (turn !== generation.current) return;
    sending.current = false;
    setBusy(false);
    if (!reply) {
      setHistory(history);
      setInput(line);
      setError("The conversation is unavailable. Retry your words, or choose an action below.");
      setShowOptions(true);
      return;
    }
    const who = scene.conversation.character;
    setHistory([...hist, ...(reply.narration ? [{ role: "narration" as const, text: reply.narration }] : []), { role: "character", text: reply.dialogue }]);
    setMood(reply.mood ?? "neutral");
    void speak(reply.dialogue, who);
    setInner(reply.inner_thought);
    let p = profileRef.current;
    const ripples: string[] = [];
    if (p) {
      for (const tag of reply.consequences ?? []) {
        const consequence = scene.conversation.consequences?.[tag];
        if (!consequence) continue;
        const next = applyConsequence(p, book.id, who, tag, consequence);
        if (next !== p && consequence.ripple) ripples.push(consequence.ripple);
        p = next;
      }
      p = adjustRelation(p, who, reply.trust_delta ?? 0, reply.fear_delta ?? 0);
      p = remember(p, reply.memory_note);
      commit(p);
      setRipple(ripples.join(" ") || null);
      const updated = p;
      const suggested = scene.choices?.find((c) => c.id === reply.decision && meets(updated, book.id, c.requires));
      if (suggested) setSuggestedChoice(suggested);
    }
  }

  const options = useMemo(() => (scene.choices ?? []).filter((c) => profile && meets(profile, book.id, c.requires)), [scene, profile, book.id]);
  const extraNarration = (scene.narrationIf ?? []).filter((n) => profile?.flags[book.id]?.[n.flag]).map((n) => n.text).join(" ");
  const lastLine = [...history].reverse().find((turn) => turn.role === "character")?.text;
  const voiceCharacter = scene.conversation?.character;

  if (!profile) return <main className="stage" aria-label="Opening your bookmark" />;

  if (!started) return <main className="stage">
    <button className="gate" onClick={() => {
      void enterImmersive();
      void fetch("/api/dialogue?warm=1").catch(() => undefined);
      void fetch("/api/tts").catch(() => undefined);
      setStarted(true);
    }}>
      <span className="gate-title">{book.title}</span>
      <span className="gate-sub">{sceneId !== book.start ? `Resume: ${scene.title}` : "for Aurie"}</span>
      <span className="gate-cta">{vp.touch ? "Touch the glass to begin" : "Begin your story"}</span>
      <span className="gate-hint">Sound on. Best with your phone sideways.</span>
    </button>
  </main>;

  return (
    <main className={`stage ${vp.touch ? "touch" : ""}`}>
      {vp.phonePortrait && <div className="rotate"><div className="rotate-icon" aria-hidden="true">⟳</div><div>Turn your phone sideways</div><div className="rotate-sub">The story is filmed widescreen.</div></div>}
      <div className="sway" aria-hidden="true">
        {prevSrc && prevSrc !== src && <video key={`prev-${prevSrc}`} className="film prev" src={prevSrc} muted playsInline preload="none" />}
        {src && !clipMissing ? <video key={src} ref={videoRef} className="film" src={src} autoPlay playsInline preload="auto" muted={!voiceEnabled} onPlaying={() => setPrevSrc(null)} onEnded={advanceClip} onError={() => setClipMissing(true)} /> : (
          <div className="film placeholder"><div className="placeholder-title">{scene.title}</div></div>
        )}
        {reactSrc && <video key={reactSrc} className="film react" src={reactSrc} autoPlay loop muted playsInline onError={() => setReactMissing((m) => ({ ...m, [reactSrc]: true }))} />}
        <div className="vignette" />
      </div>
      {nextClip && <link rel="preload" as="video" href={`${CLIP_BASE}/${book.id}/${nextClip}.mp4`} />}
      <nav className="player-tools" aria-label="Reading controls">
        <a href="/" onClick={cancelPending}>Library</a>
        <details className="journal-panel"><summary>Your journal</summary><Journal profile={profile} /></details>
        <button aria-pressed={voiceEnabled} onClick={() => {
          voiceEnabledRef.current = !voiceEnabled;
          setVoiceEnabled(!voiceEnabled);
          for (const a of musicPlayers.current) a.muted = voiceEnabled;
          voiceRef.current?.stop();
          setVoiceStatus(null);
        }}>Voice {voiceEnabled ? "on" : "off"}</button>
        {phase === "clips" && src && !clipMissing && <button onClick={() => {
          const video = videoRef.current;
          if (video?.paused) void video.play().catch(() => setClipMissing(true));
          else video?.pause();
        }}>Play / pause film</button>}
      </nav>
      {saveFailed && <p className="save-warning" role="status">Your bookmark could not be saved on this device. Keep this page open to continue.</p>}
      {scene.episodeTitle && phase === "clips" && clipIndex === 0 && !destination && <div key={`ep-${scene.id}`} className="epcard">{scene.episodeTitle}</div>}
      {destination ? (
        <section className="hook"><p>{scene.hook}</p><button onClick={() => finishTransition(destination)}>Continue</button></section>
      ) : <>
        {phase === "clips" && scene.narration && <div className="narration">{scene.narration}<span className="narration-echo"> {extraNarration}</span></div>}
        {ripple && <p className="ripple" role="status">{ripple}</p>}
        {inner && (phase === "talk" || phase === "choose") && <div className="inner">{inner}</div>}
        {(phase === "clips" || phase === "consequence") && <div className="film-controls">
          {clipMissing && <p>The scene continues in words.</p>}
          <button onClick={advanceClip}>{clipMissing ? "Continue reading" : "Skip this clip"}</button>
        </div>}
        {phase === "talk" && scene.conversation && (
          <section className="talk" aria-label="Conversation">
            {scene.objective && <p className="objective">{scene.objective}</p>}
            <div ref={transcriptRef} className="transcript" role="log" aria-live="polite" aria-relevant="additions">
              {history.map((turn, i) => <p key={i} className={turn.role}>
                {turn.role !== "narration" && <span className="who">{turn.role === "player" ? profile.name : characterName(scene.conversation!.character)}</span>}{turn.text}
              </p>)}
              {busy && <p className="thinking">Listening…</p>}
            </div>
            {voiceStatus && <p className="reading-status" role="status">{voiceStatus}</p>}
            {error && <p className="reading-status" role="status">{error}</p>}
            {suggestedChoice && <button className="suggested-action" onClick={() => choose(suggestedChoice)}>Continue: {suggestedChoice.text}</button>}
            <form className="say" onSubmit={(event) => { event.preventDefault(); void send(); }}>
              <label className="sr-only" htmlFor="aurie-words">What will Aurie say or do?</label>
              <input ref={inputRef} enterKeyHint="send" autoComplete="off" autoCapitalize="sentences" id="aurie-words" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Speak, or describe what you do…" maxLength={2000} disabled={busy} />
              <button type="submit" disabled={busy || !input.trim()}>Say</button>
              {options.length > 0 && <button type="button" className="ghost" aria-expanded={showOptions} onClick={() => setShowOptions((value) => !value)}>{showOptions ? "Hide actions" : "What could I do?"}</button>}
              {voiceEnabled && lastLine && voiceCharacter && <button type="button" className="ghost" disabled={busy} onClick={() => void speak(lastLine, voiceCharacter)}>Replay voice</button>}
            </form>
            {showOptions && <ul className="options">{options.map((choice) => <li key={choice.id}><button disabled={busy} onClick={() => choose(choice)}>{choice.text}</button></li>)}</ul>}
          </section>
        )}
        {phase === "choose" && <section className="choose">
          {scene.objective && <p className="objective">{scene.objective}</p>}
          {scene.narration && <p>{scene.narration}</p>}
          <ul className="options">{options.map((choice) => <li key={choice.id}><button disabled={busy} onClick={() => choose(choice)}>{choice.text}</button></li>)}</ul>
        </section>}
        {phase === "end" && <section className="endcard">
          <p className="eyebrow">A bookmark, until the next night</p>
          <h2>{scene.title}</h2><p>{scene.narration}</p>
          <p className="meta">Your choices are written in the journal.</p>
          <a href="/" onClick={cancelPending}>Return to the library</a>
        </section>}
      </>}
    </main>
  );
}

const characterNames: Record<string, string> = { burgess: "Roderick Burgess", alex: "Alex Burgess", "alex-old": "Alex Burgess", unity: "Unity Kincaid", lucienne: "Lucienne" };
const characterName = (key: string) => characterNames[key] ?? key;
