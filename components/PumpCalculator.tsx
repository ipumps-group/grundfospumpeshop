'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ShoppingCart, ChevronRight, Search, Loader2, Check, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTranslations } from 'next-intl'
import { withVat, fmt } from '@/lib/price'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: number
  slug: string
  name: string
  sku: string | null
  price: number
  sale_price: number | null
  image_url: string | null
  in_stock: boolean
  short_description_et: string | null
}

// ─── Constants (slugs only — labels come from translations) ──────────────────

const TEGEVUSALAD = [
  { nameKey: 'heating',           slug: 'kuttepumbad',                          id: 'heating' },
  { nameKey: 'cooling',           slug: 'kuttepumbad',                          id: 'cooling' },
  { nameKey: 'circulation',       slug: 'tsirkulatsioonipumbad-soe-tarbevesi',  id: 'circulation' },
  { nameKey: 'borewell',          slug: 'puurkaevupumbad',                      id: 'borewell' },
  { nameKey: 'wells',             slug: 'salvkaevupumbad',                      id: 'wells' },
  { nameKey: 'jpWaterAutomatics', slug: 'veeautomaadid',                        id: 'jpWaterAutomatics' },
  { nameKey: 'pressure',          slug: 'rohutostepumbad',                      id: 'pressure' },
  { nameKey: 'drainage',          slug: 'drenaazipumbad',                       id: 'drainage' },
  { nameKey: 'sewage',            slug: 'reoveepumbad',                         id: 'sewage' },
]

const TEMP_OPTIONS = [
  { labelKey: 'temp1' as const, threshold: 35  },
  { labelKey: 'temp2' as const, threshold: 95  },
  { labelKey: 'temp3' as const, threshold: 110 },
]

// ─── Unit helpers ────────────────────────────────────────────────────────────

/** Parse "15 dm" / "4 m" / "80 cm" → metres */
function parseHeadM(v: string): number | null {
  const m = v.match(/([\d.,]+)\s*(dm|cm|mm|m)\b/i)
  if (!m) return null
  const val = parseFloat(m[1].replace(',', '.'))
  const u = m[2].toLowerCase()
  if (u === 'dm') return val / 10
  if (u === 'cm') return val / 100
  if (u === 'mm') return val / 1000
  return val
}

/** Parse "4.6 m³/h" / "1.2 l/s" / "30 l/min" → m³/h */
function parseFlowM3h(v: string): number | null {
  const m = v.match(/([\d.,]+)\s*(m[³3]\/h|l\/s|l\/min)/i)
  if (!m) return null
  const val = parseFloat(m[1].replace(',', '.'))
  const u = m[2].toLowerCase()
  if (u === 'l/s')   return val * 3.6
  if (u === 'l/min') return val * 0.06
  return val
}

/** Parse "1 x 230 V" / "3 x 400 V" → '1' | '3' | null */
function parsePhase(v: string): string | null {
  const m = v.match(/^(\d+)\s*[×x]/i)
  return m ? m[1] : null
}

/** Parse max temp from "2 .. 110 °C" / "-10 .. 95 °C" → number */
function parseMaxTemp(v: string): number | null {
  const nums = v.match(/-?\d+(?:[.,]\d+)?/g)
  if (!nums || nums.length < 2) return null
  return parseFloat(nums[nums.length - 1].replace(',', '.'))
}

/** Parse IP water protection digit from "IP44" / "IPX4D" / "IP68" */
function parseIpWater(v: string): number | null {
  // Match IPxx where second char is digit or X
  const m = v.match(/IP[X\d](\d)/i)
  return m ? parseInt(m[1]) : null
}

function addToCart(product: Product) {
  if (typeof window === 'undefined') return
  try {
    const cart = JSON.parse(localStorage.getItem('ipumps_cart') || '[]')
    const existing = cart.find((i: { id: number }) => i.id === product.id)
    if (existing) existing.qty += 1
    else cart.push({ id: product.id, slug: product.slug, name: product.name, price: product.sale_price ?? product.price, image_url: product.image_url, qty: 1 })
    localStorage.setItem('ipumps_cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart_updated'))
  } catch {}
}

// ─── Mini Product Card ────────────────────────────────────────────────────────

