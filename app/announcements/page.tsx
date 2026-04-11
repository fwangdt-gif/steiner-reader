'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
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

export default function AnnouncementsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        setIsAdmin(profile?.role === 'admin')
      }

      const { data } = await supabase
        .from('announcements')
        .select('id, title, content, event_time, location, is_pinned, created_at')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      setItems(data ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  return (
    <div className="min-h-screen">
      <header className="wc-header sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm" style={{ color: 'var(--text-secondary)' }}>← 首页</Link>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              共剪西窗烛
            </span>
          </div>
          {isAdmin && (
            <Link
              href="/admin/announcements"
              className="text-sm px-3 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              管理通知
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">读书会通知</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            共剪西窗烛 · 霜华满地白
          </p>
        </div>

        {loading ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>加载中…</p>
        ) : items.length === 0 ? (
          <p className="text-sm py-12 text-center" style={{ color: 'var(--text-muted)' }}>暂无通知</p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/announcements/${item.id}`}
                className="wc-card rounded-xl border p-5 block hover:opacity-90 transition-opacity"
              >
                <div className="flex items-start gap-2 mb-2">
                  {item.is_pinned && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                      置顶
                    </span>
                  )}
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h2>
                </div>

                {(item.event_time || item.location) && (
                  <p className="text-xs mb-2 font-medium" style={{ color: 'var(--accent)' }}>
                    {item.event_time && new Date(item.event_time).toLocaleString('zh-CN', {
                      month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                    {item.event_time && item.location && ' · '}
                    {item.location}
                  </p>
                )}

                <p className="text-sm leading-relaxed line-clamp-3"
                  style={{ color: 'var(--text-secondary)' }}>
                  {item.content}
                </p>

                <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                  {new Date(item.created_at).toLocaleDateString('zh-CN', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
