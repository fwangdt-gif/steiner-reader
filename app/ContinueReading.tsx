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
      const { bookId, chapterId } = JSON.parse(raw)
      const book = getBook(bookId)
      const chapter = getChapter(bookId, chapterId)
      if (!book || !chapter) return
      setLabel(`${book.titleZh} · ${chapter.titleZh}`)
      setHref(`/books/${bookId}/chapters/${chapterId}`)
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
