'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      })
      if (error) setError(error.message)
      else setMessage('注册成功！请检查邮箱完成验证，然后登录。')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/')
    }
    setLoading(false)
  }

  const inputStyle = {
    backgroundColor: 'var(--surface)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="wc-card w-full max-w-sm rounded-2xl border p-8">
        <h1 className="text-xl font-semibold mb-1">Steiner 共读平台</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          {mode === 'login' ? '登录你的账户' : '创建新账户'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="昵称"
              required
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            required
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            required
            minLength={6}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          {message && <p className="text-xs" style={{ color: 'var(--accent)' }}>{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="py-2 rounded-lg text-white text-sm disabled:opacity-40 mt-1"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {loading ? '请稍候…' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          {mode === 'login' ? '还没有账户？' : '已有账户？'}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
            className="ml-1 underline"
            style={{ color: 'var(--accent)' }}
          >
            {mode === 'login' ? '注册' : '登录'}
          </button>
        </p>
      </div>
    </div>
  )
}
