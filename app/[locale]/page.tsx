import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import BlockRenderer from '@/components/page-builder/BlockRenderer'
import ShortcodeRenderer from '@/components/ShortcodeRenderer'
import ContactForm from '@/components/ContactForm'
import { getLocale } from 'next-intl/server'
import type { Section } from '@/components/page-builder/types'
import { SITE_URL } from '@/lib/config'

export const revalidate = 3600

function optimizeUrl(url: string | null, maxWidth = 1920): string | null {
  if (!url) return null
  if (url.includes('supabase.co/storage/v1/object/public')) {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}width=${maxWidth}&quality=80`
  }
  return url
}

// The CMS page slug that serves as the homepage
const HOME_SLUG = 'esilehtx'

const LOCALES = ['et', 'en', 'ru', 'lv', 'lt'] as const

interface Column { title: string; text: string }

interface PageRow {
  id: string
  title: string
  title_en: string | null
  title_ru: string | null
  title_lv: string | null
  title_lt: string | null
  short_description: string | null
  short_description_en: string | null
  short_description_ru: string | null
  short_description_lv: string | null
  short_description_lt: string | null
  content: string | null
  content_en: string | null
  content_ru: string | null
  content_lv: string | null
  content_lt: string | null
  image_url: string | null
  og_image_url: string | null
  meta_title: string | null
  meta_description: string | null
  published: boolean
  status: string | null
  show_title: boolean | null
  template: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blocks: any[] | null
}

function makeClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function getHomePage(): Promise<PageRow | null> {
  const { data } = await makeClient()
    .from('pages')
    .select(`id, title, title_en, title_ru, title_lv, title_lt,
      short_description, short_description_en, short_description_ru, short_description_lv, short_description_lt,
      content, content_en, content_ru, content_lv, content_lt,
      image_url, og_image_url, meta_title, meta_description,
      published, status, show_title, template, blocks`)
    .eq('slug', HOME_SLUG)
    .single()
  return data
}

function isVisible(page: PageRow): boolean {
  return page.status === 'published' || page.published === true
}

function pick(page: PageRow, field: 'title' | 'short_description' | 'content', locale: string): string | null {
  if (locale !== 'et') {
    const key = `${field}_${locale}` as keyof PageRow
    const val = page[key] as string | null
    if (val) return val
  }
  return page[field] as string | null
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const page = await getHomePage()

  const title = (page?.meta_title || (page ? pick(page, 'title', locale) : null) || 'Pump OÜ') ?? 'Pump OÜ'
  const description = (page?.meta_description || (page ? pick(page, 'short_description', locale) : null)) ?? undefined
  const ogImg = page?.og_image_url || page?.image_url

  return {
    title,
    description,
    alternates: {
      canonical: locale === 'et' ? SITE_URL : `${SITE_URL}/${locale}`,
      languages: Object.fromEntries(
        LOCALES.map(l => [l, l === 'et' ? SITE_URL : `${SITE_URL}/${l}`])
      ),
    },
    openGraph: {
      title,
      description,
      url: locale === 'et' ? SITE_URL : `${SITE_URL}/${locale}`,
      siteName: 'Pump OÜ',
      locale,
      type: 'website',
      images: ogImg
        ? [{ url: ogImg, width: 1200, height: 630 }]
        : [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImg ? [ogImg] : [`${SITE_URL}/og-default.jpg`],
    },
    robots: { index: true, follow: true },
  }
}

export default async function HomePage() {
  const locale = await getLocale()
  const page = await getHomePage()

  if (!page || !isVisible(page)) notFound()

  const title     = pick(page, 'title', locale) ?? page.title
  const shortDesc = pick(page, 'short_description', locale)
  const content   = pick(page, 'content', locale)

  const hasBlocks = Array.isArray(page.blocks) && page.blocks.length > 0
  const isContact = page.template === 'contact'

  let columns: Column[] = []
  if (!hasBlocks && isContact && content) {
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) columns = parsed
    } catch {}
  }

  const titleVisible = page.show_title !== false

  // Collect background image URLs for preload hints
  const bgImages: string[] = []
  if (hasBlocks) {
    for (const s of (page.blocks as Section[])) {
      if (s.settings?.background_image_url) {
        bgImages.push(s.settings.background_image_url)
      }
    }
  }

  if (hasBlocks) {
    return (
      <div className="min-h-screen">
        {bgImages.length > 0 && bgImages.map(url => (
          <link key={url} rel="preload" as="image" href={url} fetchPriority="high" />
        ))}
        {titleVisible && (
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-10 pb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
            {shortDesc && (
              <p className="text-[17px] text-gray-600 mt-3 leading-relaxed">{shortDesc}</p>
            )}
          </div>
        )}
        <BlockRenderer sections={page.blocks as Section[]} locale={locale} />
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {page.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.image_url}
            alt={title}
            className="w-full h-64 object-cover rounded-2xl mb-8 shadow-sm"
          />
        )}

        {titleVisible && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{title}</h2>
            {shortDesc && (
              <p className="text-[17px] text-gray-600 mb-10 leading-relaxed">{shortDesc}</p>
            )}
          </>
        )}

        {isContact ? (
          <>
            {columns.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                {columns.map((col, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    {col.title && (
                      <h3 className="font-semibold text-[#003366] text-[15px] mb-2">{col.title}</h3>
                    )}
                    {col.text && (
                      <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">{col.text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <ContactForm pageId={page.id} />
            </div>
          </>
        ) : (
          content && (
            <ShortcodeRenderer
              html={content}
              pageId={page.id}
              className="text-[15px] text-gray-700 leading-relaxed
                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-8 [&_h1]:mb-3
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-2
                [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
                [&_p]:leading-relaxed [&_p]:mb-3
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ul]:mb-3
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 [&_ol]:mb-3
                [&_a]:text-[#003366] [&_a]:underline [&_a:hover]:text-[#01a0dc]
                [&_strong]:font-semibold [&_strong]:text-gray-900
                [&_hr]:border-gray-200 [&_hr]:my-6"
            />
          )
        )}
      </div>
    </div>
  )
}
