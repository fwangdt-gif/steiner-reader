import Link from 'next/link'
import { books } from '@/lib/data'

export default function LibraryPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      {/* 顶部导航 */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">史代娜共读</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              私人圈子
            </span>
          </div>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>书库</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">书库</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {books.length} 部著作 · 共同阅读与批注
          </p>
        </div>

        {/* 书目列表 */}
        <div className="flex flex-col gap-4">
          {books.map((book) => {
            const publishedChapters = book.chapters.filter((c) => c.status === 'published')
            const firstChapter = publishedChapters[0]

            return (
              <div
                key={book.id}
                className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
              >
                {/* 书脊色条 */}
                <div className="h-1.5" style={{ backgroundColor: book.coverColor }} />

                <div className="p-5">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs mb-0.5 truncate"
                      style={{ color: 'var(--text-muted)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                    >
                      {book.titleOriginal}
                    </p>
                    <h2 className="text-lg font-semibold mb-1 leading-snug">{book.titleZh}</h2>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {book.author} · {book.publishedYear}
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}
                    >
                      {book.description}
                    </p>
                  </div>

                  {/* 章节信息 + 操作 */}
                  <div
                    className="mt-4 pt-4 border-t flex items-center justify-between"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {publishedChapters.length} 章节已发布
                      </span>
                      {book.chapters.some((c) => c.status === 'draft') && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-secondary)' }}
                        >
                          部分草稿
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/books/${book.id}`}
                        className="text-sm px-3 py-1.5 rounded-lg border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      >
                        目录
                      </Link>
                      {firstChapter && (
                        <Link
                          href={`/books/${book.id}/chapters/${firstChapter.id}`}
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
            )
          })}
        </div>

        <div className="mt-12 pb-8 text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>本平台仅供私人共读使用</p>
        </div>
      </main>
    </div>
  )
}
