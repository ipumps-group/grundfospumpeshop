import { createHmac, timingSafeEqual } from 'crypto'

function signingSecret(): string {
  const secret =
    process.env.ORDER_VIEW_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret) {
    throw new Error('ORDER_VIEW_TOKEN_SECRET or SUPABASE_SERVICE_ROLE_KEY is required')
  }

  return secret
}

export function createOrderViewToken(orderNumber: string): string {
  return createHmac('sha256', signingSecret())
    .update(orderNumber)
    .digest('base64url')
}

export function verifyOrderViewToken(orderNumber: string, token: string): boolean {
  if (!token) return false

  const expected = Buffer.from(createOrderViewToken(orderNumber))
  const received = Buffer.from(token)

  return expected.length === received.length && timingSafeEqual(expected, received)
}
