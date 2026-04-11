'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/data'

const COVER_COLORS = ['#4a6fa5', '#6a8f6a', '#7a6fa5', '#8a6244', '#6a7080']

const inputStyle = {
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
}

export default function NewBookPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    coverColor: COVER_COLORS[0],
  })

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Create book directly in Supabase — never touches localStorage
      const { data, error } = await supabase
        .from('local_books')
        .insert({
          title: form.title,
          author: form.author,
          description: form.description || null,
          category: form.category || null,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error || !data) {
        alert(`创建失败：${error?.message ?? '未知错误'}`)
        return
      }

      // Go directly to the chapter editor
      router.push(`/local/${data.id}/edit`)
    } catch (err) {
      alert(`出错：${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="wc-header sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/my-books" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ← 我的图书管理
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            新建书籍
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">新建书籍</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            书籍直接保存到云端，创建后可继续添加章节
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
              placeholder="输入书名"
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
              placeholder="输入作者名"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              简介（可选）
            </label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="一两句话介绍本书"
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

          <div>
            <label className="text-xs mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              书脊颜色
            </label>
            <div className="flex gap-2">
              {COVER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, coverColor: c }))}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: form.coverColor === c ? 'var(--text-primary)' : 'transparent',
                  }}
                />
              ))}
            </div>
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
              {saving ? '创建中…' : '创建并添加章节 →'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
