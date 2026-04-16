'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Chapter, ContentBlock, Book } from '@/lib/data'
import CommentsSection from '@/app/CommentsSection'
import NotesPanel from '@/app/NotesPanel'

// ── 段落组件 ─────────────────────────────────────────────────────────
function BlockItem({ block, isReading }: { block: ContentBlock; isReading?: boolean }) {
  const readingBg: React.CSSProperties = isReading
    ? { backgroundColor: 'var(--accent-light)', borderRadius: '6px', padding: '2px 6px', margin: '0 -6px', transition: 'background-color 0.25s' }
    : {}

  if (block.blockType === 'heading') {
    return (
      <h2
        id={`block-${block.id}`}
        className="text-xl font-semibold mt-6 mb-2"
        style={{ color: 'var(--text-primary)', ...readingBg }}
      >
        {block.translationText}
      </h2>
    )
  }

  if (block.blockType === 'subheading') {
    return (
      <h3
        id={`block-${block.id}`}
        className="text-base font-semibold mt-4 mb-2"
        style={{ color: 'var(--text-secondary)', ...readingBg }}
      >
        {block.translationText}
      </h3>
    )
  }

  if (block.blockType === 'image') {
    return (
      <figure id={`block-${block.id}`} className="my-6">
        <img
          src={block.originalText}
          alt={block.translationText}
          className="w-full rounded-xl"
          style={{ maxHeight: '520px', objectFit: 'contain' }}
        />
        {block.translationText && (
          <figcaption className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
            {block.translationText}
          </figcaption>
        )}
      </figure>
    )
  }

  if (block.blockType === 'quote') {
    return (
      <div
        id={`block-${block.id}`}
        className="px-4 py-3 rounded-r-lg my-2"
        style={{
          borderLeft: '3px solid var(--accent)',
          backgroundColor: isReading ? 'var(--accent-light)' : 'var(--accent-light)',
          color: 'var(--text-primary)',
          outline: isReading ? '2px solid var(--accent)' : 'none',
          transition: 'outline 0.25s',
        }}
      >
        <p className="reading-text italic">{block.translationText}</p>
      </div>
    )
  }

  return (
    <p
      id={`block-${block.id}`}
      className="reading-text my-2"
      style={{ color: 'var(--text-primary)', ...readingBg }}
    >
      {block.translationText}
    </p>
  )
}

// ── 中间 / 底部 操作栏 ─────────────────────────────────────────────
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

// ── TTS 速率 & 语言选项 ───────────────────────────────────────────────
const TTS_RATES = [0.8, 1.0, 1.2, 1.5] as const
type TtsLang = 'zh-CN' | 'de-DE'

