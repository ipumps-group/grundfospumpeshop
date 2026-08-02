import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ConsentProvider } from '@/lib/consent-context'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
})

const LOCALE_META: Record<string, { title: string; description: string; ogLocale: string }> = {
  et: {
    title: 'Pump OÜ — Grundfos pumbad Eestis',
    description: 'Grundfos pumpade ametlik edasimüüja Eestis — küte, puurkaevud, drenaaž ja veeautomaatika.',
    ogLocale: 'et_EE',
  },
  en: {
    title: 'Pump OÜ — Grundfos pumps in Estonia',
    description: 'Official Grundfos dealer in Estonia — heating, borewell, drainage and water automation pumps.',
    ogLocale: 'en_US',
  },
  ru: {
    title: 'Pump OÜ — насосы Grundfos в Эстонии',
    description: 'Официальный дилер Grundfos в Эстонии — насосы для отопления, скважин, дренажа и водоснабжения.',
    ogLocale: 'ru_RU',
  },
  lv: {
    title: 'Pump OÜ — Grundfos sūkņi Igaunijā',
    description: 'Oficiālais Grundfos izplatītājs Igaunijā — apkures, urbumu, drenāžas un ūdensapgādes sūkņi.',
    ogLocale: 'lv_LV',
  },
  lt: {
    title: 'Pump OÜ — Grundfos siurbliai Estijoje',
    description: 'Oficialus Grundfos atstovas Estijoje — šildymo, gręžinių, drenažo ir vandens tiekimo siurbliai.',
    ogLocale: 'lt_LT',
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const meta = LOCALE_META[locale] || LOCALE_META.et

  return {
    title: { default: meta.title, template: '%s' },
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
      siteName: 'Pump OÜ',
      locale: meta.ogLocale,
      type: 'website',
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://sdqnzyfmanflslsjhytf.supabase.co" />
      </head>
      <body className={inter.className}>
        <ConsentProvider>
          {children}
        </ConsentProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
