'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import {
  ChevronRight, Package, Truck, Shield,
  Phone, ZoomIn, Check, Share2, Printer, ShoppingCart, FileText, Eye
} from 'lucide-react'
import { groupBySection } from '@/lib/spec-sections'
import { withVat, fmt } from '@/lib/price'
import { trackMetaViewContent } from '@/lib/meta-pixel'

// ─── TÜÜBID ────────────────────────────────────────────────────────────────

export interface Product {
  id: number
  sku: string
  slug: string
  name: string
  short_description_et: string
  short_description_en: string | null
  short_description_ru: string | null
  short_description_lv: string | null
  short_description_lt: string | null
  description_et: string
  description_en: string | null
  description_ru: string | null
  description_lv: string | null
  description_lt: string | null
  price: number
  sale_price: number | null
  image_url: string
  in_stock: boolean
  weight_kg: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  category_id: number | null
  tags: string | null
  curve_url: string | null
  drawing_url: string | null
  series_slug: string | null
  primary_activity_area_slug: string | null
}

export interface Attribute {
  attribute_name: string
  attribute_value: string
}

export interface ProductDocument {
  id: number
  label: string
  public_url: string
  storage_path: string
}

export interface RelatedProduct {
  id: number
  name: string
  slug: string
  price: number
  image_url: string
  short_description_et: string
}

// ─── OSTUKORV UTILIIDID (localStorage) ────────────────────────────────────

interface CartItem {
  id: number
  slug: string
  name: string
  price: number
  image_url: string
  qty: number
}

function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('ipumps_cart') || '[]')
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem('ipumps_cart', JSON.stringify(items))
  window.dispatchEvent(new Event('cart_updated'))
}

function addToCart(product: Product, qty: number) {
  const cart = getCart()
  const existing = cart.find(i => i.id === product.id)
  if (existing) {
    existing.qty += qty
  } else {
    cart.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.sale_price ?? product.price,
      image_url: product.image_url,
      qty,
    })
  }
  saveCart(cart)
}

// ─── LEIVAKÜLJED ───────────────────────────────────────────────────────────

function Breadcrumb({ product }: { product: Product }) {
  const tNav = useTranslations('nav')
  const tCat = useTranslations('categories')
  const [catName, setCatName] = useState('')
  const [seriesName, setSeriesName] = useState('')

  const SLUG_TO_CAT_KEY: Record<string, string> = {
    'kuttepumbad': 'heatingTitle', 'puurkaevupumbad': 'borewellTitle',
    'salvkaevupumbad': 'wellsTitle', 'drenaazipumbad': 'drainageTitle',
    'rohutostepumbad': 'pressureTitle', 'reoveepumbad': 'sewageTitle',
    'veeautomaadid': 'jpWaterAutomaticsTitle',
    'tsirkulatsioonipumbad-soe-tarbevesi': 'hotWaterTitle',
  }

  useEffect(() => {
    async function load() {
      const { supabase } = await import('@/lib/supabase')
      const areaSlug = product.primary_activity_area_slug
      const seriesSlug = product.series_slug

      if (areaSlug) {
        const key = SLUG_TO_CAT_KEY[areaSlug]
        if (key) {
          setCatName(tCat(key as any))
        } else {
          const { data: area } = await supabase
            .from('activity_areas')
            .select('name_et')
            .eq('slug', areaSlug)
            .single()
          if (area) setCatName((area as any).name_et)
        }
      }

      if (seriesSlug) {
        const { data: series } = await supabase
          .from('product_series')
          .select('name')
          .eq('slug', seriesSlug)
          .single()
        if (series) setSeriesName((series as any).name)
      }
    }
    load()
  }, [product.primary_activity_area_slug, product.series_slug, tCat])

  return (
    <nav className="bg-gray-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-[15px] text-gray-500 flex-wrap">
        <a href="/" className="hover:text-[#003366] transition-colors">{tNav('home')}</a>
        <ChevronRight size={14} className="text-gray-300" />
        <a href="/tooted" className="hover:text-[#003366] transition-colors">{tNav('products')}</a>
        {catName && (
          <>
            <ChevronRight size={14} className="text-gray-300" />
            <a href={`/tooted/${product.primary_activity_area_slug}`} className="hover:text-[#003366] transition-colors">
              {catName}
            </a>
          </>
        )}
        {seriesName && (
          <>
            <ChevronRight size={14} className="text-gray-300" />
            <a href={`/tooted/${product.primary_activity_area_slug}/${product.series_slug}`} className="hover:text-[#003366] transition-colors">
              {seriesName}
            </a>
          </>
        )}
        <ChevronRight size={14} className="text-gray-300" />
        <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
      </div>
    </nav>
  )
}

