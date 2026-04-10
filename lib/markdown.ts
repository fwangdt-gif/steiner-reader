// 服务端专用 — 不可在客户端组件中 import
import fs from 'fs'
import path from 'path'
import type { Chapter, ContentBlock } from '@/lib/data'

// 将 markdown 文本解析为 ContentBlock 数组
// 支持：# 标题、## 小标题、> 引用、普通段落
function parseBlocks(md: string, chapterId: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  let idx = 0
  let buf: string[] = []

  const flushParagraph = () => {
    const text = buf.join(' ').trim()
    if (text) {
      blocks.push({
        id: `${chapterId}-b${idx}`,
        blockIndex: idx++,
        blockType: 'paragraph',
        originalText: text,
        translationText: text,
      })
    }
    buf = []
  }

  for (const raw of md.split('\n')) {
    const line = raw.trim()

    if (!line) {
      flushParagraph()
    } else if (line.startsWith('# ')) {
      flushParagraph()
      blocks.push({ id: `${chapterId}-b${idx}`, blockIndex: idx++, blockType: 'heading', originalText: line.slice(2), translationText: line.slice(2) })
    } else if (line.startsWith('## ')) {
      flushParagraph()
      blocks.push({ id: `${chapterId}-b${idx}`, blockIndex: idx++, blockType: 'subheading', originalText: line.slice(3), translationText: line.slice(3) })
    } else if (line.startsWith('> ')) {
      flushParagraph()
      blocks.push({ id: `${chapterId}-b${idx}`, blockIndex: idx++, blockType: 'quote', originalText: line.slice(2), translationText: line.slice(2) })
    } else {
      buf.push(line)
    }
  }
  flushParagraph()

  return blocks
}

// 如果章节有 markdownFile 且 blocks 为空，则从文件填充 blocks
// 否则原样返回
export function resolveChapterMarkdown(chapter: Chapter): Chapter {
  if (!chapter.markdownFile || chapter.blocks.length > 0) return chapter

  const filePath = path.join(process.cwd(), 'content', 'chapters', chapter.markdownFile)
  try {
    const md = fs.readFileSync(filePath, 'utf-8')
    return { ...chapter, blocks: parseBlocks(md, chapter.id) }
  } catch {
    return chapter // 文件不存在时静默返回原章节
  }
}
