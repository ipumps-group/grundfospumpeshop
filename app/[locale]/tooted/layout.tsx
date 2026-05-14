import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/config'
const LOCALES = [...routing.locales] as readonly ['et', 'en', 'ru', 'lv', 'lt']

const TEGEVUSALA_VALUES = [
  'kute',
  'jahutus',
  'sooja-tarbevee-tsirkulatsioonipump',
  'puurkaevud',
  'drenaaz',
  'salvkaevud',
  'rohutoste',
  'reovesi',
]

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const locale = await getLocale()
  
  const tProducts = await getTranslations('metadata.products')

  const title = tProducts('title' as any)
  const description = tProducts('description' as any)

  const canonical = `${SITE_URL}/${locale}/tooted`

  return {
    title,
    description,
    alternates: {
      canonical: canonical,
      languages: Object.fromEntries(
        LOCALES.map(l => [l, `${SITE_URL}/${l}/tooted`])
      ),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'iPumps',
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

export default function TootedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}