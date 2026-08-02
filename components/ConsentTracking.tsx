'use client'

import { useEffect } from 'react'
import { flushMetaEvents, META_PIXEL_ID } from '@/lib/meta-pixel'
import { hasAdvertisingConsent, hasAnalyticsConsent } from '@/lib/tracking-consent'

type MetaFbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue?: unknown[][]
  loaded?: boolean
  version?: string
  push?: (...args: unknown[]) => void
}

let metaInitialized = false
let googleInitialized = false

function enableGoogleTracking(advertising: boolean, analytics: boolean) {
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
  const gtmId = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID
  if (googleInitialized || (!ga4Id && !adsId && !gtmId)) return

  const trackingWindow = window as Window & { dataLayer?: unknown[] }
  trackingWindow.dataLayer = trackingWindow.dataLayer || []
  window.gtag = (...args: unknown[]) => trackingWindow.dataLayer?.push(args)
  window.gtag('consent', 'default', {
    ad_storage: advertising ? 'granted' : 'denied',
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_user_data: advertising ? 'granted' : 'denied',
    ad_personalization: advertising ? 'granted' : 'denied',
  })
  window.gtag('js', new Date())
  if (ga4Id && analytics) window.gtag('config', ga4Id)
  if (adsId && advertising) window.gtag('config', adsId, { send_page_view: false })

  if (ga4Id || adsId) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id || adsId || '')}`
    document.head.appendChild(script)
  }
  if (gtmId) {
    trackingWindow.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`
    document.head.appendChild(script)
  }
  googleInitialized = true
}

function enableTracking() {
  const advertising = hasAdvertisingConsent()
  const analytics = hasAnalyticsConsent()
  if (!advertising && !analytics) return

  enableGoogleTracking(advertising, analytics)

  window.gtag?.('consent', 'update', {
    ad_storage: advertising ? 'granted' : 'denied',
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_user_data: advertising ? 'granted' : 'denied',
    ad_personalization: advertising ? 'granted' : 'denied',
  })
  if (analytics) window.gtag?.('event', 'page_view')

  if (!advertising || metaInitialized) return

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
