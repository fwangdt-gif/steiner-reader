// ── 类型定义 ──────────────────────────────────────────────────────

export interface ContentBlock {
  id: string
  blockIndex: number
  blockType: 'heading' | 'subheading' | 'paragraph' | 'quote'
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
}

// ── 从 content/ 导入书目 JSON ─────────────────────────────────────
//
// 新增一本书：
//   1. 在 content/ 目录下新建 JSON 文件（参考现有文件格式）
//   2. 在下方 import 一行
//   3. 加入 books 数组
//
import theosophy from '@/content/theosophy.json'
import knowledgeOfHigherWorlds from '@/content/knowledge-of-higher-worlds.json'
// import myNewBook from '@/content/my-new-book.json'

export const books: Book[] = [
  theosophy as Book,
  knowledgeOfHigherWorlds as Book,
  // myNewBook as Book,
]

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
