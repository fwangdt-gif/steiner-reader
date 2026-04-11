'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { CATEGORIES } from '@/lib/data'
import type { Book } from '@/lib/data'

// ── Main component ────────────────────────────────────────────────
export default function SteinerBooksSection({ books }: { books: Book[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = useMemo(() => {
    const used = new Set(books.map((b) => b.category).filter(Boolean))
    return CATEGORIES.filter((c) => used.has(c))
  }, [books])

  const filtered = useMemo(() => {
    return books.filter((b) =>
      !selectedCategory || b.category === selectedCategory
    )
  }, [books, selectedCategory])

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}>
          Steiner 著作
        </h2>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
          {books.length} 部
        </span>
      </div>

      {/* Category chips only — no search bar (too few books) */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-xs px-3 py-1 rounded-full border transition-colors"
            style={{
              borderColor: selectedCategory === null ? 'var(--accent)' : 'var(--border)',
              backgroundColor: selectedCategory === null ? 'var(--accent-light)' : 'transparent',
              color: selectedCategory === null ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >全部</button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className="text-xs px-3 py-1 rounded-full border transition-colors"
              style={{
                borderColor: selectedCategory === cat ? 'var(--accent)' : 'var(--border)',
                backgroundColor: selectedCategory === cat ? 'var(--accent-light)' : 'transparent',
                color: selectedCategory === cat ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >{cat}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>
          无匹配结果
        </p>
      )}

      <div className="flex flex-col gap-4">
        {filtered.map((book) => {
          const publishedChapters = book.chapters.filter((c) => c.status === 'published')
          const firstChapter = publishedChapters[0]

          return (
            <div key={book.id} className="wc-card rounded-xl border overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: book.coverColor }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="text-xs truncate flex-1"
                    style={{ color: 'var(--text-muted)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                    {book.titleOriginal}
                  </p>
                  {book.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-secondary)' }}>
                      {book.category}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold mb-1 leading-snug">{book.titleZh}</h2>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {book.author} · {book.publishedYear}
                </p>
                <p className="text-sm leading-relaxed"
                  style={{
                    color: 'var(--text-secondary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  } as React.CSSProperties}>
                  {book.description}
                </p>

                <div className="mt-4 pt-4 border-t flex items-center justify-between"
                  style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {publishedChapters.length} 章节已发布
                    </span>
                    {book.chapters.some((c) => c.status === 'draft') && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-secondary)' }}>
                        部分草稿
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/books/${book.id}`}
                      className="text-sm px-3 py-1.5 rounded-lg border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      目录
                    </Link>
                    {firstChapter && (
                      <Link href={`/books/${book.id}/chapters/${firstChapter.id}`}
                        className="text-sm px-3 py-1.5 rounded-lg text-white"
                        style={{ backgroundColor: 'var(--accent)' }}>
                        开始阅读
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
