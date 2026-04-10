'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getLocalBooks, saveLocalBook } from '@/lib/local-books'
import type { Book } from '@/lib/data'

function exportBook(book: Book) {
  const json = JSON.stringify(book, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${book.id}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function LocalBooks() {
  const [books, setBooks] = useState<Book[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [publishing, setPublishing] = useState<string | null>(null) // 正在发布的 bookId

  const handlePublish = async (book: Book) => {
    if (!confirm(`确认将《${book.titleZh}》发布到公共书库？\n发布后所有人可见，且会触发 Vercel 重新部署。`)) return
    setPublishing(book.id)
    try {
      const res = await fetch('/api/publish-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`发布失败：${data.error}`)
      } else {
        alert(`《${book.titleZh}》已发布到公共书库，Vercel 将自动重新部署。`)
      }
    } catch {
      alert('网络错误，请稍后重试')
    } finally {
      setPublishing(null)
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        // 支持单本书（对象）或多本书（数组）
        const items: Book[] = Array.isArray(data) ? data : [data]
        for (const item of items) {
          if (!item.id || !item.titleZh || !Array.isArray(item.chapters)) {
            alert('JSON 格式有误：缺少 id、titleZh 或 chapters 字段')
            return
          }
          saveLocalBook(item)
        }
        setBooks(getLocalBooks())
      } catch {
        alert('文件解析失败，请确认是有效的 JSON 文件')
      } finally {
        // 重置 input，允许重复导入同一文件
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  useEffect(() => {
    setBooks(getLocalBooks())
  }, [])

  return (
    <div className="mb-8">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          本地书籍
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-muted)' }}
        >
          仅在本设备可见
        </span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="ml-auto text-xs px-3 py-1 rounded-lg border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          导入 JSON
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {books.length === 0 && (
          <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>
            暂无本地书籍，可上传或导入 JSON
          </p>
        )}
        {books.map((book) => (
          <div
            key={book.id}
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
          >
            <div className="h-1.5" style={{ backgroundColor: book.coverColor }} />
            <div className="p-5">
              <h3 className="text-lg font-semibold mb-1">{book.titleZh}</h3>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                {book.author} · {book.publishedYear}
              </p>
              {book.description && (
                <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {book.description}
                </p>
              )}
              <div
                className="pt-3 border-t flex items-center justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {book.chapters.length} 个章节
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportBook(book)}
                    className="text-sm px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    导出 JSON
                  </button>
                  <button
                    onClick={() => handlePublish(book)}
                    disabled={publishing === book.id}
                    className="text-sm px-3 py-1.5 rounded-lg border disabled:opacity-40"
                    style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  >
                    {publishing === book.id ? '发布中…' : '发布到书库'}
                  </button>
                  <Link
                    href={`/local/${book.id}`}
                    className="text-sm px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    目录
                  </Link>
                  {book.chapters[0] && (
                    <Link
                      href={`/local/${book.id}/chapters/${book.chapters[0].id}`}
                      className="text-sm px-3 py-1.5 rounded-lg text-white"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      开始阅读
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
