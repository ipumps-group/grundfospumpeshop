'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'

/** Sets <html lang="..."> on the client to match the current locale. */
export default function SetHtmlLang() {
  const locale = useLocale()
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  return null
}
