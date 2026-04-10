import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Steiner共读平台',
  description: '鲁道夫·Steiner著作阅读、批注与讨论',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col bg-[#faf9f7] text-[#1c1917]">
        {children}
      </body>
    </html>
  )
}
