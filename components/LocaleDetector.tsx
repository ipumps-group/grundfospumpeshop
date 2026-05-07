'use client'

import { useEffect } from 'react'

const SUPPORTED = ['et', 'en', 'ru', 'lv', 'lt']

function getLocaleCookie(): string | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Client-side language detection fallback.
 *
 * Only fires on first visit (no NEXT_LOCALE cookie yet) when the URL has no
 * locale prefix, meaning the middleware served the default locale (et) without
 * a confirmed user preference. If the browser/OS language is a supported
 * non-default locale, we redirect once and set the cookie so middleware handles
 * it on every subsequent request.
 *
 * We deliberately skip detection when a NEXT_LOCALE cookie already exists so
 * we never override an explicit user choice (e.g. someone who picked Estonian
 * but has an English OS).
 */
export default function LocaleDetector() {
  useEffect(() => {
    try {
      // If the user has already made an explicit locale choice, respect it
      if (getLocaleCookie()) return

      const path = window.location.pathname

      // Don't interfere if the middleware already routed to a specific locale
      const hasPrefix = SUPPORTED.some(
        (l) => path.startsWith(`/${l}/`) || path === `/${l}`,
      )
      if (hasPrefix) return

      const lang = (navigator.language || '').toLowerCase()
      const detected = SUPPORTED.find((l) => lang.startsWith(l))
      if (!detected || detected === 'et') return

      // Set the cookie so the middleware picks it up on every subsequent request
      document.cookie = `NEXT_LOCALE=${detected};path=/;max-age=31536000;samesite=lax`
      window.location.href = `/${detected}${path}${window.location.search}${window.location.hash}`
    } catch {
      // Silently ignore — detection is a best-effort enhancement
    }
  }, [])

  return null
}
