'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveLocalBook } from '@/lib/local-books'
import { CATEGORIES } from '@/lib/data'
import type { Book, ContentBlock } from '@/lib/data'

const COVER_COLORS = [
  { label: '蓝', value: '#4a6fa5' },
  { label: '绿', value: '#6a8f6a' },
  { label: '紫', value: '#7a6fa5' },
  { label: '棕', value: '#8a6244' },
  { label: '灰', value: '#6a7080' },
]

// 将多行文本按空行分割成段落 block 列表
function parseContent(text: string, chapterId: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  let idx = 0
  for (const para of text.split(/\n\s*\n/)) {
    const t = para.trim()
    if (!t) continue
    blocks.push({
      id: `${chapterId}-b${idx}`,
      blockIndex: idx++,
      blockType: 'paragraph',
      originalText: t,
      translationText: t,
    })
  }
  return blocks
}

export default function UploadPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    titleZh: '',
    titleOriginal: '',
    author: '',
    publishedYear: '',
    description: '',
    category: '',
    coverColor: COVER_COLORS[0].value,
    chapterTitle: '',
    chapterContent: '',
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const bookId = `local-${Date.now()}`
    const chapterId = `${bookId}-ch1`
    const book: Book = {
      id: bookId,
      titleOriginal: form.titleOriginal || form.titleZh,
      titleZh: form.titleZh,
      author: form.author,
      description: form.description,
      coverColor: form.coverColor,
      publishedYear: parseInt(form.publishedYear) || new Date().getFullYear(),
      category: form.category || undefined,
      chapters: [
        {
          id: chapterId,
          bookId,
          title: form.chapterTitle,
          titleZh: form.chapterTitle,
          orderIndex: 1,
          status: 'published',
          blocks: parseContent(form.chapterContent, chapterId),
        },
      ],
    }
    saveLocalBook(book)
    router.push(`/local/${bookId}`)
  }

  const inputStyle = {
    backgroundColor: 'var(--surface)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <div className="min-h-screen">
      <header className="wc-header sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            ← 书库
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>上传本地书籍</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">上传书籍</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            内容仅保存在当前浏览器，不会上传至服务器
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* 书籍基本信息 */}
          <div
            className="wc-card p-5 rounded-xl border"
          >
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
              书籍信息
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>书名 *</label>
                <input
                  required
                  value={form.titleZh}
                  onChange={set('titleZh')}
                  placeholder="中文书名"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>原文书名（可选）</label>
                <input
                  value={form.titleOriginal}
                  onChange={set('titleOriginal')}
                  placeholder="原文书名，留空则与书名相同"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>作者 *</label>
                  <input
                    required
                    value={form.author}
                    onChange={set('author')}
                    placeholder="作者名"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>年份</label>
                  <input
                    value={form.publishedYear}
                    onChange={set('publishedYear')}
                    placeholder="1904"
                    type="number"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>简介（可选）</label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder="一两句话介绍本书"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>分类</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="">未分类</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--text-secondary)' }}>书脊颜色</label>
                <div className="flex gap-2">
                  {COVER_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, coverColor: c.value }))}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: c.value,
                        borderColor: form.coverColor === c.value ? 'var(--text-primary)' : 'transparent',
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 第一章 */}
          <div
            className="wc-card p-5 rounded-xl border"
          >
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
              第一章内容
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>章节标题 *</label>
                <input
                  required
                  value={form.chapterTitle}
                  onChange={set('chapterTitle')}
                  placeholder="章节标题"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                  正文内容 *（用空行分隔段落）
                </label>
                <textarea
                  required
                  value={form.chapterContent}
                  onChange={set('chapterContent')}
                  placeholder={'在此粘贴正文内容…\n\n用空行分隔段落。\n\n每个空行后的内容会成为新段落。'}
                  rows={12}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y"
                  style={{ ...inputStyle, lineHeight: '1.7' }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white font-medium text-sm"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            保存到本地书库
          </button>
        </form>
      </main>
    </div>
  )
}
