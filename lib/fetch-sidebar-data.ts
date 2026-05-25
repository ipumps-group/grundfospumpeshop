import { supabaseAdmin } from '@/lib/supabase-admin'

interface Category {
  slug: string
  name_et: string
  parent_slug: string | null
  children?: Category[]
}

export async function fetchSidebarData(): Promise<{ categories: Category[]; series: Category[] }> {
  try {
    const { data: areas } = await supabaseAdmin
      .from('activity_areas')
      .select('slug, name_et, sort_order')
      .eq('is_active', true)
      .order('sort_order')

    const { data: allSeries } = await supabaseAdmin
      .from('product_series')
      .select('slug, name, sort_order, activity_areas!primary_activity_area_id(slug)')
      .eq('is_active', true)
      .order('sort_order')

    return {
      categories: (areas || []).map(a => ({
        slug: a.slug, name_et: a.name_et, parent_slug: null as string | null,
      })),
      series: (allSeries || []).map(s => ({
        slug: s.slug, name_et: (s as any).name.replace(/Grundfos\s*/g, ''), parent_slug: (s as any).activity_areas?.slug || null,
      })),
    }
  } catch {
    return { categories: [], series: [] }
  }
}