function MiniProductCard({ product }: { product: Product }) {
  const t = useTranslations('calculator')
  const [added, setAdded] = useState(false)
  const price = product.sale_price ?? product.price

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    addToCart(product); setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <Link href={`/toode/${product.slug}`}
      className="group bg-white rounded-xl border border-gray-100 hover:border-[#003366]/20 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      <div className="relative bg-gray-50 flex items-center justify-center h-36 p-4 flex-shrink-0">
        {product.sale_price && (
          <span className="absolute top-2 left-2 bg-[#01a0dc] text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
            -{Math.round((1 - product.sale_price / product.price) * 100)}%
          </span>
        )}
        <span className={`absolute top-2 right-2 flex items-center gap-1 text-[12px] font-medium px-1.5 py-0.5 rounded-full ${product.in_stock ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${product.in_stock ? 'bg-green-500' : 'bg-gray-400'}`} />
          {product.in_stock ? t('inStock') : t('outOfStock')}
        </span>
        <img
          src={product.image_url || '/placeholder.png'}
          alt={product.name}
          width={80}
          height={80}
          className="h-20 object-contain group-hover:scale-105 transition-transform duration-200"
          onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
        />
      </div>
      <div className="p-3 flex flex-col flex-1">
        {product.sku && <div className="text-[12px] text-gray-400 font-mono mb-0.5">{product.sku}</div>}
        <div className="font-semibold text-gray-800 text-[14px] leading-tight mb-2 group-hover:text-[#003366] transition-colors line-clamp-2 flex-1">
          {product.name}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <div>
            <div className="text-[15px] font-bold text-[#003366]">
              {fmt(withVat(price))}
            </div>
            {product.sale_price && (
              <div className="text-[12px] text-gray-400 line-through">
                {fmt(withVat(product.price))}
              </div>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={!product.in_stock}
            aria-label={t('addToCart')}
            className={`p-2 rounded-lg transition-all ${added ? 'bg-green-500 text-white' : product.in_stock ? 'bg-[#003366] hover:bg-[#01a0dc] text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            {added ? <Check size={14} /> : <ShoppingCart size={14} />}
          </button>
        </div>
      </div>
    </Link>
  )
}

// ─── Toggle Button helper ────────────────────────────────────────────────────

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-2 rounded-xl border text-[13px] font-medium transition-all text-center leading-snug ${
        active
          ? 'bg-[#003366] text-white border-[#003366] shadow-sm'
          : 'bg-white text-gray-600 border-gray-200 hover:border-[#003366] hover:text-[#003366]'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Separator label ─────────────────────────────────────────────────────────

function FieldLabel({ children, as: Tag = 'div', ...props }: { children: React.ReactNode; as?: 'div' | 'label'; htmlFor?: string }) {
  return <Tag className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-3" {...props}>{children}</Tag>
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PumpCalculator() {
  const t    = useTranslations('calculator')
  const tCat = useTranslations('categories')

  // ── Form state ────────────────────────────────────────────────────────────
  const [tegevusala, setTegevusala] = useState('kuttepumbad')
  const [minHead,    setMinHead]    = useState('10')
  const [flowMode,   setFlowMode]   = useState<'direct' | 'area'>('direct')
  const [flowInput,  setFlowInput]  = useState('')
  const [areaInput,  setAreaInput]  = useState('')
  const [phase,      setPhase]      = useState<'1' | '3' | ''>('')
  const [tempClass,  setTempClass]  = useState<number | null>(null)
  const [location,   setLocation]   = useState<'indoor' | 'outdoor' | ''>('')

  // ── Results state ─────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)  // start loading since defaults are set
  const [queried,  setQueried]  = useState(true)  // true once first query ran

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedAla  = TEGEVUSALAD.find(a => a.slug === tegevusala)
  const viewAllUrl   = tegevusala ? `/tooted/${tegevusala}` : '/tooted'
  const canQuery     = !!(tegevusala && (minHead || (flowMode === 'direct' ? flowInput : areaInput) || phase || tempClass !== null || location))

  // ── Persist calculator state to sessionStorage ────────────────────────────
  useEffect(() => {
    if (!tegevusala) return
    sessionStorage.setItem('ipumps_calculator', JSON.stringify({
      tegevusala, minHead, flowMode, flowInput, areaInput, phase, tempClass, location,
    }))
  }, [tegevusala, minHead, flowMode, flowInput, areaInput, phase, tempClass, location])

  // ── Query products ────────────────────────────────────────────────────────
  const runQuery = useCallback(async () => {
    if (!canQuery) {
      setProducts([]); setTotal(0); setQueried(false); return
    }

    setLoading(true); setQueried(true)

    // Effective flow value (direct or derived from area)
    const effectiveFlow = flowMode === 'area' && areaInput
      ? parseFloat(areaInput) * 0.05
      : flowInput ? parseFloat(flowInput) : null

    // 1 ── Category filter → product IDs
    const { data: areaProducts } = await supabase
      .from('products')
      .select('id')
      .eq('primary_activity_area_slug', tegevusala)
      .eq('published', true)

    if (!areaProducts || areaProducts.length === 0) {
      setProducts([]); setTotal(0); setLoading(false); return
    }

    let productIds = areaProducts.map(r => r.id as number)

    // 2 ── Technical spec filtering via product_attributes
    const headVal = minHead ? parseFloat(minHead) : null
    const flowVal = effectiveFlow ?? null
    const tempVal = tempClass

    // Collect only the attribute names needed for active filters
    const neededAttrs: string[] = []
    if (headVal !== null) { neededAttrs.push('Tõstekõrgus nom.'); neededAttrs.push('Tõstekõrgus maks.'); neededAttrs.push('Tõstekõrgus') }
    if (flowVal !== null) { neededAttrs.push('Max voolukiirus'); neededAttrs.push('Nimijõudlus') }
    if (phase) neededAttrs.push('Nimipinge')
    if (tempVal !== null) neededAttrs.push('Vedeliku temperatuurivahemik')
    if (location === 'outdoor') neededAttrs.push('Kaitseklass (IEC 34-5)')

    if (neededAttrs.length > 0 && productIds.length > 0) {
      // Fetch only relevant attributes — each type is well under Supabase 1000-row default limit
      const { data: allAttrs } = await supabase
        .from('product_attributes')
        .select('product_id, attribute_name, attribute_value')
        .in('product_id', productIds)
        .in('attribute_name', neededAttrs)

      if (allAttrs && allAttrs.length > 0) {
        // Build product_id → attrs map
        const attrMap = new Map<number, Array<{ name: string; value: string }>>()
        for (const row of allAttrs) {
          if (!attrMap.has(row.product_id)) attrMap.set(row.product_id, [])
          attrMap.get(row.product_id)!.push({ name: row.attribute_name, value: row.attribute_value })
        }

        productIds = productIds.filter(id => {
          const attrs = attrMap.get(id) ?? []
          const get = (re: RegExp) => attrs.find(a => re.test(a.name))
          const getAll = (re: RegExp) => attrs.filter(a => re.test(a.name))

          // ── Head: check nom., maks., generic — use highest value
          // Values: "15 dm", "4 m" — convert to metres, compare to user metres
          if (headVal !== null) {
            const headAttrs = getAll(/tõstekõrgus/i)
            if (headAttrs.length === 0) return false
            let best: number | null = null
            for (const a of headAttrs) {
              const v = parseHeadM(a.value)
              if (v !== null && (best === null || v > best)) best = v
            }
            if (best !== null && best < headVal) return false
          }

          // ── Flow: "Max voolukiirus" / "Nimijõudlus" ──────────────
          if (flowVal !== null) {
            const a = get(/max\s+voolukiirus/i) || get(/nimijõudlus/i)
            if (!a) return false
            const v = parseFlowM3h(a.value)
            if (v !== null && v < flowVal) return false
          }

          // ── Phase: "Nimipinge" ─────────────────────────────────────────
          // Values: "1 x 230 V", "3 x 400 V"
          if (phase) {
            const a = get(/nimipinge/i)
            if (!a) return false
            const pumpPhase = parsePhase(a.value)
            if (pumpPhase && pumpPhase !== phase) return false
          }

          // ── Max liquid temp: "Vedeliku temperatuurivahemik" ───────────
          // Values: "2 .. 110 °C", "-10 .. 95 °C" — take max (last number)
          // Note: lenient — missing attribute is ok (not all products list this)
          if (tempVal !== null) {
            const a = get(/vedeliku\s+temperatuurivahemik/i)
            if (a) {
              const maxT = parseMaxTemp(a.value)
              if (maxT !== null && maxT < tempVal) return false
            }
          }

          // ── IP class: "Kaitseklass (IEC 34-5)" ────────────────────────
          // Outdoor requires water protection digit ≥ 4 (splash resistant)
          // Values: "IP44", "IP68", "IPX4D", "IPX2D"
          // Note: lenient — missing attribute is ok (not all products list IP)
          if (location === 'outdoor') {
            const a = get(/kaitseklass/i)
            if (a) {
              const waterDig = parseIpWater(a.value)
              if (waterDig !== null && waterDig < 4) return false
            }
          }

          return true
        })
      }
    }

    if (productIds.length === 0) {
      setProducts([]); setTotal(0); setLoading(false); return
    }

    // 3 ── Fetch product rows
    const { data, count } = await supabase
      .from('products')
      .select('id, slug, name, sku, price, sale_price, image_url, in_stock, short_description_et', { count: 'exact' })
      .in('id', productIds)
      .order('importance', { ascending: true, nullsFirst: false })
      .order('name')
      .limit(6)

    setProducts(data ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tegevusala, minHead, flowMode, flowInput, areaInput, phase, tempClass, location, canQuery])

  // Debounce: fire 450 ms after last change
  useEffect(() => {
    const t = setTimeout(runQuery, 450)
    return () => clearTimeout(t)
  }, [runQuery])

  const reset = () => {
    setTegevusala(''); setMinHead(''); setFlowMode('direct')
    setFlowInput(''); setAreaInput(''); setPhase('')
    setTempClass(null); setLocation('')
    setProducts([]); setTotal(0); setQueried(false)
    sessionStorage.removeItem('ipumps_calculator')
  }

  const activeFilters = [minHead, flowMode === 'direct' ? flowInput : areaInput, phase, tempClass !== null ? '1' : '', location].filter(Boolean).length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="py-14 bg-white border-t border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4">

        {/* Heading */}
        <div className="mb-8">
          <div className="text-[13px] font-semibold text-[#0077a3] uppercase tracking-widest mb-1">{t('label')}</div>
          <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
          <p className="text-[15px] text-gray-500 mt-1">{t('description')}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Form ──────────────────────────────────────────────────────── */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">

              {/* Header row */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-[16px]">{t('parameters')}</span>
                {(tegevusala || activeFilters > 0) && (
                  <button onClick={reset} className="flex items-center gap-1 text-[13px] text-gray-400 hover:text-red-500 transition-colors">
                    <RotateCcw size={12} /> {t('reset')}
                  </button>
                )}
              </div>

              {/* 1 · Tegevusala */}
              <div>
                <FieldLabel as="label" htmlFor="calc-category">{t('field1')}</FieldLabel>
                <select
                  id="calc-category"
                  value={tegevusala}
                  onChange={e => setTegevusala(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] text-gray-800 bg-white outline-none focus:border-[#003366] transition-colors"
                  aria-label={t('selectArea')}
                >
                  <option value="" disabled>{t('selectArea')}</option>
                  {TEGEVUSALAD.map(a => (
                    <option key={a.id} value={a.slug}>{tCat(a.nameKey)}</option>
                  ))}
                </select>
              </div>

              {/* 2 · Max Head */}
              <div>
                <FieldLabel>{t('field2')}</FieldLabel>
                <label className="block text-[13px] text-gray-500 mb-1.5">{t('heightHint')}</label>
                <input
                  type="number" min="0" step="0.5"
                  value={minHead}
                  onChange={e => setMinHead(e.target.value)}
                  placeholder="nt 10"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] text-gray-800 outline-none focus:border-[#003366] transition-colors"
                />
              </div>

              {/* 3 · Flow / Area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <FieldLabel>{flowMode === 'direct' ? t('field3flow') : t('field3area')}</FieldLabel>
                  <button
                    onClick={() => { setFlowMode(m => m === 'direct' ? 'area' : 'direct'); setFlowInput(''); setAreaInput('') }}
                    className="text-[12px] text-[#01a0dc] hover:underline flex-shrink-0 -mt-0.5"
                  >
                    {flowMode === 'direct' ? t('calcFromArea') : t('enterDirect')}
                  </button>
                </div>
                {flowMode === 'direct' ? (
                  <>
                    <label className="block text-[13px] text-gray-500 mb-1.5">{t('flowHint')}</label>
                    <input
                      type="number" min="0" step="0.1"
                      value={flowInput}
                      onChange={e => setFlowInput(e.target.value)}
                      placeholder="nt 3"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] text-gray-800 outline-none focus:border-[#003366] transition-colors"
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-[13px] text-gray-500 mb-1.5">{t('areaHint')}</label>
                    <input
                      type="number" min="0" step="10"
                      value={areaInput}
                      onChange={e => setAreaInput(e.target.value)}
                      placeholder="nt 150"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] text-gray-800 outline-none focus:border-[#003366] transition-colors"
                    />
                    {areaInput && !isNaN(parseFloat(areaInput)) && (
                      <div className="text-[12px] text-gray-400 mt-1.5 bg-blue-50 rounded-lg px-3 py-1.5">
                        Arvutatud vooluhulk ≈ <span className="font-semibold text-[#003366]">{(parseFloat(areaInput) * 0.05).toFixed(2)} m³/h</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 4 · Phase */}
              <div>
                <FieldLabel>{t('field4')}</FieldLabel>
                <div className="flex gap-2">
                  <ToggleBtn active={phase === '1'} onClick={() => setPhase(p => p === '1' ? '' : '1')}>
                    <div className="font-semibold">{t('singlePhase')}</div>
                    <div className="text-[11px] opacity-70 mt-0.5">1×230V</div>
                  </ToggleBtn>
                  <ToggleBtn active={phase === '3'} onClick={() => setPhase(p => p === '3' ? '' : '3')}>
                    <div className="font-semibold">{t('threePhase')}</div>
                    <div className="text-[11px] opacity-70 mt-0.5">3×400V</div>
                  </ToggleBtn>
                </div>
              </div>

              {/* 5 · Liquid temperature */}
              <div>
                <FieldLabel>{t('field5')}</FieldLabel>
                <div className="space-y-2">
                  {TEMP_OPTIONS.map(opt => (
                    <button
                      key={opt.threshold}
                      onClick={() => setTempClass(c => c === opt.threshold ? null : opt.threshold)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-[14px] transition-all ${
                        tempClass === opt.threshold
                          ? 'bg-[#003366] text-white border-[#003366]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#003366]'
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6 · Location */}
              <div>
                <FieldLabel>{t('field6')}</FieldLabel>
                <div className="flex gap-2">
                  <ToggleBtn active={location === 'indoor'} onClick={() => setLocation(l => l === 'indoor' ? '' : 'indoor')}>
                    <div className="text-lg mb-0.5">🏠</div>
                    <div className="font-medium text-[12px]">{t('indoor')}</div>
                  </ToggleBtn>
                  <ToggleBtn active={location === 'outdoor'} onClick={() => setLocation(l => l === 'outdoor' ? '' : 'outdoor')}>
                    <div className="text-lg mb-0.5">🌧️</div>
                    <div className="font-medium text-[12px]">{t('outdoor')}</div>
                  </ToggleBtn>
                </div>
              </div>

            </div>
          </div>

          {/* ── Results ───────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Initial empty state */}
            {!queried && !loading && (
              <div className="flex flex-col items-center justify-center text-center py-20 text-gray-400">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Search size={28} className="text-[#003366]/30" />
                </div>
                <div className="font-semibold text-gray-500 mb-1 text-[16px]">{t('startHint')}</div>
                <div className="text-[14px] max-w-xs">{t('startDescription')}</div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <Loader2 size={32} className="text-[#003366] animate-spin" />
                <span className="text-[14px]">{t('searching')}</span>
              </div>
            )}

            {/* No results */}
            {queried && !loading && products.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-4">🔍</div>
                <div className="font-semibold text-gray-700 text-[16px] mb-2">{t('noResults')}</div>
                <div className="text-[14px] text-gray-400 max-w-sm mb-5">{t('noResultsHint')}</div>
                <button onClick={reset}
                  className="flex items-center gap-2 text-[14px] text-[#003366] hover:underline font-medium">
                  <RotateCcw size={14} /> {t('resetFilters')}
                </button>
              </div>
            )}

            {/* Results grid */}
            {!loading && products.length > 0 && (
              <div className={`transition-opacity duration-300 ${loading ? 'opacity-40' : 'opacity-100'}`}>
                {/* Result header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[15px] text-gray-600">
                    {total > 6
                      ? <><span className="font-semibold text-gray-900">{t('showingOf', { shown: 6, total })}</span></>
                      : <><span className="font-semibold text-gray-900">{total}</span> {t('suitableProducts')}</>
                    }
                    {selectedAla && (
                      <span className="ml-1.5 bg-[#003366]/10 text-[#003366] text-[13px] font-medium px-2 py-0.5 rounded-full">
                        {tCat(selectedAla.nameKey)}
                      </span>
                    )}
                  </div>
                  <a href={viewAllUrl}
                    className="flex items-center gap-1 text-[14px] text-[#003366] hover:text-[#01a0dc] font-medium transition-colors">
                    {t('viewAll')} <ChevronRight size={14} />
                  </a>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {products.map(p => <MiniProductCard key={p.id} product={p} />)}
                </div>

                {/* View-all CTA */}
                {total > 6 && (
                  <div className="mt-6 text-center">
                    <a href={viewAllUrl}
                      className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#004080] text-white px-7 py-3 rounded-xl font-semibold text-[15px] transition-colors shadow-sm">
                      {t('viewAllSuitable', { total })}
                      <ChevronRight size={16} />
                    </a>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  )
}
