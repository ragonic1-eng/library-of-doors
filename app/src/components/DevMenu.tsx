"use client";
// Developer menu (owner only, code-locked): a map of every scene and branch, and a storyboard of each scene
// with the exact picture or video under every line, so the story can be audited and jumped into by hand.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Beat, Book, Scene } from "@/lib/story/types";
import { listAllBooks } from "@/lib/story/load";

// SHA-256 of "lod-dev:" + the owner's code. The code itself is never stored in the game.
const CODE_HASH = "c58a2f5553e69f751f1b3b8253968cac9fe7be06594b90c52962f9b497f7dac4";
const UNLOCK_KEY = "lod.devUnlocked"; // this browser session only

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface Props {
  book: Book;
  current: string;
  clipUrl: (id: string) => string;
  stillUrl: (id: string) => string;
  onPlay: (sceneId: string) => void;
  onClose: () => void;
}

/** Everything a scene can lead to: its choices' targets and its plain next. */
function targets(sc: Scene) {
  const out = (sc.choices ?? []).flatMap((c) => [{ to: c.next, label: c.text, id: c.id }, ...(c.branch ?? []).map((b) => ({ to: b.next, label: `${c.text} (branch)`, id: `${c.id}~${b.next}` }))]);
  if (sc.next) out.push({ to: sc.next, label: "continue", id: "next" });
  for (const b of sc.branch ?? []) out.push({ to: b.next, label: "branch", id: `branch~${b.next}` });
  return out;
}

function allBeats(sc: Scene): Beat[] {
  return [...sc.beats, ...(sc.choices ?? []).flatMap((c) => c.aftermath ?? [])];
}

export default function DevMenu(props: Props) {
  // Only ever rendered after a tap in the game, so the browser's session storage is there to read.
  const [unlocked, setUnlocked] = useState(() => { try { return sessionStorage.getItem(UNLOCK_KEY) === "1"; } catch { return false; } });
  return unlocked ? <DevBooks {...props} /> : <Lock onUnlock={() => { try { sessionStorage.setItem(UNLOCK_KEY, "1"); } catch { /* ignore */ } setUnlocked(true); }} onClose={props.onClose} />;
}

/** The menu can show any book's map, including one still being planned; the one being played is the default. */
function DevBooks(props: Props) {
  const books = listAllBooks();
  const [bookId, setBookId] = useState(props.book.id);
  const book = books.find((b) => b.id === bookId) ?? props.book;
  const own = book.id === props.book.id;
  // Media URLs are built for the book being played; another book's live in its own folder.
  const swap = (u: string) => (own ? u : u.replace(`/${props.book.id}/`, `/${book.id}/`));
  return (
    <DevMap
      key={book.id}
      book={book}
      current={own ? props.current : ""}
      clipUrl={(id) => swap(props.clipUrl(id))}
      stillUrl={(id) => swap(props.stillUrl(id))}
      onPlay={own ? props.onPlay : undefined}
      onClose={props.onClose}
      books={books}
      onSwitch={setBookId}
    />
  );
}

