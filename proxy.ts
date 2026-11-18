import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Estonian-only campaign pages — serve them directly under the 'et' locale via an
// internal rewrite. With localeDetection: false these would already resolve to
// 'et', but the rewrite keeps them working without the /et/ prefix in the URL.
const ET_ONLY_PATHS = new Set(['/alpha-go', '/unilift'])

/**
 * pumbapood.ee proxy (Next.js 16, formerly middleware.ts).
 *
 * Routing is configured so that URLs without a locale prefix always resolve to
 * Estonian (defaultLocale). Browser language headers and the NEXT_LOCALE cookie
 * are ignored for automatic redirects — users must explicitly visit /en/...,
 * /ru/..., etc. to see another language.
 */
export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (ET_ONLY_PATHS.has(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = `/et${pathname}`
    return NextResponse.rewrite(url)
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Exclude: api, haldus, Back, _next/static, _next/image, favicon, sitemap, robots, manifest, llms.txt, and static files
    '/((?!api|haldus|Back|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|llms\\.txt|(?:site\\.)?webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)',
  ],
}
