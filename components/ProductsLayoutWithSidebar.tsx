'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { Search, ChevronDown, LayoutGrid, List } from 'lucide-react'
import { ViewModeProvider, useViewMode } from '@/lib/ViewModeContext'
import { useTranslations } from 'next-intl'
import ShopNavSidebar from '@/components/ShopNavSidebar'

const SORT_OPTIONS = [
  { value: 'name_asc',   labelKey: 'sortNameAsc' },
  { value: 'name_desc',  labelKey: 'sortNameDesc' },
  { value: 'price_asc',  labelKey: 'sortPriceAsc' },
  { value: 'price_desc', labelKey: 'sortPriceDesc' },
]

export default function ProductsLayoutWithSidebar({ children }: { children: React.ReactNode }) {
  return (
    <ViewModeProvider>
      <ProductsLayoutInner>{children}</ProductsLayoutInner>
    </ViewModeProvider>
  )
}

function ProductsLayoutInner({ children }: { children: React.ReactNode }) {
  const { viewMode, setViewMode } = useViewMode()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOpen, setSortOpen] = useState(false)
  const router = useRouter()
  const params = useParams()
  const currentTegevusala = (params?.tegevusala as string) || ''
  const currentSeeria = (params?.seeria as string) || ''
  const t = useTranslations('products')
  const tCommon = useTranslations('common')

  useEffect(() => {
    setSortOpen(false)
  }, [currentTegevusala, currentSeeria])

  const handleSearch = (q: string) => {
    if (q.trim()) router.push(`/tooted?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="search" placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(searchQuery) }}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 focus:outline-none focus:border-[#003366] transition-colors shadow-sm" />
          {searchQuery && (
            <button onClick={() => { handleSearch(searchQuery); setSearchQuery('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#003366] hover:text-[#004080]">
              <Search size={17} />
            </button>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-700 hover:border-[#003366] transition-colors shadow-sm font-medium">
            <span className="hidden sm:inline">{t(SORT_OPTIONS.find(o => o.value === 'name_asc')!.labelKey as any)}</span>
            <span className="sm:hidden">{tCommon('sort')}</span>
            <ChevronDown size={15} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-40 min-w-[210px]">
              {SORT_OPTIONS.map(opt => {
                const params = new URLSearchParams()
                if (currentTegevusala) params.set('tegevusala', currentTegevusala)
                if (currentSeeria) params.set('seeria', currentSeeria)
                params.set('sort', opt.value)
                return (
                  <a key={opt.value} href={`/tooted?${params.toString()}`}
                    className="block w-full text-left px-4 py-2.5 text-[15px] hover:bg-gray-50 transition-colors text-gray-700">
                    {t(opt.labelKey as any)}
                  </a>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button onClick={() => setViewMode('grid')}
            className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-[#003366] text-white' : 'text-gray-400 hover:text-gray-600'}`}>
            <LayoutGrid size={17} />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-[#003366] text-white' : 'text-gray-400 hover:text-gray-600'}`}>
            <List size={17} />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <ShopNavSidebar />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
