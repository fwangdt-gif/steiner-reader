'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────

interface EditChapter {
  id: string
  title: string
  content: string
  order_index: number
  dirty: boolean
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ── File import helpers ───────────────────────────────────────────

function formatMd(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold** → plain
    .replace(/\*(.+?)\*/g, '$1')        // *italic* → plain
    .replace(/~~(.+?)~~/g, '$1')        // ~~strike~~ → plain
    .replace(/`(.+?)`/g, '$1')          // `code` → plain
    .replace(/^[-*] /gm, '')            // list bullets
    .replace(/^\d+\. /gm, '')           // numbered lists
    .replace(/<[^>]+>/g, '')            // HTML tags
    .split('\n').map((l) => l.trimEnd()).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function formatTxt(raw: string): string {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const out: string[] = []
  let buf: string[] = []

  const flush = () => {
    if (!buf.length) return
    const text = buf.join(' ').trim()
    if (text) out.push(text)
    out.push('')
    buf = []
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) { flush(); continue }
    // Already has our markers
    if (t.startsWith('# ') || t.startsWith('## ') || t.startsWith('> ')) {
      flush(); out.push(t); out.push(''); continue
    }
    // Short isolated line → heading candidate (decided at flush time)
    buf.push(t)
    // If this single line is short and next would be blank, treat as heading
    if (buf.length === 1 && t.length < 45) {
      // Peek: will be flushed when blank line is encountered
    }
  }
  flush()

  // Re-scan: single short paragraph → heading
  const result: string[] = []
  for (let i = 0; i < out.length; i++) {
    const cur = out[i]
    const next = out[i + 1]
    if (cur && cur.length < 45 && !cur.startsWith('#') && (next === '' || next === undefined)) {
      result.push(`# ${cur}`)
    } else {
      result.push(cur)
    }
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function parseFile(text: string, ext: string): { title: string | null; content: string } {
  const formatted = ext === 'md' ? formatMd(text) : formatTxt(text)
  const lines = formatted.split('\n')
  // Extract first heading as chapter title
  const firstHeading = lines.find((l) => l.startsWith('# '))
  if (firstHeading) {
    const title = firstHeading.slice(2).trim()
    const content = lines.filter((l) => l !== firstHeading).join('\n').replace(/^\n+/, '').trim()
    return { title, content }
  }
  return { title: null, content: formatted }
}

// ── Chapter row ───────────────────────────────────────────────────

function ChapterRow({
  chapter,
  isFirst,
  isLast,
  autoFocus,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onUploadImage,
}: {
  chapter: EditChapter
  isFirst: boolean
  isLast: boolean
  autoFocus: boolean
  onChange: (id: string, field: 'title' | 'content', value: string) => void
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onUploadImage: (chapterId: string, file: File, cursorPos: number) => Promise<void>
}) {
  const [open, setOpen] = useState(autoFocus)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleEmpty = chapter.title.trim() === ''

  // Auto-focus title when newly added
  useEffect(() => {
    if (autoFocus) {
      titleRef.current?.focus()
      titleRef.current?.select()
    }
  }, [autoFocus])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const cursorPos = textareaRef.current?.selectionStart ?? chapter.content.length
    await onUploadImage(chapter.id, file, cursorPos)
    setUploading(false)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'txt'
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (!text) { setImporting(false); return }
      const { title, content } = parseFile(text, ext)
      // Fill title if still default
      if (title && (chapter.title === '新章节' || chapter.title.trim() === '')) {
        onChange(chapter.id, 'title', title)
      }
      onChange(chapter.id, 'content', content)
      setOpen(true)
      setImporting(false)
    }
    reader.onerror = () => { alert('文件读取失败'); setImporting(false) }
    reader.readAsText(file, 'UTF-8')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div
      id={chapter.id}
      className="wc-card rounded-xl border overflow-hidden"
      style={{ borderColor: titleEmpty ? '#dc2626' : undefined }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen((p) => !p)}
      >
        {/* Reorder */}
        <div className="flex flex-col mr-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onMoveUp(chapter.id)}
            disabled={isFirst}
            className="text-xs leading-tight px-1 disabled:opacity-25"
            style={{ color: 'var(--text-muted)' }}
          >▲</button>
          <button
            onClick={() => onMoveDown(chapter.id)}
            disabled={isLast}
            className="text-xs leading-tight px-1 disabled:opacity-25"
            style={{ color: 'var(--text-muted)' }}
          >▼</button>
        </div>

        <span className="text-xs flex-shrink-0 w-10" style={{ color: 'var(--text-muted)' }}>
          第 {chapter.order_index + 1} 章
        </span>

        <input
          ref={titleRef}
          value={chapter.title}
          onChange={(e) => { e.stopPropagation(); onChange(chapter.id, 'title', e.target.value) }}
          onClick={(e) => e.stopPropagation()}
          placeholder="章节标题（必填）"
          className="flex-1 min-w-0 bg-transparent outline-none text-sm font-medium"
          style={{ color: titleEmpty ? '#dc2626' : 'var(--text-primary)' }}
        />

        <div className="flex items-center gap-3 ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {titleEmpty && (
            <span className="text-xs" style={{ color: '#dc2626' }}>标题不能为空</span>
          )}
          {chapter.dirty && !titleEmpty && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>未保存</span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            className="hidden"
            onChange={handleFileImport}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="text-xs disabled:opacity-40"
            style={{ color: 'var(--text-secondary)' }}
          >{importing ? '导入中…' : '导入'}</button>
          <button
            onClick={() => onDelete(chapter.id)}
            className="text-xs"
            style={{ color: '#dc2626' }}
          >删除</button>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {open ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Content */}
      {open && (
        <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              # 标题　## 小标题　{'>'} 引用　普通行为段落　![说明](图片链接)
            </p>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="text-xs px-2.5 py-1 rounded-lg border flex-shrink-0 disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              {uploading ? '上传中…' : '插入图片'}
            </button>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <textarea
            ref={textareaRef}
            value={chapter.content}
            onChange={(e) => onChange(chapter.id, 'content', e.target.value)}
            rows={Math.max(8, chapter.content.split('\n').length + 3)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y font-mono"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              lineHeight: '1.7',
            }}
          />
          <p className="text-xs mt-1 text-right" style={{ color: 'var(--text-muted)' }}>
            {chapter.content.length} 字符
          </p>
        </div>
      )}
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────

function StatusBadge({ status, lastSaved }: { status: SaveStatus; lastSaved: Date | null }) {
  if (status === 'saving') return <span style={{ color: 'var(--text-muted)' }}>保存中…</span>
  if (status === 'error')  return <span style={{ color: '#dc2626' }}>保存失败</span>
  if (status === 'saved' && lastSaved)
    return <span style={{ color: 'var(--text-muted)' }}>已保存 {lastSaved.toLocaleTimeString('zh-CN')}</span>
  return <span style={{ color: 'var(--text-muted)' }}>未保存</span>
}

// ── Main page ─────────────────────────────────────────────────────

export default function EditBookPage() {
  const { bookId } = useParams<{ bookId: string }>()
  const router = useRouter()
  // Stabilize the client so it doesn't change on every render
  // (a new object in dep arrays would trigger infinite re-renders)
  const supabase = useMemo(() => createClient(), [])

  const [bookTitle, setBookTitle] = useState('')
  const [chapters, setChapters] = useState<EditChapter[]>([])
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [newChapterId, setNewChapterId] = useState<string | null>(null)

  const chaptersRef = useRef<EditChapter[]>([])
  useEffect(() => { chaptersRef.current = chapters }, [chapters])

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasDirty = chapters.some((ch) => ch.dirty)
  const hasInvalid = chapters.some((ch) => ch.title.trim() === '')

  // ── Warn before leaving ───────────────────────────────────────────

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!chaptersRef.current.some((ch) => ch.dirty)) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const handleBack = () => {
    if (hasDirty && !confirm('有未保存的修改，确定离开？')) return
    router.back()
  }

