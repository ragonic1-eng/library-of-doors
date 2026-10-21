import type { Effect, Profile } from "@/lib/story/types";

const KEY = "library-of-doors.profile.v1";

export function newProfile(name = "Aurie"): Profile {
  return {
    name,
    traits: { mercy: 0, loyalty: 0, courage: 0, faith: 0 },
    relics: [],
    completed: [],
    flags: {},
    vars: {},
    memory: [],
    playerModel: {},
    position: null,
  };
}

export function loadProfile(): Profile {
  if (typeof window === "undefined") return newProfile();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...newProfile(), ...(JSON.parse(raw) as Profile) };
  } catch {
    /* storage unavailable: play from a fresh profile */
  }
  return newProfile();
}

export function saveProfile(p: Profile) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function applyEffect(p: Profile, bookId: string, e: Effect | undefined): Profile {
  if (!e) return p;
  const next: Profile = structuredClone(p);
  for (const [t, d] of Object.entries(e.traits ?? {})) {
    const k = t as keyof Profile["traits"];
    next.traits[k] = clamp(next.traits[k] + (d ?? 0), -10, 10);
  }
  if (e.flags) next.flags[bookId] = { ...(next.flags[bookId] ?? {}), ...e.flags };
  if (e.vars) {
    const v = { ...(next.vars[bookId] ?? {}) };
    for (const [k, d] of Object.entries(e.vars)) v[k] = (v[k] ?? 0) + d;
    next.vars[bookId] = v;
  }
  if (e.relic && !next.relics.includes(e.relic)) next.relics.push(e.relic);
  return next;
}

export function remember(p: Profile, note: string | null | undefined): Profile {
  if (!note) return p;
  const memory = [...p.memory, note].slice(-60);
  return { ...p, memory };
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
