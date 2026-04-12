// ── 类型定义 ──────────────────────────────────────────────────────

export interface ContentBlock {
  id: string
  blockIndex: number
  blockType: 'heading' | 'subheading' | 'paragraph' | 'quote' | 'image'
  originalText: string
  translationText: string
  scanPageRef?: number
}

export interface Chapter {
  id: string
  bookId: string
  title: string
  titleZh: string
  orderIndex: number
  status: 'draft' | 'published'
  blocks: ContentBlock[]
  markdownFile?: string  // 可选，指向 content/chapters/ 下的 .md 文件
}

export interface Book {
  id: string
  titleOriginal: string
  titleZh: string
  author: string
  description: string
  coverColor: string
  publishedYear: number
  chapters: Chapter[]
  category?: string
}

// ── 固定分类 ──────────────────────────────────────────────────────
export const CATEGORIES = ['人智学', '教育学', '医学', '优律师美', '灵修', '其他'] as const
export type Category = typeof CATEGORIES[number]

// ── 书目数据 ──────────────────────────────────────────────────────
//
// 新增一本书：直接在 lib/books.json 数组末尾追加一个书对象即可
//
import booksData from '@/lib/books.json'

export const books: Book[] = booksData as Book[]

// ── 查询函数（供页面使用，不需要修改） ────────────────────────────

export function getBook(bookId: string): Book | undefined {
  return books.find((b) => b.id === bookId)
}

export function getChapter(bookId: string, chapterId: string): Chapter | undefined {
  const book = getBook(bookId)
  return book?.chapters.find((c) => c.id === chapterId)
}

export function getAdjacentChapters(bookId: string, chapterId: string) {
  const book = getBook(bookId)
  if (!book) return { prev: null, next: null }
  const idx = book.chapters.findIndex((c) => c.id === chapterId)
  return {
    prev: idx > 0 ? book.chapters[idx - 1] : null,
    next: idx < book.chapters.length - 1 ? book.chapters[idx + 1] : null,
  }
}
