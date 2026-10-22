"use client";

import { useEffect, useRef } from "react";
import type { Fx } from "@/lib/story/types";

/** Ambient motion drawn over the picture, so a still image feels filmed and a held frame never looks frozen.
 *  Cheap: one canvas, a few dozen particles, paused when the tab is hidden, off for reduced-motion users. */
interface P { x: number; y: number; vx: number; vy: number; r: number; a: number; t: number }

const SPEC: Record<Exclude<Fx, "flicker">, { n: number; make: (w: number, h: number, init: boolean) => P; draw: (c: CanvasRenderingContext2D, p: P) => void }> = {
  rain: {
    n: 140,
    make: (w, h, init) => ({ x: Math.random() * w * 1.2, y: init ? Math.random() * h : -20, vx: -1.2, vy: 14 + Math.random() * 8, r: 10 + Math.random() * 12, a: 0.18 + Math.random() * 0.2, t: 0 }),
    draw: (c, p) => { c.strokeStyle = `rgba(200,210,230,${p.a})`; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.vx * 1.4, p.y + p.r); c.stroke(); },
  },
  embers: {
    n: 45,
    make: (w, h, init) => ({ x: Math.random() * w, y: init ? Math.random() * h : h + 10, vx: (Math.random() - 0.5) * 0.6, vy: -(0.6 + Math.random() * 1.4), r: 1 + Math.random() * 2.2, a: 0.5 + Math.random() * 0.5, t: Math.random() * 6 }),
    draw: (c, p) => { c.fillStyle = `rgba(255,${120 + Math.floor(Math.random() * 60)},40,${p.a * (0.6 + 0.4 * Math.sin(p.t * 3))})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill(); },
  },
  ash: {
    n: 60,
    make: (w, h, init) => ({ x: Math.random() * w, y: init ? Math.random() * h : -10, vx: (Math.random() - 0.5) * 0.5, vy: 0.4 + Math.random() * 0.8, r: 1 + Math.random() * 2.5, a: 0.25 + Math.random() * 0.35, t: Math.random() * 6 }),
    draw: (c, p) => { c.fillStyle = `rgba(190,185,180,${p.a})`; c.fillRect(p.x, p.y, p.r, p.r * 0.7); },
  },
  snow: {
    n: 80,
    make: (w, h, init) => ({ x: Math.random() * w, y: init ? Math.random() * h : -10, vx: (Math.random() - 0.5) * 0.6, vy: 0.6 + Math.random() * 1.1, r: 1 + Math.random() * 2.5, a: 0.5 + Math.random() * 0.4, t: Math.random() * 6 }),
    draw: (c, p) => { c.fillStyle = `rgba(255,255,255,${p.a})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill(); },
  },
  dust: {
    n: 40,
    make: (w, h) => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.2, r: 0.8 + Math.random() * 1.8, a: 0.15 + Math.random() * 0.3, t: Math.random() * 6 }),
    draw: (c, p) => { c.fillStyle = `rgba(255,240,210,${p.a * (0.6 + 0.4 * Math.sin(p.t))})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill(); },
  },
  glitter: {
    n: 50,
    make: (w, h) => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.2, vy: -0.15 - Math.random() * 0.25, r: 0.8 + Math.random() * 1.6, a: 0.8, t: Math.random() * 6 }),
    draw: (c, p) => {
      const tw = Math.max(0, Math.sin(p.t * 2.2));
      c.fillStyle = `rgba(255,225,150,${0.75 * tw})`;
      c.beginPath(); c.arc(p.x, p.y, p.r * (0.6 + tw), 0, 6.283); c.fill();
    },
  },
  mist: {
    n: 9,
    make: (w, h) => ({ x: Math.random() * w, y: h * (0.55 + Math.random() * 0.45), vx: 0.15 + Math.random() * 0.25, vy: 0, r: 160 + Math.random() * 220, a: 0.05 + Math.random() * 0.06, t: 0 }),
    draw: (c, p) => {
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(210,220,235,${p.a})`); g.addColorStop(1, "rgba(210,220,235,0)");
      c.fillStyle = g; c.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    },
  },
};

export default function Ambience({ fx }: { fx?: Fx }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !fx || fx === "flicker") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const spec = SPEC[fx];
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, last = performance.now();
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ps = Array.from({ length: spec.n }, () => spec.make(w, h, true));
    const tick = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.7);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.t += 0.02 * dt;
        if (p.y > h + 30 || p.y < -40 || p.x < -260 || p.x > w + 260) ps[i] = spec.make(w, h, false);
        spec.draw(ctx, ps[i]);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [fx]);
  if (!fx) return null;
  if (fx === "flicker") return <div className="fx-flicker" aria-hidden="true" />;
  return <canvas ref={ref} className="fx" aria-hidden="true" />;
}
