import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Haftung · Steiner共读平台',
}

export default function HaftungPage() {
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
          Haftungsausschluss · 免责声明
        </h1>
        <div className="w-8 h-0.5 rounded-full mb-10" style={{ backgroundColor: 'var(--accent)' }} />

        <div className="text-sm leading-relaxed flex flex-col gap-8" style={{ color: 'var(--text-secondary)' }}>

          <Section title="1. 网站性质 · Art der Website">
            <p>
              本网站为个人非商业性质网站，所有内容免费提供，不含任何付费服务或商业目的。
            </p>
            <p className="mt-2">
              Diese Website ist ein privates, nicht-kommerzielles Angebot ohne Gewinnerzielungsabsicht. Alle Inhalte werden kostenlos bereitgestellt.
            </p>
          </Section>

          <Section title="2. 著作权说明 · Urheberrechtliche Hinweise">
            <p className="mb-3">
              本网站所呈现的 Rudolf Steiner（1861–1925）原始著作均为公版作品（Public Domain）。其著作在逝世满70年后已在大多数国家和地区依法进入公共领域，任何人均可自由使用。
            </p>
            <p className="mb-3">
              Die auf dieser Website dargestellten Originalwerke von Rudolf Steiner sind gemeinfrei (Public Domain). Die urheberrechtliche Schutzfrist von 70 Jahren nach dem Tod des Urhebers ist in den meisten Ländern abgelaufen.
            </p>
            <p className="mb-3">
              本网站所有中文译文均由人工智能（AI）独立生成，<strong style={{ color: 'var(--text-primary)' }}>未参考、引用或改编任何现有中文版权译本</strong>。如有与任何已出版译本相似之处，纯属巧合。
            </p>
            <p>
              Sämtliche chinesischsprachigen Übersetzungen wurden ausschließlich mithilfe künstlicher Intelligenz erstellt. Es wurden <strong style={{ color: 'var(--text-primary)' }}>keine bestehenden urheberrechtlich geschützten Übersetzungen</strong> verwendet, zitiert oder bearbeitet.
            </p>
          </Section>

          <Section title="3. 翻译免责 · Haftung für Übersetzungsinhalte">
            <p className="mb-3">
              AI生成的译文仅供参考，不构成学术研究、医疗、法律或任何专业领域的建议或依据。译文可能存在误译、遗漏或表达不准确之处。读者在引用或依赖本站内容时，应自行查阅原始德文文本。
            </p>
            <p>
              Die KI-generierten Übersetzungen dienen ausschließlich der allgemeinen Information und stellen keine wissenschaftliche, medizinische oder rechtliche Fachberatung dar. Übersetzungsfehler und Ungenauigkeiten können nicht ausgeschlossen werden. Für eine verlässliche Nutzung wird empfohlen, stets den deutschen Originaltext hinzuzuziehen.
            </p>
          </Section>

          <Section title="4. 责任限制 · Haftungsbeschränkung">
            <p className="mb-2">本网站运营者对以下情形不承担任何责任：</p>
            <ul className="list-disc list-inside space-y-1 mb-3">
              <li>因使用或依赖本站译文而产生的任何直接或间接损失</li>
              <li>外部链接页面的内容及合法性</li>
              <li>因技术故障、服务中断或数据丢失造成的损害</li>
            </ul>
            <p className="mb-2">Der Betreiber übernimmt keine Haftung für:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>direkte oder indirekte Schäden durch Nutzung der Übersetzungen</li>
              <li>Inhalte und Rechtmäßigkeit externer verlinkter Seiten</li>
              <li>Schäden durch technische Ausfälle oder Datenverlust</li>
            </ul>
          </Section>

          <Section title="5. 侵权联系 · Hinweis bei Rechtsverletzungen">
            <p className="mb-3">
              若您认为本网站内容侵犯了您的合法权益，请通过以下方式联系，运营者将在合理时间内审查并予以处理：
            </p>
            <p className="mb-3">
              Sollten Sie der Ansicht sein, dass Inhalte dieser Website Ihre Rechte verletzen, wenden Sie sich bitte an:
            </p>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>E-Mail：</strong>[your@email.com]
            </p>
          </Section>

        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      <div>{children}</div>
    </section>
  )
}
