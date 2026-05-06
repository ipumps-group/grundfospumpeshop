import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { routing, type Locale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/config'

const LOCALES = [...routing.locales] as Locale[]

// 8 static tegevusala categories (activity areas)
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

// Static pages that should always be in sitemap
const STATIC_PAGES = ['kontakt', 'privaatsuspoliitika', 'ostutingimused', 'tagastamine']

interface ProductRow {
  slug: string
  updated_at: string | null
}

interface PageRow {
  slug: string
  updated_at: string | null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  try {
    // Fetch all published products
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('slug, updated_at')
      .eq('published', true)
      .returns<ProductRow[]>()

    // Fetch all published pages
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from('pages')
      .select('slug, updated_at')
      .eq('published', true)
      .returns<PageRow[]>()

    if (productsError) console.error('Error fetching products:', productsError)
    if (pagesError) console.error('Error fetching pages:', pagesError)

    // 1. Homepage for each locale — PRIORITY 1.0
    LOCALES.forEach((locale) => {
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
    })

    // 2. Products page (/tooted) for each locale — PRIORITY 0.9
    LOCALES.forEach((locale) => {
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
    })

    // 3. Category pages (/tooted/{tegevusala}) for each locale — PRIORITY 0.9
    TEGEVUSALA_VALUES.forEach((tegevusala) => {
      LOCALES.forEach((locale) => {
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
      })
    })

    // 4. Individual products — PRIORITY 0.8
    if (!productsError && products && products.length > 0) {
      products.forEach((product) => {
        LOCALES.forEach((locale) => {
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
        })
      })
    }

    // 5. Static pages — PRIORITY 0.5
    STATIC_PAGES.forEach((pageSlug) => {
      LOCALES.forEach((locale) => {
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
      })
    }

    // 6. Dynamic pages from database — PRIORITY 0.5
    if (!pagesError && pages && pages.length > 0) {
      pages.forEach((page) => {
        LOCALES.forEach((locale) => {
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
        })
      })
    }
  } catch (error) {
    console.error('[sitemap.ts] Error generating sitemap:', error)
    // Fallback: return at least homepage and static pages if DB fails
    LOCALES.forEach((locale) => {
      entries.push({
        url: `${SITE_URL}/${locale}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      })
    })

    STATIC_PAGES.forEach((pageSlug) => {
      LOCALES.forEach((locale) => {
        entries.push({
          url: `${SITE_URL}/${locale}/leht/${pageSlug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
        })
      })
    })
  }

  return entries
}
