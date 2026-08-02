import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/haldus',
          '/konto',
          '/*/konto',
          '/ostukorv',
          '/*/ostukorv',
          '/checkout',
          '/*/checkout',
          '/tellimus',
          '/*/tellimus',
          '/api',
          '/Back',
          '/*?*sort=',
          '/*?*page=',
          '/*?*lk=',
          '/*?*q=',
          '/*?*laos=',
          '/*?*min=',
          '/*?*max=',
          '/*?*tegevusala=',
          '/*?*seeria=',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
