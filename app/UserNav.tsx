'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function UserNav() {
  // Stable client — never recreated across renders
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [user, setUser] = useState<User | null | undefined>(undefined) // undefined = loading
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Auth + role ───────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setIsAdmin(profile?.role === 'admin')
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) { setIsAdmin(false); setOpen(false) }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  // ── Close on outside click ─────────────────────────────────────────
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleSignOut = async () => {
    setOpen(false)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Still resolving auth state — render nothing to avoid flash
  if (user === undefined) return null

  // ── Logged out ────────────────────────────────────────────────────
  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm px-3 py-1.5 rounded-lg border"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        登录
      </Link>
    )
  }

  const name = user.user_metadata?.display_name || user.email?.split('@')[0] || '用户'

  // ── Logged in with dropdown ───────────────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        {isAdmin && (
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            管理
          </span>
        )}
        <span className="max-w-24 truncate">{name}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border shadow-lg z-50 overflow-hidden py-1"
          style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
        >
          {/* Admin section */}
          {isAdmin && (
            <>
              <div
                className="px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
              >
                管理员
              </div>
              <MenuItem href="/admin/books" onClick={() => setOpen(false)}>书籍管理</MenuItem>
              <MenuItem href="/admin/announcements" onClick={() => setOpen(false)}>通知管理</MenuItem>
              <MenuItem href="/admin/users" onClick={() => setOpen(false)}>用户管理</MenuItem>
              <Divider />
            </>
          )}

          {/* User section */}
          <MenuItem href="/my-books" onClick={() => setOpen(false)}>我的图书管理</MenuItem>
          <Divider />

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2.5 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--warm-100)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────

function MenuItem({
  href,
  onClick,
  children,
}: {
  href: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2.5 text-sm transition-colors"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--warm-100)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {children}
    </Link>
  )
}

function Divider() {
  return <div className="my-1 mx-3" style={{ borderTop: '1px solid var(--border)' }} />
}
