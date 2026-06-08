export const GOOGLE_ADS_ID = 'AW-18154845685'
const PURCHASE_LABEL = 'JPeXCOO5gbscEPXr89BD'
const CONTACT_FORM_SUBMIT_LABEL = 'aobnCOa5gbscEPXr89BD'
const BEGIN_CHECKOUT_LABEL = '2AHFCOm5gbscEPXr89BD'
const ADD_TO_CART_LABEL = 'bu4ZCOy5gbscEPXr89BD'

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

export function trackAddToCart(value?: number) {
  gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${ADD_TO_CART_LABEL}`,
    value: value ?? 0,
    currency: 'EUR',
  })
}

export function trackBeginCheckout(value?: number) {
  gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${BEGIN_CHECKOUT_LABEL}`,
    value: value ?? 0,
    currency: 'EUR',
  })
}

export function trackContactFormSubmit() {
  gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${CONTACT_FORM_SUBMIT_LABEL}`,
  })
}

export function trackPurchase(value?: number, transactionId?: string) {
  gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${PURCHASE_LABEL}`,
    value: value ?? 0,
    currency: 'EUR',
    transaction_id: transactionId,
  })
}
