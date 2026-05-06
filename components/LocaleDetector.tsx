'use client'

import { useEffect } from 'react'

const SUPPORTED = ['et', 'en', 'ru', 'lv', 'lt']

/**
 * Client-side language detection fallback.
 *
 * Runs on page load to check if the user's actual browser/system language
 * (navigator.language) differs from the currently served locale. This is
 * a safety net for cases where the Accept-Language header (used by the
 * middleware) doesn't match the real OS/browser language.
 *
 * Only intervenes when:
 * - The current URL has no locale prefix (i.e. we're on the default locale,
 *   meaning the middleware couldn't determine a specific language)
 * - navigator.language matches one of the supported locales
 * - The detected locale differs from the current one
 */
export default function LocaleDetector() {
  useEffect(() => {
    try {
      const path = window.location.pathname

      // Don't interfere if the middleware already routed to a specific locale
      const hasPrefix = SUPPORTED.some(
        (l) => path.startsWith(`/${l}/`) || path === `/${l}`,
      )
      if (hasPrefix) return

      const lang = (navigator.language || '').toLowerCase()
      const detected = SUPPORTED.find((l) => lang.startsWith(l))
      if (!detected || detected === 'et') return

      // Set the cookie so the middleware picks it up on the next request
      document.cookie = `NEXT_LOCALE=${detected};path=/;max-age=31536000;samesite=lax`
      window.location.href = `/${detected}${path}${window.location.search}${window.location.hash}`
    } catch {
      // Silently ignore — detection is a best-effort enhancement
    }
  }, [])

  return null
}
