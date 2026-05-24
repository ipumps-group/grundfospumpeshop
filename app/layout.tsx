import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
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

const LOCALE_META: Record<string, { title: string; description: string; ogLocale: string }> = {
  et: {
    title: 'iPumps — Grundfos pumbad Eestis',
    description: 'Grundfos pumpade ametlik edasimüüja Eestis. 321 toodet laos — küte, puurkaevud, drenaaž, veeautomaatika.',
    ogLocale: 'et_EE',
  },
  en: {
    title: 'iPumps — Grundfos pumps in Estonia',
    description: 'Official Grundfos dealer in Estonia. 321 products in stock — heating, borewell, drainage, water automatics.',
    ogLocale: 'en_US',
  },
  ru: {
    title: 'iPumps — насосы Grundfos в Эстонии',
    description: 'Официальный дилер Grundfos в Эстонии. 321 товар на складе — отопление, скважины, дренаж, водная автоматика.',
    ogLocale: 'ru_RU',
  },
  lv: {
    title: 'iPumps — Grundfos sūkņi Igaunijā',
    description: 'Oficiālais Grundfos izplatītājs Igaunijā. 321 preces noliktavā — apkure, urbumi, drenāža, ūdens automātika.',
    ogLocale: 'lv_LV',
  },
  lt: {
    title: 'iPumps — Grundfos siurbliai Estijoje',
    description: 'Oficialus Grundfos atstovas Estijoje. 321 prekės sandėlyje — šildymas, gręžiniai, drenažas, vandens automatika.',
    ogLocale: 'lt_LT',
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'et'
  const meta = LOCALE_META[locale] || LOCALE_META.et

  return {
    title: { default: meta.title, template: `%s | iPumps` },
    description: meta.description,
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon.ico', sizes: '48x48' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
      other: [
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    manifest: '/site.webmanifest',
    other: { 'theme-color': '#003366' },
    openGraph: {
      siteName: 'iPumps',
      locale: meta.ogLocale,
      type: 'website',
    },
    verification: {
      google: 'PLACEHOLDER_PASTE_GSC_TOKEN',
      other: { 'msvalidate.01': 'PLACEHOLDER_BING_TOKEN' },
      yandex: 'PLACEHOLDER_YANDEX_TOKEN',
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'et'

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://sdqnzyfmanflslsjhytf.supabase.co" />
      </head>
      <body className={inter.className}>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
