'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Search, SlidersHorizontal, LayoutGrid, List,
  ShoppingCart, ChevronDown, ChevronRight, X, Check
} from 'lucide-react'

// ─── TÜÜBID ────────────────────────────────────────────────────────────────

interface Product {
  id: number
  slug: string
  name: string
  sku: string | null
  short_description_et: string | null
  price: number
  sale_price: number | null
  image_url: string | null
  in_stock: boolean
}

interface Category {
  slug: string
  name_et: string
  parent_slug: string | null
  children?: Category[]
}

const PAGE_SIZE = 48

// ─── SLUG → TRANSLATION KEY ────────────────────────────────────────────────
type CatNameKey = 'heating' | 'cooling' | 'hotWater' | 'borewell' | 'drainage' | 'wells' | 'pressure' | 'sewage' | 'title' | 'jpWaterAutomatics'
const SLUG_TO_CAT_KEY: Partial<Record<string, CatNameKey>> = {
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

// ─── OSTUKORV ──────────────────────────────────────────────────────────────

function addToCart(product: Product) {
  if (typeof window === 'undefined') return
  try {
    const cart = JSON.parse(localStorage.getItem('ipumps_cart') || '[]')
    const existing = cart.find((i: { id: number }) => i.id === product.id)
    if (existing) { existing.qty += 1 } else {
      cart.push({ id: product.id, slug: product.slug, name: product.name, price: product.sale_price ?? product.price, image_url: product.image_url, qty: 1 })
    }
    localStorage.setItem('ipumps_cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart_updated'))
  } catch {}
}

