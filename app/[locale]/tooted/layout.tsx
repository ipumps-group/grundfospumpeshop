import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/config'

const LOCALES = [...routing.locales] as readonly ['et', 'en', 'ru', 'lv', 'lt']

const METADATA_BY_LOCALE: Record<string, { title: string; description: string }> = {
  et: { title: 'Kõik tooted – iPumps', description: 'Vaata kõiki Grundfos pumbad. 321 mudelit, hinnad koos käibemaksuga, kiire tarnimine.' },
  en: { title: 'All products – iPumps', description: 'View all Grundfos pumps. 321 models, prices incl. VAT, fast delivery.' },
  ru: { title: 'Все товары – iPumps', description: 'Смотрите все насосы Grundfos. 321 модель, цены с НДС, быстрая доставка.' },
  lv: { title: 'Visi produkti – iPumps', description: 'Skatiet visus Grundfos sūkņus. 321 modelis, cenas ar PVN.' },
  lt: { title: 'Visi produktai – iPumps', description: 'Peržiūrėkite visus Grundfos siurblius. 321 modelis, kainos su PVM.' },
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const meta = METADATA_BY_LOCALE[locale] || METADATA_BY_LOCALE.et
  const canonical = `${SITE_URL}/${locale}/tooted`

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map(l => [l, `${SITE_URL}/${l}/tooted`])
      ),
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonical,
      siteName: 'iPumps',
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
