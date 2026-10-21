import Library from "@/components/Library";
import { listBooks } from "@/lib/story/load";

export default function Home() {
  return <Library books={listBooks()} />;
}