function Lock({ onUnlock, onClose }: { onUnlock: () => void; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const press = async (d: string) => {
    const next = (code + d).slice(0, 6);
    setCode(next);
    setWrong(false);
    if (next.length === 6) {
      if ((await sha256("lod-dev:" + next)) === CODE_HASH) onUnlock();
      else { setWrong(true); setCode(""); }
    }
  };
  return (
    <div className="dev-lock" role="dialog" aria-label="Developer menu locked">
      <div className="dev-lock-card">
        <h2>Developer</h2>
        <p className={wrong ? "dev-wrong" : ""}>{wrong ? "Wrong code. Try again." : "Enter the 6-digit code"}</p>
        <div className="dev-dots" aria-live="polite">{[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={i < code.length ? "on" : ""} />)}</div>
        <div className="dev-pad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => <button key={d} onClick={() => void press(d)}>{d}</button>)}
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button onClick={() => void press("0")}>0</button>
          <button className="ghost" onClick={() => setCode(code.slice(0, -1))} aria-label="Delete">⌫</button>
        </div>
      </div>
    </div>
  );
}

type MapProps = Omit<Props, "onPlay"> & { onPlay?: (sceneId: string) => void; books: Book[]; onSwitch: (id: string) => void };

function DevMap({ book, current, clipUrl, stillUrl, onPlay, onClose, books, onSwitch }: MapProps) {
  // Story order: follow the branches from the start (depth first), so a scene sits beside the scenes it follows
  // even when it was added at the end of the book file; anything unreachable comes last.
  // Each scene sits in the chapter of the scene that first leads into it, unless it opens a chapter itself.
  const { order, columns } = useMemo(() => {
    const seen = new Set<string>(), out: string[] = [];
    const chapter: Record<string, string> = {};
    const stack: [string, string | null][] = [[book.start, null]];
    while (stack.length) {
      const [id, parent] = stack.pop()!;
      if (seen.has(id) || !book.scenes[id]) continue;
      seen.add(id);
      out.push(id);
      chapter[id] = book.scenes[id].episodeTitle || !parent ? id : chapter[parent];
      stack.push(...targets(book.scenes[id]).map((t) => [t.to, id] as [string, string]).reverse());
    }
    const lost = Object.keys(book.scenes).filter((id) => !seen.has(id));
    const cols = new Map<string, { title: string; ids: string[] }>();
    for (const id of out) {
      const head = chapter[id];
      if (!cols.has(head)) cols.set(head, { title: book.scenes[head].episodeTitle ?? "Opening", ids: [] });
      cols.get(head)!.ids.push(id);
    }
    // Columns in chapter-number order (an alternate Chapter 26 sits beside the main one); the prologue first.
    const num = (t: string) => Number(t.match(/Chapter (\d+)/)?.[1] ?? 0);
    const sorted = [...cols.values()].sort((a, b) => num(a.title) - num(b.title));
    if (lost.length) sorted.push({ title: "Not reachable", ids: lost });
    return { order: [...out, ...lost], columns: sorted };
  }, [book]);
  const incoming = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const id of order) for (const t of targets(book.scenes[id])) if (!(m[t.to] ??= []).includes(id)) m[t.to].push(id);
    return m;
  }, [order, book]);

  const [sel, setSel] = useState(current in book.scenes ? current : book.start);
  const [view, setView] = useState<"map" | "board">("map");
  const [q, setQ] = useState("");
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return null;
    return new Set(order.filter((id) => {
      const sc = book.scenes[id];
      return id.toLowerCase().includes(s) || sc.title.toLowerCase().includes(s) || allBeats(sc).some((b) => b.text?.toLowerCase().includes(s));
    }));
  }, [q, order, book]);

  const open = (id: string, toBoard = true) => { setSel(id); if (toBoard) setView("board"); };

  return (
    <div className="dev" role="dialog" aria-label="Developer menu">
      <header className="dev-bar">
        <strong>Developer</strong>
        {books.length > 1 && (
          <select className="dev-book" value={book.id} onChange={(e) => onSwitch(e.target.value)} aria-label="Book">
            {books.map((b) => <option key={b.id} value={b.id}>{b.title}{b.status === "planning" ? " (planning)" : ""}</option>)}
          </select>
        )}
        <div className="dev-tabs">
          <button className={view === "map" ? "on" : ""} onClick={() => setView("map")}>Map</button>
          <button className={view === "board" ? "on" : ""} onClick={() => setView("board")}>Storyboard · {sel}</button>
        </div>
        <input className="dev-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find scene, title or line" />
        <button className="dev-close" onClick={onClose} aria-label="Close developer menu">✕</button>
      </header>
      {view === "map"
        ? <MapView book={book} columns={columns} incoming={incoming} sel={sel} current={current} hits={hits} onSelect={(id) => open(id, false)} onOpen={(id) => open(id)} />
        : <Board book={book} id={sel} incoming={incoming[sel] ?? []} clipUrl={clipUrl} stillUrl={stillUrl} onOpen={open} onPlay={onPlay} planning={book.status === "planning"} />}
    </div>
  );
}

