export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '2133761077401963'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
  }
}

function fbq(...args: unknown[]) {
  if (typeof window === 'undefined') return
  if (typeof window.fbq === 'function') {
    window.fbq(...args)
  }
}

export function trackMetaPageView() {
  fbq('track', 'PageView')
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
  fbq('track', 'ViewContent', safe)
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
  fbq('track', 'AddToCart', safe)
}

export function trackMetaInitiateCheckout(params: {
  content_ids?: string[]
  contents?: { id: string; quantity: number }[]
  num_items?: number
  value?: number
  currency?: string
}) {
  const safe: Record<string, unknown> = {}
  if (params.content_ids?.length) safe.content_ids = params.content_ids
  if (params.contents?.length) safe.contents = params.contents
  if (params.num_items !== undefined) safe.num_items = params.num_items
  if (params.value !== undefined) safe.value = params.value
  safe.currency = params.currency || 'EUR'
  fbq('track', 'InitiateCheckout', safe)
}

export function trackMetaPurchase(params: {
  content_ids?: string[]
  contents?: { id: string; quantity: number }[]
  num_items?: number
  value?: number
  currency?: string
  transaction_id?: string
}) {
  const safe: Record<string, unknown> = {}
  if (params.content_ids?.length) safe.content_ids = params.content_ids
  if (params.contents?.length) safe.contents = params.contents
  if (params.num_items !== undefined) safe.num_items = params.num_items
  if (params.value !== undefined) safe.value = params.value
  safe.currency = params.currency || 'EUR'
  if (params.transaction_id) safe.transaction_id = params.transaction_id
  fbq('track', 'Purchase', safe)
}

export function trackMetaLead(params?: {
  value?: number
  currency?: string
}) {
  const safe: Record<string, unknown> = {}
  if (params?.value !== undefined) safe.value = params.value
  safe.currency = params?.currency || 'EUR'
  fbq('track', 'Lead', safe)
}
