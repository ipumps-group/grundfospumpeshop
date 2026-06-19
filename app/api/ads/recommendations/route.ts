/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdAccounts, getAggregatedInsights, getPeriodComparison, createRecommendation } from '@/lib/ads/admin-queries'
import { analyzePerformance } from '@/lib/ads/openai'
import { getDateRangePreset, getPreviousPeriod } from '@/lib/ads/utils'
import { requireAdmin } from '@/lib/api-auth'
import { rateLimit, AI_RATE } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try { await requireAdmin() } catch (e) { return e as NextResponse }
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(ip, AI_RATE.maxRequests)
  if (rl.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const { data: accounts } = await getAdAccounts()
    if (!accounts?.length) {
      return NextResponse.json({ error: 'No ad accounts configured' }, { status: 400 })
    }

    const companyId = accounts[0].company_id
    const { start, end } = getDateRangePreset('last_30_days')
    const prev = getPreviousPeriod(start, end)

    const results: any[] = []

    for (const platform of ['google_ads', 'meta_ads'] as const) {
      const { data: campaigns } = await supabaseAdmin
        .from('campaigns')
        .select('id, campaign_name, status, daily_budget, objective')
        .eq('platform', platform)
        .limit(50)

      const { data: aggregated } = await getAggregatedInsights(
        companyId, start, end, platform,
      )

      const { data: comparison } = await getPeriodComparison(
        companyId, start, end, prev.start, prev.end, platform,
      )

      if (!campaigns?.length || !aggregated?.length) continue

      const analysis = await analyzePerformance({
        platform,
        period: { start, end },
        campaigns,
        aggregated,
        comparison: comparison || [],
      })

      // Save each recommendation
      for (const rec of analysis.recommendations || []) {
        await createRecommendation({
          company_id: companyId,
          title: rec.title,
          description: rec.reason,
          severity: rec.severity || 'medium',
          platform,
          category: rec.category || 'general',
          reason: rec.reason,
          expected_impact: rec.expectedImpact,
          suggested_action: rec.suggestedAction,
          confidence_score: rec.confidenceScore || 70,
          status: 'open',
        })
      }

      results.push({
        platform,
        summary: analysis.summary,
        recommendationsCount: (analysis.recommendations || []).length,
        problemsCount: (analysis.problems || []).length,
        opportunitiesCount: (analysis.opportunities || []).length,
      })
    }

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data: accounts } = await getAdAccounts()
    if (!accounts?.length) {
      return NextResponse.json({ error: 'No accounts' }, { status: 400 })
    }

    const { data: recommendations } = await supabaseAdmin
      .from('recommendations')
      .select('*')
      .eq('company_id', accounts[0].company_id)
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json(recommendations || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
