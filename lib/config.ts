/**
 * Central configuration for the application.
 * Import from here instead of hardcoding values.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pumbapood.ee'
export const SITE_NAME = 'iPumps'

export const LOCALES = ['et', 'en', 'ru', 'lv', 'lt'] as const
export const DEFAULT_LOCALE = 'et' as const

export const COMPANY = {
  legalName: 'Intelligent Pump Solutions OÜ',
  regNr: '11417625',
  vatId: 'EE101173603',
  phone: '+3725033978',
  email: 'info@pumbapood.ee',
  registeredAddress: {
    street: 'Sepamäe tee 11-2',
    locality: 'Leppneeme küla',
    region: 'Viimsi vald, Harju maakond',
    postalCode: '74009',
    country: 'EE',
  },
  shopAddress: {
    street: 'Vana-Narva mnt 3, uks 5/6',
    locality: 'Tallinn',
    region: 'Harjumaa',
    postalCode: '',
    country: 'EE',
  },
  shopLat: 59.437,
  shopLng: 24.7536,
  openingHours: 'Mo-Fr 08:00-17:00',
} as const
