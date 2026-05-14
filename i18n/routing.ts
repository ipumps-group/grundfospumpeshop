// Edge-Runtime safe — imported by middleware AND server/client code.
// Contains ONLY the routing definition; no React/navigation imports.
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['et', 'en', 'ru', 'lv', 'lt'] as const,
  defaultLocale: 'et',
  // Locale prefix only when needed (e.g., /en/products vs /products).
  // This allows /robots.txt and /sitemap.xml at root without locale.
  // SEO files work at root; locale prefix used for actual content pages.
  localePrefix: 'as-needed',
  // Detect browser language via Accept-Language header and remember
  // choice in NEXT_LOCALE cookie. Falls back to defaultLocale if the
  // browser language is not in the supported locales list.
  localeDetection: true,
})

export type Locale = (typeof routing.locales)[number]
