import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchSidebarData } from '@/lib/fetch-sidebar-data'
import { matchSearchKeyword } from '@/lib/search-keywords'
import SafeImage from '@/components/SafeImage'
import ProductsLayoutWithSidebar from '@/components/ProductsLayoutWithSidebar'
import TootedPageClient from './page-client'

export const dynamic = 'force-dynamic'

async function resolveSeriesSlug(hardcodedSlug: string): Promise<string | null> {
  // 1. Try exact match
  const { data: exact } = await supabaseAdmin
    .from('product_series')
    .select('slug')
    .eq('slug', hardcodedSlug)
    .eq('is_active', true)
    .maybeSingle()
  if (exact) return exact.slug

  // 2. Try to find by extracting the product name from the slug (e.g. "grundfos-alpha" -> "alpha")
  const namePart = hardcodedSlug.replace(/^grundfos-?/i, '').replace(/-/g, ' ')
  const { data: byName } = await supabaseAdmin
    .from('product_series')
    .select('slug, name')
    .eq('is_active', true)
    .ilike('name', `%${namePart}%`)
    .limit(1)
  if (byName && byName.length > 0) return byName[0].slug

  // 3. Try matching the full slug as a LIKE pattern
  const { data: byLike } = await supabaseAdmin
    .from('product_series')
    .select('slug')
    .eq('is_active', true)
    .ilike('slug', `%${namePart}%`)
    .limit(1)
  if (byLike && byLike.length > 0) return byLike[0].slug

  return null
}

async function CatalogView() {
  const tNav = await getTranslations('nav')
  const tCat = await getTranslations('categories')
  const locale = await getLocale()

  const { data: areas } = await supabaseAdmin
    .from('activity_areas')
    .select('id, slug, name_et, h1, description, description_en, description_ru, description_lv, description_lt')
    .eq('is_active', true)
    .order('sort_order')

  if (!areas) return null

  const SLUG_TO_TITLE: Record<string, string> = {
    'kuttepumbad': 'heatingTitle', 'puurkaevupumbad': 'borewellTitle',
    'salvkaevupumbad': 'wellsTitle', 'drenaazipumbad': 'drainageTitle',
    'rohutostepumbad': 'pressureTitle', 'reoveepumbad': 'sewageTitle',
    'veeautomaadid': 'jpWaterAutomaticsTitle',
    'tsirkulatsioonipumbad-soe-tarbevesi': 'hotWaterTitle',
  }

  // Batch load series for all categories
  const { data: allSaa } = await supabaseAdmin
    .from('series_activity_areas')
    .select('series_id, activity_area_id')

  const { data: allPs } = await supabaseAdmin
    .from('product_series')
    .select('id, slug, name')
    .eq('is_active', true)

  const { data: allProducts } = await supabaseAdmin
    .from('products')
    .select('series_slug, image_url')
    .eq('published', true)

  const psMap = new Map((allPs || []).map(p => [p.id, { slug: p.slug, name: p.name }]))
  const productMap = new Map<string, { count: number; image: string | null }>()
  for (const p of allProducts || []) {
    if (!p.series_slug) continue
    if (!productMap.has(p.series_slug)) productMap.set(p.series_slug, { count: 0, image: null })
    const e = productMap.get(p.series_slug)!
    e.count++
    if (!e.image && p.image_url) e.image = p.image_url
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProductsLayoutWithSidebar>
          <h1 className="text-3xl font-bold text-[#003366] mb-8">{tNav('products')}</h1>

        {areas
          .map(area => {
            const saaRows = (allSaa || []).filter((r: any) => r.activity_area_id === area.id)
            const seriesIds = [...new Set(saaRows.map((r: any) => r.series_id) as number[])]
            const areaSeries = seriesIds.map(id => psMap.get(id)).filter(Boolean) as { slug: string; name: string }[]
            const hasProducts = areaSeries.some(s => (productMap.get(s.slug)?.count || 0) > 0)
            return hasProducts ? { area, areaSeries } : null
          })
          .filter(Boolean)
          .map((item: any) => {
            const { area, areaSeries } = item
            const areaDesc = locale === 'et' ? area.description : (area as any)[`description_${locale}`] || area.description
            const titleKey = SLUG_TO_TITLE[area.slug]
            const displayName = titleKey ? tCat(titleKey as any) : area.name_et

            return (
              <div key={area.slug} className="mb-12">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <Link href={`/tooted/${area.slug}`} className="text-2xl font-bold text-[#003366] hover:text-[#01a0dc] transition-colors">
                      {displayName}
                    </Link>
                    {areaDesc && (
                      <p className="text-[15px] text-gray-500 mt-1">{areaDesc}</p>
                    )}
                  </div>
                  <Link href={`/tooted/${area.slug}`} className="text-[15px] text-[#003366] hover:underline font-medium flex-shrink-0">
                    {tNav('allProducts')}
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {areaSeries
                    .map((s: any) => {
                      const pm = productMap.get(s.slug)
                      return (pm && pm.count > 0) ? { s, pm } : null
                    })
                    .filter(Boolean)
                    .map((item: any) => {
                      const { s, pm } = item
                      return (
                        <Link
                          key={s.slug}
                          href={`/tooted/${area.slug}/${s.slug}`}
                          className="group bg-white rounded-xl border border-gray-100 hover:border-[#003366]/20 hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                          <div className="aspect-square bg-gray-50 flex items-center justify-center p-6">
                            {pm.image ? (
                              <SafeImage src={pm.image} alt={s.name} className="h-16 object-contain group-hover:scale-105 transition-transform duration-200" />
                            ) : (
                              <div className="text-gray-300 text-3xl font-bold opacity-20">{s.name.charAt(0)}</div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="font-semibold text-gray-800 text-[14px] leading-tight group-hover:text-[#003366] transition-colors line-clamp-2">
                              {s.name.replace(/^Grundfos\s*/i, '')}
                            </div>
                            <div className="text-[12px] text-gray-400 mt-1">{pm.count} {locale === 'et' ? 'toodet' : 'products'}</div>
                          </div>
                        </Link>
                      )
                    })}
                </div>
              </div>
            )
          })}
          </ProductsLayoutWithSidebar>
      </div>
    </div>
  )
}

export default async function TootedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  // Has search query -> check keywords first (server-side redirect avoids flash of "no products")
  if (q?.trim()) {
    const kw = matchSearchKeyword(q.trim())
    if (kw) {
      if (kw.type === 'seeria' && kw.parentSlug) {
        // Validate & resolve series slug against DB (hardcoded slug may not match actual DB value)
        const resolvedSlug = await resolveSeriesSlug(kw.slug)
        if (resolvedSlug) {
          redirect(`/tooted/${kw.parentSlug}/${resolvedSlug}`)
        }
      } else {
        redirect(`/tooted/${kw.slug}`)
      }
    }

    const sidebarData = await fetchSidebarData()
    return (
      <Suspense>
        <TootedPageClient
          initCategories={sidebarData.categories}
          initSeries={sidebarData.series}
        />
      </Suspense>
    )
  }

  // No search -> show all-series catalog
  return <CatalogView />
}
