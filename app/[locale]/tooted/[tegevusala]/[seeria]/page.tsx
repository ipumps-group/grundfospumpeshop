import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/config'
import ProductsGrid from '../../ProductsGrid'
import ProductsLayoutWithSidebar from '@/components/ProductsLayoutWithSidebar'

export const revalidate = 3600

const LOCALES = [...routing.locales] as readonly ['et', 'en', 'ru', 'lv', 'lt']

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; tegevusala: string; seeria: string }> }
): Promise<Metadata> {
  const locale = await getLocale()
  const { tegevusala, seeria } = await params

  try {
    const { data: series } = await supabaseAdmin
      .from('product_series')
      .select('name, meta_title, meta_description, slug')
      .eq('slug', seeria)
      .single()

    const { data: area } = await supabaseAdmin
      .from('activity_areas')
      .select('name_et')
      .eq('slug', tegevusala)
      .single()

    if (!series || !area) {
      return { title: 'Tooted' }
    }

    const title = series.meta_title || `${series.name} — ${area.name_et} | iPumps`
    const description = series.meta_description || `${series.name} tooted ${area.name_et.toLowerCase()} kategoorias.`
    const canonical = `${SITE_URL}/${locale}/tooted/${tegevusala}/${seeria}`

    return {
      title,
      description,
      alternates: {
        canonical,
        languages: Object.fromEntries(
          LOCALES.map(l => [l, `${SITE_URL}/${l}/tooted/${tegevusala}/${seeria}`])
        ),
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'iPumps',
        locale,
        type: 'website',
        images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630 }],
      },
      robots: { index: true, follow: true },
    }
  } catch (e) {
    console.error('[generateMetadata] series page error:', e)
    return { title: 'Tooted' }
  }
}

export async function generateStaticParams() {
  try {
    const { data: areas } = await supabaseAdmin
      .from('activity_areas')
      .select('id, slug')
      .eq('is_active', true)

    if (!areas || areas.length === 0) return []

    const params: { tegevusala: string; seeria: string }[] = []

    for (const area of areas) {
      const { data: saa } = await supabaseAdmin
        .from('series_activity_areas')
        .select('series_id')
        .eq('activity_area_id', area.id)

      if (saa && saa.length > 0) {
        const ids = saa.map(r => r.series_id)
        const { data: series } = await supabaseAdmin
          .from('product_series')
          .select('slug')
          .in('id', ids)
          .eq('is_active', true)

        if (series) {
          for (const s of series) {
            params.push({ tegevusala: area.slug, seeria: s.slug })
          }
        }
      }
    }

    return params
  } catch (e) {
    console.error('[generateStaticParams] series error:', e)
    return []
  }
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ locale: string; tegevusala: string; seeria: string }>
}) {
  const { tegevusala, seeria } = await params

  try {
    const { data: series } = await supabaseAdmin
      .from('product_series')
      .select('id, name, slug')
      .eq('slug', seeria)
      .single()

    const { data: area } = await supabaseAdmin
      .from('activity_areas')
      .select('name_et, slug')
      .eq('slug', tegevusala)
      .single()

    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, slug, name, sku, short_description_et, price, sale_price, image_url, in_stock')
      .eq('series_slug', seeria)
      .eq('published', true)
      .order('name', { ascending: true })

    const pageTitle = series?.name || seeria

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ProductsLayoutWithSidebar>
            <nav className="flex items-center gap-2 text-[15px] text-gray-400 mb-6">
            <Link href="/" className="hover:text-[#003366] transition-colors">Avaleht</Link>
            <span>/</span>
            <Link href="/tooted" className="hover:text-[#003366] transition-colors">Tooted</Link>
            {area && (
              <>
                <span>/</span>
                <Link href={`/tooted/${area.slug}`} className="hover:text-[#003366] transition-colors">
                  {area.name_et}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-[#003366] font-medium">{pageTitle}</span>
          </nav>

          <h1 className="text-3xl font-bold text-[#003366] mb-2">{pageTitle}</h1>
          {series && (series as any).description && (
            <p className="text-[15px] text-gray-500 mb-8 max-w-3xl">{(series as any).description}</p>
          )}

          <ProductsGrid products={products || []} title={pageTitle} />
          {products && products.length > 0 && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'ItemList',
                  itemListElement: (products as any[]).map((p, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    item: {
                      '@type': 'Product',
                      name: p.name,
                      url: `${SITE_URL}/toode/${p.slug}`,
                      ...(p.image_url ? { image: p.image_url } : {}),
                      ...(p.sku ? { sku: p.sku } : {}),
                    },
                  })),
                  numberOfItems: (products as any[]).length,
                }),
              }}
            />
          )}
          </ProductsLayoutWithSidebar>
        </div>
      </div>
    )
  } catch (e) {
    console.error('[SeriesPage] render error:', e)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center max-w-md">
          <div className="text-red-500 text-lg font-semibold mb-2">Viga lehe laadimisel</div>
          <p className="text-gray-500 text-sm">{(e as Error).message}</p>
        </div>
      </div>
    )
  }
}
