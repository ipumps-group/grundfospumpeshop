import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
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
    description: 'Grundfos pumpade ametlik edasimüüja Eestis. 321 toodet laos — küte, puurkaevud, drenaaž, veeautomaatika.',
    ogLocale: 'et_EE',
  },
  en: {
    title: 'Pump OÜ — Grundfos pumps in Estonia',
    description: 'Official Grundfos dealer in Estonia. 321 products in stock — heating, borewell, drainage, water automatics.',
    ogLocale: 'en_US',
  },
  ru: {
    title: 'Pump OÜ — насосы Grundfos в Эстонии',
    description: 'Официальный дилер Grundfos в Эстонии. 321 товар на складе — отопление, скважины, дренаж, водная автоматика.',
    ogLocale: 'ru_RU',
  },
  lv: {
    title: 'Pump OÜ — Grundfos sūkņi Igaunijā',
    description: 'Oficiālais Grundfos izplatītājs Igaunijā. 321 preces noliktavā — apkure, urbumi, drenāža, ūdens automātika.',
    ogLocale: 'lv_LV',
  },
  lt: {
    title: 'Pump OÜ — Grundfos siurbliai Estijoje',
    description: 'Oficialus Grundfos atstovas Estijoje. 321 prekės sandėlyje — šildymas, gręžiniai, drenažas, vandens automatika.',
    ogLocale: 'lt_LT',
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'et'
  const meta = LOCALE_META[locale] || LOCALE_META.et

  return {
    title: { default: meta.title, template: `%s | Pump OÜ` },
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

  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
  const gtmId = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://sdqnzyfmanflslsjhytf.supabase.co" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />

        {gtmId ? (
          <Script id="gtm-head" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        ) : null}

        {(adsId && ga4Id) ? (
          <>
            <Script id="gtag-base" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
gtag('js',new Date());gtag('config','${ga4Id}',{send_page_view:false});
gtag('config','${adsId}',{send_page_view:false});`}
            </Script>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${adsId}`} strategy="afterInteractive" />
          </>
        ) : null}
      </head>
      <body className={inter.className}>
        {gtmId ? <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`} height="0" width="0" style={{display:'none',visibility:'hidden'}}></iframe></noscript> : null}
        <ConsentProvider>
          {children}
        </ConsentProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
