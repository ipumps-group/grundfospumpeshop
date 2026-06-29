'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { trackPurchase } from '@/lib/google-ads'
import { trackMetaPurchase } from '@/lib/meta-pixel'

interface ConfirmedPurchase {
  confirmed: boolean
  transaction_id: string
  event_id?: string
  value: number
  currency: string
  contents: { id: string; quantity: number; item_price?: number }[]
  num_items: number
}

function SuccessContent() {
  const t = useTranslations('checkout')
  const tCart = useTranslations('cart')
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') || ''

  useEffect(() => {
    if (!ref) return
    let cancelled = false

    async function confirmAndTrack() {
      for (let attempt = 0; attempt < 6 && !cancelled; attempt += 1) {
        const response = await fetch(`/api/tracking/purchase?ref=${encodeURIComponent(ref)}`, { cache: 'no-store' })
        if (response.ok) {
          const purchase = await response.json() as ConfirmedPurchase
          if (purchase.confirmed) {
            const googleKey = `pumbapood_google_purchase_${ref}`
            const metaKey = `pumbapood_meta_purchase_${ref}`

            if (!localStorage.getItem(googleKey) && trackPurchase(
              purchase.value,
              purchase.transaction_id,
              purchase.contents,
            )) {
              localStorage.setItem(googleKey, '1')
            }
            if (!localStorage.getItem(metaKey) && trackMetaPurchase({
              value: purchase.value,
              currency: purchase.currency,
              transaction_id: purchase.transaction_id,
              event_id: purchase.event_id,
              contents: purchase.contents,
              content_ids: purchase.contents.map(item => item.id),
              num_items: purchase.num_items,
            })) {
              localStorage.setItem(metaKey, '1')
            }
            return
          }
        }
        await new Promise(resolve => window.setTimeout(resolve, 2000))
      }
    }

    confirmAndTrack().catch(error => console.error('[purchase-tracking]', error))
    return () => { cancelled = true }
  }, [ref])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-100 p-12 max-w-md w-full text-center shadow-sm">
        <CheckCircle2 size={60} className="text-green-500 mx-auto mb-5" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('success')}</h1>
        {ref && (
          <p className="text-[15px] text-gray-500 mb-1">
            {t('orderRef')} <span className="font-mono font-semibold text-gray-700">{ref}</span>
          </p>
        )}
        <p className="text-[15px] text-gray-500 mb-7">
          {t('successConfirm')}
        </p>
        <Link href="/tooted"
          className="inline-block bg-[#003366] text-white px-6 py-3 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
          {tCart('continueShopping')}
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  )
}
