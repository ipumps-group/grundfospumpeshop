import { hasAdvertisingConsent, hasAnalyticsConsent } from '@/lib/tracking-consent'

export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
export const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

const PURCHASE_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL
const CONTACT_FORM_SUBMIT_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL
const BEGIN_CHECKOUT_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CHECKOUT_LABEL
const ADD_TO_CART_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_ATC_LABEL
const VIEW_ITEM_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_VIEW_ITEM_LABEL
const SEARCH_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_SEARCH_LABEL
const LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') window.gtag(...args)
}

function safeConversion(label: string | undefined, params: Record<string, unknown>): boolean {
  if (!GOOGLE_ADS_ID || !label) {
    console.warn('[Google Ads] Conversion not configured — missing ID or label')
    return false
  }
  if (!hasAdvertisingConsent() || typeof window.gtag !== 'function') return false
  gtag('event', 'conversion', { ...params, send_to: `${GOOGLE_ADS_ID}/${label}` })
  return true
}

function analyticsGtag(...args: unknown[]): boolean {
  if (!hasAnalyticsConsent() || typeof window.gtag !== 'function') return false
  gtag(...args)
  return true
}

export function trackViewItem(item?: { id: string; name?: string; price?: number; category?: string }) {
  const conversionSent = safeConversion(VIEW_ITEM_LABEL, { value: item?.price ?? 0, currency: 'EUR' })
  analyticsGtag('event', 'view_item', {
    currency: 'EUR',
    value: item?.price ?? 0,
    items: item ? [{ item_id: item.id, item_name: item.name, price: item.price, item_category: item.category }] : undefined,
  })
  return conversionSent
}

export function trackViewItemList(items?: Array<{ id: string; name?: string; price?: number }>) {
  analyticsGtag('event', 'view_item_list', {
    currency: 'EUR',
    items: items?.map(item => ({ item_id: item.id, item_name: item.name, price: item.price })),
  })
}

export function trackSearch(searchTerm?: string) {
  const conversionSent = safeConversion(SEARCH_LABEL, { value: 0, currency: 'EUR' })
  analyticsGtag('event', 'search', { search_term: searchTerm || '' })
  return conversionSent
}

export function trackSelectItem(item?: { id: string; name?: string; price?: number }) {
  analyticsGtag('event', 'select_item', {
    currency: 'EUR',
    items: item ? [{ item_id: item.id, item_name: item.name, price: item.price }] : undefined,
  })
}

export function trackAddToCart(value?: number) {
  const conversionSent = safeConversion(ADD_TO_CART_LABEL, { value: value ?? 0, currency: 'EUR' })
  analyticsGtag('event', 'add_to_cart', { value: value ?? 0, currency: 'EUR' })
  return conversionSent
}

export function trackRemoveFromCart(value?: number) {
  analyticsGtag('event', 'remove_from_cart', { value: value ?? 0, currency: 'EUR' })
}

export function trackBeginCheckout(value?: number) {
  const conversionSent = safeConversion(BEGIN_CHECKOUT_LABEL, { value: value ?? 0, currency: 'EUR' })
  analyticsGtag('event', 'begin_checkout', { value: value ?? 0, currency: 'EUR' })
  return conversionSent
}

export function trackContactFormSubmit() {
  const conversionSent = safeConversion(CONTACT_FORM_SUBMIT_LABEL, { value: 1, currency: 'EUR' })
  analyticsGtag('event', 'generate_lead', { value: 1, currency: 'EUR' })
  return conversionSent
}

export function trackLead(value?: number) {
  const conversionSent = safeConversion(LEAD_LABEL, { value: value ?? 1, currency: 'EUR' })
  analyticsGtag('event', 'generate_lead', { value: value ?? 1, currency: 'EUR' })
  return conversionSent
}

export function trackPurchase(
  value?: number,
  transactionId?: string,
  items?: Array<{ id: string; quantity: number; item_price?: number }>,
): boolean {
  const mappedItems = items?.map(item => ({ item_id: item.id, quantity: item.quantity, price: item.item_price }))
  const conversionSent = safeConversion(PURCHASE_LABEL, {
    value: value ?? 0,
    currency: 'EUR',
    transaction_id: transactionId,
    items: mappedItems,
  })
  analyticsGtag('event', 'purchase', {
    transaction_id: transactionId,
    value: value ?? 0,
    currency: 'EUR',
    items: mappedItems,
  })
  return conversionSent
}
