import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SITE_URL } from '@/lib/config'
import ProductsGrid from '../ProductsGrid'
const LOCALES = [...routing.locales] as readonly ['et', 'en', 'ru', 'lv', 'lt']

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; tegevusala: string }> }
): Promise<Metadata> {
  const locale = await getLocale()
  const { tegevusala } = await params

  try {
    const { data: area } = await supabaseAdmin
      .from('activity_areas')
      .select('name_et, meta_title, meta_description, slug')
      .eq('slug', tegevusala)
      .single()

    if (!area) {
      return { title: 'Tooted' }
    }

    const title = area.meta_title || `${area.name_et} | iPumps`
    const description = area.meta_description || `${area.name_et} — vaata kõiki tooteid selles kategoorias.`
    const canonical = `${SITE_URL}/${locale}/tooted/${tegevusala}`

    return {
      title,
      description,
      alternates: {
        canonical,
        languages: Object.fromEntries(
          LOCALES.map(l => [l, `${SITE_URL}/${l}/tooted/${tegevusala}`])
        ),
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'iPumps',
        locale,
        type: 'website',
        images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630 }],
      },
      robots: { index: true, follow: true },
    }
  } catch (e) {
    console.error('[generateMetadata] category page error:', e)
    return { title: 'Tooted' }
  }
}

export async function generateStaticParams() {
  try {
    const { data: areas } = await supabaseAdmin
      .from('activity_areas')
      .select('slug')
      .eq('is_active', true)

    if (!areas) return []
    return areas.map(a => ({ tegevusala: a.slug }))
  } catch (e) {
    console.error('[generateStaticParams] category error:', e)
    return []
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; tegevusala: string }>
}) {
  const { tegevusala } = await params

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#003366] mb-2">Test: {tegevusala}</h1>
        <p>Minimal page - 500 test</p>
      </div>
    </div>
  )
}
