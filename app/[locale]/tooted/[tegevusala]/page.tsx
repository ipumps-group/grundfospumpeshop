import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/config'
import ProductsGrid from '../ProductsGrid'
const LOCALES = [...routing.locales] as readonly ['et', 'en', 'ru', 'lv', 'lt']

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; tegevusala: string }> }
): Promise<Metadata> {
  const locale = await getLocale()
  const { tegevusala } = await params

  try {
    const { data: area } = await supabaseAdmin
      .from('activity_areas')
      .select('name_et, meta_title, meta_description, slug')
      .eq('slug', tegevusala)
      .single()

    if (!area) {
      return { title: 'Tooted' }
    }

    const title = area.meta_title || `${area.name_et} | iPumps`
    const description = area.meta_description || `${area.name_et} — vaata kõiki tooteid selles kategoorias.`
    const canonical = `${SITE_URL}/${locale}/tooted/${tegevusala}`

    return {
      title,
      description,
      alternates: {
        canonical,
        languages: Object.fromEntries(
          LOCALES.map(l => [l, `${SITE_URL}/${l}/tooted/${tegevusala}`])
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
    console.error('[generateMetadata] category page error:', e)
    return { title: 'Tooted' }
  }
}

export async function generateStaticParams() {
  try {
    const { data: areas } = await supabaseAdmin
      .from('activity_areas')
      .select('slug')
      .eq('is_active', true)

    if (!areas) return []
    return areas.map(a => ({ tegevusala: a.slug }))
  } catch (e) {
    console.error('[generateStaticParams] category error:', e)
    return []
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; tegevusala: string }>
}) {
  const { tegevusala } = await params

  try {
    const { data: area } = await supabaseAdmin
      .from('activity_areas')
      .select('id, name_et, slug, h1, description')
      .eq('slug', tegevusala)
      .single()

    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, slug, name, sku, short_description_et, price, sale_price, image_url, in_stock')
      .eq('primary_activity_area_slug', tegevusala)
      .eq('published', true)
      .order('name', { ascending: true })

    let seriesLinks: any[] | null = null
    if (area) {
      const { data: saa } = await supabaseAdmin
        .from('series_activity_areas')
        .select('series_id')
        .eq('activity_area_id', (area as any).id)

      if (saa && saa.length > 0) {
        const ids = saa.map((r: any) => r.series_id)
        const { data: ps } = await supabaseAdmin
          .from('product_series')
          .select('id, slug, name, sort_order')
          .in('id', ids)
          .order('sort_order')
        seriesLinks = ps
      }
    }

    const pageTitle = (area as any)?.h1 || (area as any)?.name_et || tegevusala

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <nav className="flex items-center gap-2 text-[15px] text-gray-400 mb-6">
            <Link href="/" className="hover:text-[#003366] transition-colors">Avaleht</Link>
            <span>/</span>
            <Link href="/tooted" className="hover:text-[#003366] transition-colors">Tooted</Link>
            <span>/</span>
            <span className="text-[#003366] font-medium">{(area as any)?.name_et || tegevusala}</span>
          </nav>

          <h1 className="text-3xl font-bold text-[#003366] mb-2">{pageTitle}</h1>
          {(area as any)?.description && (
            <p className="text-[15px] text-gray-500 mb-6 max-w-3xl">{(area as any).description}</p>
          )}

          {seriesLinks && seriesLinks.length > 0 && (
            <div className="mb-8">
              <div className="text-[15px] font-semibold text-gray-700 mb-3">Tooteseeriad</div>
              <div className="flex flex-wrap gap-2">
                {seriesLinks.map((sl: any) => (
                  <Link
                    key={sl.id}
                    href={`/tooted/${tegevusala}/${sl.slug}`}
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-[15px] font-medium text-gray-700 hover:border-[#003366] hover:text-[#003366] transition-colors shadow-sm"
                  >
                    {sl.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(!products || products.length === 0) ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <p className="text-gray-500 text-lg">Selles kategoorias ei ole veel tooteid.</p>
            </div>
          ) : (
            <ProductsGrid products={products} title={pageTitle} />
          )}
        </div>
      </div>
    )
  } catch (e) {
    console.error('[CategoryPage] render error:', e)
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
