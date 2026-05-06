'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Trash2, Plus, Minus, ShoppingCart,
  ChevronRight, ArrowRight, Package
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { withVat, fmt, VAT_RATE } from '@/lib/price'

// ─── TÜÜBID ────────────────────────────────────────────────────────────────

interface CartItem {
  id: number
  slug: string
  name: string
  price: number
  image_url: string | null
  qty: number
}

// ─── OSTUKORV UTILIIDID ────────────────────────────────────────────────────

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

// VAT_RATE imported from @/lib/price

// ─── TOOTE RIDA ─────────────────────────────────────────────────────────────

function CartRow({
  item,
  onQtyChange,
  onRemove,
}: {
  item: CartItem
  onQtyChange: (id: number, delta: number) => void
  onRemove: (id: number) => void
}) {
  const t = useTranslations('cart')

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
      {/* Pilt */}
      <Link href={`/toode/${item.slug}`}
        className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 p-2 hover:bg-gray-100 transition-colors">
        <img
          src={item.image_url || '/placeholder.png'}
          alt={item.name}
          className="h-14 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png' }}
        />
      </Link>

      {/* Nimi + hind */}
      <div className="flex-1 min-w-0">
        <Link href={`/toode/${item.slug}`}
          className="font-semibold text-gray-800 text-[15px] hover:text-[#003366] transition-colors line-clamp-2 leading-snug block">
          {item.name}
        </Link>
        <div className="text-[15px] text-gray-500 mt-0.5">
          {fmt(withVat(item.price))} {t('perPiece')}
        </div>
      </div>

      {/* Kogus + kokku + kustuta */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Koguse muutmine */}
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => onQtyChange(item.id, -1)}
            className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="w-10 text-center text-[15px] font-semibold text-gray-800">
            {item.qty}
          </span>
          <button
            onClick={() => onQtyChange(item.id, 1)}
            className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Rea koguhind */}
        <div className="text-right w-20">
          <div className="text-[15px] font-bold text-[#003366]">
            {fmt(withVat(item.price) * item.qty)}
          </div>
        </div>

        {/* Kustuta */}
        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
          title={t('remove')}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  )
}

// ─── PEAKOMPONENT ──────────────────────────────────────────────────────────

export default function OstukorvPage() {
  const t = useTranslations('cart')
  const tCommon = useTranslations('common')
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setItems(getCart())
    setMounted(true)

    const handler = () => setItems(getCart())
    window.addEventListener('cart_updated', handler)
    return () => window.removeEventListener('cart_updated', handler)
  }, [])

  const updateQty = (id: number, delta: number) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    )
    setItems(updated)
    saveCart(updated)
  }

  const removeItem = (id: number) => {
    const updated = items.filter(item => item.id !== id)
    setItems(updated)
    saveCart(updated)
  }

  const clearCart = () => {
    setItems([])
    saveCart([])
  }

  const subtotalNoVat = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const vat           = subtotalNoVat * VAT_RATE
  const total         = subtotalNoVat + vat  // incl. VAT

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Leivaküljed */}
        <nav className="flex items-center gap-2 text-[15px] text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#003366] transition-colors">{tCommon('home')}</Link>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium">{t('title')}</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#003366]">
            {t('title')}
          </h1>
          {items.length > 0 && (
            <span className="text-[15px] text-gray-400">
              {t('itemCount', { count: items.reduce((s, i) => s + i.qty, 0) })}
            </span>
          )}
        </div>

        {/* Tühi korv */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <ShoppingCart size={52} className="mx-auto text-gray-200 mb-5" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('empty')}
            </h2>
            <p className="text-[15px] text-gray-400 mb-7">
              {t('emptyHint')}
            </p>
            <Link href="/tooted"
              className="inline-flex items-center gap-2 bg-[#003366] text-white px-6 py-3 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
              {t('viewProducts')} <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Toodete nimekiri ─────────────────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {items.map(item => (
                <CartRow
                  key={item.id}
                  item={item}
                  onQtyChange={updateQty}
                  onRemove={removeItem}
                />
              ))}

              <div className="flex justify-between items-center pt-2">
                <Link href="/tooted"
                  className="text-[15px] text-[#003366] hover:underline font-medium">
                  {t('continueShopping')}
                </Link>
                <button
                  onClick={clearCart}
                  className="text-[15px] text-gray-400 hover:text-red-500 transition-colors"
                >
                  {t('clearCart')}
                </button>
              </div>
            </div>

            {/* ── Kokkuvõte ────────────────────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                <h2 className="font-bold text-gray-900 text-[17px] mb-5">
                  {t('orderSummary')}
                </h2>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-[15px]">
                    <span className="text-gray-500">{t('shipping')}</span>
                    <span className="text-[#01a0dc] font-medium">{t('shippingTbd')}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                    <span className="font-bold text-gray-900 text-[17px]">{t('total')}</span>
                    <span className="font-bold text-[#003366] text-xl">
                      {total.toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px] text-gray-400">
                    <span>{t('vatIncluded')}</span>
                    <span>{vat.toFixed(2).replace('.', ',')} €</span>
                  </div>
                </div>

                <Link href="/checkout"
                  className="w-full flex items-center justify-center gap-2 bg-[#003366] text-white py-3.5 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
                  {t('checkout')} <ArrowRight size={16} />
                </Link>

                {/* Usaldusmärgid */}
                <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-center gap-3 text-[13px] text-gray-400">
                  <Package size={14} />
                  <span>{t('securePay')}</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
