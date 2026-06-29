import { hasAdvertisingConsent } from '@/lib/tracking-consent'

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '2133761077401963'

const pendingEvents: Array<{ name: string; params: Record<string, unknown>; eventId?: string }> = []

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
  }
}

function fbq(eventName: string, params: Record<string, unknown>, eventId?: string): boolean {
  if (!hasAdvertisingConsent()) return false
  if (typeof window.fbq !== 'function') {
    pendingEvents.push({ name: eventName, params, eventId })
    return true
  }
  if (eventId) window.fbq('track', eventName, params, { eventID: eventId })
  else window.fbq('track', eventName, params)
  return true
}

export function flushMetaEvents() {
  if (!hasAdvertisingConsent() || typeof window.fbq !== 'function') return
  for (const event of pendingEvents.splice(0)) {
    if (event.eventId) window.fbq('track', event.name, event.params, { eventID: event.eventId })
    else window.fbq('track', event.name, event.params)
  }
}

export function trackMetaPageView() {
  return fbq('PageView', {})
}

export function trackMetaViewContent(params: {
  content_ids?: string[]
  content_name?: string
  content_category?: string
  content_type?: string
  value?: number
  currency?: string
}) {
  const safe: Record<string, unknown> = { content_type: 'product' }
  if (params.content_ids?.length) safe.content_ids = params.content_ids
  if (params.content_name) safe.content_name = params.content_name
  if (params.content_category) safe.content_category = params.content_category
  if (params.value !== undefined) safe.value = params.value
  safe.currency = params.currency || 'EUR'
  return fbq('ViewContent', safe)
}

export function trackMetaAddToCart(params: {
  content_ids?: string[]
  content_name?: string
  content_type?: string
  value?: number
  currency?: string
  contents?: { id: string; quantity: number }[]
}) {
  const safe: Record<string, unknown> = { content_type: 'product' }
  if (params.content_ids?.length) safe.content_ids = params.content_ids
  if (params.content_name) safe.content_name = params.content_name
  if (params.value !== undefined) safe.value = params.value
  safe.currency = params.currency || 'EUR'
  if (params.contents?.length) safe.contents = params.contents
  return fbq('AddToCart', safe)
}

export function trackMetaInitiateCheckout(params: {
  content_ids?: string[]
  contents?: { id: string; quantity: number }[]
  num_items?: number
  value?: number
  currency?: string
  event_id?: string
}) {
  const safe: Record<string, unknown> = {}
  if (params.content_ids?.length) safe.content_ids = params.content_ids
  if (params.contents?.length) safe.contents = params.contents
  if (params.num_items !== undefined) safe.num_items = params.num_items
  if (params.value !== undefined) safe.value = params.value
  safe.currency = params.currency || 'EUR'
  return fbq('InitiateCheckout', safe, params.event_id)
}

export function trackMetaPurchase(params: {
  content_ids?: string[]
  contents?: { id: string; quantity: number }[]
  num_items?: number
  value?: number
  currency?: string
  transaction_id?: string
  event_id?: string
}) {
  const safe: Record<string, unknown> = {}
  if (params.content_ids?.length) safe.content_ids = params.content_ids
  if (params.contents?.length) safe.contents = params.contents
  if (params.num_items !== undefined) safe.num_items = params.num_items
  if (params.value !== undefined) safe.value = params.value
  safe.currency = params.currency || 'EUR'
  if (params.transaction_id) safe.transaction_id = params.transaction_id
  return fbq('Purchase', safe, params.event_id)
}

export function trackMetaLead(params?: {
  value?: number
  currency?: string
  event_id?: string
}) {
  const safe: Record<string, unknown> = {}
  if (params?.value !== undefined) safe.value = params.value
  safe.currency = params?.currency || 'EUR'
  return fbq('Lead', safe, params?.event_id)
}
