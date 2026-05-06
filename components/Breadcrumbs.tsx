import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  locale?: string
  siteUrl?: string
}

export default function Breadcrumbs({ items, locale = 'et', siteUrl = 'https://grundfospump.ee' }: BreadcrumbsProps) {
  // JSON-LD for structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href.startsWith('http') ? item.href : `${siteUrl}${item.href}`,
    })),
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Visible Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 py-3">
        <ol className="flex items-center gap-1 text-sm text-gray-500 flex-wrap">
          <li>
            <Link 
              href={`/${locale}`} 
              className="hover:text-[#003366] transition-colors"
            >
              Avaleht
            </Link>
          </li>
          
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center gap-1">
              <span className="text-gray-300">/</span>
              {index === items.length - 1 ? (
                <span className="text-[#003366] font-medium">{item.label}</span>
              ) : (
                <Link 
                  href={item.href}
                  className="hover:text-[#003366] transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}