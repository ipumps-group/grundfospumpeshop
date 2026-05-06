import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

/**
 * Locale resolution uses the Accept-Language header via negotiator +
 * @formatjs/intl-localematcher. The problem is that most browsers include
 * "en" as a secondary/fallback language even when the system is set to a
 * different locale. Since "en" is a supported locale, the "best fit"
 * algorithm matches it — making the first load always English regardless
 * of the user's actual system language.
 *
 * The fix: strip Accept-Language down to only the **primary** (highest
 * quality) language. If that primary language is not supported the
 * library falls back to the defaultLocale ('et'). This makes the site
 * respect the user's actual system/browser language rather than a
 * secondary fallback.
 */
export default function middleware(request: NextRequest) {
  const acceptLang = request.headers.get('accept-language')
  if (acceptLang) {
    // Keep only the first language tag before any comma or quality params
    const primary = acceptLang.split(',')[0].split(';')[0].trim()
    request.headers.set('accept-language', primary)
  }
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Exclude: api, haldus, Back, _next/static, _next/image, favicon, sitemap, robots, manifest, and static files
    '/((?!api|haldus|Back|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
}
