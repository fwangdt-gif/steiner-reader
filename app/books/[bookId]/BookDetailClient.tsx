'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Book } from '@/lib/data'

// 将 text 中匹配 query 的部分用高亮 span 包裹
function highlight(text: string, query: string) {
  if (!query.trim()) return text
  const parts = text.split(new RegExp(`(${query.trim()})`, 'i'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.trim().toLowerCase()
      ? <mark key={i} style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '2px' }}>{part}</mark>
      : part
  )
}

export default function BookDetailClient({ book }: { book: Book }) {
  const [lastChapterId, setLastChapterId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // 读取 localStorage 中的阅读记录
  useEffect(() => {
    try {
      const raw = localStorage.getItem('steiner_last_read')
      if (!raw) return
      const { bookId, chapterId } = JSON.parse(raw)
      if (bookId === book.id) setLastChapterId(chapterId)
    } catch {
      // 读取失败静默忽略
    }
  }, [book.id])

  const lastChapter = book.chapters.find((c) => c.id === lastChapterId) ?? null
  const filtered = query.trim()
    ? book.chapters.filter((c) =>
        c.titleZh.includes(query.trim()) || c.title.includes(query.trim())
      )
    : book.chapters

  return (
    <div>
      {/* 继续阅读按钮（有记录才显示） */}
      {lastChapter && (
        <div
          className="mb-6 p-4 rounded-xl border flex items-center justify-between"
          style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>上次阅读</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {lastChapter.titleZh}
            </p>
          </div>
          <Link
            href={`/books/${book.id}/chapters/${lastChapter.id}`}
            className="text-sm px-4 py-1.5 rounded-lg text-white flex-shrink-0 ml-4"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            继续阅读
          </Link>
        </div>
      )}

      {/* 章节目录 */}
      <h2
        className="text-sm font-semibold uppercase tracking-widest mb-4"
        style={{ color: 'var(--text-muted)' }}
      >
        章节目录
      </h2>

      {/* 搜索框 */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索章节…"
        className="w-full mb-4 px-4 py-2 rounded-xl border text-sm outline-none"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      />

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
            没有找到匹配的章节
          </p>
        )}
        {filtered.map((chapter) => {
          const idx = book.chapters.indexOf(chapter)
          const isPublished = chapter.status === 'published'
          const isCurrent = chapter.id === lastChapterId

          return (
            <div key={chapter.id}>
              {isPublished ? (
                <Link
                  href={`/books/${book.id}/chapters/${chapter.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border group transition-colors"
                  style={{
                    backgroundColor: isCurrent ? 'var(--accent-light)' : 'var(--surface-raised)',
                    borderColor: isCurrent ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-xs w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-medium"
                      style={{
                        backgroundColor: isCurrent ? 'var(--accent)' : 'var(--accent-light)',
                        color: isCurrent ? 'white' : 'var(--accent)',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{highlight(chapter.titleZh, query)}</p>
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{
                          color: 'var(--text-muted)',
                          fontFamily: 'Georgia, serif',
                          fontStyle: 'italic',
                        }}
                      >
                        {highlight(chapter.title, query)}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-sm ml-3 flex-shrink-0"
                    style={{ color: isCurrent ? 'var(--accent)' : 'var(--accent)' }}
                  >
                    {isCurrent ? '阅读中 →' : '阅读 →'}
                  </span>
                </Link>
              ) : (
                <div
                  className="flex items-center justify-between p-4 rounded-xl border opacity-50"
                  style={{ backgroundColor: 'var(--warm-100)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-xs w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-medium"
                      style={{ backgroundColor: 'var(--warm-200)', color: 'var(--text-muted)' }}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                        {chapter.titleZh}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    草稿
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
