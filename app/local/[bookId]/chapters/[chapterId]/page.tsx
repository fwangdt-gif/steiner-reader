'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getLocalBook, getLocalAdjacentChapters } from '@/lib/local-books'
import { createClient } from '@/lib/supabase/client'
import ReadingClient from '@/app/books/[bookId]/chapters/[chapterId]/ReadingClient'
import type { Book, Chapter, ContentBlock } from '@/lib/data'

function textToBlocks(text: string, chapterId: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  let idx = 0
  let buf: string[] = []
  const flush = () => {
    const t = buf.join(' ').trim()
    if (t) blocks.push({ id: `${chapterId}-b${idx}`, blockIndex: idx++, blockType: 'paragraph', originalText: t, translationText: t })
    buf = []
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) { flush(); continue }
    if (line.startsWith('# '))  { flush(); blocks.push({ id: `${chapterId}-b${idx}`, blockIndex: idx++, blockType: 'heading',    originalText: line.slice(2), translationText: line.slice(2) }); continue }
    if (line.startsWith('## ')) { flush(); blocks.push({ id: `${chapterId}-b${idx}`, blockIndex: idx++, blockType: 'subheading', originalText: line.slice(3), translationText: line.slice(3) }); continue }
    if (line.startsWith('> '))  { flush(); blocks.push({ id: `${chapterId}-b${idx}`, blockIndex: idx++, blockType: 'quote',      originalText: line.slice(2), translationText: line.slice(2) }); continue }
    const imgMatch = line.match(/^!\[(.*?)\]\((https?:\/\/.+?)\)$/)
    if (imgMatch) { flush(); blocks.push({ id: `${chapterId}-b${idx}`, blockIndex: idx++, blockType: 'image', originalText: imgMatch[2], translationText: imgMatch[1] }); continue }
    buf.push(line)
  }
  flush()
  return blocks
}

type PageData = { book: Book; chapter: Chapter; prev: Chapter | null; next: Chapter | null }

export default function LocalChapterPage() {
  const { bookId, chapterId } = useParams() as { bookId: string; chapterId: string }
  const [data, setData] = useState<PageData | null | undefined>(undefined)

  useEffect(() => {
    async function load() {
      // Fast path: localStorage
      const localBook = getLocalBook(bookId)
      const localChapter = localBook?.chapters.find((c) => c.id === chapterId)
      if (localBook && localChapter) {
        const { prev, next } = getLocalAdjacentChapters(bookId, chapterId)
        setData({ book: localBook, chapter: localChapter, prev, next })
        return
      }

      // Fallback: Supabase chapters table
      const supabase = createClient()

      const { data: bookRow } = await supabase
        .from('local_books')
        .select('id, title, author, description')
        .eq('id', bookId)
        .single()

      if (!bookRow) { setData(null); return }

      const { data: allRows } = await supabase
        .from('chapters')
        .select('id, title, content, order_index')
        .eq('book_id', bookId)
        .order('order_index')

      if (!allRows?.length) { setData(null); return }

      const currentIdx = allRows.findIndex((r) => r.id === chapterId)
      if (currentIdx === -1) { setData(null); return }

      const toChapter = (r: typeof allRows[0]): Chapter => ({
        id: r.id,
        bookId,
        title: r.title,
        titleZh: r.title,
        orderIndex: r.order_index,
        status: 'published' as const,
        blocks: textToBlocks(r.content ?? '', r.id),
      })

      const book: Book = {
        id: bookRow.id,
        titleZh: bookRow.title,
        titleOriginal: bookRow.title,
        author: bookRow.author ?? '',
        description: bookRow.description ?? '',
        coverColor: '#4a6fa5',
        publishedYear: new Date().getFullYear(),
        chapters: allRows.map(toChapter),
      }

      setData({
        book,
        chapter: toChapter(allRows[currentIdx]),
        prev: currentIdx > 0 ? toChapter(allRows[currentIdx - 1]) : null,
        next: currentIdx < allRows.length - 1 ? toChapter(allRows[currentIdx + 1]) : null,
      })
    }
    load()
  }, [bookId, chapterId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (data === undefined) return null

  if (data === null) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>未找到章节内容</p>
        <Link href="/" className="text-sm" style={{ color: 'var(--accent)' }}>← 返回书库</Link>
      </div>
    </div>
  )

  return (
    <ReadingClient
      book={data.book}
      chapter={data.chapter}
      prevChapter={data.prev}
      nextChapter={data.next}
      basePath="/local"
    />
  )
}
