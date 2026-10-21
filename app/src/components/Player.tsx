"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Book, Choice, DialogueReply, Profile, Scene } from "@/lib/story/types";
import { adjustRelation, applyConsequence, applyEffect, loadProfile, meets, remember, saveProfile } from "@/lib/state/profile";

type Phase = "clips" | "talk" | "choose" | "consequence" | "end";

interface Turn {
  role: "player" | "character" | "narration";
  text: string;
}

const PLACEHOLDER_SECONDS = 4; // how long a missing clip holds its title card
// Clips are served from Vercel Blob in production and from /public locally.
const CLIP_BASE = (process.env.NEXT_PUBLIC_CLIP_BASE ?? "/clips").replace(/\/$/, "");

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
  const [clipIndex, setClipIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("clips");
  const [history, setHistory] = useState<Turn[]>([]);
  const [inner, setInner] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const [input, setInput] = useState("");
  const [clipMissing, setClipMissing] = useState(false);
  const [hook, setHook] = useState<string | null>(null);
  // Diegetic feedback when a consequence fires ("Somewhere above, a man begins to weep.")
  const [ripple, setRipple] = useState<string | null>(null);
  // Cross-fade: the previous clip stays on its last frame until the next one is actually playing.
  const [prevSrc, setPrevSrc] = useState<string | null>(null);
  // Always-current profile: delayed callbacks (auto-choose after a conversation) must never use a stale copy.
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
  // Reaction loops: while talking, the speaking character's loop for their current mood plays over the scene.
  const [mood, setMood] = useState("neutral");
  const [reactMissing, setReactMissing] = useState<Record<string, boolean>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scene: Scene = book.scenes[sceneId];
  const clipUrl = (clip: string) => `${CLIP_BASE}/${book.id}/${clip}.mp4`;
  const currentClip = phase === "consequence" ? pendingChoice?.clip : scene.clips[clipIndex];
  const src = currentClip ? clipUrl(currentClip) : undefined;
  // The clip most likely to play next, fetched early so scene changes do not stall on a phone network.
  const nextClip = phase === "clips" && clipIndex + 1 < scene.clips.length ? scene.clips[clipIndex + 1]
    : phase === "clips" && scene.next ? book.scenes[scene.next]?.clips[0] : undefined;
  const talker = phase === "talk" ? scene.conversation?.character : undefined;
  const reactFor = (m: string) => (talker ? `${CLIP_BASE}/${book.id}/react/${talker}-${m}.mp4` : undefined);
  // Prefer the exact mood, then neutral; if neither exists yet, the scene's last frame stays on screen.
  const reactSrc = [reactFor(mood), reactFor("neutral")].find((u) => u && !reactMissing[u]);

  // Load the saved profile and resume position once.
  useEffect(() => {
    const p = loadProfile();
    if (p.position?.book === book.id && book.scenes[p.position.scene]) setSceneId(p.position.scene);
    profileRef.current = p;
    setProfile(p);
  }, [book]);

  // Persist position on every scene change.
  useEffect(() => {
    if (!profile) return;
    const p = { ...profile, position: { book: book.id, scene: sceneId } };
    saveProfile(p);
  }, [sceneId, profile, book.id]);

  // Remember the outgoing clip for the cross-fade.
  const lastSrc = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (lastSrc.current && lastSrc.current !== src) setPrevSrc(lastSrc.current);
    lastSrc.current = src;
  }, [src]);

  const speak = useCallback(
    async (text: string, character: string) => {
      try {
        const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, bookId: book.id, character }) });
        if (!res.ok) throw new Error("tts");
        const blob = await res.blob();
        audioRef.current?.pause();
        const a = new Audio(URL.createObjectURL(blob));
        audioRef.current = a;
        await a.play();
      } catch {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 0.92;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        }
      }
    },
    [book.id],
  );

  const askAI = useCallback(
    async (mode: "talk" | "inner", playerLine?: string, hist: Turn[] = history): Promise<DialogueReply | null> => {
      if (!profile) return null;
      try {
        const res = await fetch("/api/dialogue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: book.id, sceneId, mode, history: hist.filter((t) => t.role !== "narration"), playerLine, profile: profileRef.current ?? profile }),
        });
        if (!res.ok) return null;
        return (await res.json()) as DialogueReply;
      } catch {
        return null;
      }
    },
    [book.id, sceneId, history, profile],
  );

  // When the clips of a scene are done, decide what comes next.
  const afterClips = useCallback(async () => {
    if (scene.type === "end") return setPhase("end");
    if (scene.conversation) {
      setPhase("talk");
      const opening = scene.conversation.opening;
      if (opening) {
        setHistory([{ role: "character", text: opening }]);
        void speak(opening, scene.conversation.character);
      }
      return;
    }
    if (scene.choices?.length) {
      setPhase("choose");
      if (scene.innerVoice) {
        setBusy(true);
        const r = await askAI("inner", undefined, []);
        setBusy(false);
        if (r?.dialogue) {
          setInner(r.dialogue);
          void speak(r.dialogue, "dream");
        }
      }
      return;
    }
    if (scene.next) goTo(scene.next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, askAI, speak]);

  const advanceClip = useCallback(() => {
    setClipMissing(false);
    if (phase === "consequence") {
      if (pendingChoice) goTo(pendingChoice.next);
      return;
    }
    if (clipIndex + 1 < scene.clips.length) setClipIndex((i) => i + 1);
    else void afterClips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, pendingChoice, clipIndex, scene, afterClips]);

  // A scene with no clips at all goes straight to its logic.
  useEffect(() => {
    if (started && phase === "clips" && scene.clips.length === 0) void afterClips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, phase, started]);

  // Missing clip: hold a title card, then move on.
  useEffect(() => {
    if (!clipMissing || !started) return;
    const t = setTimeout(advanceClip, PLACEHOLDER_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [clipMissing, advanceClip, started]);

  // Scene change: hold the current scene's hook line for a beat, then move (engagement-design.md §6).
  function goTo(next: string) {
    const line = scene.hook;
    const jump = () => {
      setHook(null);
      setSceneId(next);
      setClipIndex(0);
      setPhase("clips");
      setHistory([]);
      setMood("neutral");
      setInner(null);
      setShowOptions(false);
      setPendingChoice(null);
      setClipMissing(false);
    };
    if (line) {
      setHook(line);
      setTimeout(jump, 3200);
    } else {
      jump();
    }
  }

  function choose(choice: Choice) {
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
    audioRef.current?.pause();
    if (choice.clip) {
      setPendingChoice(choice);
      setPhase("consequence");
      setClipMissing(false);
    } else {
      goTo(choice.next);
    }
  }

  async function send() {
    const line = input.trim();
    if (!line || busy || !scene.conversation) return;
    setInput("");
    inputRef.current?.blur(); // drop the phone keyboard so the reaction loop is visible
    const hist: Turn[] = [...history, { role: "player", text: line }];
    setHistory(hist);
    setBusy(true);
    const r = await askAI("talk", line, hist);
    setBusy(false);
    if (!r) {
      setHistory([...hist, { role: "character", text: "..." }]);
      return;
    }
    const who = scene.conversation.character;
    setHistory([...hist, ...(r.narration ? [{ role: "narration" as const, text: r.narration }] : []), { role: "character", text: r.dialogue }]);
    if (r.mood) setMood(r.mood);
    void speak(r.dialogue, who);
    if (r.inner_thought) setInner(r.inner_thought);
    // Consequences: her words change the story. Apply fired consequences, the speaker's feelings and memory together.
    let p = profileRef.current;
    if (p) {
      for (const tag of r.consequences ?? []) {
        const c = scene.conversation.consequences?.[tag];
        if (!c) continue;
        p = applyConsequence(p, book.id, who, tag, c);
        showRipple(c.ripple);
      }
      p = adjustRelation(p, who, r.trust_delta ?? 0, r.fear_delta ?? 0);
      p = remember(p, r.memory_note);
      commit(p);
    }
    if (r.decision) {
      const c = scene.choices?.find((x) => x.id === r.decision);
      if (c) setTimeout(() => choose(c), 1800);
    }
  }

  // Choices closed off by earlier events are hidden (and the AI cannot steer to them either).
  const options = useMemo(() => (scene.choices ?? []).filter((c) => !profile || meets(profile, book.id, c.requires)), [scene, profile, book.id]);
  const extraNarration = (scene.narrationIf ?? []).filter((n) => profile?.flags[book.id]?.[n.flag]).map((n) => n.text).join(" ");
  const speakerName = scene.conversation ? cap(scene.conversation.character.split("-")[0]) : "";

  if (!profile) return <main className="stage" />;

  // Before the first tap: a still gate. The tap is what lets a phone browser play sound and go fullscreen.
  if (!started) {
    const resuming = sceneId !== book.start;
    return (
      <main className="stage">
        <div className="gate" onClick={() => { void enterImmersive(); setStarted(true); }} role="button" tabIndex={0}>
          <div className="gate-title">{book.title}</div>
          <div className="gate-sub">{resuming ? `Resume: ${scene.title}` : "for Aurie"}</div>
          <div className="gate-cta">{vp.touch ? "Touch the glass to begin" : "Click to begin"}</div>
          <div className="gate-hint">Sound on. Best with your phone sideways.</div>
        </div>
      </main>
    );
  }

  return (
    <main className={`stage ${vp.touch ? "touch" : ""}`}>
      {vp.phonePortrait && (
        <div className="rotate">
          <div className="rotate-icon" aria-hidden="true">⟳</div>
          <div>Turn your phone sideways</div>
          <div className="rotate-sub">The story is filmed widescreen.</div>
        </div>
      )}

      <div className="sway">
        {prevSrc && prevSrc !== src && (
          <video key={`prev-${prevSrc}`} className="film prev" src={prevSrc} muted playsInline preload="none" />
        )}
        {src && !clipMissing ? (
          <video
            key={src}
            ref={videoRef}
            className="film"
            src={src}
            autoPlay
            playsInline
            preload="auto"
            onPlaying={() => setTimeout(() => setPrevSrc(null), 500)}
            onEnded={advanceClip}
            onError={() => setClipMissing(true)}
          />
        ) : (
          <div className="film placeholder">
            <div className="placeholder-title">{scene.title}</div>
            {currentClip && <div className="placeholder-sub">clip {currentClip} not yet generated</div>}
          </div>
        )}
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
      {nextClip && <video className="prefetch" src={clipUrl(nextClip)} preload="auto" muted playsInline aria-hidden="true" />}

      {scene.episodeTitle && phase === "clips" && clipIndex === 0 && !hook && (
        <div key={`ep-${scene.id}`} className="epcard">{scene.episodeTitle}</div>
      )}

      {hook && <div className="hook">{hook}</div>}

      {phase === "clips" && scene.narration && clipIndex === 0 && !hook && (
        <div className="narration">{scene.narration}{extraNarration ? <span className="narration-echo"> {extraNarration}</span> : null}</div>
      )}

      {ripple && <div key={ripple} className="ripple">{ripple}</div>}

      {inner && (phase === "talk" || phase === "choose") && <div className="inner">{inner}</div>}

      {phase === "talk" && scene.conversation && (
        <section className="talk">
          <div className="transcript">
            {history.slice(vp.h < 520 ? -2 : -4).map((t, i) => (
              <p key={i} className={t.role}>
                {t.role === "character" ? <span className="who">{speakerName}</span> : t.role === "player" ? <span className="who">{profile.name}</span> : null}
                {t.text}
              </p>
            ))}
            {busy && <p className="character thinking">…</p>}
          </div>
          <form
            className="say"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak…"
              autoFocus={!vp.touch}
              disabled={busy}
              enterKeyHint="send"
              autoComplete="off"
              autoCapitalize="sentences"
            />
            <button type="submit" disabled={busy || !input.trim()}>Say</button>
            {options.length > 0 && (
              <button type="button" className="ghost" onClick={() => setShowOptions((s) => !s)}>
                {showOptions ? "Hide" : vp.w < 700 ? "Options" : "What could I do?"}
              </button>
            )}
          </form>
          {showOptions && (
            <ul className="options">
              {options.map((c) => (
                <li key={c.id}>
                  <button onClick={() => choose(c)}>{c.text}</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {phase === "choose" && (
        <section className="choose">
          <ul className="options">
            {options.map((c) => (
              <li key={c.id}>
                <button onClick={() => choose(c)}>{c.text}</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {phase === "end" && (
        <section className="endcard">
          <h2>{scene.title}</h2>
          <p>{scene.narration}</p>
          <p className="meta">Mercy {profile.traits.mercy > 0 ? `+${profile.traits.mercy}` : profile.traits.mercy}</p>
          <a href="/">Return to the library</a>
        </section>
      )}
    </main>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
