type ShippingAddress = Record<string, unknown>

function value(address: ShippingAddress, key: string): string {
  const raw = address[key]
  return typeof raw === 'string' ? raw.trim() : ''
}

export function getDeliveryAddressLines(address: unknown): string[] {
  if (!address || typeof address !== 'object') return []

  const shippingAddress = address as ShippingAddress
  const street = value(shippingAddress, 'street')
  const city = value(shippingAddress, 'city')
  const postalCode = value(shippingAddress, 'postal_code') || value(shippingAddress, 'zip')

  if (value(shippingAddress, 'carrier') === 'courier' || street) {
    return [
      street,
      [postalCode, city].filter(Boolean).join(' '),
    ].filter(Boolean)
  }

  const pickupName =
    value(shippingAddress, 'pickup_name') ||
    value(shippingAddress, 'parcel_machine_name')
  const pickupAddress = value(shippingAddress, 'pickup_address')
  const pickupCity = value(shippingAddress, 'pickup_city') || city
  const pickupPostal = value(shippingAddress, 'pickup_postal') || postalCode

  return [
    pickupName,
    pickupAddress,
    [pickupPostal, pickupCity].filter(Boolean).join(' '),
  ].filter(Boolean)
}

export function formatDeliveryAddress(address: unknown): string {
  return getDeliveryAddressLines(address).join('\n')
}
