'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { trackPurchase } from '@/lib/google-ads'

function SuccessContent() {
  const t = useTranslations('checkout')
  const tCart = useTranslations('cart')
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') || ''

  useEffect(() => {
    if (!ref) return
    const key = 'pumbapood_tracked_purchase'
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {}
    const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pumbapood_last_checkout_value') : null
    const value = raw ? Number(raw) : undefined
    trackPurchase(value, ref)
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
