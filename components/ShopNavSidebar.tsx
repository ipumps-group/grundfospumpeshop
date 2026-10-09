'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabase'
import { FiltersPanel, type Category } from '@/components/ProductFiltersSidebar'

/**
 * The narrow left navigation column (activity areas + series + filters) used
 * by the shop. Rendered on category pages, series pages and content pages so
 * the layout is the same everywhere: nav left, content right (desktop).
 */
export default function ShopNavSidebar() {
  const [tegevusalad, setTegevusalad] = useState<Category[]>([])
  const [seeriad, setSeeriad] = useState<Category[]>([])
  const [selectedAla, setSelectedAla] = useState('')
  const [selectedSeeria, setSelectedSeeria] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const router = useRouter()
  const params = useParams()
  const currentTegevusala = (params?.tegevusala as string) || ''
  const currentSeeria = (params?.seeria as string) || ''

  useEffect(() => {
    if (currentTegevusala) setSelectedAla(currentTegevusala)
    if (currentSeeria) setSelectedSeeria(currentSeeria)
  }, [currentTegevusala, currentSeeria])

  useEffect(() => {
    async function load() {
      const { data: areas } = await supabase
        .from('activity_areas')
        .select('id, slug, name_et, sort_order')
        .eq('is_active', true)
        .order('sort_order')

      const { data: allSeries } = await supabase
        .from('product_series')
        .select('id, slug, name, sort_order, activity_areas!primary_activity_area_id(slug)')
        .eq('is_active', true)
        .order('name')

      const { data: saa } = await supabase
        .from('series_activity_areas')
        .select('series_id, activity_area_id')

      const { data: products } = await supabase
        .from('products')
        .select('series_slug')
        .eq('published', true)

      // Series that have published products
      const seriesWithProducts = new Set((products || []).map(p => p.series_slug).filter(Boolean))
      // Series objects that have products
      const activeSeries = (allSeries || []).filter(s => seriesWithProducts.has(s.slug))
      // Activity area IDs linked to those series
      const saaMap = new Map<number, Set<unknown>>()
      for (const r of saa || []) {
        if (!saaMap.has(r.activity_area_id)) saaMap.set(r.activity_area_id, new Set())
        saaMap.get(r.activity_area_id)!.add(r.series_id)
      }
      const areaIdsWithProducts = new Set(
        activeSeries
          .map(s => (s as any).activity_areas?.slug)
          .filter(Boolean) as string[]
      )

      if (areas) {
        setTegevusalad(areas
          .filter(a => areaIdsWithProducts.has(a.slug))
          .map(a => ({ slug: a.slug, name_et: a.name_et, parent_slug: null })))
      }

      if (allSeries) {
        setSeeriad(activeSeries
          .map(s => ({ slug: s.slug, name_et: (s as any).name.replace(/Grundfos\s*/g, ''), parent_slug: (s as any).activity_areas?.slug || null })))
      }
    }
    load()
  }, [])

  const handleSetAla = (v: string) => {
    router.push(v ? `/tooted/${v}` : '/tooted')
  }

  const handleSetSeeria = (v: string) => {
    if (v) {
      const series = seeriad.find(c => c.slug === v) ?? seeriad.flatMap(c => c.children || []).find(c => c.slug === v)
      const areaSlug = series?.parent_slug || currentTegevusala
      if (areaSlug) router.push(`/tooted/${areaSlug}/${v}`)
    } else if (currentTegevusala) router.push(`/tooted/${currentTegevusala}`)
    else router.push('/tooted')
  }

  return (
    <aside className="hidden lg:block w-60 flex-shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <FiltersPanel
          tegevusalad={tegevusalad} seeriad={seeriad}
          selectedAla={selectedAla} setSelectedAla={handleSetAla}
          selectedSeeria={selectedSeeria} setSelectedSeeria={handleSetSeeria}
          inStockOnly={inStockOnly} setInStockOnly={setInStockOnly}
          priceMin={priceMin} setPriceMin={setPriceMin}
          priceMax={priceMax} setPriceMax={setPriceMax}
        />
      </div>
    </aside>
  )
}
