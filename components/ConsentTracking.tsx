'use client'

import { useEffect } from 'react'
import { flushMetaEvents, META_PIXEL_ID } from '@/lib/meta-pixel'
import { hasAdvertisingConsent } from '@/lib/tracking-consent'

type MetaFbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue?: unknown[][]
  loaded?: boolean
  version?: string
  push?: (...args: unknown[]) => void
}

let metaInitialized = false

function enableTracking() {
  if (!hasAdvertisingConsent()) return

  window.gtag?.('consent', 'update', {
    ad_storage: 'granted',
    analytics_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  })
  window.gtag?.('event', 'page_view')

  if (metaInitialized) return

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue?.push(args)
  } as MetaFbq
  fbq.queue = []
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.push = fbq
  const metaWindow = window as Window & { fbq?: MetaFbq; _fbq?: unknown }
  metaWindow.fbq = fbq
  metaWindow._fbq = fbq

  fbq('init', META_PIXEL_ID)
  fbq('track', 'PageView')
  flushMetaEvents()
  metaInitialized = true

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
}

export default function ConsentTracking() {
  useEffect(() => {
    enableTracking()
    const onConsentChanged = () => enableTracking()
    window.addEventListener('consent_changed', onConsentChanged)
    return () => window.removeEventListener('consent_changed', onConsentChanged)
  }, [])

  return null
}
