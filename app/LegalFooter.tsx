import Link from 'next/link'

export default function LegalFooter() {
  return (
    <footer className="mt-auto border-t py-6 text-center" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <Link href="/impressum" className="hover:underline underline-offset-2">Impressum</Link>
        <span>·</span>
        <Link href="/datenschutz" className="hover:underline underline-offset-2">Datenschutz</Link>
        <span>·</span>
        <Link href="/haftung" className="hover:underline underline-offset-2">Haftung</Link>
      </div>
    </footer>
  )
}
