'use client'

import { useEffect, useRef } from 'react'
import { trackAddToCart } from '@/lib/google-ads'

function getCartSubtotal(): number {
  try {
    const items: { price: number; qty: number }[] =
      JSON.parse(localStorage.getItem('ipumps_cart') || '[]')
    return items.reduce((s, i) => s + i.price * i.qty, 0)
  } catch {
    return 0
  }
}

export default function GoogleAdsTracker() {
  const prevSubtotal = useRef(0)

  useEffect(() => {
    prevSubtotal.current = getCartSubtotal()

    const handler = () => {
      const current = getCartSubtotal()
      if (current > prevSubtotal.current) {
        trackAddToCart(current - prevSubtotal.current)
      }
      prevSubtotal.current = current
    }

    window.addEventListener('cart_updated', handler)
    return () => window.removeEventListener('cart_updated', handler)
  }, [])

  return null
}
