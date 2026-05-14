'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Category {
  slug: string
  name_et: string
  parent_slug: string | null
  children?: Category[]
}

const SLUG_TO_CAT_KEY: Partial<Record<string, string>> = {
  'elamud-ja-arihooned': 'title',
  'kute': 'heating',
  'jahutus': 'cooling',
  'puurkaevud': 'borewell',
  'drenaa': 'drainage',
  'salvkaevud': 'wells',
  'rohutoste': 'pressure',
  'sooja-tarbevee-tsirkulatsioonipump': 'hotWater',
  'reovesi': 'sewage',
  'jp-veeautomaat': 'jpWaterAutomatics',
}

const DB_TO_URL: Record<string, string> = { 'drenaa': 'drenaaz' }
const URL_TO_DB: Record<string, string> = { 'drenaaz': 'drenaa' }

function CategoryTree({ categories, selected, onSelect, title }: {
  categories: Category[]
  selected: string
  onSelect: (slug: string) => void
  title: string
}) {
  const tCommon = useTranslations('common')
  const tCat = useTranslations('categories')
  const tNav = useTranslations('nav')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggle = (slug: string) => setExpanded(prev => ({ ...prev, [slug]: !prev[slug] }))

  const catName = (slug: string, fallback: string): string => {
    if (slug === 'tooted') return tNav('products')
    const key = SLUG_TO_CAT_KEY[slug]
    return key ? tCat(key as any) : fallback
  }

  const renderCat = (cat: Category, depth = 0) => {
    const hasChildren = (cat.children?.length ?? 0) > 0
    const isSelected = selected === cat.slug
    const isExpanded = expanded[cat.slug]

    return (
      <div key={cat.slug}>
        <div className={`flex items-center gap-0.5 ${depth > 0 ? 'ml-3' : ''}`}>
          <button
            onClick={() => onSelect(isSelected ? '' : cat.slug)}
            className={`flex-1 text-left px-3 py-2 rounded-lg text-[15px] transition-colors ${
              isSelected ? 'bg-[#003366] text-white font-medium' : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            {catName(cat.slug, cat.name_et)}
          </button>
          {hasChildren && (
            <button onClick={() => toggle(cat.slug)}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
              <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {cat.children!.map(child => renderCat(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="text-[15px] font-semibold text-gray-800 mb-2">{title}</div>
      <div className="space-y-0.5">
        <button onClick={() => onSelect('')}
          className={`w-full text-left px-3 py-2 rounded-lg text-[15px] transition-colors ${
            selected === '' ? 'bg-[#003366] text-white font-medium' : 'hover:bg-gray-100 text-gray-700'
          }`}>
          {tCommon('all')}
        </button>
        {categories.map(cat => renderCat(cat))}
      </div>
    </div>
  )
}

export function FiltersPanel({
  tegevusalad, seeriad,
  selectedAla, setSelectedAla,
  selectedSeeria, setSelectedSeeria,
  inStockOnly, setInStockOnly,
  priceMin, setPriceMin,
  priceMax, setPriceMax,
  onClose,
}: {
  tegevusalad: Category[]
  seeriad: Category[]
  selectedAla: string
  setSelectedAla: (v: string) => void
  selectedSeeria: string
  setSelectedSeeria: (v: string) => void
  inStockOnly: boolean
  setInStockOnly: (v: boolean) => void
  priceMin: string
  setPriceMin: (v: string) => void
  priceMax: string
  setPriceMax: (v: string) => void
  onClose?: () => void
}) {
  const t = useTranslations('products')
  const tNav = useTranslations('nav')

  return (
    <div className="space-y-5">
      <CategoryTree categories={tegevusalad} selected={URL_TO_DB[selectedAla] ?? selectedAla} onSelect={setSelectedAla} title={t('activityArea')} />
      <div className="border-t border-gray-100" />
      <CategoryTree categories={seeriad} selected={selectedSeeria} onSelect={setSelectedSeeria} title={tNav('productSeries')} />
      <div className="border-t border-gray-100" />

      <div>
        <div className="text-[15px] font-semibold text-gray-800 mb-3">{t('priceRange')}</div>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors" />
          <span className="text-gray-400 flex-shrink-0">–</span>
          <input type="number" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors" />
        </div>
      </div>

      <div className="border-t border-gray-100" />

      <div>
        <div className="text-[15px] font-semibold text-gray-800 mb-3">{t('availability')}</div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setInStockOnly(!inStockOnly)}
            className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 relative cursor-pointer ${inStockOnly ? 'bg-[#003366]' : 'bg-gray-200'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${inStockOnly ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
          <span className="text-[15px] text-gray-700">{t('inStockOnly')}</span>
        </label>
      </div>

      {onClose && (
        <button onClick={onClose}
          className="w-full bg-[#003366] text-white py-3 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
          {t('applyFilters')}
        </button>
      )}
    </div>
  )
}

export type { Category }
export { DB_TO_URL, URL_TO_DB, SLUG_TO_CAT_KEY }
