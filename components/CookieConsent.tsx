'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

const CONSENT_KEY = 'pumbapood_consent'
const CONSENT_VERSION = 1

export default function CookieConsent() {
  const t = useTranslations('cookieConsent')
  const bannerRef = useRef<HTMLDivElement>(null)
  const handlersRef = useRef<((e: Event) => void)[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.v === CONSENT_VERSION) return
      }
    } catch {}

    const el = bannerRef.current
    if (!el) return
    el.style.display = ''

    const makeHandler = (all: boolean) => (e: Event) => {
      e.preventDefault()
      const state = all
        ? { analytics: true, advertising: true, functional: true }
        : { analytics: false, advertising: false, functional: true }
      try {
        localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, state }))
      } catch {}
      el.style.display = 'none'
      if (all) {
        try {
          const w = window as Window & { gtag?: (...args: unknown[]) => void }
          if (typeof w.gtag === 'function') {
            w.gtag('consent', 'update', {
              ad_storage: 'granted', analytics_storage: 'granted',
              ad_user_data: 'granted', ad_personalization: 'granted',
            })
          }
        } catch {}
      }
      try { window.dispatchEvent(new CustomEvent('consent_changed', { detail: state })) } catch {}
    }

    const hAll = makeHandler(true)
    const hEss = makeHandler(false)
    handlersRef.current = [hAll, hEss]

    const btnAll = el.querySelector('[data-accept-all]')
    const btnEss = el.querySelector('[data-accept-essential]')
    btnAll?.addEventListener('click', hAll)
    btnEss?.addEventListener('click', hEss)

    return () => {
      btnAll?.removeEventListener('click', hAll)
      btnEss?.removeEventListener('click', hEss)
    }
  }, [])

  return (
    <div ref={bannerRef} style={{ display: 'none' }} className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 shadow-2xl p-4 md:p-5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-[14px] text-gray-600 flex-1 leading-relaxed">
          {t('message')}{' '}
          <Link href="/leht/privaatsuspoliitika" className="text-[#003366] underline hover:text-[#004080]">
            {t('learnMore')}
          </Link>
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            data-accept-essential
            className="px-4 py-2 text-[14px] font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {t('essential')}
          </button>
          <button
            data-accept-all
            className="px-5 py-2 text-[14px] font-semibold text-white bg-[#003366] rounded-xl hover:bg-[#004080] transition-colors"
          >
            {t('acceptAll')}
          </button>
        </div>
      </div>
    </div>
  )
}
