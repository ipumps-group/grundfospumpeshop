'use client'

import Script from 'next/script'

let _jsonLdCounter = 0

interface JsonLdProps {
  data: Record<string, unknown>
  id?: string
}

/**
 * Renders JSON-LD structured data for rich results.
 * Uses next/script with afterInteractive strategy for optimal loading.
 */
export default function JsonLd({ data, id }: JsonLdProps) {
  const uniqueId = id || `json-ld-${++_jsonLdCounter}`
  return (
    <Script
      id={uniqueId}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}