import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBook } from '@/lib/data'

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

        {/* 章节目录 */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            章节目录
          </h2>

          <div className="flex flex-col gap-2">
            {book.chapters.map((chapter, idx) => {
              const isPublished = chapter.status === 'published'
              return (
                <div key={chapter.id}>
                  {isPublished ? (
                    <Link
                      href={`/books/${book.id}/chapters/${chapter.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border group transition-colors"
                      style={{
                        backgroundColor: 'var(--surface-raised)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="text-xs w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-medium"
                          style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{chapter.titleZh}</p>
                          <p
                            className="text-xs truncate mt-0.5"
                            style={{
                              color: 'var(--text-muted)',
                              fontFamily: 'Georgia, serif',
                              fontStyle: 'italic',
                            }}
                          >
                            {chapter.title}
                          </p>
                        </div>
                      </div>
                      <span style={{ color: 'var(--accent)' }} className="text-sm ml-3 flex-shrink-0">
                        阅读 →
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
      </main>
    </div>
  )
}
