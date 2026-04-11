'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface ChapterRow {
  id: string
  title: string
  order_index: number
}

interface BookMeta {
  id: string
  title: string
  author: string
  description: string
  coverColor: string
}

export default function LocalBookPage() {
  const { bookId } = useParams() as { bookId: string }
  const [book, setBook] = useState<BookMeta | null | undefined>(undefined)
  const [chapters, setChapters] = useState<ChapterRow[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: bookRow } = await supabase
        .from('local_books')
        .select('id, title, author, description')
        .eq('id', bookId)
        .single()

      if (!bookRow) { setBook(null); return }

      setBook({
        id: bookRow.id,
        title: bookRow.title,
        author: bookRow.author ?? '',
        description: bookRow.description ?? '',
        coverColor: '#4a6fa5',
      })

      // Always fetch chapters fresh from Supabase — never use localStorage
      const { data: chapterRows } = await supabase
        .from('chapters')
        .select('id, title, order_index')
        .eq('book_id', bookId)
        .order('order_index', { ascending: true })

      setChapters(chapterRows ?? [])
    }
    load()
  }, [bookId])

  if (book === undefined) return null

  if (book === null) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>未找到本地书籍</p>
        <Link href="/" className="text-sm" style={{ color: 'var(--accent)' }}>← 返回书库</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <header className="wc-header sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-sm" style={{ color: 'var(--text-secondary)' }}>← 书库</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{book.title}</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-muted)' }}>
            本地
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="w-10 h-1 rounded-full mb-4" style={{ backgroundColor: book.coverColor }} />
          <h1 className="text-2xl font-semibold mb-1">{book.title}</h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{book.author}</p>
          {book.description && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {book.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            章节目录
          </h2>
          <Link
            href={`/local/${book.id}/edit`}
            className="text-xs px-3 py-1 rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            编辑章节
          </Link>
        </div>

        {chapters.length === 0 ? (
          <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>
            还没有章节，点击「编辑章节」添加
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {chapters.map((chapter, idx) => (
              <div key={chapter.id} className="wc-card flex items-center gap-3 p-4 rounded-xl border">
                <span className="text-xs w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-medium"
                  style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                  {idx + 1}
                </span>
                <p className="text-sm font-medium truncate flex-1 min-w-0">{chapter.title}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/local/${book.id}/edit#${chapter.id}`}
                    className="text-xs px-2.5 py-1 rounded-lg border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    编辑
                  </Link>
                  <Link
                    href={`/local/${book.id}/chapters/${chapter.id}`}
                    className="text-xs px-2.5 py-1 rounded-lg text-white"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    阅读
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
