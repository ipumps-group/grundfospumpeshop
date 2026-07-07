import type { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { routing } from '@/i18n/routing'
import { SITE_URL, localizedUrl } from '@/lib/config'

const LOCALES = [...routing.locales] as string[]

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

function langEntry(path: string): Record<string, string> {
  return Object.fromEntries(
    LOCALES.map(l => [l, localizedUrl(path, l)])
  )
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
        url: localizedUrl('/', locale),
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
        alternates: { languages: langEntry('/') },
      })
    }

    // 2. Products page - PRIORITY 0.9
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl('/tooted', locale),
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
        alternates: { languages: langEntry('/tooted') },
      })
    }

    // 3. Activity area (category) pages - PRIORITY 0.9
    try {
      const { data: activityAreas } = await supabaseAdmin
        .from('activity_areas')
        .select('slug, updated_at')
        .eq('is_active', true)

      if (activityAreas) {
        for (const area of activityAreas) {
          for (const locale of LOCALES) {
            const path = `/tooted/${area.slug}`
            entries.push({
              url: localizedUrl(path, locale),
              lastModified: area.updated_at ? new Date(area.updated_at) : new Date(),
              changeFrequency: 'weekly',
              priority: 0.9,
              alternates: { languages: langEntry(path) },
            })
          }
        }
      }

      // 3b. Series pages - PRIORITY 0.85
      const { data: seriesData } = await supabaseAdmin
        .from('product_series')
        .select('slug, primary_activity_area_id, activity_areas!inner(slug), updated_at')
        .eq('is_active', true)

      if (seriesData) {
        for (const series of seriesData) {
          const areaSlug = (series as any).activity_areas?.slug
          if (!areaSlug) continue
          const path = `/tooted/${areaSlug}/${series.slug}`
          for (const locale of LOCALES) {
            entries.push({
              url: localizedUrl(path, locale),
              lastModified: series.updated_at ? new Date(series.updated_at) : new Date(),
              changeFrequency: 'weekly',
              priority: 0.85,
              alternates: { languages: langEntry(path) },
            })
          }
        }
      }
    } catch {
      console.error('Failed to fetch activity areas for sitemap')
    }

    // 4. Individual products - PRIORITY 0.8
    if (products && products.length > 0) {
      for (const product of products) {
        for (const locale of LOCALES) {
          const path = `/toode/${product.slug}`
          entries.push({
            url: localizedUrl(path, locale),
            lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
            alternates: { languages: langEntry(path) },
          })
        }
      }
    }

    // 5. Static pages - PRIORITY 0.5
    for (const pageSlug of STATIC_PAGES) {
      for (const locale of LOCALES) {
        const path = `/leht/${pageSlug}`
        entries.push({
          url: localizedUrl(path, locale),
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
          alternates: { languages: langEntry(path) },
        })
      }
    }

    // 6. Dynamic pages from database - PRIORITY 0.5
    if (pages && pages.length > 0) {
      for (const page of pages) {
        for (const locale of LOCALES) {
          const path = `/leht/${page.slug}`
          entries.push({
            url: localizedUrl(path, locale),
            lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
            alternates: { languages: langEntry(path) },
          })
        }
      }
    }
  } catch (error) {
    console.error('[sitemap.ts] Error generating sitemap:', error)
    for (const locale of LOCALES) {
      entries.push({
        url: localizedUrl('/', locale),
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      })
    }
    for (const pageSlug of STATIC_PAGES) {
      for (const locale of LOCALES) {
        entries.push({
          url: localizedUrl(`/leht/${pageSlug}`, locale),
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.5,
        })
      }
    }
  }

  return entries as MetadataRoute.Sitemap
}
