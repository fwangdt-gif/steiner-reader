'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getLocalBook } from '@/lib/local-books'
import type { Book } from '@/lib/data'

export default function LocalBookPage() {
  const { bookId } = useParams() as { bookId: string }
  const [book, setBook] = useState<Book | null | undefined>(undefined)

  useEffect(() => {
    setBook(getLocalBook(bookId) ?? null)
  }, [bookId])

  // 加载中
  if (book === undefined) return null

  // 找不到
  if (book === null) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="text-center">
        <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>未找到本地书籍</p>
        <Link href="/" className="text-sm" style={{ color: 'var(--accent)' }}>← 返回书库</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      <header
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-sm" style={{ color: 'var(--text-secondary)' }}>← 书库</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{book.titleZh}</span>
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-muted)' }}
          >
            本地
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="w-10 h-1 rounded-full mb-4" style={{ backgroundColor: book.coverColor }} />
          {book.titleOriginal !== book.titleZh && (
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {book.titleOriginal}
            </p>
          )}
          <h1 className="text-2xl font-semibold mb-1">{book.titleZh}</h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {book.author} · {book.publishedYear}
          </p>
          {book.description && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {book.description}
            </p>
          )}
        </div>

        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          章节目录
        </h2>
        <div className="flex flex-col gap-2">
          {book.chapters.map((chapter, idx) => (
            <Link
              key={chapter.id}
              href={`/local/${book.id}/chapters/${chapter.id}`}
              className="flex items-center justify-between p-4 rounded-xl border"
              style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="text-xs w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-medium"
                  style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                >
                  {idx + 1}
                </span>
                <p className="text-sm font-medium truncate">{chapter.titleZh}</p>
              </div>
              <span className="text-sm ml-3 flex-shrink-0" style={{ color: 'var(--accent)' }}>阅读 →</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
