'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getLocalBook, getLocalAdjacentChapters } from '@/lib/local-books'
import ReadingClient from '@/app/books/[bookId]/chapters/[chapterId]/ReadingClient'
import type { Book, Chapter } from '@/lib/data'

export default function LocalChapterPage() {
  const { bookId, chapterId } = useParams() as { bookId: string; chapterId: string }
  const [data, setData] = useState<{ book: Book; chapter: Chapter; prev: Chapter | null; next: Chapter | null } | null | undefined>(undefined)

  useEffect(() => {
    const book = getLocalBook(bookId)
    const chapter = book?.chapters.find((c) => c.id === chapterId)
    if (!book || !chapter) { setData(null); return }
    const { prev, next } = getLocalAdjacentChapters(bookId, chapterId)
    setData({ book, chapter, prev, next })
  }, [bookId, chapterId])

  if (data === undefined) return null

  if (data === null) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="text-center">
        <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>未找到章节内容</p>
        <Link href="/" className="text-sm" style={{ color: 'var(--accent)' }}>← 返回书库</Link>
      </div>
    </div>
  )

  return (
    <ReadingClient
      book={data.book}
      chapter={data.chapter}
      prevChapter={data.prev}
      nextChapter={data.next}
      basePath="/local"
    />
  )
}
