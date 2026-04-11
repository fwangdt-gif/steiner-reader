'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/data'

const inputStyle = {
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
}

export default function EditBookInfoPage() {
  const { bookId } = useParams<{ bookId: string }>()
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
  })

  useEffect(() => {
    async function load() {
      // Auth guard
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data, error } = await supabase
        .from('local_books')
        .select('title, author, description, category')
        .eq('id', bookId)
        .single()

      if (error || !data) {
        alert('书籍不存在或无权访问')
        router.push('/my-books')
        return
      }

      setForm({
        title: data.title ?? '',
        author: data.author ?? '',
        description: data.description ?? '',
        category: data.category ?? '',
      })
      setLoading(false)
    }
    load()
  }, [bookId, supabase, router])

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('local_books')
      .update({
        title: form.title,
        author: form.author,
        description: form.description || null,
        category: form.category || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookId)
    setSaving(false)
    if (error) {
      alert(`保存失败：${error.message}`)
      return
    }
    router.push('/my-books')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>加载中…</p>
    </div>
  )

  return (
    <div className="min-h-screen">
      <header className="wc-header sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/my-books" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ← 我的图书管理
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            编辑书籍信息
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">编辑书籍信息</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            修改将直接同步到云端
          </p>
        </div>

        <form onSubmit={handleSubmit} className="wc-card p-6 rounded-xl border flex flex-col gap-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              书名 *
            </label>
            <input
              required
              value={form.title}
              onChange={set('title')}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              作者 *
            </label>
            <input
              required
              value={form.author}
              onChange={set('author')}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              简介
            </label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              分类
            </label>
            <select
              value={form.category}
              onChange={set('category')}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            >
              <option value="">未分类</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/my-books"
              className="flex-1 py-2.5 rounded-xl border text-sm text-center"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={saving || !form.title || !form.author}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </form>

        {/* Quick link to chapter editor */}
        <div className="mt-4 text-center">
          <Link
            href={`/local/${bookId}/edit`}
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            → 前往章节编辑器
          </Link>
        </div>
      </main>
    </div>
  )
}
