'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
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

export default function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = useMemo(() => createClient(), [])
  const [item, setItem] = useState<Announcement | null | undefined>(undefined)
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
        .eq('id', id)
        .single()

      setItem(data ?? null)
    }
    load()
  }, [id, supabase])

  if (item === undefined) return null  // loading

  if (!item) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>通知不存在</p>
        <Link href="/announcements" className="text-sm" style={{ color: 'var(--accent)' }}>← 返回列表</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <header className="wc-header sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/announcements" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              ← 通知列表
            </Link>
          </div>
          {isAdmin && (
            <Link
              href={`/admin/announcements/${item.id}/edit`}
              className="text-sm px-3 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              编辑
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <article className="wc-card rounded-xl border p-6">
          {/* Title + pinned */}
          <div className="flex items-start gap-2 mb-3">
            {item.is_pinned && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5"
                style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                置顶
              </span>
            )}
            <h1 className="text-xl font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
              {item.title}
            </h1>
          </div>

          {/* Event info */}
          {(item.event_time || item.location) && (
            <div className="mb-4 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--accent-light)' }}>
              {item.event_time && (
                <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                  📅{' '}
                  {new Date(item.event_time).toLocaleString('zh-CN', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    weekday: 'long', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
              {item.location && (
                <p className="text-sm mt-1" style={{ color: 'var(--accent)' }}>
                  📍 {item.location}
                </p>
              )}
            </div>
          )}

          {/* Content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--text-primary)' }}>
            {item.content}
          </div>

          {/* Footer */}
          <p className="text-xs mt-6 pt-4 border-t" style={{
            color: 'var(--text-muted)', borderColor: 'var(--border)',
          }}>
            发布于 {new Date(item.created_at).toLocaleDateString('zh-CN', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </article>
      </main>
    </div>
  )
}
