import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutz · Steiner共读平台',
}

export default function DatenschutzPage() {
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
          Datenschutzerklärung · 隐私政策
        </h1>
        <div className="w-8 h-0.5 rounded-full mb-10" style={{ backgroundColor: 'var(--accent)' }} />

        <div className="text-sm leading-relaxed flex flex-col gap-8" style={{ color: 'var(--text-secondary)' }}>

          <Section title="1. Verantwortlicher · 数据控制者">
            <p>
              Verantwortlicher im Sinne der DSGVO ist der Betreiber dieser Website:<br />
              [Name, Anschrift, E-Mail — siehe <Link href="/impressum" className="underline underline-offset-2">Impressum</Link>]
            </p>
          </Section>

          <Section title="2. Erhobene Daten · 收集的数据">
            <p className="mb-3">
              <strong style={{ color: 'var(--text-primary)' }}>Server-Logfiles：</strong>访问本网站时，托管服务商自动记录以下数据：IP地址、访问时间、请求页面、浏览器类型。上述数据由托管服务商保存，通常不超过30天，用于技术安全目的。
            </p>
            <p className="mb-3">
              <strong style={{ color: 'var(--text-primary)' }}>用户注册数据：</strong>注册账户时收集电子邮件地址、显示名称及加密密码。本网站不收集真实姓名、地址、电话号码或支付信息。
            </p>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>用户生成内容：</strong>阅读笔记、评论等内容与账户关联存储，仅用于提供个性化功能。
            </p>
          </Section>

          <Section title="3. Zweck der Verarbeitung · 处理目的">
            <ul className="list-disc list-inside space-y-1">
              <li>账户身份验证与登录功能</li>
              <li>保存阅读笔记、评论等用户内容</li>
              <li>防止账户滥用及未授权访问</li>
              <li>必要的服务通知（如密码重置）</li>
            </ul>
            <p className="mt-3">本网站不将用户数据用于广告推送、行为追踪、数据出售或向第三方营销机构传输。</p>
          </Section>

          <Section title="4. Rechtsgrundlage · 法律依据">
            <p>
              数据处理依据GDPR第6条第1款：
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong style={{ color: 'var(--text-primary)' }}>Art. 6 Abs. 1 lit. b DSGVO</strong>：履行服务合同（账户功能）</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Art. 6 Abs. 1 lit. f DSGVO</strong>：运营者合理利益（安全保护）</li>
            </ul>
          </Section>

          <Section title="5. Datenspeicherung · 数据存储">
            <p>
              用户数据存储于 <strong style={{ color: 'var(--text-primary)' }}>Supabase</strong>（欧盟服务器节点，符合GDPR要求）。密码采用行业标准加密处理，运营者无法读取明文密码。数据传输全程采用TLS/HTTPS加密。
            </p>
            <p className="mt-2">
              Datenschutzerklärung Supabase：
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 ml-1">supabase.com/privacy</a>
            </p>
          </Section>

          <Section title="6. Speicherdauer · 保存期限">
            <ul className="list-disc list-inside space-y-1">
              <li>账户数据在账户存续期间持续保存</li>
              <li>账户删除后30天内清除全部相关数据</li>
              <li>服务器日志由托管服务商自动保存7至30天</li>
            </ul>
          </Section>

          <Section title="7. Ihre Rechte · 您的权利">
            <p className="mb-3">依据GDPR，您对本人数据享有以下权利：查阅权（Art. 15）、更正权（Art. 16）、删除权（Art. 17）、限制处理权（Art. 18）、可携带权（Art. 20）、异议权（Art. 21）。</p>
            <p>
              行使上述权利，请发送邮件至：<strong style={{ color: 'var(--text-primary)' }}>[your@email.com]</strong><br />
              运营者将在一个月内（GDPR法定期限）予以答复。
            </p>
          </Section>

          <Section title="8. Beschwerderecht · 投诉权利">
            <p>
              若您认为本网站对您个人数据的处理违反GDPR，您有权向主管数据保护机构提起投诉（Art. 77 DSGVO），无需事先联系本网站运营者。
            </p>
          </Section>

          <Section title="9. Cookies">
            <p>
              本网站仅使用功能性本地存储（localStorage）保存阅读偏好（字体大小、主题），不使用任何追踪性Cookie或第三方分析工具。
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
