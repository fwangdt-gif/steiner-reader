'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getLocalBooks, deleteLocalBook } from '@/lib/local-books'
import type { Book } from '@/lib/data'

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
  const [localBooks, setLocalBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [migrating, setMigrating] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Load localStorage books immediately (client-side only)
    setLocalBooks(getLocalBooks())

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      const admin = profile?.role === 'admin'
      setIsAdmin(admin)

      // Fetch cloud books — admin sees all, users see only their own
      let booksQuery = supabase
        .from('local_books')
        .select('id, title, author, category, updated_at, user_id')
        .order('updated_at', { ascending: false })

      if (!admin) booksQuery = booksQuery.eq('user_id', user.id)

      const { data: booksData, error } = await booksQuery

      if (error) {
        console.error('加载书籍失败:', error)
        setLoading(false)
        return
      }

      if (!booksData || booksData.length === 0) { setLoading(false); return }

      // Chapter counts (separate query — no FK join)
      const bookIds = booksData.map((b) => b.id)
      const { data: chapterRows } = await supabase
        .from('chapters')
        .select('book_id')
        .in('book_id', bookIds)

      const countMap: Record<string, number> = {}
      for (const ch of (chapterRows ?? [])) {
        countMap[ch.book_id] = (countMap[ch.book_id] ?? 0) + 1
      }

      // For admin: uploader display names
      let nameMap: Record<string, string> = {}
      if (admin) {
        const userIds = [...new Set(booksData.map((b) => b.user_id).filter(Boolean))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds)
        if (profiles) {
          nameMap = Object.fromEntries(profiles.map((p) => [p.id, p.display_name ?? '未知']))
        }
      }

      setBooks(booksData.map((row) => ({
        id: row.id,
        title: row.title,
        author: row.author ?? '',
        category: row.category ?? null,
        updated_at: row.updated_at,
        chapter_count: countMap[row.id] ?? 0,
        uploader_name: admin ? (nameMap[row.user_id] ?? '未知') : undefined,
      })))
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

  const handleMigrate = async (book: Book) => {
    if (!userId) { alert('请先登录'); return }
    if (!confirm(`将《${book.titleZh}》存入云端？迁移后将从本地删除。`)) return
    setMigrating(book.id)
    try {
      // Create local_books entry
      const { data: newBook, error: bookErr } = await supabase
        .from('local_books')
        .insert({
          title: book.titleZh,
          author: book.author,
          description: book.description ?? null,
          category: book.category ?? null,
          user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (bookErr || !newBook) {
        alert(`迁移失败：${bookErr?.message ?? '未知错误'}`)
        return
      }
      const newId = newBook.id

      // Move or insert chapters
      const { data: existingChapters } = await supabase
        .from('chapters').select('id').eq('book_id', book.id)

      if (existingChapters && existingChapters.length > 0) {
        await supabase.from('chapters').update({ book_id: newId }).eq('book_id', book.id)
      } else if (book.chapters.length > 0) {
        await supabase.from('chapters').insert(
          book.chapters.map((ch, idx) => ({
            book_id: newId,
            title: ch.titleZh || ch.title || `第 ${idx + 1} 章`,
            content: JSON.stringify(ch.blocks ?? []),
            order_index: ch.orderIndex ?? idx,
          }))
        )
      }

      // Remove from localStorage, add to cloud list
      deleteLocalBook(book.id)
      setLocalBooks(getLocalBooks())
      setBooks((prev) => [{
        id: newId,
        title: book.titleZh,
        author: book.author ?? '',
        category: book.category ?? null,
        updated_at: new Date().toISOString(),
        chapter_count: book.chapters.length,
        uploader_name: isAdmin ? '我' : undefined,
      }, ...prev])
    } catch (err) {
      console.error(err)
      alert('迁移失败，请重试')
    } finally {
      setMigrating(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>加载中…</p>
    </div>
  )

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
        {isAdmin && (
          <div
            className="mb-5 px-4 py-2.5 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            管理员模式 · 云端显示全站所有书籍
          </div>
        )}

        {/* ── Local (localStorage) books ── */}
        {localBooks.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  本地书籍
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-secondary)' }}>
                  仅此设备可见
                </span>
              </div>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{localBooks.length} 本</span>
            </div>
            <div className="flex flex-col gap-3">
              {localBooks.map((book) => (
                <div key={book.id} className="wc-card rounded-xl border p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/local/${book.id}`}
                        className="text-sm font-semibold block truncate hover:underline"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {book.titleZh}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {book.author}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {book.chapters.length} 章 · 仅存于本地
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/local/${book.id}/edit`}
                        className="text-xs px-2.5 py-1.5 rounded-lg border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                      >
                        编辑章节
                      </Link>
                      <button
                        onClick={() => handleMigrate(book)}
                        disabled={migrating === book.id}
                        className="text-xs px-2.5 py-1.5 rounded-lg border disabled:opacity-40"
                        style={{ borderColor: '#6a8f6a', color: '#6a8f6a' }}
                      >
                        {migrating === book.id ? '迁移中…' : '存入云端'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Cloud books ── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isAdmin ? '全站云端书籍' : '我的云端书籍'}
          </h2>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            共 {books.length} 本
          </span>
        </div>

        {books.length === 0 && localBooks.length === 0 && (
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

        {books.length === 0 && localBooks.length > 0 && (
          <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>
            云端暂无书籍。点击上方「存入云端」将本地书籍迁移过来。
          </p>
        )}

        <div className="flex flex-col gap-3">
          {books.map((book) => (
            <div key={book.id} className="wc-card rounded-xl border p-4">
              <div className="flex items-start gap-3">
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
