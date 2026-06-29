'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth-context'
import { trackPurchase } from '@/lib/google-ads'
import { trackMetaPurchase } from '@/lib/meta-pixel'

function SuccessContent() {
  const t = useTranslations('checkout')
  const tCart = useTranslations('cart')
  const tAcc = useTranslations('account')
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') || ''
  const { user } = useAuth()

  useEffect(() => {
    if (!ref) return

    try {
      const value = Number(sessionStorage.getItem('pumbapood_last_checkout_value') || '0')
      const itemsJson = sessionStorage.getItem('pumbapood_last_checkout_items')
      const contents: { id: string; quantity: number }[] = itemsJson ? JSON.parse(itemsJson) : []
      const numItems = contents.reduce((s, c) => s + c.quantity, 0)

      if (value > 0) {
        const googleKey = `pumbapood_google_purchase_${ref}`
        const metaKey = `pumbapood_meta_purchase_${ref}`

        if (!localStorage.getItem(googleKey)) {
          trackPurchase(value, ref, contents)
          localStorage.setItem(googleKey, '1')
        }
        if (!localStorage.getItem(metaKey)) {
          trackMetaPurchase({
            value,
            currency: 'EUR',
            transaction_id: ref,
            contents,
            content_ids: contents.map(c => c.id),
            num_items: numItems,
          })
          localStorage.setItem(metaKey, '1')
        }

        sessionStorage.removeItem('pumbapood_last_checkout_value')
        sessionStorage.removeItem('pumbapood_last_checkout_items')
      }
    } catch (err) {
      console.error('[purchase-tracking]', err)
    }
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
        <div className="flex flex-col gap-3">
          {user ? (
            <Link href="/konto/tellimused"
              className="inline-block bg-[#003366] text-white px-6 py-3 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
              {tAcc('orders')}
            </Link>
          ) : (
            <Link href="/konto/sisselogimine"
              className="inline-block bg-[#003366] text-white px-6 py-3 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
              {tAcc('login')}
            </Link>
          )}
          <Link href="/tooted"
            className="inline-block text-[#003366] px-6 py-3 rounded-xl font-semibold text-[15px] hover:underline">
            {tCart('continueShopping')}
          </Link>
        </div>
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
