import Link from 'next/link'
import { books } from '@/lib/data'
import ContinueReading from './ContinueReading'
import LocalBooks from './LocalBooks'
import SteinerBooksSection from './SteinerBooksSection'
import UploadFileModal from './UploadFileModal'
import UserNav from './UserNav'

export default function LibraryPage() {
  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <header className="wc-header sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">Steiner共读平台</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              私人圈子
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UploadFileModal />
            <Link
              href="/upload"
              className="text-sm px-3 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              + 手动录入
            </Link>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">书库</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {books.length} 部著作 · 共同阅读与批注
          </p>
        </div>

        <ContinueReading />

        <LocalBooks />

        <div className="mt-10">
          <SteinerBooksSection books={books} />
        </div>

        <div className="mt-12 pb-8 text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>本平台仅供私人共读使用</p>
        </div>
      </main>
    </div>
  )
}
