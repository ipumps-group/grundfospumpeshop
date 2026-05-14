'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FiltersPanel, type Category } from '@/components/ProductFiltersSidebar'

export default function ProductsLayoutWithSidebar({ children }: { children: React.ReactNode }) {
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

  useEffect(() => {
    if (currentTegevusala) {
      setSelectedAla(currentTegevusala)
    }
  }, [currentTegevusala])

  useEffect(() => {
    async function load() {
      const { data: areas } = await supabase
        .from('activity_areas')
        .select('slug, name_et, sort_order')
        .eq('is_active', true)
        .order('sort_order')

      const { data: allSeries } = await supabase
        .from('product_series')
        .select('slug, name, sort_order')
        .eq('is_active', true)
        .order('sort_order')

      if (areas) setTegevusalad(areas.map(a => ({ slug: a.slug, name_et: a.name_et, parent_slug: null })))
      if (allSeries) setSeeriad(allSeries.map(s => ({ slug: s.slug, name_et: s.name.replace(/Grundfos\s*/g, ''), parent_slug: null })))
    }
    load()
  }, [])

  const handleSetAla = (v: string) => {
    if (v) router.push(`/tooted/${v}`)
    else router.push('/tooted')
  }

  const handleSetSeeria = (v: string) => {
    if (v) router.push(`/tooted/${currentTegevusala}/${v}`)
  }

  return (
    <div className="flex gap-6">
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
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
