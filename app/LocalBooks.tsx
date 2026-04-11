'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { getLocalBooks, saveLocalBook, deleteLocalBook } from '@/lib/local-books'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/data'
import type { Book } from '@/lib/data'

const COLORS = ['#4a6fa5', '#6a8f6a', '#7a6fa5', '#8a6244', '#6a7080']

const inputStyle = {
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
}

interface CloudBook {
  book: Book
  user_id: string
  uploader: string
  isOwn: boolean
  category: string | null
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

// ── Edit modal ────────────────────────────────────────────────────
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
        <h2 className="text-base font-semibold mb-4">编辑书名</h2>
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

// ── Book card ─────────────────────────────────────────────────────
function BookCard({ book, isOwn, uploader, category, onEdit, onDelete, onPublish, publishing }: {
  book: Book
  isOwn: boolean
  uploader?: string
  category?: string | null
  onEdit?: () => void
  onDelete?: () => void
  onPublish?: () => void
  publishing?: boolean
}) {
  return (
    <div className="wc-card rounded-xl border overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: book.coverColor }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-lg font-semibold leading-snug">{book.titleZh}</h3>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-1 flex-wrap justify-end">
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
          {book.author} · {book.publishedYear}
        </p>
        {book.description && (
          <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {book.description}
          </p>
        )}
        <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {book.chapters.length} 个章节
          </span>
          <div className="flex gap-2 flex-wrap justify-end">
            {isOwn && (
              <>
                <button onClick={onEdit}
                  className="text-sm px-3 py-1.5 rounded-lg border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  编辑书名
                </button>
                <Link href={`/local/${book.id}/edit`}
                  className="text-sm px-3 py-1.5 rounded-lg border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  编辑内容
                </Link>
                <button onClick={onPublish} disabled={publishing}
                  className="text-sm px-3 py-1.5 rounded-lg border disabled:opacity-40"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                  {publishing ? '发布中…' : '发布到书库'}
                </button>
                <button onClick={onDelete}
                  className="text-sm px-3 py-1.5 rounded-lg border"
                  style={{ borderColor: '#dc2626', color: '#dc2626' }}>
                  删除
                </button>
              </>
            )}
            <Link href={`/local/${book.id}`}
              className="text-sm px-3 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              目录
            </Link>
            {book.chapters[0] && (
              <Link href={`/local/${book.id}/chapters/${book.chapters[0].id}`}
                className="text-sm px-3 py-1.5 rounded-lg text-white"
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

// ── Section header ────────────────────────────────────────────────
function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {title}
      </h2>
      {badge && (
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
          {badge}
        </span>
      )}
    </div>
  )
}

// ── Search + category bar ─────────────────────────────────────────
function FilterBar({
  query, onQuery,
  categories, selected, onCategory,
}: {
  query: string
  onQuery: (q: string) => void
  categories: string[]
  selected: string | null
  onCategory: (c: string | null) => void
}) {
  return (
    <div className="mb-6">
      {/* Search input */}
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="搜索书名或作者…"
          className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none"
          style={inputStyle}
        />
        {query && (
          <button
            onClick={() => onQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >✕</button>
        )}
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategory(null)}
            className="text-xs px-3 py-1 rounded-full border transition-colors"
            style={{
              borderColor: selected === null ? 'var(--accent)' : 'var(--border)',
              backgroundColor: selected === null ? 'var(--accent-light)' : 'transparent',
              color: selected === null ? 'var(--accent)' : 'var(--text-secondary)',
            }}
          >全部</button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategory(selected === cat ? null : cat)}
              className="text-xs px-3 py-1 rounded-full border transition-colors"
              style={{
                borderColor: selected === cat ? 'var(--accent)' : 'var(--border)',
                backgroundColor: selected === cat ? 'var(--accent-light)' : 'transparent',
                color: selected === cat ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >{cat}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function LocalBooks() {
  const supabase = createClient()
  const [localBooks, setLocalBooks] = useState<Book[]>([])
  const [myCloudBooks, setMyCloudBooks] = useState<CloudBook[]>([])
  const [othersBooks, setOthersBooks] = useState<CloudBook[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [editingBook, setEditingBook] = useState<Book | null>(null)

  // ── Filter state ──────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // ── Derived: all categories from cloud books ───────────────────────
  const allCategories = useMemo(() => {
    const used = new Set([...myCloudBooks, ...othersBooks].map(({ category }) => category).filter(Boolean))
    return CATEGORIES.filter((c) => used.has(c))
  }, [myCloudBooks, othersBooks])

  // ── Filter helpers ────────────────────────────────────────────────
  const matchesQuery = (title: string, author: string) => {
    if (!query) return true
    const q = query.toLowerCase()
    return title.toLowerCase().includes(q) || author.toLowerCase().includes(q)
  }

  const matchesCategory = (category: string | null) => {
    if (!selectedCategory) return true
    return category === selectedCategory
  }

  const filteredLocal = localBooks.filter((b) => matchesQuery(b.titleZh, b.author))

  const filteredMine = myCloudBooks.filter(({ book, category }) =>
    matchesQuery(book.titleZh, book.author) && matchesCategory(category)
  )

  const filteredOthers = othersBooks.filter(({ book, category }) =>
    matchesQuery(book.titleZh, book.author) && matchesCategory(category)
  )

  // ── Handlers ──────────────────────────────────────────────────────
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
      else alert(`《${book.titleZh}》已发布到公共书库，Vercel 将自动重新部署。`)
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
    // Delete chapters first, then the book
    await supabase.from('chapters').delete().eq('book_id', bookId)
    await supabase.from('local_books').delete().eq('id', bookId)
    setMyCloudBooks((prev) => prev.filter(({ book }) => book.id !== bookId))
  }

  const handleSaveEdit = async (updated: Book) => {
    saveLocalBook(updated)
    setLocalBooks(getLocalBooks())
    // Sync to Supabase if this is a cloud book
    const isCloud = [...myCloudBooks, ...othersBooks].some(({ book }) => book.id === updated.id)
    if (isCloud) {
      await supabase.from('local_books').update({
        title: updated.titleZh,
        author: updated.author,
        description: updated.description,
        category: updated.category ?? null,
        updated_at: new Date().toISOString(),
      }).eq('id', updated.id)
      // Refresh cloud list
      setMyCloudBooks((prev) => prev.map(({ book, ...rest }) =>
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

  useEffect(() => {
    setLocalBooks(getLocalBooks())

    async function loadCloud() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('local_books')
        .select('id, title, author, description, category, user_id, profiles(display_name), chapters(id, order_index)')
        .order('updated_at', { ascending: false })

      if (!data) return

      const mine: CloudBook[] = []
      const others: CloudBook[] = []

      for (const row of data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profileArr = row.profiles as any
        const displayName: string =
          (Array.isArray(profileArr) ? profileArr[0]?.display_name : profileArr?.display_name) ?? '未知用户'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chapterArr: any[] = Array.isArray(row.chapters) ? row.chapters : []
        const book: Book = {
          id: row.id,
          titleZh: row.title,
          titleOriginal: row.title,
          author: row.author ?? '',
          description: row.description ?? '',
          coverColor: '#4a6fa5',
          publishedYear: new Date().getFullYear(),
          chapters: chapterArr
            .sort((a, b) => a.order_index - b.order_index)
            .map((ch) => ({
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
          uploader: displayName,
          isOwn: row.user_id === user.id,
          category: row.category ?? null,
        }
        if (entry.isOwn) mine.push(entry)
        else others.push(entry)
      }

      setMyCloudBooks(mine)
      setOthersBooks(others)
    }
    loadCloud()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mb-8">
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {/* ── Search + category filter ── */}
      <FilterBar
        query={query}
        onQuery={setQuery}
        categories={allCategories}
        selected={selectedCategory}
        onCategory={setSelectedCategory}
      />

      {/* ── 本地书籍 ── */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          本地书籍
        </h2>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-muted)' }}>
          仅在本设备可见
        </span>
        <button onClick={() => fileInputRef.current?.click()}
          className="ml-auto text-xs px-3 py-1 rounded-lg border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          导入 JSON
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {filteredLocal.length === 0 && (
          <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>
            {query ? '无匹配结果' : '暂无本地书籍，可上传或导入 JSON'}
          </p>
        )}
        {filteredLocal.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            isOwn={true}
            onEdit={() => setEditingBook(book)}
            onDelete={() => handleDeleteLocal(book.id)}
            onPublish={() => handlePublish(book)}
            publishing={publishing === book.id}
          />
        ))}
      </div>

      {/* ── 我的云端书籍 ── */}
      {myCloudBooks.length > 0 && (
        <div className="mt-10">
          <SectionHeader title="我的云端书籍" badge="云端同步" />
          <div className="flex flex-col gap-4">
            {filteredMine.length === 0 && (
              <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>无匹配结果</p>
            )}
            {filteredMine.map(({ book, category }) => (
              <BookCard
                key={book.id}
                book={book}
                isOwn={true}
                category={category}
                onEdit={() => setEditingBook(book)}
                onDelete={() => handleDeleteCloud(book.id)}
                onPublish={() => handlePublish(book)}
                publishing={publishing === book.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 共享书库 ── */}
      {othersBooks.length > 0 && (
        <div className="mt-10">
          <SectionHeader title="共享书库" badge="他人上传" />
          <div className="flex flex-col gap-4">
            {filteredOthers.length === 0 && (
              <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>无匹配结果</p>
            )}
            {filteredOthers.map(({ book, uploader, category }) => (
              <BookCard
                key={book.id}
                book={book}
                isOwn={false}
                uploader={uploader}
                category={category}
              />
            ))}
          </div>
        </div>
      )}

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
