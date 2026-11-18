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
  // Disable automatic browser-language detection. pumbapood.ee defaults to
  // Estonian for every URL that has no locale prefix. Other locales are only
  // served when the user explicitly visits the prefixed path (e.g. /en/...).
  localeDetection: false,
})

export type Locale = (typeof routing.locales)[number]
