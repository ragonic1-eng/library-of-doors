"use client";

// Her Reading: the last page of a book. What the game measured (her ending, mercy, allies, who trusts and fears
// her, how much of the book she found) plus a personality report Lucienne writes once from her choices.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Book, Profile, Reading as ReadingT } from "@/lib/story/types";
import { getCharacter } from "@/lib/story/load";
import { lineId } from "@/lib/story/lines";

// One relic per book goes on the library's reading table (series-bible.md §6).
const RELICS: Record<string, string> = { sand: "A pinch of dream sand", angel_key: "The Angel's key", button_key: "The black button key", stones: "Urim and Thummim" };

export default function Reading({ book, profile, sceneId, onReading, children }: {
  book: Book;
  profile: Profile;
  sceneId: string;
  onReading: (r: ReadingT) => void;
  children: ReactNode; // the end actions
}) {
  const journal = useMemo(() => (profile.journal ?? []).filter((j) => book.scenes[j.scene]), [profile.journal, book]);
  // The ending she reached: the last scene marked as one of the book's endings in her journal.
  const ending = [...journal].reverse().find((j) => book.scenes[j.scene].ending)?.scene ?? sceneId;
  const endings = Object.values(book.scenes).filter((s) => s.ending);
  // v2: the deeper reading (what kind of Dream she is); a reading saved before it is written again once.
  const key = `v2:${ending}:${lineId(journal.map((j) => j.choice ?? "").join("|"))}`;
  const saved = profile.readings?.[book.id];
  const [reading, setReading] = useState<ReadingT | null>(saved?.key === key ? saved : null);
  const visited = new Set((profile.visited ?? []).filter((id) => book.scenes[id]));
  // Endings found add up over every playthrough: the saved reading carries them across "play again".
  const found = [...new Set([...(saved?.found ?? []), ...endings.filter((s) => visited.has(s.id)).map((s) => s.id)])];
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (reading) return;
    let live = true;
    fetch("/api/reading", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: book.id, profile, ending, key }), signal: AbortSignal.timeout(90_000) })
      .then((r) => (r.ok ? (r.json() as Promise<ReadingT>) : Promise.reject(new Error(String(r.status)))))
      .then((r) => { if (live) { setReading(r); onReading({ ...r, found }); } })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
    // Written once per ending and set of choices.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const rel = Object.entries(profile.relations ?? {}).filter(([who]) => getCharacter(book.id, who));
  const nameOf = (who: string) => getCharacter(book.id, who)?.name ?? who;
  const trusted = rel.filter(([, r]) => r.trust > 0).sort((a, b) => b[1].trust - a[1].trust)[0]?.[0];
  const feared = rel.filter(([, r]) => r.fear > 0).sort((a, b) => b[1].fear - a[1].fear)[0]?.[0];
  const total = Object.values(book.scenes).length;
  const seen = visited.size;
  const mercy = profile.traits.mercy;
  const allies = profile.vars?.[book.id]?.allies ?? 0;

  return (
    <section className="reading">
      <p className="reading-kicker">Your Reading · {book.title}</p>
      {reading ? (
        <>
          <h2>{reading.archetype}</h2>
          <p className="reading-tagline">{reading.tagline}</p>
        </>
      ) : (
        <h2 className="reading-wait">{failed ? "The End" : "Lucienne is writing your page…"}</h2>
      )}

      <div className="reading-grid">
        <dl className="reading-facts">
          <div><dt>Your ending</dt><dd>{book.scenes[ending]?.title ?? "The End"}</dd></div>
          <div><dt>Mercy</dt><dd>{mercy > 0 ? `+${mercy}` : mercy} <small>of ±10</small></dd></div>
          {allies > 0 && <div><dt>Allies who came</dt><dd>{allies}</dd></div>}
          {trusted && <div><dt>Trusts you most</dt><dd>{nameOf(trusted)}</dd></div>}
          {feared && <div><dt>Fears you most</dt><dd>{nameOf(feared)}</dd></div>}
          {endings.length > 1 && <div><dt>Endings found</dt><dd>{found.length} of {endings.length}</dd></div>}
          <div><dt>Of the book you found</dt><dd>{Math.round((seen / total) * 100)}% <small>{seen} of {total} scenes</small></dd></div>
          {profile.relics.includes(book.relic) && <div><dt>Relic for the library</dt><dd>{RELICS[book.relic] ?? book.relic}</dd></div>}
        </dl>

        {reading && (
          <ul className="reading-dims">
            {reading.dims.map((d) => (
              <li key={d.name}>
                <div className="dim-head"><span>{d.low}</span><b>{d.name}</b><span>{d.high}</span></div>
                <div className="dim-bar"><i style={{ left: `${d.score}%` }} /></div>
                {d.because && <p>{d.because}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {reading?.dream && (
        <div className="reading-dream">
          <p className="reading-label">What kind of Dream you are</p>
          <h3>{reading.dream.title}</h3>
          {reading.dream.realm && <p className="reading-realm">{reading.dream.realm}</p>}
          {reading.dream.gifts.length > 0 && (
            <>
              <p className="reading-label">The dreams you will give tonight</p>
              <ul className="reading-gifts">
                {reading.dream.gifts.map((g) => (
                  <li key={g.to}>
                    <span className="gift-to">For {g.to}</span>
                    <p>{g.dream}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
          {reading.dream.nightmare && (
            <div className="reading-nightmare">
              <p className="reading-label">Your nightmares</p>
              <p>{reading.dream.nightmare}</p>
            </div>
          )}
        </div>
      )}

      {reading?.depth && (reading.depth.strengths.length > 0 || reading.depth.shadow) && (
        <div className="reading-depth">
          <p className="reading-label">Your light and your shadow</p>
          {reading.depth.strengths.length > 0 && <ul className="reading-strengths">{reading.depth.strengths.map((s) => <li key={s}>{s}</li>)}</ul>}
          <dl>
            {reading.depth.shadow && <div><dt>Your shadow</dt><dd>{reading.depth.shadow}</dd></div>}
            {reading.depth.fears && <div><dt>What you fear</dt><dd>{reading.depth.fears}</dd></div>}
            {reading.depth.love && <div><dt>How you love</dt><dd>{reading.depth.love}</dd></div>}
          </dl>
        </div>
      )}

      {reading && reading.moments.length > 0 && (
        <div className="reading-moments">
          <p className="reading-label">The moments that made you</p>
          {reading.moments.map((m) => <blockquote key={m}>“{m}”</blockquote>)}
        </div>
      )}

      {reading?.letter && <p className="reading-letter">{reading.letter}</p>}

      <div className="endactions">{children}</div>
    </section>
  );
}
