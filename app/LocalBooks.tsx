'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getLocalBooks } from '@/lib/local-books'
import type { Book } from '@/lib/data'

function exportBook(book: Book) {
  const json = JSON.stringify(book, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${book.id}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function LocalBooks() {
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    setBooks(getLocalBooks())
  }, [])

  if (books.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          本地书籍
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-muted)' }}
        >
          仅在本设备可见
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {books.map((book) => (
          <div
            key={book.id}
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
          >
            <div className="h-1.5" style={{ backgroundColor: book.coverColor }} />
            <div className="p-5">
              <h3 className="text-lg font-semibold mb-1">{book.titleZh}</h3>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                {book.author} · {book.publishedYear}
              </p>
              {book.description && (
                <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {book.description}
                </p>
              )}
              <div
                className="pt-3 border-t flex items-center justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {book.chapters.length} 个章节
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportBook(book)}
                    className="text-sm px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    导出 JSON
                  </button>
                  <Link
                    href={`/local/${book.id}`}
                    className="text-sm px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    目录
                  </Link>
                  {book.chapters[0] && (
                    <Link
                      href={`/local/${book.id}/chapters/${book.chapters[0].id}`}
                      className="text-sm px-3 py-1.5 rounded-lg text-white"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      开始阅读
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
