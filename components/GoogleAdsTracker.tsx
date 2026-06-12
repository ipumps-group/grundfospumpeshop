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
  const prevItemIds = useRef<Set<number>>(new Set())

  useEffect(() => {
    const initial = getCartItems()
    prevSubtotal.current = initial.reduce((s, i) => s + i.price * i.qty, 0)
    prevItemIds.current = new Set(initial.map(i => i.id))

    const handler = () => {
      const current = getCartSubtotal()
      const currentItems = getCartItems()
      const currentIds = new Set(currentItems.map(i => i.id))

      const delta = current - prevSubtotal.current
      if (delta > 0) {
        const newItems = currentItems.filter(i => !prevItemIds.current.has(i.id))
        const contentIds = newItems.map(i => String(i.id))
        const contents = newItems.map(i => ({ id: String(i.id), quantity: i.qty }))

        trackAddToCart(delta)
        trackMetaAddToCart({
          value: delta,
          currency: 'EUR',
          content_ids: contentIds,
          contents,
        })
      }

      prevSubtotal.current = current
      prevItemIds.current = currentIds
    }

    window.addEventListener('cart_updated', handler)
    return () => window.removeEventListener('cart_updated', handler)
  }, [])

  return null
}
