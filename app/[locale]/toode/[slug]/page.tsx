import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL, localizedUrl } from '@/lib/config'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import ProductDetailClient from '@/components/ProductDetailClient'
import type { Product, Attribute, RelatedProduct, ProductDocument } from '@/components/ProductDetailClient'

export const revalidate = 3600

const LOCALES = [...routing.locales] as readonly ['et', 'en', 'ru', 'lv', 'lt']

function stripHtml(html: string): string {
  return html
    .replace(/\[caption[^\]]*\]/gi, '')
    .replace(/\[\/caption\]/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?38;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveDescription(product: Record<string, unknown>, locale: string): string {
  const fullDescField = `description_${locale}`
  const shortDescField = `short_description_${locale}`
  const raw = (product[fullDescField] as string | null)
    || (product.description_et as string | null)
    || (product[shortDescField] as string | null)
    || (product.short_description_et as string | null)
    || ''
  return stripHtml(raw)
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; slug: string }> }
): Promise<Metadata> {
  const locale = await getLocale()
  const { slug } = await params

  try {
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('name, description_et, description_en, description_ru, description_lv, description_lt, short_description_et, short_description_en, short_description_ru, short_description_lv, short_description_lt, image_url, slug')
      .eq('slug', slug)
      .single()

    if (!product) {
      return { title: 'Toode puudub' }
    }

    const description = resolveDescription(product as Record<string, unknown>, locale)

    const title = `${product.name} | Pump OÜ`
    const canonical = localizedUrl(`/toode/${slug}`, locale)

    return {
      title,
      description,
      alternates: {
        canonical,
        languages: Object.fromEntries(
          LOCALES.map(l => [l, localizedUrl(`/toode/${slug}`, l)])
        ),
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'Pump OÜ',
        locale,
        type: 'website',
        images: product.image_url ? [{ url: product.image_url, width: 1200, height: 630 }] : [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: product.image_url ? [product.image_url] : [`${SITE_URL}/og-default.jpg`],
      },
      robots: { index: true, follow: true },
    }
  } catch (e) {
    console.error('[generateMetadata] product page error:', e)
    return { title: 'Toode | Pump OÜ' }
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getLocale()
  const t = await getTranslations('product')
  const { slug } = await params

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!product) {
    notFound()
  }

  const [attrsResult, relatedResult, docsResult] = await Promise.all([
    supabaseAdmin
      .from('product_attributes')
      .select('attribute_name, attribute_value')
      .eq('product_id', product.id)
      .order('attribute_name'),
    product.category_id
      ? supabaseAdmin
          .from('products')
          .select('id, name, slug, price, image_url, short_description_et')
          .eq('category_id', product.category_id)
          .neq('id', product.id)
          .limit(4)
      : Promise.resolve({ data: null, error: null }),
    supabaseAdmin
      .from('product_documents')
      .select('id, label, public_url, storage_path')
      .eq('sku', product.sku)
      .order('label'),
  ])

  const attributes: Attribute[] = (attrsResult.data || []) as Attribute[]
  const related: RelatedProduct[] = (relatedResult.data || []) as RelatedProduct[]
  const documents: ProductDocument[] = (docsResult.data || []) as ProductDocument[]

  let attrNameMap: Record<string, string> = {}
  if (locale !== 'et' && attributes.length > 0) {
    const names = attributes.map(a => a.attribute_name)
    const { data: translations } = await supabaseAdmin
      .from('attribute_name_translations')
      .select('name_et, name_en, name_ru, name_lv, name_lt')
      .in('name_et', names)
    if (translations) {
      for (const row of translations) {
        const translated = (row as Record<string, string | null>)[`name_${locale}`]
        if (translated) attrNameMap[row.name_et] = translated
      }
    }
  }

  const displayPrice = product.sale_price ?? product.price
  const description = resolveDescription(product as Record<string, unknown>, locale)
  const availability = product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    sku: product.sku,
    image: product.image_url,
    url: `${SITE_URL}/toode/${product.slug}`,
    ...(product.category_id || product.tags ? {
      category: product.tags
        ? product.tags.split(',').map((t: string) => t.trim()).filter(Boolean).join(', ')
        : undefined,
    } : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/toode/${product.slug}`,
      priceCurrency: 'EUR',
      price: displayPrice,
      availability,
      ...(product.sale_price ? {
        validFrom: new Date().toISOString().split('T')[0],
      } : {}),
      seller: {
        '@type': 'Organization',
        name: 'Pump OÜ',
      },
    },
  }

  return (
    <>
      <Script
        id="product-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailClient
        product={product as Product}
        attributes={attributes}
        attrNameMap={attrNameMap}
        related={related}
        documents={documents}
      />
    </>
  )
}
