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
  // Hell: glowing embers drifting up (the bursts and the heat glow are drawn in EXTRA below)
  sparks: {
    n: 38,
    make: (w, h, init) => ({ x: Math.random() * w, y: init ? h * (0.2 + Math.random() * 0.8) : h + 10, vx: (Math.random() - 0.5) * 0.9, vy: -(0.8 + Math.random() * 1.8), r: 0.8 + Math.random() * 1.8, a: 0.6 + Math.random() * 0.4, t: Math.random() * 6 }),
    draw: (c, p) => {
      const f = p.a * (0.55 + 0.45 * Math.sin(p.t * 4));
      c.fillStyle = `rgba(255,100,30,${f * 0.22})`; c.beginPath(); c.arc(p.x, p.y, p.r * 3.4, 0, 6.283); c.fill();
      c.fillStyle = `rgba(255,${200 + Math.floor(40 * Math.sin(p.t * 7))},130,${f})`; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
    },
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
  // Ice: tiny crystals that drift and glint (the icy mist and frosted edges are drawn in EXTRA below)
  frost: {
    n: 46,
    make: (w, h, init) => ({ x: Math.random() * w, y: init ? Math.random() * h : -10, vx: (Math.random() - 0.5) * 0.35, vy: 0.12 + Math.random() * 0.3, r: 1.5 + Math.random() * 2.8, a: 0.8, t: Math.random() * 6 }),
    draw: (c, p) => {
      const tw = Math.max(0.15, Math.sin(p.t * 1.7));
      c.strokeStyle = `rgba(225,242,255,${0.75 * tw})`; c.lineWidth = 0.8;
      const r = p.r * (0.5 + tw);
      c.beginPath(); c.moveTo(p.x - r, p.y); c.lineTo(p.x + r, p.y); c.moveTo(p.x, p.y - r); c.lineTo(p.x, p.y + r); c.stroke();
    },
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

/** Layers some effects draw under and over their particles. `dt` is in 60 fps frames, `ms` the clock. */
type Extra = { under?: (c: CanvasRenderingContext2D, w: number, h: number, ms: number, dt: number) => void; over?: (c: CanvasRenderingContext2D, w: number, h: number, dt: number) => void };

const EXTRA: Partial<Record<Fx, () => Extra>> = {
  // Hell: a heat glow breathing up from below, and sparks that burst out of nowhere every second or two.
  sparks: () => {
    let bits: { x: number; y: number; vx: number; vy: number; life: number; max: number }[] = [];
    let flashes: { x: number; y: number; life: number }[] = [];
    let wait = 30;
    return {
      under: (c, w, h, ms) => {
        const heat = 0.13 + 0.05 * Math.sin(ms / 700) + 0.03 * Math.sin(ms / 230);
        const g = c.createLinearGradient(0, h, 0, h * 0.5);
        g.addColorStop(0, `rgba(255,70,15,${heat})`); g.addColorStop(1, "rgba(255,70,15,0)");
        c.globalCompositeOperation = "screen"; c.fillStyle = g; c.fillRect(0, h * 0.5, w, h * 0.5);
        c.globalCompositeOperation = "source-over";
      },
      over: (c, w, h, dt) => {
        wait -= dt;
        if (wait <= 0) {
          wait = 30 + Math.random() * 115;
          const x = w * (0.08 + Math.random() * 0.84), y = h * (0.5 + Math.random() * 0.45);
          flashes.push({ x, y, life: 0 });
          for (let k = 8 + Math.floor(Math.random() * 12); k > 0; k--) {
            const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, sp = 1.5 + Math.random() ** 1.5 * 7;
            bits.push({ x: x + (Math.random() - 0.5) * 18, y: y + (Math.random() - 0.5) * 10, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: Math.random() * 8, max: 30 + Math.random() * 55 });
          }
        }
        bits = bits.filter((s) => s.life < s.max);
        flashes = flashes.filter((f) => f.life < 14);
        c.globalCompositeOperation = "lighter"; c.lineCap = "round";
        for (const f of flashes) {
          f.life += dt;
          const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, 46);
          g.addColorStop(0, `rgba(255,170,60,${0.4 * (1 - f.life / 14)})`); g.addColorStop(1, "rgba(255,170,60,0)");
          c.fillStyle = g; c.fillRect(f.x - 46, f.y - 46, 92, 92);
        }
        for (const s of bits) {
          s.life += dt; s.vx *= 0.985 ** dt; s.vy = s.vy * 0.985 ** dt + 0.09 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
          const k = 1 - s.life / s.max;
          c.strokeStyle = `rgba(255,${Math.floor(110 + 130 * k)},${Math.floor(70 * k)},${k})`;
          c.lineWidth = 1 + 1.8 * k;
          c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - s.vx * 3, s.y - s.vy * 3); c.stroke();
        }
        c.globalCompositeOperation = "source-over";
      },
    };
  },
  // Ice: frosted edges that slowly breathe, and banks of cold mist drifting across the whole frame.
  frost: () => {
    let wisps: { x: number; y: number; vx: number; r: number; a: number; t: number }[] = [];
    return {
      under: (c, w, h, ms, dt) => {
        if (!wisps.length) wisps = Array.from({ length: 10 }, () => ({ x: Math.random() * w, y: h * (0.15 + Math.random() * 0.85), vx: (Math.random() < 0.5 ? -1 : 1) * (0.12 + Math.random() * 0.22), r: 180 + Math.random() * 260, a: 0.16 + Math.random() * 0.14, t: Math.random() * 6 }));
        const m = Math.max(w, h), edge = 0.42 + 0.1 * Math.sin(ms / 1500);
        const v = c.createRadialGradient(w / 2, h / 2, m * 0.32, w / 2, h / 2, m * 0.75);
        v.addColorStop(0, "rgba(200,225,255,0)"); v.addColorStop(1, `rgba(200,225,255,${edge})`);
        c.globalCompositeOperation = "screen"; c.fillStyle = v; c.fillRect(0, 0, w, h);
        for (const p of wisps) {
          p.x += p.vx * dt; p.t += 0.01 * dt;
          if (p.x < -p.r) p.x = w + p.r; else if (p.x > w + p.r) p.x = -p.r;
          c.save(); c.translate(p.x, p.y); c.scale(1, 0.42);
          const g = c.createRadialGradient(0, 0, 0, 0, 0, p.r);
          const a = p.a * (0.7 + 0.3 * Math.sin(p.t));
          g.addColorStop(0, `rgba(205,228,250,${a})`); g.addColorStop(1, "rgba(205,228,250,0)");
          c.fillStyle = g; c.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
          c.restore();
        }
        c.globalCompositeOperation = "source-over";
      },
    };
  },
};

export default function Ambience({ fx }: { fx?: Fx }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !fx || fx === "flicker") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const spec = SPEC[fx];
    const extra = EXTRA[fx]?.();
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
      extra?.under?.(ctx, w, h, now, dt);
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.t += 0.02 * dt;
        if (p.y > h + 30 || p.y < -40 || p.x < -260 || p.x > w + 260) ps[i] = spec.make(w, h, false);
        spec.draw(ctx, ps[i]);
      }
      extra?.over?.(ctx, w, h, dt);
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
