import type { Metadata } from 'next'
import './globals.css'
import LegalFooter from './LegalFooter'

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
      <body className="min-h-full flex flex-col">
        {children}
        <LegalFooter />
      </body>
    </html>
  )
}
