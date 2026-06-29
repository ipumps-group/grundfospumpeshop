'use client'

import { useEffect, useRef } from 'react'
import { trackAddToCart } from '@/lib/google-ads'
import { trackMetaAddToCart } from '@/lib/meta-pixel'

interface CartItem {
  id: number
  slug: string
  name: string
  price: number
  image_url: string | null
  qty: number
}

function getCartItems(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem('ipumps_cart') || '[]')
  } catch {
    return []
  }
}

function getCartSubtotal(): number {
  return getCartItems().reduce((s, i) => s + i.price * i.qty, 0)
}

export default function GoogleAdsTracker() {
  const prevSubtotal = useRef(0)
  const prevQuantities = useRef<Map<number, number>>(new Map())

  useEffect(() => {
    const initial = getCartItems()
    prevSubtotal.current = initial.reduce((s, i) => s + i.price * i.qty, 0)
    prevQuantities.current = new Map(initial.map(i => [i.id, i.qty]))

    const handler = () => {
      const current = getCartSubtotal()
      const currentItems = getCartItems()
      const delta = current - prevSubtotal.current
      if (delta > 0) {
        const changedItems = currentItems.filter(i => i.qty > (prevQuantities.current.get(i.id) || 0))
        const contentIds = changedItems.map(i => String(i.id))
        const contents = changedItems.map(i => ({
          id: String(i.id),
          quantity: i.qty - (prevQuantities.current.get(i.id) || 0),
        }))

        trackAddToCart(delta)
        trackMetaAddToCart({
          value: delta,
          currency: 'EUR',
          content_ids: contentIds,
          contents,
        })
      }

      prevSubtotal.current = current
      prevQuantities.current = new Map(currentItems.map(i => [i.id, i.qty]))
    }

    window.addEventListener('cart_updated', handler)
    return () => window.removeEventListener('cart_updated', handler)
  }, [])

  return null
}
