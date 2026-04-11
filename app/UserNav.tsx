'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

export default function UserNav() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

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

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{name}</span>
      <button
        onClick={() => supabase.auth.signOut()}
        className="text-xs px-2 py-1 rounded-lg border"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        退出
      </button>
    </div>
  )
}
