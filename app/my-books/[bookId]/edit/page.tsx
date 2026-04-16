'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/data'

const inputStyle = {
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
}

export default function EditBookInfoPage() {
  const { bookId } = useParams<{ bookId: string }>()
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [form, setForm] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
  })
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Try with cover_image_url; fall back if the column doesn't exist yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = null
      const ir1 = await supabase
        .from('local_books')
        .select('title, author, description, category, cover_image_url')
        .eq('id', bookId)
        .single()
      if (!ir1.error) {
        data = ir1.data
      } else {
        const ir2 = await supabase
          .from('local_books')
          .select('title, author, description, category')
          .eq('id', bookId)
          .single()
        data = ir2.data
      }

      if (!data) {
        alert('书籍不存在或无权访问')
        router.push('/my-books')
        return
      }

      setForm({
        title: data.title ?? '',
        author: data.author ?? '',
        description: data.description ?? '',
        category: data.category ?? '',
      })
      setCoverImageUrl((data as Record<string, unknown>).cover_image_url as string | null ?? null)
      setLoading(false)
    }
    load()
  }, [bookId, supabase, router])

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `covers/${bookId}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, file, { cacheControl: '3600', upsert: true })
      if (uploadError) { alert(`封面上传失败：${uploadError.message}`); return }
      const { data } = supabase.storage.from('images').getPublicUrl(path)
      const url = data.publicUrl
      const { error: updateError } = await supabase
        .from('local_books')
        .update({ cover_image_url: url })
        .eq('id', bookId)
      if (updateError) { alert(`保存封面链接失败：${updateError.message}`); return }
      setCoverImageUrl(url)
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const handleRemoveCover = async () => {
    if (!confirm('确认移除封面图片？')) return
    await supabase.from('local_books').update({ cover_image_url: null }).eq('id', bookId)
    setCoverImageUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('local_books')
      .update({
        title: form.title,
        author: form.author,
        description: form.description || null,
        category: form.category || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookId)
    setSaving(false)
    if (error) {
      alert(`保存失败：${error.message}`)
      return
    }
    router.push('/my-books')
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
          <Link href="/my-books" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ← 我的图书管理
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            编辑书籍信息
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">编辑书籍信息</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            修改将直接同步到云端
          </p>
        </div>

        {/* ── 封面图片 ── */}
        <div className="wc-card p-6 rounded-xl border mb-4">
          <label className="text-xs mb-3 block font-medium" style={{ color: 'var(--text-secondary)' }}>
            封面图片
          </label>
          {coverImageUrl ? (
            <div className="flex items-start gap-4">
              <img
                src={coverImageUrl}
                alt="封面"
                className="rounded-lg object-cover flex-shrink-0"
                style={{ width: 100, height: 140 }}
              />
              <div className="flex flex-col gap-2 pt-1">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  {uploadingCover ? '上传中…' : '更换图片'}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="text-xs px-3 py-1.5 rounded-lg border"
                  style={{ borderColor: '#dc2626', color: '#dc2626' }}
                >
                  移除封面
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="w-full py-8 rounded-xl border-2 border-dashed text-sm disabled:opacity-40"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                {uploadingCover ? '上传中…' : '点击上传封面图片'}
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="wc-card p-6 rounded-xl border flex flex-col gap-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              书名 *
            </label>
            <input
              required
              value={form.title}
              onChange={set('title')}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              作者 *
            </label>
            <input
              required
              value={form.author}
              onChange={set('author')}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              简介
            </label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              分类
            </label>
            <select
              value={form.category}
              onChange={set('category')}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={inputStyle}
            >
              <option value="">未分类</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/my-books"
              className="flex-1 py-2.5 rounded-xl border text-sm text-center"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={saving || !form.title || !form.author}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <Link
            href={`/local/${bookId}/edit`}
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            → 前往章节编辑器
          </Link>
        </div>
      </main>
    </div>
  )
}
