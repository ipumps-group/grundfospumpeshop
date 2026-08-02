/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type { GscSearchAnalyticsRow, GscQueryData, GscPageData } from './types'

function client() {
  return supabase
}

export async function upsertSearchAnalytics(rows: Array<{
  date: string
  dimension_type: 'query' | 'page'
  dimension_value: string
  clicks: number
  impressions: number
  ctr: number
  avg_position: number
}>): Promise<number> {
  let saved = 0

  for (const row of rows) {
    const { error } = await client()
      .from('gsc_search_analytics')
      .upsert({
        date: row.date,
        dimension_type: row.dimension_type,
        dimension_value: row.dimension_value,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        avg_position: row.avg_position,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'date, dimension_type, dimension_value',
      })

    if (!error) saved++
  }

  return saved
}

export async function getSearchAnalytics(filters: {
  dateStart?: string
  dateEnd?: string
  dimensionType?: 'query' | 'page'
  limit?: number
}): Promise<GscSearchAnalyticsRow[]> {
  let q = client().from('gsc_search_analytics').select('*')

  if (filters.dateStart) q = q.gte('date', filters.dateStart)
  if (filters.dateEnd) q = q.lte('date', filters.dateEnd)
  if (filters.dimensionType) q = q.eq('dimension_type', filters.dimensionType)
  if (filters.limit) q = q.limit(filters.limit)

  const { data } = await q.order('impressions', { ascending: false })
  return (data || []) as GscSearchAnalyticsRow[]
}

export async function getTopQueries(dateStart: string, dateEnd: string, limit = 50): Promise<GscQueryData[]> {
  const { data } = await client()
    .from('gsc_search_analytics')
    .select('*')
    .eq('dimension_type', 'query')
    .gte('date', dateStart)
    .lte('date', dateEnd)
    .order('impressions', { ascending: false })
    .limit(limit)

  return (data || []).map(row => ({
    query: row.dimension_value,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    avg_position: row.avg_position,
  }))
}

export async function getTopPages(dateStart: string, dateEnd: string, limit = 50): Promise<GscPageData[]> {
  const { data } = await client()
    .from('gsc_search_analytics')
    .select('*')
    .eq('dimension_type', 'page')
    .gte('date', dateStart)
    .lte('date', dateEnd)
    .order('clicks', { ascending: false })
    .limit(limit)

  return (data || []).map(row => ({
    page: row.dimension_value,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    avg_position: row.avg_position,
  }))
}

export async function createGscRecommendations(companyId: string, recommendations: Array<{
  title: string
  severity: 'low' | 'medium' | 'high'
  category: string
  reason: string
  expectedImpact: string
  suggestedAction: string
  confidenceScore: number
  dataEvidence: Record<string, unknown>
}>): Promise<number> {
  let created = 0

  for (const rec of recommendations) {
    const { error } = await client()
      .from('recommendations')
      .upsert({
        company_id: companyId,
        title: rec.title,
        description: rec.reason,
        severity: rec.severity,
        platform: 'gsc',
        category: `seo_${rec.category}`,
        reason: rec.reason,
        data_evidence: rec.dataEvidence,
        expected_impact: rec.expectedImpact,
        suggested_action: rec.suggestedAction,
        confidence_score: Math.min(100, Math.max(0, rec.confidenceScore)) / 100,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'company_id, title',
        ignoreDuplicates: false,
      })

    if (!error) created++
  }

  return created
}

export async function getGscRecommendations(companyId: string): Promise<any[]> {
  const { data } = await client()
    .from('recommendations')
    .select('*')
    .eq('company_id', companyId)
    .eq('platform', 'gsc')
    .order('created_at', { ascending: false })

  return data || []
}
