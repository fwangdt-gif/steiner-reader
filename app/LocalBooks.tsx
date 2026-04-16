'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { getLocalBooks, saveLocalBook, deleteLocalBook } from '@/lib/local-books'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/data'
import type { Book } from '@/lib/data'
import SteinerBooksSection from './SteinerBooksSection'

const COLORS = ['#4a6fa5', '#6a8f6a', '#7a6fa5', '#8a6244', '#6a7080']

const inputStyle = {
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
}

// 分类中除"其他"外的所有固定分类
const MAIN_CATS = CATEGORIES.filter((c) => c !== '其他') as readonly string[]

interface CloudBook {
  book: Book
  user_id: string
  uploader: string
  isOwn: boolean
  category: string | null
  updated_at: string
  coverImageUrl?: string
}

function exportBook(book: Book) {
  const json = JSON.stringify(book, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${book.id}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ── 编辑弹窗 ─────────────────────────────────────────────────────
function EditBookModal({ book, onSave, onClose }: {
  book: Book
  onSave: (updated: Book) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title: book.titleZh,
    author: book.author,
    year: String(book.publishedYear),
    color: book.coverColor,
    description: book.description ?? '',
    category: book.category ?? '',
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSave = () => {
    onSave({
      ...book,
      titleZh: form.title,
      titleOriginal: form.title,
      author: form.author,
      publishedYear: parseInt(form.year) || book.publishedYear,
      coverColor: form.color,
      description: form.description,
      category: form.category || undefined,
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div
        className="fixed inset-x-4 z-50 rounded-2xl shadow-2xl p-6 max-w-md mx-auto"
        style={{ backgroundColor: 'var(--surface-raised)', top: '50%', transform: 'translateY(-50%)' }}
      >
        <h2 className="text-base font-semibold mb-4">编辑书目信息</h2>
        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>书名 *</label>
            <input value={form.title} onChange={set('title')} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>作者 *</label>
            <input value={form.author} onChange={set('author')} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>年份</label>
            <input value={form.year} onChange={set('year')} type="number" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>简介</label>
            <textarea value={form.description} onChange={set('description')} rows={2} className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>分类</label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            >
              <option value="">未分类</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-2 block" style={{ color: 'var(--text-secondary)' }}>书脊颜色</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className="w-8 h-8 rounded-full border-2"
                  style={{ backgroundColor: c, borderColor: form.color === c ? 'var(--text-primary)' : 'transparent' }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>取消</button>
          <button onClick={handleSave} disabled={!form.title || !form.author}
            className="flex-1 py-2 rounded-lg text-white text-sm disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)' }}>保存</button>
        </div>
      </div>
    </>
  )
}

// ── 书籍卡片 ──────────────────────────────────────────────────────
function BookCard({ book, isOwn, isAdmin, uploader, category, coverImageUrl, onEdit, onDelete, onPublish, publishing, onMigrate, migrating }: {
  book: Book
  isOwn: boolean
  isAdmin?: boolean
  uploader?: string
  category?: string | null
  coverImageUrl?: string
  onEdit?: () => void
  onDelete?: () => void
  onPublish?: () => void
  publishing?: boolean
  onMigrate?: () => void
  migrating?: boolean
}) {
  return (
    <div className="wc-card rounded-2xl border overflow-hidden">
      {coverImageUrl ? (
        <img src={coverImageUrl} alt={book.titleZh} className="w-full object-cover" style={{ maxHeight: 160 }} />
      ) : (
        <div className="h-1" style={{ backgroundColor: book.coverColor }} />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-[15px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
            {book.titleZh}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5 flex-wrap justify-end">
            {category && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-secondary)' }}>
                {category}
              </span>
            )}
            {!isOwn && uploader && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
                {uploader}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          {book.author}{book.publishedYear ? ` · ${book.publishedYear}` : ''}
        </p>

        {book.description && (
          <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {book.description}
          </p>
        )}

        <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {book.chapters.length} 个章节
          </span>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {(isOwn || isAdmin) && (
              <>
                <button onClick={onEdit}
                  className="text-xs px-2.5 py-1.5 rounded-lg border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  编辑书名
                </button>
                <Link href={`/local/${book.id}/edit`}
                  className="text-xs px-2.5 py-1.5 rounded-lg border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  编辑内容
                </Link>
                {isOwn && onMigrate && (
                  <button onClick={onMigrate} disabled={migrating}
                    className="text-xs px-2.5 py-1.5 rounded-lg border disabled:opacity-40"
                    style={{ borderColor: '#6a8f6a', color: '#6a8f6a' }}>
                    {migrating ? '迁移中…' : '存入云端'}
                  </button>
                )}
                {isOwn && (
                  <button onClick={onPublish} disabled={publishing}
                    className="text-xs px-2.5 py-1.5 rounded-lg border disabled:opacity-40"
                    style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                    {publishing ? '发布中…' : '发布到书库'}
                  </button>
                )}
                <button onClick={onDelete}
                  className="text-xs px-2.5 py-1.5 rounded-lg border"
                  style={{ borderColor: '#dc2626', color: '#dc2626' }}>
                  删除
                </button>
              </>
            )}
            <Link href={`/local/${book.id}`}
              className="text-xs px-2.5 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              目录
            </Link>
            {book.chapters[0] && (
              <Link href={`/local/${book.id}/chapters/${book.chapters[0].id}`}
                className="text-xs px-2.5 py-1.5 rounded-lg text-white"
                style={{ backgroundColor: 'var(--accent)' }}>
                开始阅读
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 分类筛选条 ────────────────────────────────────────────────────
function CategoryBar({ selected, onSelect }: {
  selected: string | null
  onSelect: (c: string | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {CATEGORIES.map((cat) => {
        const active = selected === cat
        return (
          <button
            key={cat}
            onClick={() => onSelect(active ? null : cat)}
            className="text-xs px-3.5 py-1 rounded-full border transition-colors"
            style={{
              borderColor: active ? 'var(--accent)' : 'var(--border)',
              backgroundColor: active ? 'var(--accent-light)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
              letterSpacing: '0.02em',
            }}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}

// ── 区块标题 ──────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-medium tracking-[0.14em] uppercase"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </h2>
  )
}

// ── 主组件 ────────────────────────────────────────────────────────
export default function LocalBooks({ query = '', steinerBooks }: { query?: string; steinerBooks?: Book[] }) {
  const supabase = useMemo(() => createClient(), [])
  const [localBooks, setLocalBooks] = useState<Book[]>([])
  const [myCloudBooks, setMyCloudBooks] = useState<CloudBook[]>([])
  const [othersBooks, setOthersBooks] = useState<CloudBook[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [cloudLoaded, setCloudLoaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [migrating, setMigrating] = useState<string | null>(null)
  const [editingBook, setEditingBook] = useState<Book | null>(null)

  // 共享书库的状态
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sharedExpanded, setSharedExpanded] = useState(false)

  // ── 过滤逻辑 ──────────────────────────────────────────────────
  const matchesQuery = (title: string, author: string) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return title.toLowerCase().includes(q) || author.toLowerCase().includes(q)
  }

  const matchesCategory = (category: string | null) => {
    if (!selectedCategory) return true
    // "其他"：匹配没有分类或分类不在主分类列表里的书
    if (selectedCategory === '其他') {
      return !category || !MAIN_CATS.includes(category)
    }
    return category === selectedCategory
  }

  const filteredLocal = localBooks.filter((b) => matchesQuery(b.titleZh, b.author))
  const filteredMine = myCloudBooks.filter(({ book }) => matchesQuery(book.titleZh, book.author))
  const filteredOthers = othersBooks.filter(({ book, category }) =>
    matchesQuery(book.titleZh, book.author) && matchesCategory(category)
  )

  // 共享书库：折叠时只显示前 3 本（Supabase 已按 updated_at DESC 排序）
  const sharedVisible = sharedExpanded ? filteredOthers : filteredOthers.slice(0, 3)
  const hasMore = filteredOthers.length > 3

  // ── 操作处理器 ────────────────────────────────────────────────
  const handlePublish = async (book: Book) => {
    if (!confirm(`确认将《${book.titleZh}》发布到公共书库？\n发布后所有人可见，且会触发 Vercel 重新部署。`)) return
    setPublishing(book.id)
    try {
      const res = await fetch('/api/publish-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      })
      const data = await res.json()
      if (!res.ok) alert(`发布失败：${data.error}`)
      else alert(`《${book.titleZh}》已发布到公共书库。`)
    } catch {
      alert('网络错误，请稍后重试')
    } finally {
      setPublishing(null)
    }
  }

  const handleDeleteLocal = (bookId: string) => {
    if (!confirm('确认删除这本本地书籍？此操作不可撤销。')) return
    deleteLocalBook(bookId)
    setLocalBooks(getLocalBooks())
  }

  const handleDeleteCloud = async (bookId: string) => {
    if (!confirm('确认删除这本云端书籍？章节内容也会一并删除，且不可撤销。')) return
    await supabase.from('chapters').delete().eq('book_id', bookId)
    await supabase.from('local_books').delete().eq('id', bookId)
    setMyCloudBooks((prev) => prev.filter(({ book }) => book.id !== bookId))
    setOthersBooks((prev) => prev.filter(({ book }) => book.id !== bookId))
  }

  const handleMigrateToCloud = async (book: Book) => {
    if (!isLoggedIn) { alert('请先登录后再存入云端'); return }
    if (!confirm(`将《${book.titleZh}》存入云端？\n迁移后将从本地删除。`)) return
    setMigrating(book.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('请先登录'); return }

      const { data: newBook, error: bookErr } = await supabase
        .from('local_books')
        .insert({
          title: book.titleZh,
          author: book.author,
          description: book.description ?? null,
          category: book.category ?? null,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (bookErr || !newBook) { alert(`迁移失败：${bookErr?.message ?? '未知错误'}`); return }
      const newId = newBook.id

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

      deleteLocalBook(book.id)
      setLocalBooks(getLocalBooks())

      const { data: profile } = await supabase
        .from('profiles').select('display_name').eq('id', user.id).single()
      const cloudBook: CloudBook = {
        book: { ...book, id: newId, chapters: book.chapters.map((ch) => ({ ...ch, bookId: newId })) },
        user_id: user.id,
        uploader: profile?.display_name ?? '我',
        isOwn: true,
        category: book.category ?? null,
        updated_at: new Date().toISOString(),
      }
      setMyCloudBooks((prev) => [cloudBook, ...prev])
      alert(`《${book.titleZh}》已成功存入云端！`)
    } catch (err) {
      console.error(err)
      alert('迁移失败，请重试')
    } finally {
      setMigrating(null)
    }
  }

  const handleSaveEdit = async (updated: Book) => {
    saveLocalBook(updated)
    setLocalBooks(getLocalBooks())
    const isCloud = [...myCloudBooks, ...othersBooks].some(({ book }) => book.id === updated.id)
    if (isCloud) {
      await supabase.from('local_books').update({
        title: updated.titleZh,
        author: updated.author,
        description: updated.description,
        category: updated.category ?? null,
        updated_at: new Date().toISOString(),
      }).eq('id', updated.id)
      setMyCloudBooks((prev) => prev.map(({ book, ...rest }) =>
        book.id === updated.id ? { ...rest, book: updated, category: updated.category ?? null } : { ...rest, book }
      ))
      setOthersBooks((prev) => prev.map(({ book, ...rest }) =>
        book.id === updated.id ? { ...rest, book: updated, category: updated.category ?? null } : { ...rest, book }
      ))
    }
    setEditingBook(null)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        const items: Book[] = Array.isArray(data) ? data : [data]
        for (const item of items) {
          if (!item.id || !item.titleZh || !Array.isArray(item.chapters)) {
            alert('JSON 格式有误：缺少 id、titleZh 或 chapters 字段')
            return
          }
          saveLocalBook(item)
        }
        setLocalBooks(getLocalBooks())
      } catch {
        alert('文件解析失败，请确认是有效的 JSON 文件')
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  // ── 加载数据 ──────────────────────────────────────────────────
  useEffect(() => {
    setLocalBooks(getLocalBooks())

    async function loadCloud() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCloudLoaded(true); return }
      setIsLoggedIn(true)

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'admin') setIsAdmin(true)

      const { data: booksData } = await supabase
        .from('local_books')
        .select('id, title, author, description, category, user_id, updated_at, cover_image_url')
        .order('updated_at', { ascending: false })

      if (!booksData) { setCloudLoaded(true); return }

      // Fetch display names separately
      const userIds = [...new Set(booksData.map((r) => r.user_id).filter(Boolean))]
      const nameMap: Record<string, string> = {}
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles').select('id, display_name').in('id', userIds)
        for (const p of profiles ?? []) {
          nameMap[p.id] = p.display_name ?? '未知用户'
        }
      }

      // Fetch chapter stubs separately (book_id is text, no FK needed)
      const bookIds = booksData.map((r) => r.id)
      const chapterMap: Record<string, Array<{ id: string; order_index: number }>> = {}
      if (bookIds.length > 0) {
        const { data: chapterRows } = await supabase
          .from('chapters').select('id, book_id, order_index').in('book_id', bookIds)
        for (const ch of chapterRows ?? []) {
          if (!chapterMap[ch.book_id]) chapterMap[ch.book_id] = []
          chapterMap[ch.book_id].push({ id: ch.id, order_index: ch.order_index })
        }
      }

      const mine: CloudBook[] = []
      const others: CloudBook[] = []

      for (const row of booksData) {
        const chapterArr = (chapterMap[row.id] ?? []).sort((a, b) => a.order_index - b.order_index)
        const book: Book = {
          id: row.id,
          titleZh: row.title,
          titleOriginal: row.title,
          author: row.author ?? '',
          description: row.description ?? '',
          coverColor: '#4a6fa5',
          publishedYear: new Date().getFullYear(),
          chapters: chapterArr.map((ch) => ({
            id: ch.id,
            bookId: row.id,
            title: '',
            titleZh: '',
            orderIndex: ch.order_index,
            status: 'published' as const,
            blocks: [],
          })),
        }
        const entry: CloudBook = {
          book,
          user_id: row.user_id,
          uploader: nameMap[row.user_id] ?? '未知用户',
          isOwn: row.user_id === user.id,
          category: row.category ?? null,
          updated_at: row.updated_at ?? '',
          coverImageUrl: row.cover_image_url ?? undefined,
        }
        if (entry.isOwn) mine.push(entry)
        else others.push(entry)
      }

      setMyCloudBooks(mine)
      setOthersBooks(others)
      setCloudLoaded(true)
    }
    loadCloud()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 渲染 ──────────────────────────────────────────────────────
  return (
    <div>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* ════════════════ 我的书库 ════════════════ */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-baseline gap-2.5">
            <SectionLabel>我的书库</SectionLabel>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {localBooks.length + myCloudBooks.length} 本
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/my-books/new"
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              + 新建
            </Link>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              导入 JSON
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* 本地书籍 */}
          {filteredLocal.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              isOwn={true}
              onEdit={() => setEditingBook(book)}
              onDelete={() => handleDeleteLocal(book.id)}
              onPublish={() => handlePublish(book)}
              publishing={publishing === book.id}
              onMigrate={isLoggedIn ? () => handleMigrateToCloud(book) : undefined}
              migrating={migrating === book.id}
            />
          ))}

          {/* 我的云端书籍 */}
          {filteredMine.map(({ book, category, coverImageUrl }) => (
            <BookCard
              key={book.id}
              book={book}
              isOwn={true}
              isAdmin={isAdmin}
              category={category}
              coverImageUrl={coverImageUrl}
              onEdit={() => setEditingBook(book)}
              onDelete={() => handleDeleteCloud(book.id)}
              onPublish={() => handlePublish(book)}
              publishing={publishing === book.id}
            />
          ))}

          {/* 空状态 */}
          {filteredLocal.length === 0 && filteredMine.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {query ? '无匹配结果' : '还没有书籍，点击「+ 新建」或「导入 JSON」'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════ Steiner 著作 ════════════════ */}
      {steinerBooks && steinerBooks.length > 0 && (
        <div className="mb-14">
          <SteinerBooksSection books={steinerBooks} query={query} />
        </div>
      )}

      {/* ════════════════ 共享书库 ════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-baseline gap-2.5">
            <SectionLabel>共享书库</SectionLabel>
            {othersBooks.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {othersBooks.length} 本
              </span>
            )}
          </div>
        </div>

        {/* 分类导览 */}
        <CategoryBar selected={selectedCategory} onSelect={setSelectedCategory} />

        {/* 内容区 */}
        {!cloudLoaded ? (
          <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>加载中…</p>
        ) : !isLoggedIn ? (
          <div className="wc-card rounded-2xl border p-6 text-center">
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              登录后可查看其他成员上传的书籍
            </p>
            <a
              href="/login"
              className="text-sm px-5 py-2 rounded-lg text-white inline-block"
              style={{ backgroundColor: 'var(--accent)' }}>
              登录
            </a>
          </div>
        ) : filteredOthers.length === 0 ? (
          <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>
            {query || selectedCategory ? '无匹配结果' : '暂无其他成员上传的书籍'}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {sharedVisible.map(({ book, uploader, category, coverImageUrl }) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isOwn={false}
                  isAdmin={isAdmin}
                  uploader={uploader}
                  category={category}
                  coverImageUrl={coverImageUrl}
                  onEdit={isAdmin ? () => setEditingBook(book) : undefined}
                  onDelete={isAdmin ? () => handleDeleteCloud(book.id) : undefined}
                />
              ))}
            </div>

            {/* 展开 / 收起 */}
            {hasMore && (
              <button
                onClick={() => setSharedExpanded((v) => !v)}
                className="mt-5 w-full py-2.5 rounded-xl border text-sm transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'transparent',
                }}
              >
                {sharedExpanded
                  ? '收起'
                  : `展开全部 · 共 ${filteredOthers.length} 本`}
              </button>
            )}
          </>
        )}
      </section>

      {editingBook && (
        <EditBookModal
          book={editingBook}
          onSave={handleSaveEdit}
          onClose={() => setEditingBook(null)}
        />
      )}
    </div>
  )
}
