import { createClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'
import BlockRenderer from '@/components/page-builder/BlockRenderer'
import ShortcodeRenderer from '@/components/ShortcodeRenderer'
import { getTranslations, getLocale } from 'next-intl/server'
import type { Section } from '@/components/page-builder/types'
import { supabaseAdmin } from '@/lib/supabase-admin'
import JsonLd from '@/components/seo/JsonLd'

export const dynamic = 'force-dynamic'
import { SITE_URL } from '@/lib/config'

const LOCALES = ['et', 'en', 'ru', 'lv', 'lt'] as const

// ─── FAQPAGE SCHEMA ─────────────────────────────────────────────────────────────────────

interface FAQItem {
  question: string
  answer: string
}

/**
 * Parse content for Q&A sections to build FAQPage schema.
 * Looks for content with "Q:" or "?" patterns, or h3 headings followed by content.
 */
function extractFAQItems(content: string | null, blocks: unknown[] | null): FAQItem[] {
  const faqs: FAQItem[] = []
  if (!content && (!blocks || blocks.length === 0)) return faqs

  // Check blocks for FAQ sections
  if (blocks && blocks.length > 0) {
    for (const block of blocks) {
      if (typeof block !== 'object' || block === null) continue
      const b = block as Record<string, unknown>
      // Check for FAQBlock type
      if (b.type === 'faq' && Array.isArray(b.items)) {
        for (const item of b.items) {
          if (typeof item === 'object' && item !== null) {
            const i = item as Record<string, string>
            if (i.question && i.answer) {
              faqs.push({ question: i.question, answer: i.answer })
            }
          }
        }
      }
    }
  }

  // If no FAQ blocks found, try to parse from HTML content
  if (faqs.length === 0 && content) {
    // Match H3 followed by paragraph (#### Question\nAnswer)
    const h3AnswerRegex = /<h3[^>]*>([^<]+)<\/h3>\s*<p>([^<]+)<\/p>/gi
    let match
    while ((match = h3AnswerRegex.exec(content)) !== null) {
      faqs.push({ question: match[1].trim(), answer: match[2].trim() })
    }
  }

  return faqs
}

function FAQPageSchema({ page, locale, slug }: { page: PageRow; locale: string; slug: string }) {
  const faqs = extractFAQItems(page.content, page.blocks)
  if (faqs.length === 0) return null

  const pageUrl = `${SITE_URL}/${locale}/leht/${slug}`

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return <JsonLd data={schema} />
}

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
  visibility: string | null
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

async function getPage(slug: string, preview = false): Promise<PageRow | null> {
  const client = preview ? supabaseAdmin : makeClient()
  const { data } = await client
    .from('pages')
    .select(`id, title, title_en, title_ru, title_lv, title_lt,
      short_description, short_description_en, short_description_ru, short_description_lv, short_description_lt,
      content, content_en, content_ru, content_lv, content_lt,
      image_url, og_image_url, meta_title, meta_description,
      published, status, visibility, show_title, template, blocks`)
    .eq('slug', slug)
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

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; locale: string }> }
): Promise<Metadata> {
  const locale = await getLocale()
  const { slug } = await params
  const page = await getPage(slug)
  if (!page || !isVisible(page)) return {}
  
  const title = page.meta_title || pick(page, 'title', locale) || page.title
  const description = page.meta_description || pick(page, 'short_description', locale) || undefined
  const ogImg = page.og_image_url || page.image_url

  const canonical = `${SITE_URL}/${locale}/leht/${slug}`

  return {
    title,
    description: description ?? undefined,
    alternates: {
      canonical: canonical,
      languages: Object.fromEntries(
        LOCALES.map(l => [l, `${SITE_URL}/${l}/leht/${slug}`])
      ),
    },
    openGraph: {
      title,
      description: description ?? undefined,
      url: canonical,
      siteName: 'Pump OÜ',
      locale: locale,
      type: 'website',
      images: ogImg ? [{ url: ogImg, width: 1200, height: 630 }] : [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description ?? undefined,
      images: ogImg ? [ogImg] : [`${SITE_URL}/og-default.jpg`],
    },
    robots: { index: true, follow: true },
  }
}

export default async function PublicPage(
  { params, searchParams }: { params: Promise<{ slug: string; locale: string }>; searchParams: Promise<{ preview?: string }> }
) {
  const { slug } = await params
  const { preview } = await searchParams
  const locale = await getLocale()
  const page = await getPage(slug, preview === '1')

  if (!page || (!isVisible(page) && preview !== '1')) notFound()

  // Private page — require logged-in session
  if (page.visibility === 'private') {
    const { data: { session } } = await makeClient().auth.getSession()
    if (!session) redirect('/konto/sisselogimine')
  }

  const tCommon = await getTranslations('common')
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

  if (hasBlocks) {
    return (
      <div className="min-h-screen">
        {/* FAQPage JSON-LD schema if FAQ content detected */}
        <FAQPageSchema page={page} locale={locale} slug={slug} />
        {titleVisible && (
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-10 pb-2">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
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
      {/* FAQPage JSON-LD schema if FAQ content detected */}
      <FAQPageSchema page={page} locale={locale} slug={slug} />
      
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
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{title}</h2>
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
              <h2 className="text-xl font-bold text-gray-900 mb-1">{tCommon('contactFormTitle')}</h2>
              <p className="text-[14px] text-gray-500 mb-6">{tCommon('contactFormSubtitle')}</p>
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
