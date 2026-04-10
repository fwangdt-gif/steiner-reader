import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBook } from '@/lib/data'
import BookDetailClient from './BookDetailClient'

interface Props {
  params: Promise<{ bookId: string }>
}

export default async function BookDetailPage({ params }: Props) {
  const { bookId } = await params
  const book = getBook(bookId)
  if (!book) notFound()

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      {/* 顶部导航 */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="text-sm flex items-center gap-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            ← 书库
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {book.titleZh}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 书目信息 */}
        <div className="mb-8">
          <div
            className="w-10 h-1 rounded-full mb-4"
            style={{ backgroundColor: book.coverColor }}
          />
          <p
            className="text-sm mb-1"
            style={{ color: 'var(--text-muted)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {book.titleOriginal}
          </p>
          <h1 className="text-2xl font-semibold mb-1">{book.titleZh}</h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {book.author} · {book.publishedYear}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {book.description}
          </p>
        </div>

        <BookDetailClient book={book} />
      </main>
    </div>
  )
}
