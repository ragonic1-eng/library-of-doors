"use client";

import { useEffect, useRef, useState } from "react";

/** A character's loop that never flashes the scene through: when the mood changes, the new loop starts on top of
 *  the old one, and the old one is removed only once the new one is actually playing. `paused` holds the current
 *  frame (a character with only a talking loop stays on screen, still, between lines instead of vanishing). */
export default function ReactLoop({ src, className = "", paused = false, onMissing }: {
  src: string; className?: string; paused?: boolean; onMissing: (src: string) => void;
}) {
  const [cur, setCur] = useState(src);
  const [prev, setPrev] = useState<string | null>(null);
  if (src !== cur) { setPrev(cur); setCur(src); } // adjust during render: the outgoing loop stays underneath
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (paused) v.pause(); else void v.play().catch(() => undefined);
  }, [paused, cur]);
  return (
    <>
      {prev && <video key={prev} className={`film react ${className} under`} src={prev} autoPlay loop muted playsInline />}
      <video
        key={cur}
        ref={ref}
        className={`film react ${className} ${prev ? "swap" : ""}`}
        src={cur}
        autoPlay={!paused}
        loop
        muted
        playsInline
        onPlaying={() => setPrev(null)}
        onError={() => { setPrev(null); onMissing(cur); }}
      />
    </>
  );
}
