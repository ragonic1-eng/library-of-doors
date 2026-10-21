import type { Book, CharacterCard } from "./types";
import sandman from "@/content/books/sandman/book.json";
import sandmanCast from "@/content/characters/sandman.json";

// Adding a book = adding a folder under content/books and one line here.
const books: Record<string, Book> = {
  sandman: sandman as unknown as Book,
};

const casts: Record<string, Record<string, CharacterCard>> = {
  sandman: sandmanCast as unknown as Record<string, CharacterCard>,
};

export function getBook(id: string): Book | undefined {
  return books[id];
}

export function listBooks(): Book[] {
  return Object.values(books);
}

export function getCharacter(bookId: string, key: string): CharacterCard | undefined {
  return casts[bookId]?.[key];
}
