import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGtag = vi.fn()
const mockFbq = vi.fn()

Object.defineProperty(window, 'gtag', { value: mockGtag, writable: true })
Object.defineProperty(window, 'fbq', { value: mockFbq, writable: true })

vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => JSON.stringify({ v: 1, state: { advertising: true, analytics: true, functional: true } })),
  setItem: vi.fn(),
  removeItem: vi.fn(),
})

beforeEach(() => {
  mockGtag.mockClear()
  mockFbq.mockClear()
})

describe('trackAddToCart', () => {
  it('fires gtag conversion with value and EUR currency', async () => {
    const { trackAddToCart } = await import('@/lib/google-ads')
    trackAddToCart(49.99)
    expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', expect.objectContaining({
      value: 49.99,
      currency: 'EUR',
    }))
  })
})

describe('trackBeginCheckout', () => {
  it('fires gtag conversion with value and EUR currency', async () => {
    const { trackBeginCheckout } = await import('@/lib/google-ads')
    trackBeginCheckout(99.50)
    expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', expect.objectContaining({
      value: 99.50,
      currency: 'EUR',
    }))
  })
})

describe('trackContactFormSubmit', () => {
  it('fires gtag conversion with value 1.0 and EUR currency', async () => {
    const { trackContactFormSubmit } = await import('@/lib/google-ads')
    trackContactFormSubmit()
    expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', expect.objectContaining({
      value: 1.0,
      currency: 'EUR',
    }))
  })
})

describe('trackPurchase', () => {
  it('fires gtag conversion with transaction_id, value and EUR currency', async () => {
    const { trackPurchase } = await import('@/lib/google-ads')
    trackPurchase(150.00, 'ORDER-123')
    expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', expect.objectContaining({
      value: 150.00,
      currency: 'EUR',
      transaction_id: 'ORDER-123',
    }))
  })
})

describe('Meta Pixel events', () => {
  it('trackMetaViewContent fires ViewContent with content_ids and EUR', async () => {
    const { trackMetaViewContent } = await import('@/lib/meta-pixel')
    trackMetaViewContent({
      content_ids: ['42'],
      content_name: 'Test Pump',
      value: 99.99,
      currency: 'EUR',
    })
    expect(mockFbq).toHaveBeenCalledWith('track', 'ViewContent', expect.objectContaining({
      content_ids: ['42'],
      content_name: 'Test Pump',
      currency: 'EUR',
    }))
  })

  it('trackMetaAddToCart fires AddToCart with content_ids and EUR', async () => {
    const { trackMetaAddToCart } = await import('@/lib/meta-pixel')
    trackMetaAddToCart({
      content_ids: ['42'],
      value: 99.99,
      currency: 'EUR',
      contents: [{ id: '42', quantity: 2 }],
    })
    expect(mockFbq).toHaveBeenCalledWith('track', 'AddToCart', expect.objectContaining({
      content_ids: ['42'],
      currency: 'EUR',
    }))
  })

  it('trackMetaInitiateCheckout fires InitiateCheckout with value and EUR', async () => {
    const { trackMetaInitiateCheckout } = await import('@/lib/meta-pixel')
    trackMetaInitiateCheckout({
      value: 199.99,
      currency: 'EUR',
      num_items: 3,
    })
    expect(mockFbq).toHaveBeenCalledWith('track', 'InitiateCheckout', expect.objectContaining({
      value: 199.99,
      currency: 'EUR',
      num_items: 3,
    }))
  })

  it('trackMetaPurchase fires Purchase with transaction_id and EUR', async () => {
    const { trackMetaPurchase } = await import('@/lib/meta-pixel')
    trackMetaPurchase({
      value: 299.99,
      currency: 'EUR',
      transaction_id: 'ORDER-456',
      num_items: 2,
    })
    expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', expect.objectContaining({
      value: 299.99,
      currency: 'EUR',
      transaction_id: 'ORDER-456',
    }))
  })

  it('trackMetaLead fires Lead with currency EUR', async () => {
    const { trackMetaLead } = await import('@/lib/meta-pixel')
    trackMetaLead()
    expect(mockFbq).toHaveBeenCalledWith('track', 'Lead', expect.objectContaining({
      currency: 'EUR',
    }))
  })

  it('Meta events never include personal information', async () => {
    const { trackMetaLead, trackMetaPurchase } = await import('@/lib/meta-pixel')
    trackMetaLead()
    const leadCall = mockFbq.mock.calls.find((c: unknown[]) => c[0] === 'track' && c[1] === 'Lead')
    const leadData = leadCall?.[2] as Record<string, unknown> | undefined
    expect(leadData).not.toHaveProperty('email')
    expect(leadData).not.toHaveProperty('phone')
    expect(leadData).not.toHaveProperty('name')

    mockFbq.mockClear()
    trackMetaPurchase({ transaction_id: 'T1', currency: 'EUR' })
    const purchaseCall = mockFbq.mock.calls.find((c: unknown[]) => c[0] === 'track' && c[1] === 'Purchase')
    const purchaseData = purchaseCall?.[2] as Record<string, unknown> | undefined
    expect(purchaseData).not.toHaveProperty('email')
    expect(purchaseData).not.toHaveProperty('phone')
    expect(purchaseData).not.toHaveProperty('name')
  })
})
