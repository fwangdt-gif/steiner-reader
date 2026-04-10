import { NextRequest, NextResponse } from 'next/server'

const GITHUB_API = 'https://api.github.com'
const OWNER = process.env.GITHUB_OWNER
const REPO = process.env.GITHUB_REPO
const TOKEN = process.env.GITHUB_TOKEN
const FILE_PATH = 'lib/books.json'

export async function POST(req: NextRequest) {
  // 检查环境变量
  if (!TOKEN || !OWNER || !REPO) {
    return NextResponse.json({ error: '服务器未配置 GitHub 环境变量' }, { status: 500 })
  }

  // 解析请求体
  const book = await req.json().catch(() => null)
  if (!book?.id || !book?.titleZh || !Array.isArray(book?.chapters)) {
    return NextResponse.json({ error: '无效的书籍数据格式' }, { status: 400 })
  }

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }

  // 1. 从 GitHub 读取当前 lib/books.json
  const getRes = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    { headers, cache: 'no-store' }
  )
  if (!getRes.ok) {
    return NextResponse.json({ error: '无法读取书库文件，请检查仓库配置' }, { status: 502 })
  }
  const fileData = await getRes.json()
  const currentBooks = JSON.parse(
    Buffer.from(fileData.content, 'base64').toString('utf-8')
  )
  const sha: string = fileData.sha

  // 2. 检查 id 重复
  if (currentBooks.find((b: { id: string }) => b.id === book.id)) {
    return NextResponse.json(
      { error: `书籍 id "${book.id}" 已存在于公共书库，请先修改 id 再发布` },
      { status: 409 }
    )
  }

  // 3. 追加新书，写回 GitHub
  const newBooks = [...currentBooks, book]
  const encoded = Buffer.from(JSON.stringify(newBooks, null, 2)).toString('base64')

  const putRes = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `publish: ${book.titleZh}`,
        content: encoded,
        sha,
      }),
    }
  )

  if (!putRes.ok) {
    const detail = await putRes.json().catch(() => ({}))
    return NextResponse.json(
      { error: '写入 GitHub 失败', detail: detail.message ?? '' },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true })
}
