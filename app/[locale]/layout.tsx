import { getLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/config'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SetHtmlLang from '@/components/SetHtmlLang'
import LocaleDetector from '@/components/LocaleDetector'
import JsonLd from '@/components/seo/JsonLd'
import { AuthProvider } from '@/lib/auth-context'
import GoogleAdsTracker from '@/components/GoogleAdsTracker'
import ConsentTracking from '@/components/ConsentTracking'
import CookieConsent from '@/components/CookieConsent'
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getSiteSettings } from '@/lib/site-settings'

const LOCALES = [...routing.locales] as readonly ['et', 'en', 'ru', 'lv', 'lt']

/**
 * Homepage metadata - generates unique titles/descriptions per locale
 */
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const locale = await getLocale()
  const { locale: urlLocale } = await params
  
  const tHome = await getTranslations('metadata.home')
  
  const title = tHome('title' as any)
  const description = tHome('description' as any)

  const canonical = `${SITE_URL}/${urlLocale}`

  return {
    title,
    description,
    alternates: {
      canonical: canonical,
      languages: Object.fromEntries(
        LOCALES.map(l => [l, `${SITE_URL}/${l}`])
      ),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Pump OÜ',
      locale: locale,
      type: 'website',
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og-default.jpg`],
    },
    robots: { index: true, follow: true },
  }
}

/**
 * Organization + WebSite + LocalBusiness JSON-LD schema for all locale layouts.
 * Renders in the layout to ensure it's present on every page.
 */
async function OrganizationSchema() {
  const locale = await getLocale()
  
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Pump OÜ',
    url: SITE_URL,
    logo: `${SITE_URL}/ipumps-logo-white.svg`,
    telephone: '+3725274403',
    address: {
      streetAddress: 'Vana-Narva mnt 3',
      addressLocality: 'Maardu linn',
      postalCode: '74114',
      addressRegion: 'Harju maakond',
      addressCountry: 'EE',
    },
    vatID: 'EE102445343',
    sameAs: [
      'https://www.facebook.com/ipumps',
      'https://www.instagram.com/ipumps_ee',
    ],
  }

  const webSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/${locale}/tooted?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Pump OÜ',
    image: `${SITE_URL}/og-default.jpg`,
    url: SITE_URL,
    telephone: '+3725274403',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Vana-Narva mnt 3',
      addressLocality: 'Maardu linn',
      postalCode: '74114',
      addressRegion: 'Harju maakond',
      addressCountry: 'EE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '59.437',
      longitude: '24.7536',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '17:00',
    },
    priceRange: '€€',
  }

  return (
    <>
      <JsonLd data={organization} />
      <JsonLd data={webSite} />
      <JsonLd data={localBusiness} />
    </>
  )
}

// Static imports — no dynamic template-literal imports that can fail in Vercel's bundler
import etMessages from '@/messages/et.json'
import enMessages from '@/messages/en.json'
import ruMessages from '@/messages/ru.json'
import lvMessages from '@/messages/lv.json'
import ltMessages from '@/messages/lt.json'

const allMessages = {
  et: etMessages,
  en: enMessages,
  ru: ruMessages,
  lv: lvMessages,
  lt: ltMessages,
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound()
  }

  const messages = allMessages[locale as keyof typeof allMessages]
  const siteSettings = await getSiteSettings()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* JSON-LD structured data for Organization, WebSite, LocalBusiness */}
      <OrganizationSchema />
      {/* Updates <html lang="..."> on the client to match the locale */}
      <SetHtmlLang />
      {/* Detects system language on first visit via navigator.language */}
      <LocaleDetector />
      <AuthProvider>
        <ConsentTracking />
        <GoogleAdsTracker />
        <Header siteSettings={siteSettings} />
        <main>{children}</main>
        <Footer siteSettings={siteSettings} />
        <CookieConsent />
      </AuthProvider>
    </NextIntlClientProvider>
  )
}