// ── 主阅读组件 ────────────────────────────────────────────────────────
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

  // ── TTS 状态 ──────────────────────────────────────────────────────
  const [ttsActive, setTtsActive] = useState(false)
  const [ttsPaused, setTtsPaused] = useState(false)
  const [ttsReadingId, setTtsReadingId] = useState<string | null>(null)
  const [ttsRate, setTtsRate] = useState(1.0)
  const [ttsLang, setTtsLang] = useState<TtsLang>('zh-CN')

  // Refs 用于在 onend 回调中读取最新值（避免闭包过期）
  const ttsActiveRef = useRef(false)
  const ttsQueueRef = useRef<ContentBlock[]>([])
  const ttsIdxRef = useRef(0)
  const ttsRateRef = useRef(1.0)
  const ttsLangRef = useRef<TtsLang>('zh-CN')
  // Chrome 防自动暂停定时器
  const resumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── 初始化主题 ────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('steiner_theme')
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
      setDark(true)
    }
  }, [])

  // ── 初始化字号 ────────────────────────────────────────────────────
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

  // ── 滚动进度条 ────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(scrolled / total, 1) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── 保存阅读进度 ──────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('steiner_last_read', JSON.stringify({
      bookId: book.id,
      chapterId: chapter.id,
      basePath,
      bookTitle: book.titleZh,
      chapterTitle: chapter.titleZh,
    }))
  }, [book.id, chapter.id, basePath, book.titleZh, chapter.titleZh])

  // ── 键盘翻章 & 空格暂停 ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft' && prevChapter)
        window.location.href = `${basePath}/${book.id}/chapters/${prevChapter.id}`
      if (e.key === 'ArrowRight' && nextChapter)
        window.location.href = `${basePath}/${book.id}/chapters/${nextChapter.id}`
      if (e.key === ' ' && ttsActiveRef.current) {
        e.preventDefault()
        handleTtsPause()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prevChapter, nextChapter, basePath, book.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 卸载时停止 TTS ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
      if (resumeTimerRef.current) clearInterval(resumeTimerRef.current)
    }
  }, [])

  // ── TTS 核心：播放当前位置的块 ────────────────────────────────────
  function speakCurrent() {
    if (!ttsActiveRef.current) return
    const block = ttsQueueRef.current[ttsIdxRef.current]
    if (!block) {
      // 全章读完
      ttsActiveRef.current = false
      setTtsActive(false)
      setTtsReadingId(null)
      setTtsPaused(false)
      if (resumeTimerRef.current) clearInterval(resumeTimerRef.current)
      return
    }

    const lang = ttsLangRef.current
    const text = lang === 'de-DE' ? block.originalText : block.translationText
    // 如果该语言没有文本，跳过
    if (!text?.trim()) {
      ttsIdxRef.current++
      speakCurrent()
      return
    }

    setTtsReadingId(block.id)
    // 滚动到当前段落
    setTimeout(() => {
      document.getElementById(`block-${block.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = ttsRateRef.current
    utterance.onend = () => {
      if (!ttsActiveRef.current) return
      ttsIdxRef.current++
      speakCurrent()
    }
    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return
      // 出错跳过这个块
      ttsIdxRef.current++
      speakCurrent()
    }
    window.speechSynthesis.speak(utterance)
  }

  // ── TTS 开始 ─────────────────────────────────────────────────────
  function handleTtsStart() {
    if (!window.speechSynthesis) { alert('您的浏览器不支持语音朗读'); return }
    window.speechSynthesis.cancel()

    const lang = ttsLangRef.current
    const readable = chapter.blocks.filter((b) => {
      if (b.blockType === 'image') return false
      const text = lang === 'de-DE' ? b.originalText : b.translationText
      return text?.trim()
    })
    if (readable.length === 0) return

    ttsQueueRef.current = readable
    ttsIdxRef.current = 0
    ttsActiveRef.current = true
    setTtsActive(true)
    setTtsPaused(false)

    // Chrome 防止 15 秒后自动暂停
    if (resumeTimerRef.current) clearInterval(resumeTimerRef.current)
    resumeTimerRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 12000)

    speakCurrent()
  }

  // ── TTS 暂停 / 继续 ──────────────────────────────────────────────
  function handleTtsPause() {
    if (!ttsActiveRef.current) return
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setTtsPaused(false)
    } else {
      window.speechSynthesis.pause()
      setTtsPaused(true)
    }
  }

  // ── TTS 停止 ─────────────────────────────────────────────────────
  function handleTtsStop() {
    ttsActiveRef.current = false
    window.speechSynthesis.cancel()
    setTtsActive(false)
    setTtsPaused(false)
    setTtsReadingId(null)
    if (resumeTimerRef.current) clearInterval(resumeTimerRef.current)
  }

  // ── TTS 速率切换 ─────────────────────────────────────────────────
  function handleRateChange(r: number) {
    ttsRateRef.current = r
    setTtsRate(r)
    if (ttsActiveRef.current) {
      window.speechSynthesis.cancel()
      setTimeout(() => { if (ttsActiveRef.current) speakCurrent() }, 80)
    }
  }

  // ── TTS 语言切换 ─────────────────────────────────────────────────
  function handleLangChange(lang: TtsLang) {
    ttsLangRef.current = lang
    setTtsLang(lang)
    if (ttsActiveRef.current) {
      window.speechSynthesis.cancel()
      setTimeout(() => { if (ttsActiveRef.current) speakCurrent() }, 80)
    }
  }

  // ── 段落块列表 ────────────────────────────────────────────────────
  const blocks = chapter.blocks
  const midIdx = blocks.length > 2 ? Math.floor(blocks.length / 2) - 1 : -1

  return (
    <div className="reading-page" style={{ paddingBottom: ttsActive ? 64 : 0 }}>
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
            {/* 朗读控件 */}
            <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              {/* 语言切换 */}
              <button
                onClick={() => handleLangChange(ttsLang === 'zh-CN' ? 'de-DE' : 'zh-CN')}
                className="text-xs px-2 py-1 border-r"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                title="切换朗读语言"
              >
                {ttsLang === 'zh-CN' ? '中' : '德'}
              </button>
              {/* 播放/停止 */}
              <button
                onClick={ttsActive ? handleTtsStop : handleTtsStart}
                className="text-xs px-2 py-1"
                style={{
                  color: ttsActive ? 'var(--accent)' : 'var(--text-secondary)',
                  backgroundColor: ttsActive ? 'var(--accent-light)' : 'transparent',
                }}
                title={ttsActive ? '停止朗读' : '开始朗读'}
              >
                {ttsActive ? '🔊' : '🔈'}
              </button>
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

        {/* 段落列表 */}
        {blocks.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
            本章内容尚未整理完成
          </div>
        ) : (
          <div>
            {blocks.map((block, idx) => (
              <div key={block.id}>
                <BlockItem block={block} isReading={ttsReadingId === block.id} />
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

        {/* 底部评论区 */}
        <div ref={commentsRef} className="mt-12">
          <ActionBar
            onNoteClick={() => setShowNotes(true)}
            commentsRef={commentsRef}
          />
          <CommentsSection bookId={book.id} chapterId={chapter.id} />
        </div>
      </main>

      {/* ── TTS 悬浮控制栏 ─────────────────────────────────────────── */}
      {ttsActive && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t"
          style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
        >
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
            {/* 状态 */}
            <span className="text-xs flex-shrink-0 w-14" style={{ color: 'var(--text-muted)' }}>
              {ttsPaused ? '⏸ 暂停' : '🔊 朗读'}
            </span>

            {/* 语言切换 */}
            <div className="flex items-center rounded-lg border overflow-hidden flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              {(['zh-CN', 'de-DE'] as TtsLang[]).map((lang, i) => (
                <button
                  key={lang}
                  onClick={() => handleLangChange(lang)}
                  className="text-xs px-2.5 py-1"
                  style={{
                    color: ttsLang === lang ? 'var(--accent)' : 'var(--text-muted)',
                    backgroundColor: ttsLang === lang ? 'var(--accent-light)' : 'transparent',
                    borderRight: i === 0 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {lang === 'zh-CN' ? '中文' : '德语'}
                </button>
              ))}
            </div>

            {/* 速率 */}
            <div className="flex items-center gap-1 flex-1 justify-center">
              {TTS_RATES.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRateChange(r)}
                  className="text-xs px-2 py-1 rounded-md border"
                  style={{
                    borderColor: ttsRate === r ? 'var(--accent)' : 'var(--border)',
                    color: ttsRate === r ? 'var(--accent)' : 'var(--text-muted)',
                    backgroundColor: ttsRate === r ? 'var(--accent-light)' : 'transparent',
                  }}
                >
                  {r}x
                </button>
              ))}
            </div>

            {/* 暂停 / 继续 */}
            <button
              onClick={handleTtsPause}
              className="text-xs px-3 py-1.5 rounded-lg border flex-shrink-0"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              {ttsPaused ? '▶ 继续' : '⏸ 暂停'}
            </button>

            {/* 停止 */}
            <button
              onClick={handleTtsStop}
              className="text-xs px-3 py-1.5 rounded-lg border flex-shrink-0"
              style={{ borderColor: '#dc2626', color: '#dc2626' }}
            >
              ⏹ 停止
            </button>
          </div>
        </div>
      )}

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
