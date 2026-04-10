import { notFound } from 'next/navigation'
import { getBook, getChapter, getAdjacentChapters } from '@/lib/data'
import ReadingClient from './ReadingClient'

// Next.js App Router 动态路由页面，params 是 Promise（与 BookDetailPage 保持一致）
interface Props {
  params: Promise<{ bookId: string; chapterId: string }>
}

export default async function ChapterPage({ params }: Props) {
  // 解包路由参数
  const { bookId, chapterId } = await params

  // 从 lib/data.ts 获取 book 和 chapter
  const book = getBook(bookId)
  const chapter = getChapter(bookId, chapterId)

  // 任意一个找不到，返回 404
  if (!book || !chapter) notFound()

  // 获取上一章 / 下一章，用于底部导航
  const { prev, next } = getAdjacentChapters(bookId, chapterId)

  // 将数据传给客户端组件渲染
  return (
    <ReadingClient
      book={book}
      chapter={chapter}
      prevChapter={prev}
      nextChapter={next}
    />
  )
}
