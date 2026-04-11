'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Book } from '@/lib/data'

export default function SteinerBooksSection({ books, query = '' }: { books: Book[]; query?: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [showHidden, setShowHidden] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'admin') setIsAdmin(true)

      const { data: overrides } = await supabase
        .from('book_overrides').select('book_id, hidden')
      if (overrides) {
        setHiddenIds(new Set(overrides.filter((r) => r.hidden).map((r) => r.book_id)))
      }
    }
    init()
  }, [supabase])

  const handleToggleHidden = async (bookId: string) => {
    setToggling(bookId)
    const nowHidden = !hiddenIds.has(bookId)
    // Upsert into book_overrides
    await supabase.from('book_overrides').upsert(
      { book_id: bookId, hidden: nowHidden, updated_at: new Date().toISOString() },
      { onConflict: 'book_id' }
    )
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (nowHidden) next.add(bookId)
      else next.delete(bookId)
      return next
    })
    setToggling(null)
  }

  const categories = ['人智学', '教育学', '医学', '优律师美', '灵修'] as const

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return books.filter((b) => {
      if (!showHidden && hiddenIds.has(b.id)) return false
      if (selectedCategory && b.category !== selectedCategory) return false
      if (q && !b.titleZh.toLowerCase().includes(q) && !b.titleOriginal.toLowerCase().includes(q) && !b.author.toLowerCase().includes(q)) return false
      return true
    })
  }, [books, selectedCategory, hiddenIds, showHidden, query])

  const hiddenCount = hiddenIds.size

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <h2 className="text-xs font-medium tracking-[0.14em] uppercase"
          style={{ color: 'var(--text-muted)' }}>
          Steiner 著作
        </h2>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
          {books.length - (showHidden ? 0 : hiddenCount)} 部
        </span>
        {isAdmin && hiddenCount > 0 && (
          <button
            onClick={() => setShowHidden((v) => !v)}
            className="ml-auto text-xs px-2.5 py-0.5 rounded-full border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            {showHidden ? `隐藏已隐藏书籍 (${hiddenCount})` : `显示已隐藏书籍 (${hiddenCount})`}
          </button>
        )}
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
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
          const isHidden = hiddenIds.has(book.id)

          return (
            <div
              key={book.id}
              className="wc-card rounded-xl border overflow-hidden"
              style={isHidden ? { opacity: 0.5 } : undefined}
            >
              <div className="h-1.5" style={{ backgroundColor: book.coverColor }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="text-xs truncate flex-1"
                    style={{ color: 'var(--text-muted)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                    {book.titleOriginal}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isHidden && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-muted)' }}>
                        已隐藏
                      </span>
                    )}
                    {book.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-secondary)' }}>
                        {book.category}
                      </span>
                    )}
                  </div>
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

                <div className="mt-4 pt-4 border-t flex items-center justify-between gap-2"
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
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {isAdmin && (
                      <button
                        onClick={() => handleToggleHidden(book.id)}
                        disabled={toggling === book.id}
                        className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40"
                        style={{
                          borderColor: isHidden ? '#6a8f6a' : '#dc2626',
                          color: isHidden ? '#6a8f6a' : '#dc2626',
                        }}
                      >
                        {toggling === book.id ? '…' : isHidden ? '取消隐藏' : '隐藏'}
                      </button>
                    )}
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
