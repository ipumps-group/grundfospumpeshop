import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', fetchMock)
  process.env.META_PIXEL_ID = 'pixel-123'
  process.env.META_CAPI_ACCESS_TOKEN = 'secret-token'
  delete process.env.META_TEST_EVENT_CODE
})

describe('Meta Conversions API', () => {
  it('sends a deduplicated purchase with hashed contact data', async () => {
    const { sendMetaEvent } = await import('@/lib/meta-capi')
    const sent = await sendMetaEvent({
      eventName: 'Purchase',
      eventId: 'event-123',
      eventSourceUrl: 'https://pumbapood.ee/checkout/success',
      email: 'Buyer@Example.com',
      phone: '+372 5555 1234',
      value: 149.9,
      currency: 'EUR',
      orderId: 'ORDER-123',
      contents: [{ id: '42', quantity: 1, item_price: 149.9 }],
    })

    expect(sent).toBe(true)
    const request = fetchMock.mock.calls[0]
    const payload = JSON.parse(request[1].body as string)
    expect(payload.data[0]).toMatchObject({
      event_name: 'Purchase',
      event_id: 'event-123',
      action_source: 'website',
      custom_data: { value: 149.9, currency: 'EUR', order_id: 'ORDER-123' },
    })
    expect(payload.data[0].user_data.em).toMatch(/^[a-f0-9]{64}$/)
    expect(payload.data[0].user_data.ph).toMatch(/^[a-f0-9]{64}$/)
    expect(JSON.stringify(payload)).not.toContain('Buyer@Example.com')
    expect(JSON.stringify(payload)).not.toContain('+372 5555 1234')
  })

  it('does not throw when server credentials are missing', async () => {
    delete process.env.META_PIXEL_ID
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID
    delete process.env.META_CAPI_ACCESS_TOKEN
    delete process.env.META_ACCESS_TOKEN
    const { sendMetaEvent } = await import('@/lib/meta-capi')

    await expect(sendMetaEvent({ eventName: 'Lead', eventId: 'lead-1' })).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
