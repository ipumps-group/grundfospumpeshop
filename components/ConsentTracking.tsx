'use client'

/**
 * Consent → tag bridge. The Google tags themselves are server-rendered in
 * <head> (components/TrackingHead.tsx) with consent mode default = denied;
 * this component only pushes consent UPDATES into gtag:
 *   - on mount, when the visitor has a stored consent choice (return visit)
 *   - on every 'consent_changed' event from the cookie banner
 * Meta Pixel has no consent-mode equivalent, so it stays consent-gated and
 * is injected only after advertising consent.
 */

import { useEffect } from 'react'
import { flushMetaEvents, META_PIXEL_ID } from '@/lib/meta-pixel'
import { hasAdvertisingConsent, hasAnalyticsConsent } from '@/lib/tracking-consent'

type Gtag = (...args: unknown[]) => void

type MetaFbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue?: unknown[][]
  loaded?: boolean
  version?: string
  push?: (...args: unknown[]) => void
}

let metaInitialized = false

function gtag(): Gtag | undefined {
  return (window as Window & { gtag?: Gtag }).gtag
}

function pushConsentUpdate() {
  const advertising = hasAdvertisingConsent()
  const analytics = hasAnalyticsConsent()
  gtag()?.('consent', 'update', {
    ad_storage: advertising ? 'granted' : 'denied',
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_user_data: advertising ? 'granted' : 'denied',
    ad_personalization: advertising ? 'granted' : 'denied',
  })
}

function enableMeta() {
  if (metaInitialized || !hasAdvertisingConsent()) return

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
    // Return visit with a stored choice: restore consent into gtag.
    if (hasAdvertisingConsent() || hasAnalyticsConsent()) {
      pushConsentUpdate()
    }
    if (hasAdvertisingConsent()) enableMeta()

    const onConsentChanged = () => {
      pushConsentUpdate()
      enableMeta()
    }
    window.addEventListener('consent_changed', onConsentChanged)
    return () => window.removeEventListener('consent_changed', onConsentChanged)
  }, [])

  return null
}
