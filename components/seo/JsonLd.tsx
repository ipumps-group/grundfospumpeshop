interface JsonLdProps {
  data: Record<string, unknown>
  id?: string
}

/**
 * Renders JSON-LD structured data in the server response for crawlers.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export default function JsonLd({ data, id }: JsonLdProps) {
  const json = serializeJsonLd(data)
  return (
    <script
      {...(id ? { id } : {})}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
