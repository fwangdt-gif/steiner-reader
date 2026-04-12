import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impressum · Steiner共读平台',
}

export default function ImpressumPage() {
  return (
    <div className="min-h-screen">
      <header className="wc-header border-b">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center">
          <Link href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>← 返回</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-12">
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Legal</p>
        <h1 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Georgia, serif', color: 'var(--text-primary)' }}>
          Impressum
        </h1>
        <div className="w-8 h-0.5 rounded-full mb-10" style={{ backgroundColor: 'var(--accent)' }} />

        <div className="prose-legal">
          <Section title="Angaben gemäß § 5 TMG">
            <Field label="Name" value="[Vor- und Nachname]" />
            <Field label="Anschrift" value="[Straße, Hausnummer, PLZ, Ort, Deutschland]" />
            <Field label="E-Mail" value="[your@email.com]" />
          </Section>

          <Section title="Verantwortlich für den Inhalt">
            <p style={{ color: 'var(--text-secondary)' }}>
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:<br />
              [Vor- und Nachname, Anschrift wie oben]
            </p>
          </Section>

          <Section title="Hinweis">
            <p style={{ color: 'var(--text-secondary)' }}>
              Diese Website ist ein privates, nicht-kommerzielles Angebot ohne Gewinnerzielungsabsicht.
              Alle Inhalte werden kostenlos bereitgestellt.
            </p>
          </Section>

          <Section title="网站运营说明">
            <p style={{ color: 'var(--text-secondary)' }}>
              本网站为个人非商业性质，所有内容免费提供，不含任何付费服务或商业目的。
            </p>
          </Section>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 mb-1.5">
      <span className="w-24 flex-shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)' }}>{value}</span>
    </div>
  )
}
