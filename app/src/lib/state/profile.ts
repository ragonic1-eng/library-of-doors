import type { Consequence, Effect, Profile, Requires } from "@/lib/story/types";

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
  if (p.flags[bookId]?.[consequenceFlag(tag)]) return p;
  let next = applyEffect(p, bookId, { ...(c.effects ?? {}), flags: { ...(c.effects?.flags ?? {}), [consequenceFlag(tag)]: true } });
  next = adjustRelation(next, who, c.trust ?? 0, c.fear ?? 0);
  if (c.echo) next = { ...next, echoes: [...(next.echoes ?? []), c.echo] };
  return next;
}

/** Does the profile meet a gate? */
/** Where to go next: the first alternate route her earlier deeds qualify for, else the usual next. */
export function route(p: Profile | null, bookId: string, x: { next?: string; branch?: { requires: Requires; next: string }[] }): string | undefined {
  const alt = p ? x.branch?.find((b) => meets(p, bookId, b.requires)) : undefined;
  return alt?.next ?? x.next;
}

/** Scenes reached in a book, in order of the latest visit (a revisit moves a scene to the end). The Sandman keeps
 *  its original `visited` list so existing saves carry on; later books keep their own list under `visitedBy`. */
export function visitedIn(p: Profile, bookId: string): string[] {
  return bookId === "sandman" ? p.visited ?? [] : p.visitedBy?.[bookId] ?? [];
}

export function markVisited(p: Profile, bookId: string, id: string): Profile {
  const list = [...visitedIn(p, bookId).filter((x) => x !== id), id];
  return bookId === "sandman" ? { ...p, visited: list } : { ...p, visitedBy: { ...(p.visitedBy ?? {}), [bookId]: list } };
}

/** One condition, which may look into another book (how one book remembers another):
 *  "FLAG" this book's flag · "sandman:FLAG" another book's flag · "sandman:@end-A" that scene was reached ·
 *  "sandman:last=end-B|end-A|end-C|end-R" of those scenes, the first listed is the one reached most recently. */
export function flagOn(p: Profile, bookId: string, f: string): boolean {
  const i = f.indexOf(":");
  if (i < 0) return !!p.flags[bookId]?.[f];
  const other = f.slice(0, i), rest = f.slice(i + 1);
  if (rest.startsWith("@")) return visitedIn(p, other).includes(rest.slice(1));
  if (rest.startsWith("last=")) {
    const [want, ...rivals] = rest.slice(5).split("|");
    const seen = visitedIn(p, other);
    const at = seen.lastIndexOf(want);
    return at >= 0 && rivals.every((r) => seen.lastIndexOf(r) < at);
  }
  return !!p.flags[other]?.[rest];
}

export function meets(p: Profile, bookId: string, r?: Requires): boolean {
  if (!r) return true;
  if (r.traits && Object.entries(r.traits).some(([t, v]) => (p.traits[t as keyof Profile["traits"]] ?? 0) < (v ?? 0))) return false;
  if (r.flags?.some((f) => !flagOn(p, bookId, f))) return false;
  if (r.notFlags?.some((f) => flagOn(p, bookId, f))) return false;
  if (r.vars && Object.entries(r.vars).some(([k, min]) => (p.vars[bookId]?.[k] ?? 0) < min)) return false;
  if (r.relation && Object.entries(r.relation).some(([who, m]) => {
    const rel = relationOf(p, who);
    return (m.trust != null && rel.trust < m.trust) || (m.fear != null && rel.fear < m.fear);
  })) return false;
  return true;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
