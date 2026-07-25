import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createOrderViewToken, verifyOrderViewToken } from '@/lib/order-view-token'

describe('order view tokens', () => {
  const previousSecret = process.env.ORDER_VIEW_TOKEN_SECRET

  beforeEach(() => {
    process.env.ORDER_VIEW_TOKEN_SECRET = 'test-order-view-secret'
  })

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.ORDER_VIEW_TOKEN_SECRET
    } else {
      process.env.ORDER_VIEW_TOKEN_SECRET = previousSecret
    }
  })

  it('allows the matching order link', () => {
    const token = createOrderViewToken('GP-2026-0078')

    expect(verifyOrderViewToken('GP-2026-0078', token)).toBe(true)
  })

  it('does not allow the token for a different order', () => {
    const token = createOrderViewToken('GP-2026-0078')

    expect(verifyOrderViewToken('GP-2026-0079', token)).toBe(false)
    expect(verifyOrderViewToken('GP-2026-0078', 'invalid')).toBe(false)
  })
})
