import { notFound } from "next/navigation";
import Player from "@/components/Player";
import { getBook, listBooks } from "@/lib/story/load";

export function generateStaticParams() {
  return listBooks().map((b) => ({ book: b.id }));
}

export default async function PlayPage({ params }: { params: Promise<{ book: string }> }) {
  const { book } = await params;
  const data = getBook(book);
  if (!data) notFound();
  return <Player book={data} />;
}
