'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Note {
  id: string
  content: string
  updated_at: string
}

export default function NotesPanel({
  bookId,
  chapterId,
  onClose,
}: {
  bookId: string
  chapterId: string
  onClose: () => void
}) {
  const supabase = useMemo(() => createClient(), [])
  const [note, setNote] = useState<Note | null>(null)
  const [text, setText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('notes')
        .select('id, content, updated_at')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .eq('chapter_id', chapterId)
        .maybeSingle()

      if (data) { setNote(data); setText(data.content) }
      setLoading(false)
    }
    load()
  }, [bookId, chapterId, supabase])

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      if (note) {
        // Update existing
        const { data } = await supabase
          .from('notes')
          .update({ content: text, updated_at: now })
          .eq('id', note.id)
          .select('id, content, updated_at')
          .single()
        if (data) setNote(data)
      } else {
        // Create new
        const { data } = await supabase
          .from('notes')
          .insert({ user_id: userId, book_id: bookId, chapter_id: chapterId, content: text })
          .select('id, content, updated_at')
          .single()
        if (data) setNote(data)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!note || !confirm('确认删除这条笔记？')) return
    await supabase.from('notes').delete().eq('id', note.id)
    setNote(null)
    setText('')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-2xl flex flex-col"
        style={{
          backgroundColor: 'var(--surface-raised)',
          maxHeight: '80vh',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--warm-200)' }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            本章笔记
          </span>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded"
            style={{ color: 'var(--text-muted)' }}>
            关闭
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>加载中…</p>
          </div>
        ) : !userId ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>登录后才能记笔记</p>
          </div>
        ) : (
          <>
            {/* Textarea */}
            <div className="px-5 pt-4 flex-1 overflow-y-auto">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="记录你的理解、疑问或摘录…"
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                style={{
                  minHeight: '140px',
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  lineHeight: '1.8',
                }}
              />
              {note && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  上次保存：{new Date(note.updated_at).toLocaleString('zh-CN', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 pt-3 pb-5 flex items-center justify-between">
              {note ? (
                <button
                  onClick={handleDelete}
                  className="text-sm px-4 py-2 rounded-lg"
                  style={{ color: '#dc2626', backgroundColor: '#fee2e2' }}
                >
                  删除笔记
                </button>
              ) : <div />}
              <button
                onClick={handleSave}
                disabled={saving || !text.trim()}
                className="text-sm px-5 py-2 rounded-lg text-white font-medium disabled:opacity-40"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
