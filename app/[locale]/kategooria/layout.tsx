import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL, localizedUrl } from '@/lib/config'

const LOCALES = [...routing.locales] as readonly ['et', 'en', 'ru', 'lv', 'lt']

const TEGEVUSALA_SLUGS = new Set([
  'kute', 'jahutus', 'sooja-tarbevee-tsirkulatsioonipump',
  'puurkaevud', 'drenaaz', 'salvkaevud', 'rohutoste', 'reovesi',
])

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; slug: string }> }
): Promise<Metadata> {
  const locale = await getLocale()
  const { slug } = await params

  try {
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('name_et, meta_title, meta_description')
      .eq('slug', slug)
      .single()

    if (!category) {
      return { title: 'Kategooria | Pump OÜ' }
    }

    const name = category.name_et || slug
    const title = category.meta_title || `${name} | Pump OÜ`
    const description = category.meta_description || `${name} — vaata kõiki tooteid selles kategoorias.`

    const canonicalBase = TEGEVUSALA_SLUGS.has(slug) ? `/tooted/${slug}` : `/kategooria/${slug}`
    const canonical = localizedUrl(canonicalBase, locale)

    return {
      title,
      description,
      alternates: {
        canonical,
        languages: Object.fromEntries(
          LOCALES.map(l => [l, localizedUrl(canonicalBase, l)])
        ),
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'Pump OÜ',
        locale,
        type: 'website',
        images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630 }],
      },
      robots: { index: true, follow: true },
    }
  } catch (e) {
    console.error('[generateMetadata] kategooria layout error:', e)
    return { title: 'Kategooria | Pump OÜ' }
  }
}

export default function KategooriaLayout({ children }: { children: React.ReactNode }) {
  return children
}
