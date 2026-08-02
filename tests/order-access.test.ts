import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { canRetryOrder } from '@/lib/order-access'
import { createOrderViewToken } from '@/lib/order-view-token'

describe('order payment retry access', () => {
  const previousSecret = process.env.ORDER_VIEW_TOKEN_SECRET

  beforeEach(() => {
    process.env.ORDER_VIEW_TOKEN_SECRET = 'test-order-view-secret'
  })

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.ORDER_VIEW_TOKEN_SECRET
    else process.env.ORDER_VIEW_TOKEN_SECRET = previousSecret
  })

  it('allows the authenticated owner', () => {
    expect(canRetryOrder({
      orderNumber: 'GP-2026-1',
      orderUserId: 'user-1',
      callerUserId: 'user-1',
    })).toBe(true)
  })

  it('allows a signed order link', () => {
    const token = createOrderViewToken('GP-2026-1')
    expect(canRetryOrder({ orderNumber: 'GP-2026-1', suppliedToken: token })).toBe(true)
  })

  it('rejects an unrelated caller', () => {
    expect(canRetryOrder({
      orderNumber: 'GP-2026-1',
      orderUserId: 'user-1',
      callerUserId: 'user-2',
      suppliedToken: 'invalid',
    })).toBe(false)
  })
})
