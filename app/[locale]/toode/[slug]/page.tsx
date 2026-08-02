import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL, localizedUrl, languageAlternates } from '@/lib/config'
import ProductDetailClient from '@/components/ProductDetailClient'
import JsonLd from '@/components/seo/JsonLd'
import type { Product, Attribute, RelatedProduct, ProductDocument } from '@/components/ProductDetailClient'
import { withVat } from '@/lib/price'

export const revalidate = 3600

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
      .select('name, description_et, description_en, description_ru, description_lv, description_lt, short_description_et, short_description_en, short_description_ru, short_description_lv, short_description_lt, image_url, slug, price, sale_price, published')
      .eq('slug', slug)
      .single()

    const metadataPrice = Number(product?.sale_price ?? product?.price)
    if (!product || !product.published || !Number.isFinite(metadataPrice) || metadataPrice <= 0) {
      return {
        title: 'Toode puudub',
        robots: { index: false, follow: false },
      }
    }

    const description = resolveDescription(product as Record<string, unknown>, locale)

    const title = `${product.name} | Pump OÜ`
    const canonical = localizedUrl(`/toode/${slug}`, locale)

    return {
      title,
      description,
      alternates: {
        canonical,
        languages: languageAlternates(`/toode/${slug}`),
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
  const tNav = await getTranslations('nav')
  const { slug } = await params

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  const displayPrice = Number(product?.sale_price ?? product?.price)
  if (!product || !product.published || !Number.isFinite(displayPrice) || displayPrice <= 0) {
    // Keep the product-specific empty state visible. Calling notFound() here
    // replaces it with the generic route-level 404, which can briefly flash
    // and then be replaced by catalogue navigation in some client transitions.
    return (
      <ProductDetailClient
        product={null}
        attributes={[]}
        attrNameMap={{}}
        related={[]}
        documents={[]}
      />
    )
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

  const attrNameMap: Record<string, string> = {}
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

  const description = resolveDescription(product as Record<string, unknown>, locale)
  const availability = product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
  const productUrl = localizedUrl(`/toode/${product.slug}`, locale)
  const vatInclusivePrice = Number(withVat(displayPrice).toFixed(2))

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    sku: product.sku,
    brand: { '@type': 'Brand', name: 'Grundfos' },
    image: product.image_url,
    url: productUrl,
    ...(product.category_id || product.tags ? {
      category: product.tags
        ? product.tags.split(',').map((t: string) => t.trim()).filter(Boolean).join(', ')
        : undefined,
    } : {}),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'EUR',
      price: vatInclusivePrice,
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Pump OÜ',
      },
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: tNav('home'), item: localizedUrl('/', locale) },
      { '@type': 'ListItem', position: 2, name: tNav('products'), item: localizedUrl('/tooted', locale) },
      { '@type': 'ListItem', position: 3, name: product.name, item: productUrl },
    ],
  }

  return (
    <>
      <JsonLd id="product-json-ld" data={productJsonLd} />
      <JsonLd id="product-breadcrumb-json-ld" data={breadcrumbJsonLd} />
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
