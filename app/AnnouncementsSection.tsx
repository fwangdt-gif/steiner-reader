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

function formatEventTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', {
    month: 'long', day: 'numeric', weekday: 'short',
  })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function AnnouncementsSection() {
  const supabase = useMemo(() => createClient(), [])
  const [items, setItems] = useState<Announcement[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Check admin
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setIsAdmin(profile?.role === 'admin')
      }

      // Pinned first, then newest — show up to 4
      const { data } = await supabase
        .from('announcements')
        .select('id, title, content, event_time, location, is_pinned, created_at')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(4)

      setItems(data ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  // Hide section entirely if no content and not admin
  if (!loading && items.length === 0 && !isAdmin) return null

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: '#b5845a' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            共剪西窗烛
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            · 读书会通知
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin/announcements"
              className="text-xs px-3 py-1 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              + 发布通知
            </Link>
          )}
          {items.length > 0 && (
            <Link
              href="/announcements"
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              全部 →
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-sm py-3" style={{ color: 'var(--text-muted)' }}>加载中…</p>
      ) : items.length === 0 ? (
        <div className="wc-card rounded-xl border p-5 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            暂无通知 · 点击「发布通知」添加第一条
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/announcements/${item.id}`}
              className="wc-card rounded-xl border p-4 flex items-start gap-3 hover:opacity-90 transition-opacity"
            >
              {/* Pinned badge */}
              {item.is_pinned && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 font-medium"
                  style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                >
                  置顶
                </span>
              )}

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug"
                  style={{ color: 'var(--text-primary)' }}>
                  {item.title}
                </p>

                {/* Event time + location */}
                {(item.event_time || item.location) && (
                  <p className="text-xs mt-0.5 font-medium"
                    style={{ color: 'var(--accent)' }}>
                    {item.event_time && formatEventTime(item.event_time)}
                    {item.event_time && item.location && ' · '}
                    {item.location}
                  </p>
                )}

                {/* Content preview */}
                <p className="text-xs mt-1 line-clamp-2 leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}>
                  {item.content}
                </p>
              </div>

              {/* Date */}
              <span className="text-xs flex-shrink-0 mt-0.5"
                style={{ color: 'var(--text-muted)' }}>
                {formatDate(item.created_at)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
