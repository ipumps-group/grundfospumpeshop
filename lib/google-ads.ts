export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18154845685'
export const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || 'G-KD26VEJVWY'

const PURCHASE_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL || 'JPeXCOO5gbscEPXr89BD'
const CONTACT_FORM_SUBMIT_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL || 'aobnCOa5gbscEPXr89BD'
const BEGIN_CHECKOUT_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CHECKOUT_LABEL || '2AHFCOm5gbscEPXr89BD'
const ADD_TO_CART_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_ATC_LABEL || 'bu4ZCOy5gbscEPXr89BD'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag === 'function') {
    window.gtag(...args)
  }
}

function hasConsent(): boolean {
  try {
    const stored = localStorage.getItem('pumbapood_consent')
    if (!stored) return false
    const parsed = JSON.parse(stored)
    return parsed.state?.advertising === true
  } catch {
    return false
  }
}

function safeGtag(...args: unknown[]) {
  if (!hasConsent()) return
  gtag(...args)
}

export function trackAddToCart(value?: number) {
  safeGtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${ADD_TO_CART_LABEL}`,
    value: value ?? 0,
    currency: 'EUR',
  })
}

export function trackBeginCheckout(value?: number) {
  safeGtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${BEGIN_CHECKOUT_LABEL}`,
    value: value ?? 0,
    currency: 'EUR',
  })
}

export function trackContactFormSubmit() {
  safeGtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${CONTACT_FORM_SUBMIT_LABEL}`,
    value: 1.0,
    currency: 'EUR',
  })
}

export function trackPurchase(value?: number, transactionId?: string) {
  safeGtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${PURCHASE_LABEL}`,
    value: value ?? 0,
    currency: 'EUR',
    transaction_id: transactionId,
  })
}
