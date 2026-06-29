import crypto from 'crypto'

const META_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0'

function hash(value?: string | null): string | undefined {
  const normalized = value?.trim().toLowerCase()
  return normalized ? crypto.createHash('sha256').update(normalized).digest('hex') : undefined
}

function normalizePhone(value?: string | null): string | undefined {
  const normalized = value?.replace(/\D/g, '')
  return normalized || undefined
}

interface MetaEventInput {
  eventName: 'Purchase' | 'Lead'
  eventId: string
  eventSourceUrl?: string | null
  email?: string | null
  phone?: string | null
  fbp?: string | null
  fbc?: string | null
  value?: number
  currency?: string
  contents?: Array<{ id: string; quantity: number; item_price?: number }>
  orderId?: string
}

export async function sendMetaEvent(input: MetaEventInput): Promise<boolean> {
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN
  if (!pixelId || !accessToken) {
    console.warn('[meta-capi] Pixel ID or access token is not configured')
    return false
  }

  const userData: Record<string, string> = {}
  const emailHash = hash(input.email)
  const phoneHash = hash(normalizePhone(input.phone))
  if (emailHash) userData.em = emailHash
  if (phoneHash) userData.ph = phoneHash
  if (input.fbp) userData.fbp = input.fbp
  if (input.fbc) userData.fbc = input.fbc

  const customData: Record<string, unknown> = { currency: input.currency || 'EUR' }
  if (input.value !== undefined) customData.value = input.value
  if (input.contents?.length) {
    customData.contents = input.contents
    customData.content_ids = input.contents.map(item => item.id)
    customData.content_type = 'product'
    customData.num_items = input.contents.reduce((sum, item) => sum + item.quantity, 0)
  }
  if (input.orderId) customData.order_id = input.orderId

  const payload: Record<string, unknown> = {
    data: [{
      event_name: input.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: input.eventId,
      action_source: 'website',
      event_source_url: input.eventSourceUrl || process.env.NEXT_PUBLIC_SITE_URL,
      user_data: userData,
      custom_data: customData,
    }],
  }
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE

  const response = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    console.error('[meta-capi] Event rejected', response.status, await response.text())
    return false
  }
  return true
}