function badges(sc: Scene) {
  const b = allBeats(sc);
  return {
    clips: b.filter((x) => x.clip).length,
    stills: b.filter((x) => x.still).length,
    lines: b.filter((x) => x.text).length,
    talk: !!sc.conversation,
    choices: sc.choices?.length ?? 0,
    end: sc.type === "end",
    dead: !!sc.retryFrom,
  };
}

function MapView({ book, columns, incoming, sel, current, hits, onSelect, onOpen }: {
  book: Book; columns: { title: string; ids: string[] }[]; incoming: Record<string, string[]>; sel: string; current: string;
  hits: Set<string> | null; onSelect: (id: string) => void; onOpen: (id: string) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLButtonElement>());
  const [lines, setLines] = useState<{ from: string; to: string; d: string }[]>([]);
  // Draw the branches between the cards once they are laid out (and again when the window changes size).
  useLayoutEffect(() => {
    const draw = () => {
      const box = wrap.current?.getBoundingClientRect();
      if (!box || !wrap.current) return;
      const sx = wrap.current.scrollLeft, sy = wrap.current.scrollTop;
      const out: { from: string; to: string; d: string }[] = [];
      for (const [from, el] of nodes.current) {
        const a = el.getBoundingClientRect();
        for (const t of targets(book.scenes[from])) {
          const bEl = nodes.current.get(t.to);
          if (!bEl) continue;
          const b = bEl.getBoundingClientRect();
          const x1 = a.right - box.left + sx, y1 = a.top + a.height / 2 - box.top + sy;
          const x2 = b.left - box.left + sx, y2 = b.top + b.height / 2 - box.top + sy;
          const back = x2 < x1; // a branch that returns to an earlier chapter loops round
          const bend = back ? 80 : Math.max(30, (x2 - x1) / 2);
          out.push({ from, to: t.to, d: `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}` });
        }
      }
      setLines(out);
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [book, columns]);
  // Bring the selected (or current) scene into view when the map opens.
  useEffect(() => { nodes.current.get(sel)?.scrollIntoView({ block: "center", inline: "center" }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const near = new Set([sel, ...(incoming[sel] ?? []), ...targets(book.scenes[sel]).map((t) => t.to)]);
  return (
    <div className="dev-map" ref={wrap}>
      <svg className="dev-edges" aria-hidden="true">
        {lines.map((l, i) => {
          const cls = l.from === sel ? "out" : l.to === sel ? "in" : "";
          return <path key={i} d={l.d} className={cls ? `dev-e-${cls}` : undefined} markerEnd={cls ? `url(#arrow-${cls})` : undefined} />;
        })}
        <defs>
          <marker id="arrow-out" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#c9a24a" /></marker>
          <marker id="arrow-in" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#6fa8dc" /></marker>
        </defs>
      </svg>
      {columns.map((col) => (
        <section key={col.title + col.ids[0]} className="dev-col">
          <h3>{col.title}</h3>
          {col.ids.map((id) => {
            const sc = book.scenes[id];
            const b = badges(sc);
            const dim = (hits && !hits.has(id)) || (!hits && sel && !near.has(id));
            return (
              <button
                key={id}
                ref={(el) => { if (el) nodes.current.set(id, el); else nodes.current.delete(id); }}
                className={`dev-node ${id === sel ? "dev-sel" : ""} ${id === current ? "dev-here" : ""} ${b.end ? "dev-k-end" : b.talk ? "dev-k-talk" : b.choices > 1 ? "dev-k-branch" : ""} ${dim ? "dev-dim" : ""}`}
                onClick={() => (id === sel ? onOpen(id) : onSelect(id))}
                title={id === sel ? "Tap again to open the storyboard" : sc.title}
              >
                <span className="dev-id">{id}{id === current ? " · you are here" : ""}</span>
                <span className="dev-title">{sc.title}</span>
                <span className="dev-badges">
                  {b.clips > 0 && <i>🎬{b.clips}</i>}
                  {b.stills > 0 && <i>🖼{b.stills}</i>}
                  {b.talk && <i>💬</i>}
                  {b.choices > 1 && <i>⑂{b.choices}</i>}
                  {b.end && <i>{b.dead ? "DEAD END" : "END"}</i>}
                </span>
              </button>
            );
          })}
        </section>
      ))}
    </div>
  );
}

function Cond({ b }: { b: Beat }) {
  return (
    <>
      {b.if?.map((f) => <span key={f} className="dev-chip if">if {f}</span>)}
      {b.unless?.map((f) => <span key={f} className="dev-chip unless">unless {f}</span>)}
      {b.sfx && <span className="dev-chip">sfx {b.sfx}</span>}
      {b.ambience && <span className="dev-chip">ambience {b.ambience}</span>}
      {b.fx && <span className="dev-chip">fx {b.fx}</span>}
      {b.cast && <span className={`dev-chip ${b.cast.includes("aurie") ? "if" : ""}`}>{b.cast.length ? b.cast.join(", ") : "nobody in frame"}</span>}
    </>
  );
}

/** One beat: the picture or video on screen (inherited when the beat names none) beside its line.
 *  In a planning skeleton the pictures do not exist yet, so the slot is shown as a labelled frame instead. */
function BeatRow({ b, pic, n, clipUrl, stillUrl, planning }: { b: Beat; pic: { kind: "clip" | "still"; id: string } | null; n: number; clipUrl: (id: string) => string; stillUrl: (id: string) => string; planning?: boolean }) {
  const own = !!(b.clip || b.still);
  return (
    <li className={`dev-beat ${own ? "" : "dev-held"}`}>
      <div className="dev-thumb">
        {planning && pic && <div className={`dev-slot ${pic.kind}`}>{pic.kind === "clip" ? "video" : "still"}</div>}
        {/* eslint-disable-next-line @next/next/no-img-element -- plain thumbnails from the media store */}
        {!planning && pic?.kind === "still" && <img src={stillUrl(pic.id)} alt="" loading="lazy" />}
        {!planning && pic?.kind === "clip" && <video src={`${clipUrl(pic.id)}#t=1`} preload="metadata" muted playsInline onClick={(e) => { const v = e.currentTarget; if (v.paused) { v.currentTime = 0; void v.play(); } else v.pause(); }} />}
        {pic && <span className="dev-picid">{pic.kind === "clip" ? "🎬" : "🖼"} {pic.id}{own ? "" : " (held)"}</span>}
      </div>
      <div className="dev-line">
        <span className="dev-n">{n}</span>
        {b.card && <p className="dev-card">{b.card}</p>}
        {b.text && <p className={b.style === "hook" ? "dev-hook" : ""}>{b.text}</p>}
        {!b.text && !b.card && <p className="dev-silent">(no narration)</p>}
        <div><Cond b={b} /></div>
      </div>
    </li>
  );
}

function BeatList({ beats, start, clipUrl, stillUrl, planning }: { beats: Beat[]; start: { kind: "clip" | "still"; id: string } | null; clipUrl: (id: string) => string; stillUrl: (id: string) => string; planning?: boolean }) {
  // The picture on screen during each beat: its own, or the last one named before it.
  const pics = beats.reduce<({ kind: "clip" | "still"; id: string } | null)[]>((acc, b) => {
    const prev = acc.length ? acc[acc.length - 1] : start;
    acc.push(b.clip ? { kind: "clip", id: b.clip } : b.still ? { kind: "still", id: b.still } : prev);
    return acc;
  }, []);
  return (
    <ol className="dev-beats">
      {beats.map((b, i) => <BeatRow key={i} b={b} pic={pics[i]} n={i + 1} clipUrl={clipUrl} stillUrl={stillUrl} planning={planning} />)}
    </ol>
  );
}

function lastPic(beats: Beat[]) {
  let pic: { kind: "clip" | "still"; id: string } | null = null;
  for (const b of beats) { if (b.clip) pic = { kind: "clip", id: b.clip }; else if (b.still) pic = { kind: "still", id: b.still }; }
  return pic;
}

function GoTo({ to, book, onOpen }: { to: string; book: Book; onOpen: (id: string) => void }) {
  return <button key={to} className="dev-goto" onClick={() => onOpen(to)}>{to} · {book.scenes[to]?.title ?? "missing!"}</button>;
}

function Board({ book, id, incoming, clipUrl, stillUrl, onOpen, onPlay, planning }: {
  book: Book; id: string; incoming: string[]; clipUrl: (id: string) => string; stillUrl: (id: string) => string;
  onOpen: (id: string) => void; onPlay?: (id: string) => void; planning?: boolean;
}) {
  const sc = book.scenes[id];
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => { top.current?.scrollTo({ top: 0 }); }, [id]);
  const end = lastPic(sc.beats);
  return (
    <div className="dev-board" ref={top}>
      <div className="dev-head">
        <div>
          <h2>{id} · {sc.title}</h2>
          <p className="dev-meta">
            {sc.episodeTitle && <span>{sc.episodeTitle}</span>}
            {sc.music && <span>music {sc.music}</span>}
            {sc.ambience && <span>ambience {sc.ambience}</span>}
            {sc.fx && <span>fx {sc.fx}</span>}
            {sc.type === "end" && <span>END</span>}
            {planning && <span>planning skeleton: picture slots, not final words</span>}
          </p>
          <p className="dev-from">Comes from: {incoming.length ? incoming.map((f) => <GoTo key={f} to={f} book={book} onOpen={onOpen} />) : <em>nothing (start or orphan)</em>}</p>
        </div>
        {onPlay ? <button className="primary dev-play" onClick={() => onPlay(id)}>▶ Play from here</button> : planning ? <span className="dev-chip">not playable yet</span> : <a className="primary dev-play" href={`/play/${book.id}`}>Open this book</a>}
      </div>
      <BeatList beats={sc.beats} start={null} clipUrl={clipUrl} stillUrl={stillUrl} planning={planning} />
      {sc.conversation && (
        <div className="dev-talk">
          <h3>💬 Live talk with {sc.conversation.character} · up to {sc.conversation.maxTurns ?? "?"} turns</h3>
          {sc.conversation.opening && <p className="dev-opening">“{sc.conversation.opening}”</p>}
          {sc.conversation.suggestions?.length ? <p className="dev-sugg">Ideas: {sc.conversation.suggestions.map((s) => <span key={s} className="dev-chip">{s}</span>)}</p> : null}
        </div>
      )}
      {(sc.choices ?? []).map((c) => (
        <div key={c.id} className="dev-choice">
          <h3>⑂ {c.id}: “{c.text}” <GoTo to={c.next} book={book} onOpen={onOpen} />{(c.branch ?? []).map((b) => <span key={b.next} className="dev-chip if">or if {JSON.stringify(b.requires)} → <GoTo to={b.next} book={book} onOpen={onOpen} /></span>)}</h3>
          {c.requires && <p className="dev-req">requires {JSON.stringify(c.requires)}</p>}
          {c.effects && <p className="dev-req">effects {JSON.stringify(c.effects)}</p>}
          {c.aftermath?.length ? <BeatList beats={c.aftermath} start={end} clipUrl={clipUrl} stillUrl={stillUrl} planning={planning} /> : null}
        </div>
      ))}
      {sc.retryFrom && <p className="dev-next">Dead end. She goes back, with her state restored, to: <GoTo to={sc.retryFrom} book={book} onOpen={onOpen} /></p>}
      {sc.next && <p className="dev-next">Then: <GoTo to={sc.next} book={book} onOpen={onOpen} />{(sc.branch ?? []).map((b) => <span key={b.next} className="dev-chip if">or if {JSON.stringify(b.requires)} → <GoTo to={b.next} book={book} onOpen={onOpen} /></span>)}</p>}
    </div>
  );
}
