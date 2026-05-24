'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Check } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { withVat, fmt } from '@/lib/price'

interface Product {
  id: number
  slug: string
  name: string
  sku: string | null
  short_description_et: string | null
  short_description_en?: string | null
  short_description_ru?: string | null
  short_description_lv?: string | null
  short_description_lt?: string | null
  price: number
  sale_price: number | null
  image_url: string | null
  in_stock: boolean
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

// ─── TOOTEKAART (GRID) ─────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const t = useTranslations('products')
  const locale = useLocale()
  const [added, setAdded] = useState(false)
  const displayPrice = product.sale_price ?? product.price

  const desc = (product as Record<string, unknown>)[`short_description_${locale}`] as string | null
    || product.short_description_et

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
          width={112}
          height={112}
          className="h-28 object-contain group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }} />
      </div>
      <div className="p-4 flex flex-col flex-1">
        {product.sku && <div className="text-[13px] text-gray-400 font-mono mb-1">{product.sku}</div>}
        <div className="font-semibold text-gray-800 text-[15px] leading-tight mb-2 group-hover:text-[#003366] transition-colors line-clamp-2 flex-1">
          {product.name}
        </div>
        {desc && (
          <div className="text-[13px] text-gray-400 line-clamp-1 mb-3">{desc}</div>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div>
            <div className="text-lg font-bold text-[#003366]">
              {fmt(withVat(displayPrice))}
            </div>
            {product.sale_price && (
              <div className="text-[13px] text-gray-400 line-through">
                {fmt(withVat(product.price))}
              </div>
            )}
          </div>
          <button onClick={handleAdd} disabled={!product.in_stock}
            aria-label={t('addToCart')}
            className={`p-2.5 rounded-xl transition-all ${added ? 'bg-green-500 text-white' : product.in_stock ? 'bg-[#003366] hover:bg-[#01a0dc] text-white' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
            {added ? <Check size={16} /> : <ShoppingCart size={16} />}
          </button>
        </div>
      </div>
    </Link>
  )
}

// ─── PRODUCTS GRID ───────────────────────────────────────────────────────────
export default function ProductsGrid({ 
  products, 
  tegevusala,
  title,
}: { 
  products: Product[]
  tegevusala?: string
  title?: string
}) {
  const t = useTranslations('categories')
  
  const catName = (): string => {
    if (title) return title
    const map: Record<string, string> = {
      'kute': 'Küttepumbad',
      'jahutus': 'Jahutuspumbad', 
      'sooja-tarbevee-tsirkulatsioonipump': 'Tarbevee tsirkulatsioonipumbad',
      'puurkaevud': 'Puurkaevu pumbad',
      'drenaa': 'Drenaažipumbad',
      'salvkaevud': 'Salvkaevu pumbad',
      'rohutoste': 'Rõhutõsepumbad',
      'reovesi': 'Reoveepumbad',
    }
    return map[tegevusala || ''] || 'Tooted'
  }

  if (products.length === 0) {
    return (
      <div>
        <p className="text-gray-500">Selles kategoorias ei ole tooteid.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}