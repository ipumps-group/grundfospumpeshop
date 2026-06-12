'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useConsent } from '@/lib/consent-context'
import { useTranslations } from 'next-intl'

export default function CookieConsent() {
  const t = useTranslations('cookieConsent')
  const { consentGiven, setConsent } = useConsent()
  const [open, setOpen] = useState(!consentGiven)

  if (!open) return null

  const acceptAll = () => {
    setConsent({ analytics: true, advertising: true, functional: true })
    setOpen(false)
    activateTracking()
  }

  const acceptEssential = () => {
    setConsent({ analytics: false, advertising: false, functional: true })
    setOpen(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 shadow-2xl p-4 md:p-5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-[14px] text-gray-600 flex-1 leading-relaxed">
          {t('message')}{' '}
          <Link href="/privaatsus" className="text-[#003366] underline hover:text-[#004080]">
            {t('learnMore')}
          </Link>
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={acceptEssential}
            className="px-4 py-2 text-[14px] font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {t('essential')}
          </button>
          <button
            onClick={acceptAll}
            className="px-5 py-2 text-[14px] font-semibold text-white bg-[#003366] rounded-xl hover:bg-[#004080] transition-colors"
          >
            {t('acceptAll')}
          </button>
        </div>
      </div>
    </div>
  )
}

function activateTracking() {
  if (typeof window === 'undefined') return
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    })
  }
}
