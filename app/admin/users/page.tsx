'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserRow {
  id: string
  display_name: string | null
  role: string
  created_at: string
}

export default function AdminUsersPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/'); return }

      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, role, created_at')
        .order('created_at', { ascending: false })

      setUsers(data ?? [])
      setLoading(false)
    }
    load()
  }, [supabase, router])

  async function toggleRole(u: UserRow) {
    const next = u.role === 'admin' ? 'user' : 'admin'
    if (!confirm(`将 ${u.display_name || u.id.slice(0, 8)} 设为「${next === 'admin' ? '管理员' : '普通用户'}」？`)) return
    setUpdating(u.id)
    await supabase.from('profiles').update({ role: next }).eq('id', u.id)
    setUsers((prev) => prev.map((r) => r.id === u.id ? { ...r, role: next } : r))
    setUpdating(null)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>加载中…</p>
    </div>
  )

  return (
    <div className="min-h-screen">
      <header className="wc-header sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-sm" style={{ color: 'var(--text-secondary)' }}>← 首页</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>用户管理</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold">全部用户</h1>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{users.length} 人</span>
        </div>

        <div className="flex flex-col gap-3">
          {users.map((u) => (
            <div key={u.id} className="wc-card rounded-xl border p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {u.display_name || '（未设置昵称）'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {u.id.slice(0, 16)}… · 注册于 {new Date(u.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: u.role === 'admin' ? 'var(--accent-light)' : 'var(--warm-100)',
                    color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {u.role === 'admin' ? '管理员' : '普通用户'}
                </span>
                <button
                  onClick={() => toggleRole(u)}
                  disabled={updating === u.id}
                  className="text-xs px-2.5 py-1 rounded-lg border disabled:opacity-40"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  {updating === u.id ? '…' : u.role === 'admin' ? '撤销管理员' : '设为管理员'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
