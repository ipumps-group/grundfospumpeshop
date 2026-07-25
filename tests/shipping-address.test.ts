import { describe, expect, it } from 'vitest'
import { buildNewOrderAdminHtml } from '@/lib/email-templates'
import { formatDeliveryAddress, getDeliveryAddressLines } from '@/lib/shipping-address'

describe('shipping address formatting', () => {
  it('formats a courier recipient address instead of the carrier name', () => {
    const address = {
      carrier: 'courier',
      carrier_name: 'Kuller',
      street: 'Pargi tee 12-3',
      postal_code: '10111',
      city: 'Tallinn',
    }

    expect(getDeliveryAddressLines(address)).toEqual([
      'Pargi tee 12-3',
      '10111 Tallinn',
    ])
    expect(formatDeliveryAddress(address)).toBe('Pargi tee 12-3\n10111 Tallinn')
  })

  it('formats pickup location fields', () => {
    const address = {
      carrier: 'omniva',
      carrier_name: 'Omniva',
      pickup_name: 'Mustamäe Prisma',
      pickup_address: 'Mustamäe tee 17',
      pickup_postal: '10616',
      pickup_city: 'Tallinn',
    }

    expect(getDeliveryAddressLines(address)).toEqual([
      'Mustamäe Prisma',
      'Mustamäe tee 17',
      '10616 Tallinn',
    ])
  })

  it('renders the courier address in the new-order admin email', () => {
    const html = buildNewOrderAdminHtml({
      orderRef: 'GP-2026-0078',
      order: { total: 0.12, created_at: '2026-07-25T09:46:11.000Z' },
      items: [{ product_name: 'test', quantity: 1, unit_price: 0.1 }],
      customerName: 'Proov Proov',
      customerEmail: 'proov@example.com',
      shippingAddress: {
        carrier: 'courier',
        carrier_name: 'Kuller',
        street: 'Pargi tee 12-3',
        postal_code: '10111',
        city: 'Tallinn',
      },
    })

    expect(html).toContain('Pargi tee 12-3')
    expect(html).toContain('10111 Tallinn')
    expect(html).not.toContain('Kuller:')
    expect(html).not.toContain('>, </div>')
  })
})
