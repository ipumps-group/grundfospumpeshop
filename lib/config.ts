/**
 * Central configuration for the application.
 * Import from here instead of hardcoding values.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pumbapood.ee'
export const SITE_NAME = 'Pump OÜ'

export const LOCALES = ['et', 'en', 'ru', 'lv', 'lt'] as const
export const DEFAULT_LOCALE = 'et' as const

export function localizedUrl(path: string, locale: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return locale === DEFAULT_LOCALE
    ? `${SITE_URL}${normalizedPath}`
    : `${SITE_URL}/${locale}${normalizedPath}`
}

export const COMPANY = {
  legalName: 'Pump OÜ',
  regNr: '16391391',
  vatId: 'EE102445343',
  phone: '+3725274403',
  email: 'info@pumbapood.ee',
  bankAccount: 'EE192200221087019864',
  bankName: 'Swedbank AS',
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
  shopLat: 59.4607,
  shopLng: 24.9319,
  openingHours: 'Mo-Fr 08:00-17:00',
} as const
