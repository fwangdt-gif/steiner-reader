'use client'

import { useState } from 'react'
import { books } from '@/lib/data'
import AnnouncementsSection from './AnnouncementsSection'
import ContinueReading from './ContinueReading'
import LocalBooks from './LocalBooks'
import SteinerBooksSection from './SteinerBooksSection'
import UserNav from './UserNav'

export default function LibraryPage() {
  const [query, setQuery] = useState('')

  return (
    <div className="min-h-screen">
      {/* ── 顶部：站名 + 搜索 + 用户导航 ───────────────────────── */}
      <header className="wc-header sticky top-0 z-10 border-b">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-4">
          <span className="flex-shrink-0 leading-none">
            <span
              className="text-xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Steiner
            </span>
            <span
              className="text-sm font-medium ml-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              共读平台
            </span>
          </span>

          {/* 搜索栏 */}
          <div className="flex-1 min-w-0">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索书名或作者…"
              className="w-full px-3 py-1.5 rounded-lg border text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--warm-100)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <UserNav />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10">
        {/* ── 公告 ──────────────────────────────────────────────── */}
        <AnnouncementsSection />

        {/* ── 上次阅读 ──────────────────────────────────────────── */}
        <ContinueReading />

        {/* ── 我的书库 + 共享书库 ────────────────────────────────── */}
        <LocalBooks query={query} />

        {/* ── Steiner 著作 ───────────────────────────────────────── */}
        <div className="mt-14">
          <SteinerBooksSection books={books} query={query} />
        </div>

        <div className="mt-16 pb-8 text-center">
          <p className="text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>
            本平台仅供私人共读使用
          </p>
        </div>
      </main>
    </div>
  )
}
