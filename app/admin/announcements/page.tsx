'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Announcement {
  id: string
  title: string
  content: string
  event_time: string | null
  location: string | null
  is_pinned: boolean
  created_at: string
}

type FormState = {
  title: string
  content: string
  event_time: string
  location: string
  is_pinned: boolean
}

const EMPTY_FORM: FormState = {
  title: '',
  content: '',
  event_time: '',
  location: '',
  is_pinned: false,
}

const inputStyle = {
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
}

export default function AdminAnnouncementsPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)   // null = new
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // ── Auth + admin guard ────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/'); return }

      setUserId(user.id)
      await fetchAll()
      setLoading(false)
    }
    load()
  }, [supabase, router]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAll() {
    const { data } = await supabase
      .from('announcements')
      .select('id, title, content, event_time, location, is_pinned, created_at')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setItems(data ?? [])
  }

  // ── Form helpers ─────────────────────────────────────────────────
  const set =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(item: Announcement) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      content: item.content,
      event_time: item.event_time
        ? new Date(item.event_time).toISOString().slice(0, 16)
        : '',
      location: item.location ?? '',
      is_pinned: item.is_pinned,
    })
    setShowForm(true)
  }

  // ── Save ─────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        content: form.content,
        event_time: form.event_time ? new Date(form.event_time).toISOString() : null,
        location: form.location || null,
        is_pinned: form.is_pinned,
        updated_at: new Date().toISOString(),
      }

      if (editingId) {
        const { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingId)
        if (error) { alert(`保存失败：${error.message}`); return }
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert({ ...payload, created_by: userId })
        if (error) { alert(`发布失败：${error.message}`); return }
      }

      setShowForm(false)
      setForm(EMPTY_FORM)
      setEditingId(null)
      await fetchAll()
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('确认删除这条通知？')) return
    setDeleting(id)
    await supabase.from('announcements').delete().eq('id', id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    setDeleting(null)
  }

  // ── Toggle pinned ─────────────────────────────────────────────────
  async function handleTogglePin(item: Announcement) {
    await supabase
      .from('announcements')
      .update({ is_pinned: !item.is_pinned, updated_at: new Date().toISOString() })
      .eq('id', item.id)
    setItems((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, is_pinned: !i.is_pinned } : i)
    )
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
            <Link href="/" className="text-sm" style={{ color: 'var(--text-secondary)' }}>← 首页</Link>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              通知管理
            </span>
          </div>
          <button
            onClick={openNew}
            className="text-sm px-4 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            + 发布通知
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* ── Create / Edit form ── */}
        {showForm && (
          <div className="wc-card rounded-xl border p-5 mb-6">
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {editingId ? '编辑通知' : '发布新通知'}
            </h2>
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  标题 *
                </label>
                <input
                  required
                  value={form.title}
                  onChange={set('title')}
                  placeholder="通知标题"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  内容 *
                </label>
                <textarea
                  required
                  value={form.content}
                  onChange={set('content')}
                  placeholder="通知正文，支持换行"
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y"
                  style={inputStyle}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    活动时间（可选）
                  </label>
                  <input
                    type="datetime-local"
                    value={form.event_time}
                    onChange={set('event_time')}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    地点（可选）
                  </label>
                  <input
                    value={form.location}
                    onChange={set('location')}
                    placeholder="线上 / 具体地址"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) => setForm((p) => ({ ...p, is_pinned: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>置顶此通知</span>
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null) }}
                  className="flex-1 py-2 rounded-lg border text-sm"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {saving ? '保存中…' : editingId ? '保存修改' : '发布'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── List ── */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            全部通知
          </h1>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{items.length} 条</span>
        </div>

        {items.length === 0 ? (
          <p className="text-sm py-12 text-center" style={{ color: 'var(--text-muted)' }}>
            还没有通知，点击右上角发布
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="wc-card rounded-xl border p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.is_pinned && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                          置顶
                        </span>
                      )}
                      <p className="text-sm font-semibold truncate"
                        style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </p>
                    </div>
                    {(item.event_time || item.location) && (
                      <p className="text-xs mb-1 font-medium" style={{ color: 'var(--accent)' }}>
                        {item.event_time && new Date(item.event_time).toLocaleString('zh-CN', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                        {item.event_time && item.location && ' · '}
                        {item.location}
                      </p>
                    )}
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {item.content}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString('zh-CN', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePin(item)}
                      className="text-xs px-2.5 py-1 rounded-lg border"
                      style={{
                        borderColor: item.is_pinned ? '#92400e' : 'var(--border)',
                        color: item.is_pinned ? '#92400e' : 'var(--text-muted)',
                      }}
                    >
                      {item.is_pinned ? '取消置顶' : '置顶'}
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="text-xs px-2.5 py-1 rounded-lg border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="text-xs px-2.5 py-1 rounded-lg border disabled:opacity-40"
                      style={{ borderColor: '#dc2626', color: '#dc2626' }}
                    >
                      {deleting === item.id ? '…' : '删除'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
