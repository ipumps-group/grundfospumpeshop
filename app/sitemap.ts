import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/config'

const LOCALES = [...routing.locales] as string[]

const TEGEVUSALA_VALUES = [
  'kute',
  'jahutus',
  'sooja-tarbevee-tsirkulatsioonipump',
  'puurkaevud',
  'drenaaz',
  'salvkaevud',
  'rohutoste',
  'reovesi',
]

const STATIC_PAGES = ['kontakt', 'privaatsuspoliitika', 'ostutingimused', 'tagastamine']

type SitemapEntry = {
  url: string
  lastModified: Date
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'always' | 'hourly' | 'never'
  priority: number
  alternates?: {
    languages: Record<string, string>
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: SitemapEntry[] = []

  try {
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('slug, updated_at')
      .eq('published', true)

    const { data: pages, error: pagesError } = await supabaseAdmin
      .from('pages')
      .select('slug, updated_at')
      .eq('published', true)

    if (productsError) {
      console.error('Error fetching products:', productsError)
    }
    if (pagesError) {
      console.error('Error fetching pages:', pagesError)
    }

    // 1. Homepage for each locale - PRIORITY 1.0
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
        alternates: {
          languages: {
            et: `${SITE_URL}/et`,
            en: `${SITE_URL}/en`,
            ru: `${SITE_URL}/ru`,
            lv: `${SITE_URL}/lv`,
            lt: `${SITE_URL}/lt`,
          },
        },
      })
    }

    // 2. Products page - PRIORITY 0.9
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}/tooted`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
        alternates: {
          languages: {
            et: `${SITE_URL}/et/tooted`,
            en: `${SITE_URL}/en/tooted`,
            ru: `${SITE_URL}/ru/tooted`,
            lv: `${SITE_URL}/lv/tooted`,
            lt: `${SITE_URL}/lt/tooted`,
          },
        },
      })
    }

    // 3. Category pages - PRIORITY 0.9
    for (const tegevusala of TEGEVUSALA_VALUES) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${SITE_URL}/${locale}/tooted/${tegevusala}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.9,
          alternates: {
            languages: {
              et: `${SITE_URL}/et/tooted/${tegevusala}`,
              en: `${SITE_URL}/en/tooted/${tegevusala}`,
              ru: `${SITE_URL}/ru/tooted/${tegevusala}`,
              lv: `${SITE_URL}/lv/tooted/${tegevusala}`,
              lt: `${SITE_URL}/lt/tooted/${tegevusala}`,
            },
          },
        })
      }
    }

    // 4. Individual products - PRIORITY 0.8
    if (products && products.length > 0) {
      for (const product of products) {
        for (const locale of LOCALES) {
          entries.push({
            url: `${SITE_URL}/${locale}/toode/${product.slug}`,
            lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
            alternates: {
              languages: {
                et: `${SITE_URL}/et/toode/${product.slug}`,
                en: `${SITE_URL}/en/toode/${product.slug}`,
                ru: `${SITE_URL}/ru/toode/${product.slug}`,
                lv: `${SITE_URL}/lv/toode/${product.slug}`,
                lt: `${SITE_URL}/lt/toode/${product.slug}`,
              },
            },
          })
        }
      }
    }

    // 5. Static pages - PRIORITY 0.5
    for (const pageSlug of STATIC_PAGES) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${SITE_URL}/${locale}/leht/${pageSlug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
          alternates: {
            languages: {
              et: `${SITE_URL}/et/leht/${pageSlug}`,
              en: `${SITE_URL}/en/leht/${pageSlug}`,
              ru: `${SITE_URL}/ru/leht/${pageSlug}`,
              lv: `${SITE_URL}/lv/leht/${pageSlug}`,
              lt: `${SITE_URL}/lt/leht/${pageSlug}`,
            },
          },
        })
      }
    }

    // 6. Dynamic pages from database - PRIORITY 0.5
    if (pages && pages.length > 0) {
      for (const page of pages) {
        for (const locale of LOCALES) {
          entries.push({
            url: `${SITE_URL}/${locale}/leht/${page.slug}`,
            lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
            alternates: {
              languages: {
                et: `${SITE_URL}/et/leht/${page.slug}`,
                en: `${SITE_URL}/en/leht/${page.slug}`,
                ru: `${SITE_URL}/ru/leht/${page.slug}`,
                lv: `${SITE_URL}/lv/leht/${page.slug}`,
                lt: `${SITE_URL}/lt/leht/${page.slug}`,
              },
            },
          })
        }
      }
    }
  } catch (error) {
    console.error('[sitemap.ts] Error generating sitemap:', error)
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      })
    }
    for (const pageSlug of STATIC_PAGES) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${SITE_URL}/${locale}/leht/${pageSlug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
        })
      }
    }
  }

  return entries as MetadataRoute.Sitemap
}