  // ── Load ──────────────────────────────────────────────────────────

  const loadChapters = useCallback(async () => {
    const { data } = await supabase
      .from('chapters')
      .select('id, title, content, order_index')
      .eq('book_id', bookId)
      .order('order_index')

    if (data) {
      setChapters(data.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content ?? '',
        order_index: row.order_index,
        dirty: false,
      })))
    }
  }, [bookId, supabase])

  useEffect(() => {
    async function init() {
      const { data: bookRow } = await supabase
        .from('local_books')
        .select('title')
        .eq('id', bookId)
        .single()
      if (bookRow) setBookTitle(bookRow.title)
      await loadChapters()
      setLoading(false)
    }
    init()
  }, [bookId, loadChapters, supabase])

  // ── Autosave ──────────────────────────────────────────────────────

  const doSave = useCallback(async () => {
    const dirty = chaptersRef.current.filter((ch) => ch.dirty && ch.title.trim() !== '')
    if (dirty.length === 0) return
    setSaveStatus('saving')
    let failed = false
    for (const ch of dirty) {
      const { error } = await supabase.from('chapters').update({
        title: ch.title,
        content: ch.content,
        order_index: ch.order_index,
      }).eq('id', ch.id)
      if (error) { console.error('章节保存失败:', error); failed = true }
    }
    if (failed) {
      setSaveStatus('error')
    } else {
      setChapters((prev) => prev.map((ch) => ({ ...ch, dirty: false })))
      setLastSaved(new Date())
      setSaveStatus('saved')
    }
  }, [supabase])

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(doSave, 1000)
  }, [doSave])

  // ── Edit handlers ─────────────────────────────────────────────────

  const handleChange = useCallback((id: string, field: 'title' | 'content', value: string) => {
    setChapters((prev) =>
      prev.map((ch) => ch.id === id ? { ...ch, [field]: value, dirty: true } : ch)
    )
    setSaveStatus('idle')
    scheduleAutosave()
  }, [scheduleAutosave])

  const handleMoveUp = useCallback((id: string) => {
    setChapters((prev) => {
      const idx = prev.findIndex((ch) => ch.id === id)
      if (idx <= 0) return prev
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next.map((ch, i) => ({ ...ch, order_index: i, dirty: true }))
    })
    scheduleAutosave()
  }, [scheduleAutosave])

  const handleMoveDown = useCallback((id: string) => {
    setChapters((prev) => {
      const idx = prev.findIndex((ch) => ch.id === id)
      if (idx < 0 || idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next.map((ch, i) => ({ ...ch, order_index: i, dirty: true }))
    })
    scheduleAutosave()
  }, [scheduleAutosave])

  // ── Image upload ─────────────────────────────────────────────────

  const handleUploadImage = useCallback(async (chapterId: string, file: File, cursorPos: number) => {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `chapters/${bookId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('images').upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) { alert(`图片上传失败：${error.message}`); return }
    const { data } = supabase.storage.from('images').getPublicUrl(path)
    const caption = file.name.replace(/\.[^.]+$/, '')
    const markdown = `\n![${caption}](${data.publicUrl})\n`
    setChapters((prev) => prev.map((ch) => {
      if (ch.id !== chapterId) return ch
      const before = ch.content.slice(0, cursorPos)
      const after = ch.content.slice(cursorPos)
      return { ...ch, content: before + markdown + after, dirty: true }
    }))
    scheduleAutosave()
  }, [bookId, supabase, scheduleAutosave])

  // ── Add ───────────────────────────────────────────────────────────

  const handleAdd = async () => {
    try {
      const orderIndex = chaptersRef.current.length
      const { data, error } = await supabase
        .from('chapters')
        .insert({ book_id: bookId, title: '新章节', content: '', order_index: orderIndex })
        .select('id')
        .single()

      if (error || !data) {
        console.error('新增章节失败:', error)
        alert(`新增章节失败：${error?.message ?? '未知错误'}`)
        return
      }

      setChapters((prev) => [
        ...prev,
        { id: data.id, title: '新章节', content: '', order_index: orderIndex, dirty: false },
      ])
      setNewChapterId(data.id)
    } catch (err) {
      console.error('新增章节异常:', err)
      alert(`新增章节出错：${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('确认删除这个章节？此操作不可撤销。')) return
    await supabase.from('chapters').delete().eq('id', id)
    setChapters((prev) =>
      prev.filter((ch) => ch.id !== id).map((ch, i) => ({ ...ch, order_index: i }))
    )
    if (newChapterId === id) setNewChapterId(null)
  }, [supabase, newChapterId])

  // ── Manual save ───────────────────────────────────────────────────

  const handleSave = async () => {
    if (hasInvalid) {
      alert('请先填写所有章节标题')
      return
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    setSaveStatus('saving')
    try {
      await supabase.from('local_books').update({
        updated_at: new Date().toISOString(),
      }).eq('id', bookId)

      let failed = false
      for (const ch of chaptersRef.current) {
        const { error } = await supabase.from('chapters').update({
          title: ch.title,
          content: ch.content,
          order_index: ch.order_index,
        }).eq('id', ch.id)
        if (error) { console.error('章节保存失败:', error.message); failed = true }
      }

      if (failed) {
        setSaveStatus('error')
        alert('部分章节保存失败，请检查控制台错误信息')
        return
      }

      setChapters((prev) => prev.map((ch) => ({ ...ch, dirty: false })))
      setLastSaved(new Date())
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }

  // ── Render ────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>加载中…</p>
    </div>
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="wc-header sticky top-0 z-30 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            className="text-sm px-3 py-1.5 rounded-lg border flex-shrink-0"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >← 返回</button>

          <div className="flex-1 min-w-0 text-center">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {bookTitle}
            </p>
            <p className="text-xs">
              <StatusBadge status={saveStatus} lastSaved={lastSaved} />
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || hasInvalid}
            className="text-sm px-4 py-1.5 rounded-lg text-white flex-shrink-0 disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)' }}
          >保存</button>
        </div>
      </header>

      {/* Chapter list */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {hasInvalid && (
          <div
            className="mb-4 px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
          >
            有章节标题为空，请填写后再保存
          </div>
        )}

        <div className="flex flex-col gap-3">
          {chapters.map((ch, idx) => (
            <ChapterRow
              key={ch.id}
              chapter={ch}
              isFirst={idx === 0}
              isLast={idx === chapters.length - 1}
              autoFocus={ch.id === newChapterId}
              onChange={handleChange}
              onDelete={handleDelete}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onUploadImage={handleUploadImage}
            />
          ))}
        </div>

        {chapters.length === 0 && (
          <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
            还没有章节，点击下方新增
          </p>
        )}

        <button
          onClick={handleAdd}
          className="mt-4 w-full py-3 rounded-xl border-2 border-dashed text-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >+ 新增章节</button>

        <p className="text-xs text-center mt-6 pb-12" style={{ color: 'var(--text-muted)' }}>
          停止输入 1 秒后自动保存 · 手动保存会重新加载章节列表
        </p>
      </main>
    </div>
  )
}
