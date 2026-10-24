import type { Book, CharacterCard } from "./types";
import sandman from "@/content/books/sandman/book.json";
import sandmanCast from "@/content/characters/sandman.json";
import neverwhere from "@/content/books/neverwhere/book.json";
import neverwhereCast from "@/content/characters/neverwhere.json";

// Adding a book = adding a folder under content/books and one line here.
const books: Record<string, Book> = {
  sandman: sandman as unknown as Book,
  neverwhere: neverwhere as unknown as Book,
};

const casts: Record<string, Record<string, CharacterCard>> = {
  sandman: sandmanCast as unknown as Record<string, CharacterCard>,
  neverwhere: neverwhereCast as unknown as Record<string, CharacterCard>,
};

export function getBook(id: string): Book | undefined {
  return books[id];
}

/** Books the player can enter. */
export function listBooks(): Book[] {
  return Object.values(books).filter((b) => !b.status);
}

/** Every book, including skeletons still being planned (for the Developer menu). */
export function listAllBooks(): Book[] {
  return Object.values(books);
}

export function getCharacter(bookId: string, key: string): CharacterCard | undefined {
  return casts[bookId]?.[key];
}