// ─── TOOTEKAART ────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const t = useTranslations('products')
  const [added, setAdded] = useState(false)
  const displayPrice = product.sale_price ?? product.price

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    addToCart(product); setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <Link href={`/toode/${product.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#003366]/20 hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="relative bg-gray-50 flex items-center justify-center h-44 p-5 flex-shrink-0">
        {product.sale_price && (
          <span className="absolute top-3 left-3 bg-[#01a0dc] text-white text-[13px] font-bold px-2 py-0.5 rounded-full z-10">
            -{Math.round((1 - product.sale_price / product.price) * 100)}%
          </span>
        )}
        <span className={`absolute top-3 right-3 flex items-center gap-1 text-[13px] font-medium px-2 py-0.5 rounded-full ${product.in_stock ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${product.in_stock ? 'bg-green-500' : 'bg-gray-400'}`} />
          {product.in_stock ? t('inStock') : t('outOfStock')}
        </span>
        <img src={product.image_url || '/placeholder.png'} alt={product.name}
          className="h-28 object-contain group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }} />
      </div>
      <div className="p-4 flex flex-col flex-1">
        {product.sku && <div className="text-[13px] text-gray-400 font-mono mb-1">{product.sku}</div>}
        <div className="font-semibold text-gray-800 text-[15px] leading-tight mb-2 group-hover:text-[#003366] transition-colors line-clamp-2 flex-1">
          {product.name}
        </div>
        {product.short_description_et && (
          <div className="text-[13px] text-gray-400 line-clamp-1 mb-3">{product.short_description_et}</div>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div>
            <div className="text-lg font-bold text-[#003366]">
              {Number(displayPrice).toFixed(2).replace('.', ',')} €
            </div>
            {product.sale_price && (
              <div className="text-[13px] text-gray-400 line-through">
                {Number(product.price).toFixed(2).replace('.', ',')} €
              </div>
            )}
          </div>
          <button onClick={handleAdd} disabled={!product.in_stock}
            className={`p-2.5 rounded-xl transition-all ${added ? 'bg-green-500 text-white' : product.in_stock ? 'bg-[#003366] hover:bg-[#01a0dc] text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
            {added ? <Check size={16} /> : <ShoppingCart size={16} />}
          </button>
        </div>
      </div>
    </Link>
  )
}

// ─── TOOTE RIDA (LIST) ─────────────────────────────────────────────────────

function ProductRow({ product }: { product: Product }) {
  const t = useTranslations('products')
  const [added, setAdded] = useState(false)
  const displayPrice = product.sale_price ?? product.price

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    addToCart(product); setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <Link href={`/toode/${product.slug}`}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-[#003366]/20 hover:shadow-md transition-all duration-200 flex items-center gap-4 p-4">
      <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 p-2">
        <img src={product.image_url || '/placeholder.png'} alt={product.name}
          className="h-14 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {product.sku && <span className="text-[13px] text-gray-400 font-mono">{product.sku}</span>}
          <span className={`flex items-center gap-1 text-[13px] ${product.in_stock ? 'text-green-700' : 'text-gray-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${product.in_stock ? 'bg-green-500' : 'bg-gray-400'}`} />
            {product.in_stock ? t('inStock') : t('outOfStock')}
          </span>
        </div>
        <div className="font-semibold text-gray-800 text-[15px] leading-snug group-hover:text-[#003366] transition-colors line-clamp-1">
          {product.name}
        </div>
        {product.short_description_et && (
          <div className="text-[13px] text-gray-400 line-clamp-1 mt-0.5">{product.short_description_et}</div>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <div className="text-lg font-bold text-[#003366]">
            {Number(displayPrice).toFixed(2).replace('.', ',')} €
          </div>
          {product.sale_price && (
            <div className="text-[13px] text-gray-400 line-through">
              {Number(product.price).toFixed(2).replace('.', ',')} €
            </div>
          )}
        </div>
        <button onClick={handleAdd} disabled={!product.in_stock}
          className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-[15px] font-semibold transition-all ${added ? 'bg-green-500 text-white' : product.in_stock ? 'bg-[#003366] hover:bg-[#01a0dc] text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
          {added ? <><Check size={15} /> {t('added')}</> : <><ShoppingCart size={15} /> {t('add')}</>}
        </button>
      </div>
    </Link>
  )
}

// ─── PEAKOMPONENT ──────────────────────────────────────────────────────────

export default function KategooriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const t = useTranslations('products')
  const tNav = useTranslations('nav')
  const tCat = useTranslations('categories')
  const router = useRouter()

  const catName = (slug: string, fallback: string): string => {
    if (slug === 'tooted') return tNav('products')
    const key = SLUG_TO_CAT_KEY[slug]
    return key ? tCat(key) : fallback
  }
  const searchParams = useSearchParams()

  const SORT_OPTIONS = [
    { value: 'name_asc',   label: t('sortNameAsc') },
    { value: 'name_desc',  label: t('sortNameDesc') },
    { value: 'price_asc',  label: t('sortPriceAsc') },
    { value: 'price_desc', label: t('sortPriceDesc') },
  ]

  // URL-põhine state
  const [inputQuery, setInputQuery] = useState(searchParams.get('q') || '')
  const [query, setQuery]           = useState(searchParams.get('q') || '')
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('laos') === '1')
  const [priceMin, setPriceMin]     = useState(searchParams.get('min') || '')
  const [priceMax, setPriceMax]     = useState(searchParams.get('max') || '')
  const [sortBy, setSortBy]         = useState(searchParams.get('sort') || 'name_asc')
  const [viewMode, setViewMode]     = useState<'grid' | 'list'>('grid')
  const [page, setPage]             = useState(Number(searchParams.get('page')) || 1)
  const [sortOpen, setSortOpen]     = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [category, setCategory]     = useState<Category | null>(null)
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [parentCategory, setParentCategory] = useState<Category | null>(null)
  const [products, setProducts]     = useState<Product[]>([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)

  // ── URL sync ───────────────────────────────────────────────────────────
  const updateUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    router.push(`/kategooria/${slug}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, slug])

  // ── Lae kategooria info ────────────────────────────────────────────────
  useEffect(() => {
    async function loadCategory() {
      const { data: allCats } = await supabase
        .from('categories')
        .select('slug, name_et, parent_slug')

      if (!allCats) return

      const current = allCats.find(c => c.slug === slug)
      if (!current) return
      setCategory(current)

      const children = allCats.filter(c => c.parent_slug === slug)
      setSubcategories(children)

      if (current.parent_slug) {
        const parent = allCats.find(c => c.slug === current.parent_slug)
        setParentCategory(parent || null)
      }
    }
    loadCategory()
  }, [slug])

  // ── Debounce otsing ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => { setQuery(inputQuery); setPage(1) }, 350)
    return () => clearTimeout(timer)
  }, [inputQuery])

  // ── Lae tooted ─────────────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    setLoading(true)

    const { data: allCats } = await supabase
      .from('categories')
      .select('slug, parent_slug')

    const getAllSlugs = (parentSlug: string): string[] => {
      const slugs = [parentSlug]
      const children = (allCats || []).filter(c => c.parent_slug === parentSlug)
      children.forEach(child => slugs.push(...getAllSlugs(child.slug)))
      return slugs
    }

    const allSlugs = getAllSlugs(slug)

    const { data: catLinks } = await supabase
      .from('product_categories')
      .select('product_id')
      .in('category_slug', allSlugs)

    if (!catLinks || catLinks.length === 0) {
      setProducts([]); setTotal(0); setLoading(false); return
    }

    const productIds = [...new Set(catLinks.map(r => r.product_id))]

    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let q = supabase
      .from('products')
      .select('id, slug, name, sku, short_description_et, price, sale_price, image_url, in_stock', { count: 'exact' })
      .in('id', productIds)

    if (query.trim()) {
      const term = `%${query.trim()}%`
      q = q.or(`name.ilike.${term},sku.ilike.${term},short_description_et.ilike.${term}`)
    }
    if (inStockOnly) q = q.eq('in_stock', true)
    if (priceMin) q = q.gte('price', Number(priceMin))
    if (priceMax) q = q.lte('price', Number(priceMax))

    const [field, dir] = sortBy.split('_')
    q = q.order(field === 'name' ? 'name' : 'price', { ascending: dir === 'asc' })
    q = q.range(from, to)

    const { data, count, error } = await q
    if (!error) { setProducts(data || []); setTotal(count || 0) }
    setLoading(false)
  }, [slug, query, inStockOnly, priceMin, priceMax, sortBy, page])

  useEffect(() => { loadProducts() }, [loadProducts])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const activeFiltersCount = [inStockOnly ? '1' : '', priceMin, priceMax, query].filter(Boolean).length

  const clearFilters = () => {
    setInStockOnly(false); setPriceMin(''); setPriceMax('')
    setInputQuery(''); setPage(1)
    updateUrl({ laos: '', min: '', max: '', q: '', page: '' })
  }

  // Breadcrumb path
  const breadcrumb = []
  if (parentCategory) breadcrumb.push(parentCategory)
  if (category) breadcrumb.push(category)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Päis + breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-[15px] text-gray-400 mb-3 flex-wrap">
            <Link href="/" className="hover:text-[#003366] transition-colors">{tNav('home')}</Link>
            <ChevronRight size={14} />
            <Link href="/tooted" className="hover:text-[#003366] transition-colors">{tNav('products')}</Link>
            {breadcrumb.map((bc, i) => (
              <span key={bc.slug} className="flex items-center gap-2">
                <ChevronRight size={14} />
                {i < breadcrumb.length - 1 ? (
                  <Link href={`/kategooria/${bc.slug}`} className="hover:text-[#003366] transition-colors">
                    {catName(bc.slug, bc.name_et)}
                  </Link>
                ) : (
                  <span className="text-gray-700 font-medium">{catName(bc.slug, bc.name_et)}</span>
                )}
              </span>
            ))}
          </nav>

          <h1 className="text-2xl md:text-3xl font-bold text-[#003366]">
            {category ? catName(category.slug, category.name_et) : slug}
          </h1>
          <p className="text-[15px] text-gray-500 mt-1">
            {loading ? t('loading') : t('productCount', { count: total })}
          </p>
        </div>

        {/* Alamkategooriad */}
        {subcategories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {subcategories.map(sub => (
                <Link key={sub.slug} href={`/kategooria/${sub.slug}`}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[15px] font-medium text-gray-700 hover:border-[#003366] hover:text-[#003366] transition-colors shadow-sm">
                  {catName(sub.slug, sub.name_et)}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tööriistariba */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="search" placeholder={t('searchInCategory')}
              value={inputQuery} onChange={e => setInputQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 focus:outline-none focus:border-[#003366] transition-colors shadow-sm" />
            {inputQuery && (
              <button onClick={() => { setInputQuery(''); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filtrid */}
          <button onClick={() => setFiltersOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[15px] font-medium transition-colors shadow-sm ${
              activeFiltersCount > 0 ? 'bg-[#003366] text-white border-[#003366]' : 'bg-white border-gray-200 text-gray-700 hover:border-[#003366]'
            }`}>
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">{t('filters')}</span>
            {activeFiltersCount > 0 && (
              <span className="bg-white/25 text-white text-[13px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sorteerimine */}
          <div className="relative">
            <button onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-700 hover:border-[#003366] transition-colors shadow-sm font-medium">
              <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
              <span className="sm:hidden">{t('sort')}</span>
              <ChevronDown size={15} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-40 min-w-[210px]">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => { setSortBy(opt.value); setSortOpen(false); setPage(1); updateUrl({ sort: opt.value, page: '' }) }}
                    className={`w-full text-left px-4 py-2.5 text-[15px] hover:bg-gray-50 transition-colors ${sortBy === opt.value ? 'text-[#003366] font-semibold' : 'text-gray-700'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grid / List */}
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

        {/* Aktiivsed filtrid */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-[15px] text-gray-500">{t('filters')}:</span>
            {inStockOnly && (
              <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-[15px] font-medium px-3 py-1 rounded-full">
                {t('inStockBadge')} <button onClick={() => { setInStockOnly(false); updateUrl({ laos: '' }) }}><X size={13} /></button>
              </span>
            )}
            {(priceMin || priceMax) && (
              <span className="flex items-center gap-1.5 bg-[#003366]/10 text-[#003366] text-[15px] font-medium px-3 py-1 rounded-full">
                {priceMin || '0'}–{priceMax || '∞'} €
                <button onClick={() => { setPriceMin(''); setPriceMax(''); updateUrl({ min: '', max: '' }) }}><X size={13} /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-[15px] text-gray-400 hover:text-red-500 transition-colors underline">
              {t('clearAll')}
            </button>
          </div>
        )}

        {/* Tooted */}
        <div className="flex gap-6">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-gray-900 text-[17px]">{t('filters')}</span>
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="text-[15px] text-[#01a0dc] hover:underline">{t('clearFilters')}</button>
                )}
              </div>

              {/* Hinnavahemik */}
              <div className="mb-5">
                <div className="text-[15px] font-semibold text-gray-800 mb-3">{t('priceRange')}</div>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" value={priceMin}
                    onChange={e => { setPriceMin(e.target.value); setPage(1) }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors" />
                  <span className="text-gray-400">–</span>
                  <input type="number" placeholder="Max" value={priceMax}
                    onChange={e => { setPriceMax(e.target.value); setPage(1) }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors" />
                </div>
              </div>

              <div className="border-t border-gray-100 mb-5" />

              {/* Laoseis */}
              <div>
                <div className="text-[15px] font-semibold text-gray-800 mb-3">{t('availability')}</div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => { setInStockOnly(!inStockOnly); setPage(1) }}
                    className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${inStockOnly ? 'bg-[#003366]' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${inStockOnly ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                  <span className="text-[15px] text-gray-700">{t('inStockOnly')}</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Tooted grid/list */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="w-10 h-10 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <div className="font-semibold text-gray-800 text-lg mb-2">{t('noProducts')}</div>
                <div className="text-[15px] text-gray-400 mb-5">{t('noProductsHint')}</div>
                <button onClick={clearFilters}
                  className="bg-[#003366] text-white px-6 py-2.5 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
                  {t('clearFilters')}
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {products.map(p => <ProductRow key={p.id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                <button onClick={() => { setPage(p => Math.max(1, p - 1)); updateUrl({ page: String(Math.max(1, page - 1)) }) }}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-[15px] font-medium text-gray-600 hover:border-[#003366] hover:text-[#003366] disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white">
                  {t('prev')}
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let p: number
                    if (totalPages <= 7) p = i + 1
                    else if (page <= 4) p = i + 1
                    else if (page >= totalPages - 3) p = totalPages - 6 + i
                    else p = page - 3 + i
                    return (
                      <button key={p} onClick={() => { setPage(p); updateUrl({ page: String(p) }) }}
                        className={`w-10 h-10 rounded-xl text-[15px] font-medium transition-colors ${page === p ? 'bg-[#003366] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#003366] hover:text-[#003366]'}`}>
                        {p}
                      </button>
                    )
                  })}
                </div>
                <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); updateUrl({ page: String(Math.min(totalPages, page + 1)) }) }}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-[15px] font-medium text-gray-600 hover:border-[#003366] hover:text-[#003366] disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white">
                  {t('next')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobiili filtrite drawer */}
      {filtersOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setFiltersOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-50 lg:hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-bold text-gray-900 text-lg">{t('filters')}</span>
              <button onClick={() => setFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <div className="text-[15px] font-semibold text-gray-800 mb-3">{t('priceRange')}</div>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" value={priceMin}
                    onChange={e => setPriceMin(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[15px] text-gray-900 outline-none focus:border-[#003366]" />
                  <span className="text-gray-400">–</span>
                  <input type="number" placeholder="Max" value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[15px] text-gray-900 outline-none focus:border-[#003366]" />
                </div>
              </div>
              <div className="border-t border-gray-100" />
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setInStockOnly(!inStockOnly)}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${inStockOnly ? 'bg-[#003366]' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${inStockOnly ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-[15px] text-gray-700">{t('inStockOnly')}</span>
              </label>
              <button onClick={() => setFiltersOpen(false)}
                className="w-full bg-[#003366] text-white py-3 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
                {t('applyFilters')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
