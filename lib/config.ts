/**
 * Central configuration for the application.
 * Import from here instead of hardcoding values.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pumbapood.ee'
export const SITE_NAME = 'Pump OÜ'

export const LOCALES = ['et', 'en', 'ru', 'lv', 'lt'] as const
export const DEFAULT_LOCALE = 'et' as const

export const COMPANY = {
  legalName: 'Pump OÜ',
  regNr: '16391391',
  vatId: 'EE102445343',
  phone: '+3725274403',
  email: 'info@pumbapood.ee',
  registeredAddress: {
    street: 'Vana-Narva mnt 3',
    locality: 'Maardu linn',
    region: 'Harju maakond',
    postalCode: '74114',
    country: 'EE',
  },
  shopAddress: {
    street: 'Vana-Narva mnt 3',
    locality: 'Maardu linn',
    region: 'Harju maakond',
    postalCode: '74114',
    country: 'EE',
  },
  shopLat: 59.437,
  shopLng: 24.7536,
  openingHours: 'Mo-Fr 08:00-17:00',
} as const
