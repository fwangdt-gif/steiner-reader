'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Chapter, ContentBlock, Book } from '@/lib/data'

// ── 笔记类型 ──────────────────────────────────────────────────────
interface Note {
  blockId: string
  text: string
  createdAt: string
}

// ── 本地存储工具函数 ──────────────────────────────────────────────
function loadNotes(chapterId: string): Record<string, Note> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(`notes_${chapterId}`)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveNotes(chapterId: string, notes: Record<string, Note>) {
  localStorage.setItem(`notes_${chapterId}`, JSON.stringify(notes))
}

// ── 底部抽屉组件 ──────────────────────────────────────────────────
function NoteSheet({
  block,
  note,
  onSave,
  onClose,
}: {
  block: ContentBlock
  note: Note | null
  onSave: (blockId: string, text: string) => void
  onClose: () => void
}) {
  const [text, setText] = useState(note?.text ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100)
  }, [])

  const handleSave = () => {
    if (text.trim()) {
      onSave(block.id, text.trim())
    }
    onClose()
  }

  const handleDelete = () => {
    onSave(block.id, '')
    onClose()
  }

  // 段落预览（取前50字）
  const preview = block.translationText.slice(0, 50) + (block.translationText.length > 50 ? '…' : '')

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        onClick={onClose}
      />

      {/* 抽屉 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-2xl flex flex-col"
        style={{
          backgroundColor: 'var(--surface-raised)',
          maxHeight: '80vh',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* 拖动条 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--warm-200)' }} />
        </div>

        {/* 标题栏 */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-sm font-medium">添加备注</span>
          <button
            onClick={onClose}
            className="text-sm px-2 py-1 rounded"
            style={{ color: 'var(--text-muted)' }}
          >
            取消
          </button>
        </div>

        {/* 段落引用 */}
        <div
          className="mx-5 mt-4 px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--warm-100)',
            color: 'var(--text-secondary)',
            borderLeft: '3px solid var(--accent)',
          }}
        >
          {preview}
        </div>

        {/* 输入区 */}
        <div className="px-5 pt-3 flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="写下你对这段内容的理解、感想或疑问…"
            className="w-full rounded-xl p-3 text-sm resize-none outline-none border"
            style={{
              minHeight: '120px',
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
              lineHeight: '1.7',
            }}
          />
        </div>

        {/* 操作按钮 */}
        <div className="px-5 pt-3 pb-5 flex items-center justify-between">
          {note ? (
            <button
              onClick={handleDelete}
              className="text-sm px-4 py-2 rounded-lg"
              style={{ color: '#dc2626', backgroundColor: '#fee2e2' }}
            >
              删除备注
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="text-sm px-5 py-2 rounded-lg text-white font-medium disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            保存
          </button>
        </div>
      </div>
    </>
  )
}

// ── 段落组件 ──────────────────────────────────────────────────────
function BlockItem({
  block,
  note,
  onNoteClick,
}: {
  block: ContentBlock
  note: Note | null
  onNoteClick: (block: ContentBlock) => void
}) {
  const hasNote = !!note

  if (block.blockType === 'heading') {
    return (
      <h2
        className="text-xl font-semibold mt-4 mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        {block.translationText}
      </h2>
    )
  }

  if (block.blockType === 'subheading') {
    return (
      <h3
        className="text-base font-semibold mt-4 mb-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        {block.translationText}
      </h3>
    )
  }

  if (block.blockType === 'quote') {
    return (
      <div className="relative group my-2">
        <div
          className="px-4 py-3 rounded-r-lg"
          style={{
            borderLeft: '3px solid var(--accent)',
            backgroundColor: 'var(--accent-light)',
            color: 'var(--text-primary)',
          }}
        >
          <p className="reading-text italic">{block.translationText}</p>

          {/* 备注指示 */}
          {hasNote && (
            <div
              className="mt-2 pt-2 border-t text-xs"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              📝 {note.text.slice(0, 40)}{note.text.length > 40 ? '…' : ''}
            </div>
          )}
        </div>
        <button
          onClick={() => onNoteClick(block)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs transition-opacity"
          style={{
            backgroundColor: hasNote ? 'var(--accent)' : 'var(--warm-200)',
            color: hasNote ? 'white' : 'var(--text-muted)',
            opacity: 0.85,
          }}
          title={hasNote ? '编辑备注' : '添加备注'}
        >
          {hasNote ? '📝' : '+'}
        </button>
      </div>
    )
  }

  // 普通段落
  return (
    <div className="relative group my-2">
      {/* 左侧备注指示线 */}
      {hasNote && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
          style={{ backgroundColor: 'var(--accent)' }}
        />
      )}

      <div className={hasNote ? 'pl-4' : ''}>
        <p
          className="reading-text"
          style={{ color: 'var(--text-primary)' }}
        >
          {block.translationText}
        </p>

        {/* 已有备注预览 */}
        {hasNote && (
          <div
            className="mt-2 text-xs px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--warm-100)',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
            }}
          >
            📝 {note.text.slice(0, 60)}{note.text.length > 60 ? '…' : ''}
          </div>
        )}
      </div>

      {/* 备注按钮（段落右侧，悬停/常驻） */}
      <button
        onClick={() => onNoteClick(block)}
        className="absolute -right-1 top-1 w-7 h-7 rounded-full flex items-center justify-center text-xs"
        style={{
          backgroundColor: hasNote ? 'var(--accent)' : 'var(--warm-200)',
          color: hasNote ? 'white' : 'var(--text-muted)',
          flexShrink: 0,
        }}
        title={hasNote ? '编辑备注' : '添加备注'}
      >
        {hasNote ? '📝' : '+'}
      </button>
    </div>
  )
}

