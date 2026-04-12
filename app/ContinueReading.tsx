'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getBook, getChapter } from '@/lib/data'

export default function ContinueReading() {
  const [href, setHref] = useState<string | null>(null)
  const [label, setLabel] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('steiner_last_read')
      if (!raw) return
      const { bookId, chapterId, basePath = '/books', bookTitle, chapterTitle } = JSON.parse(raw)
      if (!bookId || !chapterId) return

      // 优先从静态书库获取标题（Steiner 著作）
      const book = getBook(bookId)
      const chapter = getChapter(bookId, chapterId)
      if (book && chapter) {
        setLabel(`${book.titleZh} · ${chapter.titleZh}`)
      } else if (bookTitle && chapterTitle) {
        // 本地/云端书籍使用存储的标题
        setLabel(`${bookTitle} · ${chapterTitle}`)
      } else {
        return
      }

      setHref(`${basePath}/${bookId}/chapters/${chapterId}`)
    } catch {
      // localStorage 读取失败时静默忽略
    }
  }, [])

  if (!href) return null

  return (
    <div
      className="wc-card mb-8 p-4 rounded-xl border flex items-center justify-between"
    >
      <div>
        <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>上次阅读</p>
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{label}</p>
      </div>
      <Link
        href={href}
        className="text-sm px-4 py-1.5 rounded-lg text-white flex-shrink-0 ml-4"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        继续阅读
      </Link>
    </div>
  )
}
