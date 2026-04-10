'use client'

import { useRef, useState } from 'react'
import { saveLocalBook } from '@/lib/local-books'
import type { Book, ContentBlock } from '@/lib/data'

// 解析 .md / .txt 内容为 ContentBlock 数组
function parseBlocks(text: string, chapterId: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  let idx = 0
  let buf: string[] = []

  const flush = () => {
    const t = buf.join(' ').trim()
    if (t) {
      blocks.push({ id: `${chapterId}-b${idx}`, blockIndex: idx++, blockType: 'paragraph', originalText: t, translationText: t })
    }
    buf = []
  }

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) { flush(); continue }
    if (line.startsWith('# '))  { flush(); blocks.push({ id: `${chapterId}-b${idx}`, blockIndex: idx++, blockType: 'heading',    originalText: line.slice(2), translationText: line.slice(2) }); continue }
    if (line.startsWith('## ')) { flush(); blocks.push({ id: `${chapterId}-b${idx}`, blockIndex: idx++, blockType: 'subheading', originalText: line.slice(3), translationText: line.slice(3) }); continue }
    if (line.startsWith('> '))  { flush(); blocks.push({ id: `${chapterId}-b${idx}`, blockIndex: idx++, blockType: 'quote',      originalText: line.slice(2), translationText: line.slice(2) }); continue }
    buf.push(line)
  }
  flush()
  return blocks
}

const COLORS = ['#4a6fa5', '#6a8f6a', '#7a6fa5', '#8a6244', '#6a7080']

const inputStyle = {
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
}

export default function UploadFileModal() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [form, setForm] = useState({
    title: '',
    author: '',
    year: String(new Date().getFullYear()),
    color: COLORS[0],
  })
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setContent(text)
      // 用文件名（去掉扩展名）预填书名
      const name = file.name.replace(/\.(md|txt)$/i, '')
      setForm((prev) => ({ ...prev, title: prev.title || name }))
      setOpen(true)
    }
    reader.readAsText(file)
    // 重置 input，允许重复选同一文件
    e.target.value = ''
  }

  const buildBook = (): Book => {
    const bookId = `upload-${Date.now()}`
    const chapterId = `${bookId}-ch1`
    return {
      id: bookId,
      titleOriginal: form.title,
      titleZh: form.title,
      author: form.author,
      description: '',
      coverColor: form.color,
      publishedYear: parseInt(form.year) || new Date().getFullYear(),
      chapters: [{
        id: chapterId,
        bookId,
        title: form.title,
        titleZh: form.title,
        orderIndex: 1,
        status: 'published',
        blocks: parseBlocks(content, chapterId),
      }],
    }
  }

  const close = () => {
    setOpen(false)
    setContent('')
    setForm({ title: '', author: '', year: String(new Date().getFullYear()), color: COLORS[0] })
  }

  const handleSaveLocal = () => {
    saveLocalBook(buildBook())
    close()
    window.location.reload()
  }

  const handlePublish = async () => {
    if (!form.title || !form.author) return
    setLoading(true)
    try {
      const res = await fetch('/api/publish-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBook()),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`发布失败：${data.error}`)
      } else {
        alert('发布成功，Vercel 将自动重新部署')
        close()
      }
    } catch {
      alert('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const blockCount = parseBlocks(content, 'preview').length

  return (
    <>
      {/* 隐藏的文件选择 input */}
      <input ref={fileRef} type="file" accept=".txt,.md" className="hidden" onChange={handleFile} />

      {/* 触发按钮 */}
      <button
        onClick={() => fileRef.current?.click()}
        className="text-sm px-3 py-1.5 rounded-lg border"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        上传文件
      </button>

      {/* 弹窗 */}
      {open && (
        <>
          {/* 遮罩 */}
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={close} />

          {/* 内容 */}
          <div
            className="fixed inset-x-4 z-50 rounded-2xl shadow-2xl p-6 max-w-md mx-auto"
            style={{
              backgroundColor: 'var(--surface-raised)',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <h2 className="text-base font-semibold mb-1">填写书籍信息</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              已解析 {blockCount} 个段落
            </p>

            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>书名 *</label>
                <input
                  value={form.title}
                  onChange={set('title')}
                  placeholder="中文书名"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>作者 *</label>
                <input
                  value={form.author}
                  onChange={set('author')}
                  placeholder="作者名"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>年份</label>
                <input
                  value={form.year}
                  onChange={set('year')}
                  type="number"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="text-xs mb-2 block" style={{ color: 'var(--text-secondary)' }}>书脊颜色</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, color: c }))}
                      className="w-8 h-8 rounded-full border-2"
                      style={{
                        backgroundColor: c,
                        borderColor: form.color === c ? 'var(--text-primary)' : 'transparent',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={close}
                className="flex-1 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={handleSaveLocal}
                className="flex-1 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              >
                保存到本地
              </button>
              <button
                onClick={handlePublish}
                disabled={loading || !form.title || !form.author}
                className="flex-1 py-2 rounded-lg text-white text-sm disabled:opacity-40"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {loading ? '发布中…' : '发布到书库'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
