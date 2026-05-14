import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/config'
const LOCALES = ['et', 'en', 'ru', 'lv', 'lt'] as const

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; locale: string }> }
): Promise<Metadata> {
  const locale = await getLocale()
  const { slug } = await params

  // Fetch product from Supabase
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('name, sku, short_description_et, short_description_en, short_description_ru, short_description_lv, short_description_lt, image_url, price, sale_price')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!product) {
    return { title: 'Product not found' }
  }

  // Get localized short description
  const descKey = `short_description_${locale}` as keyof typeof product
  const shortDesc = product[descKey] as string | null || product.short_description_et

  // Build title and description
  const title = `${product.name} ${product.sku ? product.sku : ''} — Grundfos pump | iPumps`.trim()
  const description = shortDesc 
    ? shortDesc.slice(0, 155) 
    : `Buy ${product.name} from iPumps. Best price and expert advice.`

  const canonical = `${SITE_URL}/${locale}/toode/${slug}`
  const imageUrl = product.image_url || `${SITE_URL}/og-default.jpg`
  const price = product.sale_price ?? product.price

  return {
    title,
    description,
    alternates: {
      canonical: canonical,
      languages: Object.fromEntries(
        LOCALES.map(l => [l, `${SITE_URL}/${l}/toode/${slug}`])
      ),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'iPumps',
      locale: locale,
      type: 'website',
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: { index: true, follow: true },
  }
}

export default function ToodeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}