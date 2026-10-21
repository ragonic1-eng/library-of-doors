import Link from "next/link";
import { listBooks } from "@/lib/story/load";

const futureDoors = ["Neverwhere", "Coraline", "The Alchemist"];

export default function Home() {
  const books = listBooks();
  return (
    <main className="title">
      <div className="sway">
        <div className="film placeholder title-plate">
          <h1>The Library of Doors</h1>
          <p className="sub">for Aurie</p>
        </div>
        <div className="vignette" />
      </div>
      <nav className="doors">
        {books.map((b) => (
          <Link key={b.id} href={`/play/${b.id}`} className="door open">
            <span className="door-title">{b.title}</span>
            <span className="door-sub">Enter</span>
          </Link>
        ))}
        {futureDoors.map((t) => (
          <div key={t} className="door locked">
            <span className="door-title">{t}</span>
            <span className="door-sub">Locked</span>
          </div>
        ))}
      </nav>
    </main>
  );
}
