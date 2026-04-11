import type { Book } from '@/lib/data'

const STORAGE_KEY = 'steiner_local_books'

export function getLocalBooks(): Book[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveLocalBook(book: Book): void {
  const books = getLocalBooks()
  const idx = books.findIndex((b) => b.id === book.id)
  if (idx >= 0) books[idx] = book
  else books.push(book)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
}

export function getLocalBook(bookId: string): Book | undefined {
  return getLocalBooks().find((b) => b.id === bookId)
}

export function deleteLocalBook(bookId: string): void {
  const books = getLocalBooks().filter((b) => b.id !== bookId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
}

export function getLocalAdjacentChapters(bookId: string, chapterId: string) {
  const book = getLocalBook(bookId)
  if (!book) return { prev: null, next: null }
  const idx = book.chapters.findIndex((c) => c.id === chapterId)
  return {
    prev: idx > 0 ? book.chapters[idx - 1] : null,
    next: idx < book.chapters.length - 1 ? book.chapters[idx + 1] : null,
  }
}
