'use client'

import Script from 'next/script'

interface JsonLdProps {
  data: Record<string, unknown>
}

/**
 * Renders JSON-LD structured data for rich results.
 * Uses next/script with afterInteractive strategy for optimal loading.
 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}