// ─── PILDIGALERII ──────────────────────────────────────────────────────────

function ProductGallery({ image, name }: { image: string; name: string }) {
  const [zoomed, setZoomed] = useState(false)

  return (
    <div className="relative">
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-zoom-in group shadow-sm"
        onClick={() => setZoomed(true)}
      >
        <div className="relative aspect-square flex items-center justify-center p-8">
          <img
            src={image || '/placeholder.png'}
            alt={name}
            width={320}
            height={320}
            className="max-h-80 object-contain group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
          />
          <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
            <ZoomIn size={16} className="text-gray-600" />
          </div>
        </div>
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8 cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <img
            src={image}
            alt={name}
            width={800}
            height={800}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </div>
  )
}

// ─── TOOTE INFO ────────────────────────────────────────────────────────────

function normalizeTagKey(tag: string): string {
  return tag.toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/õ/g, 'o')
    .replace(/ž/g, 'z').replace(/š/g, 's').replace(/č/g, 'c')
    .replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

function ProductInfo({ product }: { product: Product }) {
  const t = useTranslations('product')
  const tBenefits = useTranslations('benefits')
  const tTags = useTranslations('tags')
  const locale = useLocale()
  const shortDesc = (product[`short_description_${locale}` as keyof Product] as string | null)
    || product.short_description_et
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addToCart(product, qty)
    setAdded(true)
  }

  const displayPrice = product.sale_price ?? product.price
  const discount = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : null

  const benefits = [
    { icon: Truck,   text: tBenefits('shipping') },
    { icon: Shield,  text: tBenefits('warranty') },
    { icon: Package, text: t('original') },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* SKU */}
      <div className="text-[15px] text-gray-400">
        {t('productCode')}: <span className="font-mono text-gray-600">{product.sku}</span>
      </div>

      {/* Nimi */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
        {product.name}
      </h1>

      {/* Sildid */}
      {product.tags && (
        <div className="flex flex-wrap gap-1.5">
          {product.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
            <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#003366]/8 text-[#003366] text-[13px] font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Lühikirjeldus */}
      {shortDesc && (
        <p className="text-[15px] text-gray-600 leading-relaxed border-l-2 border-[#01a0dc] pl-4">
          {shortDesc}
        </p>
      )}

      {/* Hind */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-3xl font-bold text-[#003366]">
          {fmt(withVat(displayPrice))}
        </span>
        {product.sale_price && (
          <>
            <span className="text-[15px] text-gray-400 line-through">
              {fmt(withVat(product.price))}
            </span>
            <span className="bg-[#01a0dc] text-white text-[15px] font-bold px-2 py-0.5 rounded-lg">
              -{discount}%
            </span>
          </>
        )}
        <span className="text-[14px] text-gray-400">{t('vatIncl')}</span>
      </div>

      {/* Laoseis */}
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${product.in_stock ? 'bg-green-500' : 'bg-red-400'}`} />
        <span className={`text-[15px] font-medium ${product.in_stock ? 'text-green-700' : 'text-red-600'}`}>
          {product.in_stock ? t('inStockFull') : t('outOfStockFull')}
        </span>
      </div>

      {/* Kogus + ostukorv */}
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-10 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-[15px] font-bold transition-colors"
          >−</button>
          <span className="w-12 text-center text-[15px] font-semibold text-gray-800">{qty}</span>
          <button
            onClick={() => setQty(q => q + 1)}
            className="w-10 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-[15px] font-bold transition-colors"
          >+</button>
        </div>
        <button
          onClick={handleAdd}
          disabled={!product.in_stock}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-[15px] transition-all ${
            added
              ? 'bg-green-500 text-white'
              : product.in_stock
              ? 'bg-[#003366] hover:bg-[#004080] text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {added
            ? <><Check size={18} /> {t('added')}</>
            : <><ShoppingCart size={18} /> {t('addToCart')}</>
          }
        </button>
      </div>

      {/* Post-add buttons */}
      {added && (
        <div className="flex flex-wrap gap-3">
          <Link href="/ostukorv"
            className="flex-1 min-w-0 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white font-semibold text-[15px] transition-all whitespace-nowrap">
            <ShoppingCart size={16} /> Ostukorv
          </Link>
          <Link href="/tooted"
            className="flex-1 min-w-0 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold text-[15px] transition-all whitespace-nowrap">
            <Eye size={16} /> Vaata veel tooteid
          </Link>
        </div>
      )}

      {/* Päring */}
      <a
        href={`/${locale}/leht/kontakt`}
        className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl border-2 border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white font-semibold text-[15px] transition-all"
      >
        <Phone size={16} /> {t('requestQuote')}
      </a>

      {/* Eelised */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
        {benefits.map(b => (
          <div key={b.text} className="flex flex-col items-center gap-1.5 text-center">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <b.icon size={16} className="text-[#003366]" />
            </div>
            <span className="text-[15px] text-gray-500">{b.text}</span>
          </div>
        ))}
      </div>

      {/* Jaga / Prindi */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => navigator.share?.({ title: product.name, url: window.location.href }).catch(() => {})}
          className="flex items-center gap-1.5 text-[15px] text-gray-400 hover:text-[#003366] transition-colors"
        >
          <Share2 size={15} /> {t('share')}
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-[15px] text-gray-400 hover:text-[#003366] transition-colors"
        >
          <Printer size={15} /> {t('print')}
        </button>
      </div>

      {/* Sildid hashtagidena */}
      {product.tags && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
          {product.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => {
            const key = normalizeTagKey(tag)
            let label = tag
            try { label = tTags(key as Parameters<typeof tTags>[0]) } catch { /* unknown tag */ }
            return (
              <span key={tag} className="text-[14px] text-[#003366]/60 hover:text-[#003366] transition-colors cursor-default">
                #{label}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── ATRIBUUDID (ülevaate kast) ────────────────────────────────────────────

function AttributesTable({ attributes, product }: { attributes: Attribute[]; product: Product }) {
  const t = useTranslations('product')
  const [showAll, setShowAll] = useState(false)

  const physicalAttrs: Attribute[] = []
  if (product.weight_kg) physicalAttrs.push({ attribute_name: t('weightKg'), attribute_value: String(product.weight_kg) })
  if (product.length_cm) physicalAttrs.push({ attribute_name: t('lengthCm'), attribute_value: String(product.length_cm) })
  if (product.width_cm) physicalAttrs.push({ attribute_name: t('widthCm'), attribute_value: String(product.width_cm) })
  if (product.height_cm) physicalAttrs.push({ attribute_name: t('heightCm'), attribute_value: String(product.height_cm) })

  const allAttrs = [...physicalAttrs, ...attributes]
  const visibleAttrs = showAll ? allAttrs : allAttrs.slice(0, 16)

  if (allAttrs.length === 0) return null

  const half = Math.ceil(visibleAttrs.length / 2)
  const col1 = visibleAttrs.slice(0, half)
  const col2 = visibleAttrs.slice(half)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-[17px]">{t('specs')}</h2>
        <span className="text-[15px] text-gray-400">{allAttrs.length} {t('parameters')}</span>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
          {[col1, col2].map((col, ci) => (
            <div key={ci}>
              {col.map((attr, i) => (
                <div
                  key={i}
                  className={`flex items-start justify-between py-2.5 ${i < col.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <span className="text-[15px] text-gray-500 pr-4 flex-shrink-0 w-1/2">{attr.attribute_name}</span>
                  <span className="text-[15px] font-medium text-gray-800 text-right">{attr.attribute_value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {allAttrs.length > 16 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-4 w-full py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-500 hover:border-[#003366] hover:text-[#003366] transition-colors font-medium"
          >
            {showAll ? t('hide') : t('showAllParams', { count: allAttrs.length })}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── TOOTE TABID ───────────────────────────────────────────────────────────

function ProductTabs({ product, attributes, locale, attrNameMap, documents }: { product: Product; attributes: Attribute[]; locale: string; attrNameMap: Record<string, string>; documents: ProductDocument[] }) {
  const t = useTranslations('product')

  const tabs = [
    { key: 'description', label: t('tabDescription') },
    { key: 'specs',       label: t('tabSpecs') },
    { key: 'drawing',     label: t('tabDrawing') },
    { key: 'curves',      label: t('tabCurves') },
    { key: 'documents',   label: `${t('tabDocuments')}${documents.length ? ` (${documents.length})` : ''}` },
  ]

  const [active, setActive] = useState<string>('description')

  const physicalAttrs: Attribute[] = []
  if (product.weight_kg) physicalAttrs.push({ attribute_name: t('weightKg'),  attribute_value: String(product.weight_kg) })
  if (product.length_cm) physicalAttrs.push({ attribute_name: t('lengthCm'),  attribute_value: String(product.length_cm) })
  if (product.width_cm)  physicalAttrs.push({ attribute_name: t('widthCm'),   attribute_value: String(product.width_cm) })
  if (product.height_cm) physicalAttrs.push({ attribute_name: t('heightCm'),  attribute_value: String(product.height_cm) })
  const allAttrs = [...physicalAttrs, ...attributes]

  const desc = (product[`description_${locale}` as keyof Product] as string | null) || product.description_et

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-shrink-0 px-6 py-4 text-[15px] font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              active === tab.key
                ? 'border-[#003366] text-[#003366]'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {active === 'description' && (
          <div className="text-[15px] text-gray-600 leading-relaxed">
            {desc || <span className="text-gray-400 italic">Kirjeldus puudub.</span>}
          </div>
        )}

        {active === 'specs' && (
          allAttrs.length > 0 ? (
            <>
              <div className="mb-5 text-[15px] text-gray-400">{allAttrs.length} {t('parameters')}</div>
              <div className="space-y-6">
                {groupBySection(allAttrs).map(({ section, attrs: sAttrs }) => (
                  <div key={section.key}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[13px] font-bold text-[#003366] uppercase tracking-wider">
                        {t(section.labelKey as Parameters<typeof t>[0]) || section.label}
                      </span>
                      <div className="flex-1 h-px bg-[#003366]/10" />
                      <span className="text-[12px] text-gray-400">{sAttrs.length}</span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
                      {(() => {
                        const half = Math.ceil(sAttrs.length / 2)
                        return [sAttrs.slice(0, half), sAttrs.slice(half)].map((col, ci) => (
                          <div key={ci}>
                            {col.map((attr, i) => (
                              <div key={i} className={`flex items-start justify-between py-2 ${i < col.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                <span className="text-[14px] text-gray-500 pr-4 flex-shrink-0 w-1/2 leading-snug">{attrNameMap[attr.attribute_name] || attr.attribute_name}</span>
                                <span className="text-[14px] font-medium text-gray-800 text-right leading-snug">{attr.attribute_value}</span>
                              </div>
                            ))}
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : <span className="text-gray-400 italic text-[15px]">Tehnilised andmed puuduvad.</span>
        )}

        {active === 'drawing' && (
          product.drawing_url
            ? <img src={product.drawing_url} alt={`${product.name} joonis`} className="max-w-full mx-auto" />
            : <span className="text-gray-400 italic text-[15px]">Joonis puudub.</span>
        )}

        {active === 'curves' && (
          product.curve_url
            ? <img src={product.curve_url} alt={`${product.name} kõver`} className="max-w-full mx-auto" />
            : <span className="text-gray-400 italic text-[15px]">Kõverad puuduvad.</span>
        )}

        {active === 'documents' && (
          documents.length > 0
            ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documents.map(doc => (
                  <a
                    key={doc.id}
                    href={doc.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-[#003366]/30 hover:bg-[#003366]/4 transition-all group"
                  >
                    <div className="flex-shrink-0 w-9 h-9 bg-[#003366]/8 rounded-lg flex items-center justify-center group-hover:bg-[#003366]/15 transition-colors">
                      <FileText size={16} className="text-[#003366]" />
                    </div>
                    <span className="text-[14px] text-gray-700 leading-snug group-hover:text-[#003366] transition-colors line-clamp-2">
                      {doc.label}
                    </span>
                  </a>
                ))}
              </div>
            )
            : <span className="text-gray-400 italic text-[15px]">{t('noDocuments')}</span>
        )}
      </div>
    </div>
  )
}

// ─── SEOTUD TOOTED ─────────────────────────────────────────────────────────

function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  const t = useTranslations('product')
  if (products.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-gray-900 mb-5">{t('relatedProductsTitle')}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map(p => (
          <a key={p.slug} href={`/toode/${p.slug}`}
            className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#003366]/20 hover:shadow-lg transition-all duration-300">
            <div className="bg-gray-50 p-5 flex items-center justify-center h-36">
              <img
                src={p.image_url}
                alt={p.name}
                width={96}
                height={96}
                className="h-24 object-contain group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
              />
            </div>
            <div className="p-4">
              <div className="font-semibold text-gray-800 text-[15px] leading-tight mb-2 group-hover:text-[#003366] transition-colors line-clamp-2">
                {p.name}
              </div>
              <div className="text-[17px] font-bold text-[#003366]">
                {Number(p.price).toFixed(2).replace('.', ',')} €
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ─── PEAKOMPONENT ──────────────────────────────────────────────────────────

interface ProductDetailClientProps {
  product: Product | null
  attributes: Attribute[]
  attrNameMap: Record<string, string>
  related: RelatedProduct[]
  documents: ProductDocument[]
}

export default function ProductDetailClient({ product, attributes, attrNameMap, related, documents }: ProductDetailClientProps) {
  const t = useTranslations('product')
  const locale = useLocale()

  useEffect(() => {
    if (!product) return
    const displayPrice = product.sale_price ?? product.price
    trackMetaViewContent({
      content_ids: [String(product.id)],
      content_name: product.name,
      content_category: product.primary_activity_area_slug || undefined,
      value: displayPrice,
      currency: 'EUR',
    })
  }, [product])

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">{t('notFound')}</h1>
          <p className="text-[15px] text-gray-500 mb-5">{t('notFoundHint')}</p>
          <a href="/tooted" className="bg-[#003366] text-white px-6 py-3 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
            {t('viewAllProducts')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb product={product} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <ProductGallery image={product.image_url} name={product.name} />
          <ProductInfo product={product} />
        </div>

        <ProductTabs product={product} attributes={attributes} locale={locale} attrNameMap={attrNameMap} documents={documents} />

        <RelatedProducts products={related} />
      </div>
    </div>
  )
}
