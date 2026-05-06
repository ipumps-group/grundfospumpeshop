import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/config'
import ProductsGrid from '../ProductsGrid'
const LOCALES = [...routing.locales] as readonly ['et', 'en', 'ru', 'lv', 'lt']

// Map URL slugs to DB tegevusala values
const URL_SLUG_TO_TEGEVUSALA: Record<string, string> = {
  'kute': 'kute',
  'jahutus': 'jahutus',
  'sooja-tarbevee-tsirkulatsioonipump': 'sooja-tarbevee-tsirkulatsioonipump',
  'puurkaevud': 'puurkaevud',
  'drenaaz': 'drenaa', // DB uses 'drenaa' not 'drenaaz'
  'salvkaevud': 'salvkaevud',
  'rohutoste': 'rohutoste',
  'reovesi': 'reovesi',
}

const TEGEVUSALA_VALUES = Object.values(URL_SLUG_TO_TEGEVUSALA)

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; tegevusala: string }> }
): Promise<Metadata> {
  const locale = await getLocale()
  const { tegevusala } = await params
  
  // Skip if not a valid tegevusala
  if (!URL_SLUG_TO_TEGEVUSALA[tegevusala]) {
    return { title: 'Tooted' }
  }
  
  const tProducts = await getTranslations('metadata.products')
  const tCats = await getTranslations('metadata.tegevusaladTitle')
  const tCatDesc = await getTranslations('metadata.tegevusaladDesc')

  const dbTegevusala = URL_SLUG_TO_TEGEVUSALA[tegevusala] || tegevusala
  const title = tCats(dbTegevusala as any) || tProducts('title' as any)
  const description = tCatDesc(dbTegevusala as any) || tProducts('description' as any)

  const canonical = `${SITE_URL}/${locale}/tooted/${tegevusala}`

  return {
    title,
    description,
    alternates: {
      canonical: canonical,
      languages: Object.fromEntries(
        LOCALES.map(l => [l, `${SITE_URL}/${l}/tooted/${tegevusala}`])
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
    robots: { index: true, follow: true },
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; tegevusala: string }>
}) {
  const { tegevusala } = await params
  
  // Get DB value
  const dbTegevusala = URL_SLUG_TO_TEGEVUSALA[tegevusala] || tegevusala

  // Fetch products for this category
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, slug, name, sku, short_description_et, price, sale_price, image_url, in_stock')
    .eq('tegevusala', dbTegevusala)
    .eq('published', true)
    .order('name', { ascending: true })

  return (
    <ProductsGrid 
      products={products || []} 
      tegevusala={dbTegevusala}
    />
  )
}