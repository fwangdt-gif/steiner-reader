import { books } from '@/lib/data'
import AnnouncementsSection from './AnnouncementsSection'
import ContinueReading from './ContinueReading'
import LocalBooks from './LocalBooks'
import SteinerBooksSection from './SteinerBooksSection'
import UserNav from './UserNav'

export default function LibraryPage() {
  return (
    <div className="min-h-screen">
      {/* ── 顶部导航 ─────────────────────────────────────────────── */}
      <header className="wc-header sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-base font-semibold tracking-tight"
            style={{ color: 'var(--text-primary)' }}>
            Steiner 共读平台
          </span>
          <UserNav />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* ── 共剪西窗烛 ───────────────────────────────────────────── */}
        <AnnouncementsSection />

        {/* ── 上次阅读 ─────────────────────────────────────────────── */}
        <ContinueReading />

        {/* ── 我的书籍 + 共享书库（含搜索 / 分类 / 上传入口） ────── */}
        <LocalBooks />

        {/* ── Steiner 著作（静态） ──────────────────────────────────── */}
        <div className="mt-10">
          <SteinerBooksSection books={books} />
        </div>

        <div className="mt-12 pb-8 text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            本平台仅供私人共读使用
          </p>
        </div>
      </main>
    </div>
  )
}
