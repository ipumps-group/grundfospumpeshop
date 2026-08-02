import type { Metadata } from 'next'
import { SITE_URL, localizedUrl, languageAlternates } from '@/lib/config'

const METADATA_BY_LOCALE: Record<string, { title: string; description: string }> = {
  et: { title: 'Kõik tooted – Pump OÜ', description: 'Vaata Grundfos pumpade valikut. Hinnad koos käibemaksuga ja kiire tarnimine.' },
  en: { title: 'All products – Pump OÜ', description: 'Browse Grundfos pumps with VAT-inclusive prices and fast delivery.' },
  ru: { title: 'Все товары – Pump OÜ', description: 'Каталог насосов Grundfos: цены с НДС и быстрая доставка.' },
  lv: { title: 'Visi produkti – Pump OÜ', description: 'Grundfos sūkņu katalogs ar PVN cenām un ātru piegādi.' },
  lt: { title: 'Visi produktai – Pump OÜ', description: 'Grundfos siurblių katalogas su PVM kainomis ir greitu pristatymu.' },
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const meta = METADATA_BY_LOCALE[locale] || METADATA_BY_LOCALE.et
  const canonical = localizedUrl('/tooted', locale)

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical,
      languages: languageAlternates('/tooted'),
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonical,
      siteName: 'Pump OÜ',
      locale,
      type: 'website',
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [`${SITE_URL}/og-default.jpg`],
    },
    robots: { index: true, follow: true },
  }
}

export default function TootedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
