import type { Profile } from "@/lib/story/types";

export default function Journal({ profile }: { profile: Profile }) {
  return <section className="journal-pages" aria-label="Your story so far">
    <p className="eyebrow">The pages you have written</p>
    <h2>Your story so far</h2>
    {profile.journal.length ? <ol>{profile.journal.map((entry) => <li key={entry.id}><h3>{entry.title}</h3><p>{entry.text}</p></li>)}</ol>
      : <p>Your first page is waiting. Decisions and their echoes will appear here as you travel.</p>}
    <p className="journal-note">Your bookmark is kept in this browser. Returning to a scene begins its conversation again; recorded consequences remain.</p>
  </section>;
}
