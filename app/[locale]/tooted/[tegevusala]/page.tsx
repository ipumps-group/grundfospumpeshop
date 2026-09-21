import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL, localizedUrl, languageAlternates } from '@/lib/config'
import { getCategoryContent } from '@/lib/category-content'
import ProductsLayoutWithSidebar from '@/components/ProductsLayoutWithSidebar'
import SafeImage from '@/components/SafeImage'

export const dynamic = 'force-dynamic'

interface SeriesWithMeta {
  id: number
  slug: string
  name: string
  sort_order: number
  description: string | null
  product_count: number
  image_url: string | null
}

const SLUG_TO_TITLE: Record<string, string> = {
  'kuttepumbad': 'heatingTitle', 'puurkaevupumbad': 'borewellTitle',
  'salvkaevupumbad': 'wellsTitle', 'drenaazipumbad': 'drainageTitle',
  'rohutostepumbad': 'pressureTitle', 'reoveepumbad': 'sewageTitle',
  'veeautomaadid': 'jpWaterAutomaticsTitle',
  'tsirkulatsioonipumbad-soe-tarbevesi': 'hotWaterTitle',
}

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

    const tCat = await getTranslations('categories')
    const tKey = SLUG_TO_TITLE[area.slug] || SLUG_TO_TITLE[tegevusala]
    const catName = tKey ? tCat(tKey as any) : area.name_et

    const title = locale !== 'et' ? `${catName} | Pump OÜ` : (area.meta_title || `${area.name_et} | Pump OÜ`)
    const description = area.meta_description || `${area.name_et} — vaata kõiki tooteid selles kategoorias.`
    const canonical = localizedUrl(`/tooted/${tegevusala}`, locale)

    return {
      title,
      description,
      alternates: {
        canonical,
        languages: languageAlternates(`/tooted/${tegevusala}`),
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

async function getSeriesWithMeta(areaId: number, areaSlug: string, locale: string): Promise<SeriesWithMeta[]> {
  const { data: saa } = await supabaseAdmin
    .from('series_activity_areas')
    .select('series_id')
    .eq('activity_area_id', areaId)

  if (!saa || saa.length === 0) return []

  const ids = saa.map((r: any) => r.series_id)
  const descField = locale === 'et' ? 'description' : `description_${locale}`
  const { data: seriesList } = await supabaseAdmin
    .from('product_series')
    .select('id, slug, name, sort_order, description, description_en, description_ru, description_lv, description_lt')
    .in('id', ids)
    .eq('is_active', true)
    .order('sort_order')

  if (!seriesList) return []

  const seriesSlugs = seriesList.map((s: any) => s.slug)
  const { data: productData } = await supabaseAdmin
    .from('products')
    .select('series_slug, image_url')
    .in('series_slug', seriesSlugs)
    .eq('published', true)

  const productMap = new Map<string, { count: number; image: string | null }>()
  for (const p of productData || []) {
    const slug = p.series_slug
    if (!slug) continue
    if (!productMap.has(slug)) productMap.set(slug, { count: 0, image: null })
    const entry = productMap.get(slug)!
    entry.count++
    if (!entry.image && p.image_url) entry.image = p.image_url
  }

  return seriesList
    .map((s: any) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      sort_order: s.sort_order,
      description: (s as any)[descField] || s.description || '',
      product_count: productMap.get(s.slug)?.count || 0,
      image_url: productMap.get(s.slug)?.image || null,
    }))
    .filter(s => s.product_count > 0)
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; tegevusala: string }>
}) {
  const { tegevusala } = await params

  try {
    const locale = await getLocale()
    const { data: area } = await supabaseAdmin
      .from('activity_areas')
      .select('id, name_et, slug, h1, description, description_en, description_ru, description_lv, description_lt')
      .eq('slug', tegevusala)
      .single()

    const seriesList: SeriesWithMeta[] = area
      ? await getSeriesWithMeta((area as any).id, tegevusala, locale)
      : []

    const pageTitle = (area as any)?.h1 || (area as any)?.name_et || tegevusala
    const tNav = await getTranslations('nav')
    const tCat = await getTranslations('categories')
    const tProd = await getTranslations('products')

    const titleKey = SLUG_TO_TITLE[tegevusala]
    const catDisplayName = titleKey ? tCat(titleKey as any) : (area as any)?.name_et || tegevusala
    const displayTitle = locale !== 'et' ? catDisplayName : pageTitle

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ProductsLayoutWithSidebar>
            <nav className="flex items-center gap-2 text-[15px] text-gray-400 mb-6">
            <Link href="/" className="hover:text-[#003366] transition-colors">{tNav('home')}</Link>
            <span>/</span>
            <Link href="/tooted" className="hover:text-[#003366] transition-colors">{tNav('products')}</Link>
            <span>/</span>
            <span className="text-[#003366] font-medium">{catDisplayName}</span>
          </nav>

          <h1 className="text-3xl font-bold text-[#003366] mb-2">{displayTitle}</h1>
          {(() => {
            const areaDesc = locale === 'et' ? (area as any)?.description : (area as any)?.[`description_${locale}`] || (area as any)?.description
            return areaDesc ? (
              <p className="text-[15px] text-gray-500 mb-6 max-w-3xl">{areaDesc}</p>
            ) : null
          })()}

          {seriesList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <p className="text-gray-500 text-lg">{tProd('noSeries')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {seriesList.map((s) => (
                <Link
                  key={s.id}
                  href={`/tooted/${tegevusala}/${s.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-[#003366]/20 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center p-8">
                    {s.image_url ? (
                      <SafeImage
                        src={s.image_url}
                        alt={s.name}
                        className="h-28 object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-gray-300 text-5xl font-bold opacity-20">{s.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#003366] transition-colors">{s.name}</h3>
                    {s.description && (
                      <p className="text-[15px] text-gray-500 mt-2 leading-relaxed line-clamp-4">
                        {s.description.endsWith('.') || s.description.endsWith('!') || s.description.endsWith('?') ? s.description : s.description + '.'}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[13px] font-medium text-[#003366] bg-[#003366]/5 px-3 py-1 rounded-full">
                        {tProd('seriesProductCount', { count: s.product_count })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          </ProductsLayoutWithSidebar>

          {(() => {
            const cc = getCategoryContent(tegevusala, locale)
            if (!cc) return null
            return (
              <div className="mt-12 max-w-4xl">
                <section className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#003366]">{cc.guideTitle}</h2>
                  {cc.guideParagraphs.map((p) => (
                    <p key={p.slice(0, 32)} className="mt-4 text-[15px] text-gray-600 leading-relaxed">{p}</p>
                  ))}

                  <h3 className="mt-8 text-xl font-bold text-[#003366]">{cc.priceTitle}</h3>
                  <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">{cc.priceIntro}</p>
                  <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full min-w-[480px] text-[14px]">
                      <thead>
                        <tr className="bg-[#003366] text-white text-left">
                          {cc.priceTable.head.map((h) => (
                            <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cc.priceTable.rows.map((row, i) => (
                          <tr key={row[0]} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2.5 font-semibold text-gray-900">{row[0]}</td>
                            <td className="px-4 py-2.5 text-gray-700">{row[1]}</td>
                            <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{row[2]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#003366]">{cc.faqTitle}</h2>
                  <div className="mt-4 divide-y divide-gray-100">
                    {cc.faq.map((f) => (
                      <details key={f.q} className="group py-4">
                        <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-gray-800 group-open:text-[#003366]">
                          {f.q}
                          <span className="shrink-0 text-[#01a0dc] transition-transform group-open:rotate-45">+</span>
                        </summary>
                        <p className="mt-3 text-[15px] text-gray-600 leading-relaxed max-w-3xl">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </section>
              </div>
            )
          })()}
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
