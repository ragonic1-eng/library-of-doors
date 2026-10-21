import type { Book, Choice, Consequence, Effect, Profile, Requires } from "@/lib/story/types";

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
    relations: {},
    echoes: [],
    playerModel: {},
    position: null,
    decisions: {},
    journal: [],
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

export function saveProfile(p: Profile): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
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

export function relationOf(p: Profile, who: string) {
  return p.relations?.[who] ?? { trust: 0, fear: 0 };
}

export function adjustRelation(p: Profile, who: string, trust = 0, fear = 0): Profile {
  if (!trust && !fear) return p;
  const r = relationOf(p, who);
  return {
    ...p,
    relations: { ...(p.relations ?? {}), [who]: { trust: clamp(r.trust + trust, -5, 5), fear: clamp(r.fear + fear, -5, 5) } },
  };
}

/** Flag name recording that a consequence already fired (each fires at most once per playthrough). */
export const consequenceFlag = (tag: string) => `C_${tag}`;

/** Apply one fired consequence: its effects, the speaker's feelings, its echo, and its one-time flag. */
export function applyConsequence(p: Profile, bookId: string, who: string, tag: string, c: Consequence): Profile {
  if (p.flags[bookId]?.[consequenceFlag(tag)] || !meets(p, bookId, c.requires)) return p;
  let next = applyEffect(p, bookId, { ...(c.effects ?? {}), flags: { ...(c.effects?.flags ?? {}), [consequenceFlag(tag)]: true } });
  next = adjustRelation(next, who, c.trust ?? 0, c.fear ?? 0);
  if (c.echo) next = { ...next, echoes: [...(next.echoes ?? []), c.echo] };
  if (c.ripple) next = addJournal(next, `${bookId}:consequence:${tag}`, "The Dreaming remembers", c.ripple);
  return next;
}

export function addJournal(p: Profile, id: string, title: string, text: string): Profile {
  if (p.journal.some((entry) => entry.id === id)) return p;
  return { ...p, journal: [...p.journal, { id, title, text }] };
}

/** Save arrival and completion together, including when resuming an older save. */
export function arrive(p: Profile, book: Book, sceneId: string): Profile {
  const scene = book.scenes[sceneId];
  if (!scene) return p;
  const completed = scene.completes && !p.completed.includes(scene.completes)
    ? [...p.completed, scene.completes] : p.completed;
  return { ...p, completed, position: { book: book.id, scene: sceneId } };
}

/** Effects, journal and destination are one save; double clicks/reloads cannot farm traits. */
export function commitChoice(p: Profile, book: Book, sceneId: string, choice: Choice): Profile {
  const scene = book.scenes[sceneId];
  const key = `${book.id}:${sceneId}`;
  if (!scene?.choices?.some((c) => c.id === choice.id) || !book.scenes[choice.next]
      || p.decisions[key] || !meets(p, book.id, choice.requires)) return p;
  let next = applyEffect(p, book.id, choice.effects);
  for (const extra of choice.effectsIf ?? []) {
    if (p.flags[book.id]?.[extra.flag]) {
      next = applyEffect(next, book.id, extra.effects);
      if (extra.ripple) next = addJournal(next, `${key}:${extra.flag}`, scene.title, extra.ripple);
    }
  }
  next = addJournal(next, key, scene.title, choice.journal ?? choice.text);
  return arrive({ ...next, decisions: { ...next.decisions, [key]: choice.id } }, book, choice.next);
}

/** Does the profile meet a gate? */
export function meets(p: Profile, bookId: string, r?: Requires): boolean {
  if (!r) return true;
  const flags = p.flags[bookId] ?? {};
  if (r.traits && Object.entries(r.traits).some(([t, v]) => (p.traits[t as keyof Profile["traits"]] ?? 0) < (v ?? 0))) return false;
  if (r.flags?.some((f) => !flags[f])) return false;
  if (r.notFlags?.some((f) => flags[f])) return false;
  if (r.relation && Object.entries(r.relation).some(([who, m]) => {
    const rel = relationOf(p, who);
    return (m.trust != null && rel.trust < m.trust) || (m.fear != null && rel.fear < m.fear);
  })) return false;
  return true;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

