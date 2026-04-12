'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Chapter, ContentBlock, Book } from '@/lib/data'
import CommentsSection from '@/app/CommentsSection'
import NotesPanel from '@/app/NotesPanel'

// ── 段落组件（仅渲染内容，无操作按钮）────────────────────────────
function BlockItem({ block }: { block: ContentBlock }) {
  if (block.blockType === 'heading') {
    return (
      <h2 className="text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--text-primary)' }}>
        {block.translationText}
      </h2>
    )
  }

  if (block.blockType === 'subheading') {
    return (
      <h3 className="text-base font-semibold mt-4 mb-2" style={{ color: 'var(--text-secondary)' }}>
        {block.translationText}
      </h3>
    )
  }

  if (block.blockType === 'quote') {
    return (
      <div
        className="px-4 py-3 rounded-r-lg my-2"
        style={{
          borderLeft: '3px solid var(--accent)',
          backgroundColor: 'var(--accent-light)',
          color: 'var(--text-primary)',
        }}
      >
        <p className="reading-text italic">{block.translationText}</p>
      </div>
    )
  }

  return (
    <p className="reading-text my-2" style={{ color: 'var(--text-primary)' }}>
      {block.translationText}
    </p>
  )
}

// ── 中间 / 底部 评论栏 ────────────────────────────────────────────
function ActionBar({
  onNoteClick,
  commentsRef,
}: {
  onNoteClick: () => void
  commentsRef: React.RefObject<HTMLDivElement | null>
}) {
  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex items-center gap-3 my-8">
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
      <div className="flex items-center gap-2">
        <button
          onClick={onNoteClick}
          className="text-xs px-3.5 py-1.5 rounded-full border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          ✏️ 写笔记
        </button>
        <button
          onClick={scrollToComments}
          className="text-xs px-3.5 py-1.5 rounded-full border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          💬 发评论
        </button>
      </div>
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
    </div>
  )
}

