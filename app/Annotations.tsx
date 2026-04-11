'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Annotation {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: { display_name: string | null } | null
}

interface Props {
  bookId: string
  chapterId: string
  blockId: string
  onClose: () => void
}

export default function Annotations({ bookId, chapterId, blockId, onClose }: Props) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  useEffect(() => {
    fetchAnnotations()
  }, [blockId])

  const fetchAnnotations = async () => {
    const { data } = await supabase
      .from('annotations')
      .select('id, user_id, content, created_at, profiles(display_name)')
      .eq('book_id', bookId)
      .eq('chapter_id', chapterId)
      .eq('block_id', blockId)
      .order('created_at', { ascending: true })
    setAnnotations((data as unknown as Annotation[]) ?? [])
  }

  const handleSubmit = async () => {
    if (!text.trim() || !user) return
    setLoading(true)
    await supabase.from('annotations').insert({
      user_id: user.id,
      book_id: bookId,
      chapter_id: chapterId,
      block_id: blockId,
      content: text.trim(),
    })
    setText('')
    await fetchAnnotations()
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('annotations').delete().eq('id', id)
    await fetchAnnotations()
  }

  return (
    <div
      className="rounded-xl border p-4 mt-2 mb-4"
      style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
          共 {annotations.length} 条批注
        </span>
        <button onClick={onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>关闭</button>
      </div>

      <div className="flex flex-col gap-3 mb-3">
        {annotations.map((a) => (
          <div key={a.id}>
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                {a.profiles?.display_name ?? '匿名读者'}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(a.created_at).toLocaleDateString('zh-CN')}
              </span>
              {user?.id === a.user_id && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-xs ml-auto"
                  style={{ color: 'var(--text-muted)' }}
                >
                  删除
                </button>
              )}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a.content}</p>
          </div>
        ))}
        {annotations.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>还没有批注，来写第一条吧</p>
        )}
      </div>

      {user ? (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="写下你的批注…"
            className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            className="px-3 py-1.5 rounded-lg text-white text-sm disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            发布
          </button>
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <a href="/login" className="underline" style={{ color: 'var(--accent)' }}>登录</a> 后可发表批注
        </p>
      )}
    </div>
  )
}