// ── 主阅读组件 ────────────────────────────────────────────────────
export default function ReadingClient({
  book,
  chapter,
  prevChapter,
  nextChapter,
}: {
  book: Book
  chapter: Chapter
  prevChapter: Chapter | null
  nextChapter: Chapter | null
}) {
  const [notes, setNotes] = useState<Record<string, Note>>({})
  const [activeBlock, setActiveBlock] = useState<ContentBlock | null>(null)

  // 从 localStorage 加载笔记
  useEffect(() => {
    setNotes(loadNotes(chapter.id))
  }, [chapter.id])

  // 保存阅读进度
  useEffect(() => {
    localStorage.setItem('steiner_last_read', JSON.stringify({ bookId: book.id, chapterId: chapter.id }))
  }, [book.id, chapter.id])

  const handleSaveNote = (blockId: string, text: string) => {
    setNotes((prev) => {
      const next = { ...prev }
      if (text.trim()) {
        next[blockId] = { blockId, text, createdAt: new Date().toISOString() }
      } else {
        delete next[blockId]
      }
      saveNotes(chapter.id, next)
      return next
    })
  }

  const noteCount = Object.keys(notes).length

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      {/* 顶部导航 */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link
            href={`/books/${book.id}`}
            className="text-sm flex-shrink-0 px-3 py-1.5 rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            返回目录
          </Link>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-xs truncate font-medium" style={{ color: 'var(--text-primary)' }}>
              {book.titleZh}
            </p>
            <p className="text-xs truncate leading-tight" style={{ color: 'var(--text-muted)' }}>
              {chapter.titleZh}
            </p>
          </div>
          <div className="flex-shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>
            {noteCount > 0 ? `📝 ${noteCount}` : ''}
          </div>
        </div>
      </header>

      {/* 正文 */}
      <main className="max-w-2xl mx-auto px-5 py-8">
        {/* 章节标题区 */}
        <div className="mb-8">
          <p
            className="text-xs mb-1"
            style={{
              color: 'var(--text-muted)',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            第 {chapter.orderIndex} 章
          </p>
          <p
            className="text-sm mb-1"
            style={{
              color: 'var(--text-muted)',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            {chapter.title}
          </p>
        </div>

        {/* 段落列表 */}
        {chapter.blocks.length === 0 ? (
          <div
            className="text-center py-16 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            本章内容尚未整理完成
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {chapter.blocks.map((block) => (
              <BlockItem
                key={block.id}
                block={block}
                note={notes[block.id] ?? null}
                onNoteClick={setActiveBlock}
              />
            ))}
          </div>
        )}

        {/* 章节导航 */}
        <div
          className="mt-12 pt-6 border-t flex justify-between items-center"
          style={{ borderColor: 'var(--border)' }}
        >
          {prevChapter ? (
            <Link
              href={`/books/${book.id}/chapters/${prevChapter.id}`}
              className="text-sm"
              style={{ color: 'var(--accent)' }}
            >
              ← {prevChapter.titleZh}
            </Link>
          ) : (
            <span className="text-sm cursor-not-allowed" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
              ← 已是第一章
            </span>
          )}
          {nextChapter ? (
            <Link
              href={`/books/${book.id}/chapters/${nextChapter.id}`}
              className="text-sm"
              style={{ color: 'var(--accent)' }}
            >
              {nextChapter.titleZh} →
            </Link>
          ) : (
            <span className="text-sm cursor-not-allowed" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
              已是最后一章 →
            </span>
          )}
        </div>

        <div className="pb-16" />
      </main>

      {/* 备注抽屉 */}
      {activeBlock && (
        <NoteSheet
          block={activeBlock}
          note={notes[activeBlock.id] ?? null}
          onSave={handleSaveNote}
          onClose={() => setActiveBlock(null)}
        />
      )}
    </div>
  )
}
