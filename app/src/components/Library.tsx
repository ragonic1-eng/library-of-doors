"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Book, Profile } from "@/lib/story/types";
import { loadProfile } from "@/lib/state/profile";
import Journal from "@/components/Journal";

const futureDoors = [
  { title: "Coraline", tone: "A small door. A very large courage.", theme: "coraline" },
  { title: "Neverwhere", tone: "Below the city, someone needs you.", theme: "neverwhere" },
  { title: "The Alchemist", tone: "Some journeys lead you back to yourself.", theme: "alchemist" },
];
const relics = [ ["sand", "Dream sand"], ["angel_key", "The Angel’s key"], ["button_key", "The button key"], ["stones", "The two stones"] ];

export default function Library({ books }: { books: Book[] }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => { setProfile(loadProfile()); }, []);
  const completed = profile?.completed.includes("sandman.ep1");
  return <main className="library">
    <header className="library-heading">
      <p className="eyebrow">A story for Charmaine</p>
      <h1>The Library<br /><em>of Doors</em></h1>
      <p className="library-intro">Every door is a story.<br />Every story remembers who you were.</p>
    </header>
    <section className="librarian-note" aria-label="Your bookmark">
      <span className="eyebrow">Lucienne’s reading table</span>
      <p>{completed ? "“The first night is written, my lady. I have kept your place.”" : profile?.position ? "“There you are, my lady. Your page is still open.”" : "“There is a place for you here, my lady. There always has been.”"}</p>
      <small>{completed ? "The Captivity of Dream · complete. The next chapter is still being written." : "Begin with The Sandman. Your words, silences and promises will be remembered."}</small>
    </section>
    <nav className="library-doors" aria-label="The doors">
      {books.map((book) => {
        const saved = profile?.position?.book === book.id ? book.scenes[profile.position.scene] : null;
        return <Link key={book.id} href={`/play/${book.id}`} className="library-door sandman">
          <span className="door-number">I</span><span className="door-arch" aria-hidden="true">✦</span>
          <span className="door-title">{book.title}</span>
          <span className="door-description">What will you do with the power to forgive?</span>
          <span className="door-action">{saved?.type === "end" ? "Return to your last page" : saved ? "Continue your story" : "Open the first door"} <span aria-hidden="true">→</span></span>
          {saved && <span className="door-bookmark">Bookmark: {saved.title}</span>}
        </Link>;
      })}
      {futureDoors.map((door, i) => <article key={door.title} className={`library-door waiting ${door.theme}`} aria-label={`${door.title}, being written`}>
        <span className="door-number">{["II", "III", "IV"][i]}</span><span className="door-arch" aria-hidden="true">◇</span>
        <h2 className="door-title">{door.title}</h2><p className="door-description">{door.tone}</p>
        <span className="door-action">Still being written</span>
      </article>)}
    </nav>
    <section className="reading-table" aria-label="Relics from completed books">
      <p className="eyebrow">Four places at the table</p>
      <div className="relics">{relics.map(([id, name]) => <div key={id} className={profile?.relics.includes(id) ? "relic earned" : "relic"}>
        <span aria-hidden="true">{profile?.relics.includes(id) ? "✦" : "○"}</span>
        <p>{profile?.relics.includes(id) ? name : "A place waiting"}</p>
      </div>)}</div>
      <p className="journal-note">A keepsake from each completed book. The first night is only the beginning.</p>
    </section>
    {profile && <details className="library-journal"><summary>Open your journal <span aria-hidden="true">↗</span></summary><Journal profile={profile} /></details>}
    <footer className="library-footer">For all the worlds you have yet to become.</footer>
  </main>;
}
