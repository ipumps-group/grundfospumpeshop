/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdAccounts, getAggregatedInsights, getPeriodComparison, createGeneratedReport } from '@/lib/ads/admin-queries'
import { generateReportSummary } from '@/lib/ads/openai'
import { formatCurrency, formatNumber } from '@/lib/ads/utils'
import { requireAdmin } from '@/lib/api-auth'
import { rateLimit, AI_RATE } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try { await requireAdmin() } catch (e) { return e as NextResponse }
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(ip, AI_RATE.maxRequests)
  if (rl.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await request.json()
    const { reportType, title, dateStart, dateEnd, compareStart, compareEnd, platforms } = body

    const { data: accounts } = await getAdAccounts()
    if (!accounts?.length) {
      return NextResponse.json({ error: 'No accounts' }, { status: 400 })
    }

    const companyId = accounts[0].company_id
    const sections: any[] = []

    // Overview section
    let totalSpend = 0
    let totalImpressions: number | bigint = 0
    let totalClicks: number | bigint = 0
    let totalConversions: number | bigint = 0
    let totalRevenue = 0
    let totalLeads: number | bigint = 0
    let totalPurchases: number | bigint = 0

    for (const platform of platforms || ['google_ads', 'meta_ads']) {
      const { data: agg } = await getAggregatedInsights(companyId, dateStart, dateEnd, platform)
      if (agg) {
        for (const row of agg as any[]) {
          totalSpend += Number(row.total_spend) || 0
          totalImpressions = Number(totalImpressions) + Number(row.total_impressions || 0)
          totalClicks = Number(totalClicks) + Number(row.total_clicks || 0)
          totalConversions = Number(totalConversions) + Number(row.total_conversions || 0)
          totalRevenue += Number(row.total_conversion_value) || 0
          totalLeads = Number(totalLeads) + Number(row.total_leads || 0)
          totalPurchases = Number(totalPurchases) + Number(row.total_purchases || 0)
        }
      }
    }

    // Comparison data
    let comparisonData: any[] = []
    if (compareStart && compareEnd) {
      const { data: comp } = await getPeriodComparison(
        companyId, dateStart, dateEnd, compareStart, compareEnd,
      )
      if (comp) comparisonData = comp as any[]
    }

    const metricsSummary: Record<string, number> = {
      spend: totalSpend,
      impressions: Number(totalImpressions),
      clicks: Number(totalClicks),
      conversions: Number(totalConversions),
      revenue: totalRevenue,
      leads: Number(totalLeads),
      purchases: Number(totalPurchases),
      ctr: Number(totalImpressions) > 0 ? (Number(totalClicks) / Number(totalImpressions)) * 100 : 0,
      cpc: Number(totalClicks) > 0 ? totalSpend / Number(totalClicks) : 0,
      cpa: Number(totalConversions) > 0 ? totalSpend / Number(totalConversions) : 0,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    }

    // Get campaigns for the report
    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('id, campaign_name, platform, status, daily_budget')
      .in('platform', platforms || ['google_ads', 'meta_ads'])
      .limit(100)

    // Get top/worst campaigns from aggregated data
    const { data: allAgg } = await getAggregatedInsights(companyId, dateStart, dateEnd)
    const aggRows = (allAgg || []) as any[]
    const sortedBySpend = [...aggRows].sort((a, b) => Number(b.total_spend) - Number(a.total_spend))
    const topCampaigns = sortedBySpend.slice(0, 5).map((r: any) => r.campaign_id || '')
    const worstCampaigns = [...aggRows].sort((a, b) => Number(a.total_spend) - Number(b.total_spend)).slice(0, 5).map((r: any) => r.campaign_id || '')

    // Campaign names
    const campaignMap = new Map((campaigns || []).map((c: any) => [c.id, c.campaign_name]))
    const topNames = topCampaigns.map((id: string) => campaignMap.get(id) || id)
    const worstNames = worstCampaigns.map((id: string) => campaignMap.get(id) || id)

    const changes: Record<string, number> = {}
    for (const c of comparisonData) {
      changes[c.metric as string] = c.change_pct
    }

    // AI summary
    let aiResult = { summary: '', actionPlan: '' }
    try {
      aiResult = await generateReportSummary({
        title,
        type: reportType,
        dateRange: `${dateStart} to ${dateEnd}`,
        metrics: metricsSummary,
        campaigns: campaigns || [],
        topCampaigns: topNames,
        worstCampaigns: worstNames,
        changes,
      })
    } catch {
      aiResult = {
        summary: `Report for ${title} from ${dateStart} to ${dateEnd}. Total spend: ${formatCurrency(totalSpend)}.`,
        actionPlan: 'Review the data and identify optimization opportunities.',
      }
    }

    // Build overview section
    sections.push({
      section_type: 'overview',
      title: 'Executive Overview',
      content: {
        totalSpend,
        totalImpressions: Number(totalImpressions),
        totalClicks: Number(totalClicks),
        totalConversions: Number(totalConversions),
        totalRevenue,
        totalLeads: Number(totalLeads),
        totalPurchases: Number(totalPurchases),
        ctr: metricsSummary.ctr,
        cpc: metricsSummary.cpc,
        cpa: metricsSummary.cpa,
        roas: metricsSummary.roas,
      },
      sort_order: 0,
    })

    // Key metrics section
    sections.push({
      section_type: 'key_metrics',
      title: 'Key Metrics',
      content: metricsSummary,
      sort_order: 1,
    })

    // Comparison section
    if (comparisonData.length > 0) {
      sections.push({
        section_type: 'comparison',
        title: 'Period Comparison',
        content: { metrics: comparisonData },
        sort_order: 2,
      })
    }

    // Campaign performance section
    if (aggRows.length > 0) {
      sections.push({
        section_type: 'campaign_performance',
        title: 'Campaign Performance',
        content: {
          campaigns: aggRows.map((r: any) => ({
            campaign_id: r.campaign_id,
            campaign_name: campaignMap.get(r.campaign_id) || r.campaign_id,
            platform: r.platform,
            spend: r.total_spend,
            impressions: r.total_impressions,
            clicks: r.total_clicks,
            conversions: r.total_conversions,
            revenue: r.total_conversion_value,
            roas: r.avg_roas,
          })),
          topCampaigns: topNames,
          worstCampaigns: worstNames,
        },
        sort_order: 3,
      })
    }

    // Save to database
    const { data: report } = await createGeneratedReport({
      company_id: companyId,
      title: title || `${reportType} Report`,
      report_type: reportType,
      date_start: dateStart,
      date_end: dateEnd,
      compare_start: compareStart || null,
      compare_end: compareEnd || null,
      platforms: platforms || null,
      summary: metricsSummary as any,
      sections: sections as any,
      ai_summary: aiResult.summary,
      ai_action_plan: aiResult.actionPlan,
    })

    return NextResponse.json({ success: true, report })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
