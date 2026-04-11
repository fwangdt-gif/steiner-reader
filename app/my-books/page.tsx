'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface BookRow {
  id: string
  title: string
  author: string
  category: string | null
  updated_at: string
  chapter_count: number
  uploader_name?: string   // only populated for admins
}

export default function MyBooksPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [books, setBooks] = useState<BookRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Check role — gracefully handles missing column (defaults to non-admin)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const admin = profile?.role === 'admin'
      setIsAdmin(admin)

      // Fetch books — admin sees all, users see only their own
      let query = supabase
        .from('local_books')
        .select('id, title, author, category, updated_at, user_id, chapters(id), profiles(display_name)')
        .order('updated_at', { ascending: false })

      if (!admin) query = query.eq('user_id', user.id)

      const { data, error } = await query

      if (error) {
        console.error('加载书籍失败:', error)
        setLoading(false)
        return
      }

      if (data) {
        setBooks(data.map((row) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = row.profiles as any
          const uploader: string =
            (Array.isArray(p) ? p[0]?.display_name : p?.display_name) ?? '未知'
          return {
            id: row.id,
            title: row.title,
            author: row.author ?? '',
            category: row.category ?? null,
            updated_at: row.updated_at,
            chapter_count: Array.isArray(row.chapters) ? row.chapters.length : 0,
            uploader_name: admin ? uploader : undefined,
          }
        }))
      }
      setLoading(false)
    }
    load()
  }, [supabase, router])

  const handleDelete = async (bookId: string, title: string) => {
    if (!confirm(`确认删除《${title}》？章节内容也会一并删除，且不可撤销。`)) return
    setDeleting(bookId)
    await supabase.from('chapters').delete().eq('book_id', bookId)
    const { error } = await supabase.from('local_books').delete().eq('id', bookId)
    if (error) {
      alert(`删除失败：${error.message}`)
      setDeleting(null)
      return
    }
    setBooks((prev) => prev.filter((b) => b.id !== bookId))
    setDeleting(null)
  }

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>加载中…</p>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <header className="wc-header sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm" style={{ color: 'var(--text-secondary)' }}>← 书库</Link>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              我的图书管理
            </span>
          </div>
          <Link
            href="/my-books/new"
            className="text-sm px-4 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            + 新建书籍
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Admin banner */}
        {isAdmin && (
          <div
            className="mb-5 px-4 py-2.5 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            管理员模式 · 显示全站所有书籍
          </div>
        )}

        {/* Page heading */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isAdmin ? '全站书籍' : '我的书籍'}
          </h1>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            共 {books.length} 本
          </span>
        </div>

        {/* Empty state */}
        {books.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              还没有书籍，点击右上角新建
            </p>
            <Link
              href="/my-books/new"
              className="text-sm px-5 py-2.5 rounded-lg text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              新建第一本书
            </Link>
          </div>
        )}

        {/* Book list */}
        <div className="flex flex-col gap-3">
          {books.map((book) => (
            <div key={book.id} className="wc-card rounded-xl border p-4">
              <div className="flex items-start gap-3">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/local/${book.id}`}
                    className="text-sm font-semibold block truncate hover:underline"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {book.title}
                  </Link>
                  <p className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap"
                    style={{ color: 'var(--text-secondary)' }}>
                    <span>{book.author}</span>
                    {book.uploader_name && (
                      <span style={{ color: 'var(--text-muted)' }}>· {book.uploader_name}</span>
                    )}
                    {book.category && (
                      <span
                        className="px-1.5 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-muted)' }}
                      >
                        {book.category}
                      </span>
                    )}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {book.chapter_count} 章 · 更新于{' '}
                    {new Date(book.updated_at).toLocaleDateString('zh-CN', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/my-books/${book.id}/edit`}
                    className="text-xs px-2.5 py-1.5 rounded-lg border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    编辑信息
                  </Link>
                  <Link
                    href={`/local/${book.id}/edit`}
                    className="text-xs px-2.5 py-1.5 rounded-lg border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    编辑章节
                  </Link>
                  <button
                    onClick={() => handleDelete(book.id, book.title)}
                    disabled={deleting === book.id}
                    className="text-xs px-2.5 py-1.5 rounded-lg border disabled:opacity-40"
                    style={{ borderColor: '#dc2626', color: '#dc2626' }}
                  >
                    {deleting === book.id ? '…' : '删除'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
