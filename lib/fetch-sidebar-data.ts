import { supabaseAdmin } from '@/lib/supabase-admin'

interface Category {
  slug: string
  name_et: string
  parent_slug: string | null
  children?: Category[]
}

export async function fetchSidebarData(): Promise<{ categories: Category[]; series: Category[] }> {
  try {
    const [areasRes, seriesRes] = await Promise.all([
      supabaseAdmin
        .from('activity_areas')
        .select('slug, name_et, sort_order')
        .eq('is_active', true)
        .order('sort_order'),
      supabaseAdmin
        .from('product_series')
        .select('slug, name, sort_order')
        .eq('is_active', true)
        .order('sort_order'),
    ])
    return {
      categories: (areasRes.data || []).map(a => ({
        slug: a.slug, name_et: a.name_et, parent_slug: null as string | null,
      })),
      series: (seriesRes.data || []).map(s => ({
        slug: s.slug, name_et: s.name.replace(/Grundfos\s*/g, ''), parent_slug: null as string | null,
      })),
    }
  } catch {
    return { categories: [], series: [] }
  }
}
