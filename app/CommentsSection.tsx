'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  display_name: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1)   return '刚刚'
  if (diffMin < 60)  return `${diffMin} 分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24)    return `${diffH} 小时前`
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function CommentsSection({
  bookId,
  chapterId,
}: {
  bookId: string
  chapterId: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      // Auth + role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, display_name')
          .eq('id', user.id)
          .single()
        setIsAdmin(profile?.role === 'admin')
        setUserName(
          profile?.display_name ||
          user.user_metadata?.display_name ||
          user.email?.split('@')[0] ||
          '用户'
        )
      }

      // Load comments + display names via profiles join
      const { data } = await supabase
        .from('comments')
        .select('id, user_id, content, created_at, profiles(display_name)')
        .eq('book_id', bookId)
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: true })

      if (data) {
        setComments(data.map((row) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = row.profiles as any
          const name: string =
            (Array.isArray(p) ? p[0]?.display_name : p?.display_name) ?? '匿名'
          return {
            id: row.id,
            user_id: row.user_id,
            content: row.content,
            created_at: row.created_at,
            display_name: name,
          }
        }))
      }
      setLoading(false)
    }
    load()
  }, [bookId, chapterId, supabase])

  // ── Submit ────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !userId) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          book_id: bookId,
          chapter_id: chapterId,
          user_id: userId,
          content: text.trim(),
        })
        .select('id, user_id, content, created_at')
        .single()

      if (error) { alert(`评论失败：${error.message}`); return }
      if (data) {
        setComments((prev) => [
          ...prev,
          {
            id: data.id,
            user_id: data.user_id,
            content: data.content,
            created_at: data.created_at,
            display_name: '匿名',
          },
        ])
        setText('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('确认删除这条评论？')) return
    setDeleting(id)
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) { alert(`删除失败：${error.message}`); setDeleting(null); return }
    setComments((prev) => prev.filter((c) => c.id !== id))
    setDeleting(null)
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <section
      className="mt-12 pt-8 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
        本章讨论
        {comments.length > 0 && (
          <span className="ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
            {comments.length} 条
          </span>
        )}
      </h2>

      {/* List */}
      {loading ? (
        <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>加载中…</p>
      ) : comments.length === 0 && !userId ? null : comments.length === 0 ? (
        <p className="text-sm pb-5" style={{ color: 'var(--text-muted)' }}>
          还没有讨论，来发第一条吧
        </p>
      ) : (
        <div className="flex flex-col gap-5 mb-6">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
              >
                匿
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    匿名
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(c.created_at)}
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {c.content}
                </p>
                {/* Delete — own comment or admin */}
                {(userId === c.user_id || isAdmin) && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="text-xs mt-1.5 disabled:opacity-40"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {deleting === c.id ? '删除中…' : '删除'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      {userId ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="写下你的看法或问题…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              lineHeight: '1.7',
            }}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="text-sm px-5 py-1.5 rounded-lg text-white font-medium disabled:opacity-40"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {submitting ? '发送中…' : '发送'}
            </button>
          </div>
        </form>
      ) : (
        <div
          className="wc-card rounded-xl border p-4 text-center"
        >
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            登录后参与本章讨论
          </p>
          <Link
            href="/login"
            className="text-sm px-5 py-1.5 rounded-lg text-white inline-block"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            登录
          </Link>
        </div>
      )}

      <div className="pb-8" />
    </section>
  )
}