// ── 主阅读组件 ────────────────────────────────────────────────────
export default function ReadingClient({
  book,
  chapter,
  prevChapter,
  nextChapter,
  basePath = '/books',
}: {
  book: Book
  chapter: Chapter
  prevChapter: Chapter | null
  nextChapter: Chapter | null
  basePath?: string
}) {
  const [showNotes, setShowNotes] = useState(false)
  const [dark, setDark] = useState(false)
  const [progress, setProgress] = useState(0)
  const commentsRef = useRef<HTMLDivElement>(null)

  const FONT_SIZES = [15, 17, 20]
  const [sizeIdx, setSizeIdx] = useState(1)

  // 初始化主题
  useEffect(() => {
    const saved = localStorage.getItem('steiner_theme')
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
      setDark(true)
    }
  }, [])

  // 初始化字号
  useEffect(() => {
    const saved = localStorage.getItem('steiner_font_size')
    if (saved !== null) {
      const idx = Number(saved)
      setSizeIdx(idx)
      document.documentElement.style.setProperty('--reading-font-size', FONT_SIZES[idx] + 'px')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const changeSize = (delta: number) => {
    setSizeIdx((prev) => {
      const next = Math.min(Math.max(prev + delta, 0), FONT_SIZES.length - 1)
      document.documentElement.style.setProperty('--reading-font-size', FONT_SIZES[next] + 'px')
      localStorage.setItem('steiner_font_size', String(next))
      return next
    })
  }

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '')
    localStorage.setItem('steiner_theme', next ? 'dark' : 'light')
  }

  // 滚动进度条
  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(scrolled / total, 1) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 保存阅读进度（含 basePath 和标题，用于 ContinueReading 支持本地书籍）
  useEffect(() => {
    localStorage.setItem('steiner_last_read', JSON.stringify({
      bookId: book.id,
      chapterId: chapter.id,
      basePath,
      bookTitle: book.titleZh,
      chapterTitle: chapter.titleZh,
    }))
  }, [book.id, chapter.id, basePath, book.titleZh, chapter.titleZh])

  // 键盘翻章
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft' && prevChapter)
        window.location.href = `${basePath}/${book.id}/chapters/${prevChapter.id}`
      if (e.key === 'ArrowRight' && nextChapter)
        window.location.href = `${basePath}/${book.id}/chapters/${nextChapter.id}`
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prevChapter, nextChapter, basePath, book.id])

  // 计算中间位置（块数 > 2 才插入）
  const blocks = chapter.blocks
  const midIdx = blocks.length > 2 ? Math.floor(blocks.length / 2) - 1 : -1

  return (
    <div className="reading-page">
      {/* 滚动进度条 */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5" style={{ backgroundColor: 'var(--border)' }}>
        <div
          className="h-full transition-none"
          style={{ width: `${progress * 100}%`, backgroundColor: 'var(--accent)' }}
        />
      </div>

      {/* 顶部导航 */}
      <header className="wc-header sticky top-0 z-30 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link
            href={`${basePath}/${book.id}`}
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
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 字号调节 */}
            <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => changeSize(-1)}
                disabled={sizeIdx === 0}
                className="px-2 py-1 text-xs disabled:opacity-30"
                style={{ color: 'var(--text-secondary)' }}
              >A-</button>
              <span className="w-px h-4 self-center" style={{ backgroundColor: 'var(--border)' }} />
              <button
                onClick={() => changeSize(1)}
                disabled={sizeIdx === FONT_SIZES.length - 1}
                className="px-2 py-1 text-xs disabled:opacity-30"
                style={{ color: 'var(--text-secondary)' }}
              >A+</button>
            </div>
            {/* 亮暗切换 */}
            <button
              onClick={toggleTheme}
              className="text-xs px-2 py-1 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* 正文 */}
      <main className="max-w-xl mx-auto px-5 py-10">
        {/* 章节标题 */}
        <div className="mb-10">
          <p className="text-xs mb-3 uppercase tracking-widest"
            style={{ color: 'var(--text-muted)', fontFamily: 'Georgia, serif' }}>
            第 {chapter.orderIndex} 章 · 共 {book.chapters.length} 章
          </p>
          {chapter.title && chapter.title !== chapter.titleZh && (
            <p className="text-sm mb-2 italic"
              style={{ color: 'var(--text-muted)', fontFamily: 'Georgia, serif' }}>
              {chapter.title}
            </p>
          )}
          <h1 className="text-2xl font-semibold leading-snug"
            style={{ fontFamily: 'Georgia, "Noto Serif SC", serif', color: 'var(--text-primary)' }}>
            {chapter.titleZh}
          </h1>
          <div className="mt-4 w-8 h-0.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
        </div>

        {/* 段落列表（中间插入一组操作栏）*/}
        {blocks.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
            本章内容尚未整理完成
          </div>
        ) : (
          <div>
            {blocks.map((block, idx) => (
              <div key={block.id}>
                <BlockItem block={block} />
                {idx === midIdx && (
                  <ActionBar
                    onNoteClick={() => setShowNotes(true)}
                    commentsRef={commentsRef}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 章节导航 */}
        <div className="mt-16 pt-8 border-t grid grid-cols-2 gap-3" style={{ borderColor: 'var(--border)' }}>
          {prevChapter ? (
            <Link
              href={`${basePath}/${book.id}/chapters/${prevChapter.id}`}
              className="wc-card rounded-xl border p-4 flex flex-col gap-1"
            >
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>← 上一章</span>
              <span className="text-sm font-medium leading-snug line-clamp-2" style={{ color: 'var(--accent)' }}>
                {prevChapter.titleZh}
              </span>
            </Link>
          ) : <div />}
          {nextChapter ? (
            <Link
              href={`${basePath}/${book.id}/chapters/${nextChapter.id}`}
              className="wc-card rounded-xl border p-4 flex flex-col gap-1 text-right col-start-2"
            >
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>下一章 →</span>
              <span className="text-sm font-medium leading-snug line-clamp-2" style={{ color: 'var(--accent)' }}>
                {nextChapter.titleZh}
              </span>
            </Link>
          ) : (
            <div className="wc-card rounded-xl border p-4 text-right opacity-40">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>已是最后一章</span>
            </div>
          )}
        </div>

        {/* AI 翻译免责提示 */}
        <div className="mt-12 mb-2 px-4 py-3 rounded-xl text-xs leading-relaxed"
          style={{ backgroundColor: 'var(--warm-100)', color: 'var(--text-muted)' }}>
          本文译自 Rudolf Steiner 德文公版著作，由人工智能生成，未参考任何现有版权译本，仅供参考。
          建议结合德文原文阅读。·{' '}
          <a href="/haftung" className="underline underline-offset-2">AI翻译免责声明</a>
        </div>

        {/* 底部评论区（第二组） */}
        <div ref={commentsRef} className="mt-12">
          <ActionBar
            onNoteClick={() => setShowNotes(true)}
            commentsRef={commentsRef}
          />
          <CommentsSection bookId={book.id} chapterId={chapter.id} />
        </div>
      </main>

      {/* 笔记抽屉 */}
      {showNotes && (
        <NotesPanel
          bookId={book.id}
          chapterId={chapter.id}
          onClose={() => setShowNotes(false)}
        />
      )}
    </div>
  )
}
