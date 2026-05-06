import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
})

export const metadata: Metadata = {
  title: {
    default: 'iPumps — Grundfos pumbad Eestis',
    template: '%s | iPumps',
  },
  description:
    'Grundfos pumpade ametlik edasimüüja Eestis. 321 toodet laos — küte, jahutus, puurkaevud, drenaaž ja palju muud.',
  openGraph: {
    siteName: 'iPumps',
    locale: 'et_EE',
    type: 'website',
  },
  verification: {
    google: 'PLACEHOLDER_PASTE_GSC_TOKEN',
    other: {
      'msvalidate.01': 'PLACEHOLDER_BING_TOKEN',
    },
    yandex: 'PLACEHOLDER_YANDEX_TOKEN',
  },
}

// Root layout owns <html> and <body> — required by Next.js / Vercel.
// All locale-specific providers, Header and Footer are in app/[locale]/layout.tsx.
// The actual html lang attribute is set dynamically by SetHtmlLang (client component).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="et" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
