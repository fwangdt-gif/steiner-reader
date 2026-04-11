'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Reflection {
  id: string
  user_id: string
  title: string
  content: string
  is_public: boolean
  created_at: string
  display_name: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function ReflectionsSection({ bookId }: { bookId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [items, setItems] = useState<Reflection[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', content: '', is_public: false })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles').select('role, display_name').eq('id', user.id).single()
        setIsAdmin(profile?.role === 'admin')
        setUserName(
          profile?.display_name ||
          user.user_metadata?.display_name ||
          user.email?.split('@')[0] || '用户'
        )
      }

      await fetchReflections(user?.id ?? null)
      setLoading(false)
    }
    load()
  }, [bookId, supabase]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchReflections(uid: string | null) {
    const { data } = await supabase
      .from('reflections')
      .select('id, user_id, title, content, is_public, created_at, profiles(display_name)')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false })

    if (data) {
      setItems(data.map((row) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = row.profiles as any
        return {
          id: row.id,
          user_id: row.user_id,
          title: row.title,
          content: row.content,
          is_public: row.is_public,
          created_at: row.created_at,
          display_name: (Array.isArray(p) ? p[0]?.display_name : p?.display_name) ?? '匿名',
        }
      }))
    }
  }

  function openNew() {
    setEditingId(null)
    setForm({ title: '', content: '', is_public: false })
    setShowForm(true)
  }

  function openEdit(r: Reflection) {
    setEditingId(r.id)
    setForm({ title: r.title, content: r.content, is_public: r.is_public })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      if (editingId) {
        await supabase.from('reflections').update({
          title: form.title,
          content: form.content,
          is_public: form.is_public,
          updated_at: now,
        }).eq('id', editingId)
      } else {
        await supabase.from('reflections').insert({
          user_id: userId,
          book_id: bookId,
          title: form.title,
          content: form.content,
          is_public: form.is_public,
        })
      }
      setShowForm(false)
      setEditingId(null)
      await fetchReflections(userId)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除这篇读后感？')) return
    setDeleting(id)
    await supabase.from('reflections').delete().eq('id', id)
    setItems((prev) => prev.filter((r) => r.id !== id))
    setDeleting(null)
  }

  if (loading) return null

  return (
    <section className="mt-10 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          读后感
          {items.length > 0 && (
            <span className="ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
              {items.length} 篇
            </span>
          )}
        </h2>
        {userId && !showForm && (
          <button
            onClick={openNew}
            className="text-xs px-3 py-1 rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            + 写读后感
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="wc-card rounded-xl border p-4 mb-5 flex flex-col gap-3">
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="标题（可选）"
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <textarea
            required
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            placeholder="写下读完这本书的感想、收获或思考…"
            rows={6}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', lineHeight: '1.8' }}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm((p) => ({ ...p, is_public: e.target.checked }))}
            />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              公开（其他人可以看到）
            </span>
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }}
              className="flex-1 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              取消
            </button>
            <button type="submit" disabled={saving || !form.content.trim()}
              className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: 'var(--accent)' }}>
              {saving ? '保存中…' : editingId ? '保存修改' : '发布'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {items.length === 0 && !showForm ? (
        <p className="text-sm pb-4" style={{ color: 'var(--text-muted)' }}>
          {userId ? '还没有读后感，点击「写读后感」' : '暂无公开读后感'}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((r) => (
            <div key={r.id} className="wc-card rounded-xl border p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  {r.title && (
                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                      {r.title}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {r.display_name} · {formatDate(r.created_at)}
                    {!r.is_public && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-muted)' }}>
                        私密
                      </span>
                    )}
                  </p>
                </div>
                {(userId === r.user_id || isAdmin) && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    {userId === r.user_id && (
                      <button onClick={() => openEdit(r)}
                        className="text-xs px-2 py-1 rounded-lg border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        编辑
                      </button>
                    )}
                    <button onClick={() => handleDelete(r.id)}
                      disabled={deleting === r.id}
                      className="text-xs px-2 py-1 rounded-lg border disabled:opacity-40"
                      style={{ borderColor: '#dc2626', color: '#dc2626' }}>
                      {deleting === r.id ? '…' : '删除'}
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--text-secondary)' }}>
                {r.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
