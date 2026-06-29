/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAdAccount } from '@/lib/ads/admin-queries'
import { fetchSearchTerms, fetchKeywords, fetchAuctionInsights } from '@/lib/ads/keywords'
import { analyzeSearchTerms } from '@/lib/ads/openai'
import { requireAdmin } from '@/lib/api-auth'
import { rateLimit, AI_RATE } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try { await requireAdmin() } catch (e) { return e as NextResponse }

  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')
  const dateStart = searchParams.get('dateStart') || ''
  const dateEnd = searchParams.get('dateEnd') || ''
  const type = searchParams.get('type') || 'search_terms'

  try {
    if (!accountId) {
      return NextResponse.json({ error: 'accountId required' }, { status: 400 })
    }

    const { data: account } = await getAdAccount(accountId)
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const customerId = account.platform_account_id

    if (type === 'search_terms') {
      const { terms } = await fetchSearchTerms(accountId, customerId, dateStart, dateEnd)
      return NextResponse.json({ terms })
    }

    if (type === 'keywords') {
      const keywords = await fetchKeywords(accountId, customerId, dateStart, dateEnd)
      return NextResponse.json({ keywords })
    }

    if (type === 'auction_insights') {
      const insights = await fetchAuctionInsights(customerId, dateStart, dateEnd)
      return NextResponse.json({ insights })
    }

    return NextResponse.json({ error: 'Invalid type. Use: search_terms, keywords, auction_insights' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try { await requireAdmin() } catch (e) { return e as NextResponse }
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(ip, AI_RATE.maxRequests)
  if (rl.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await request.json()
    const { accountId, dateStart, dateEnd, campaignName } = body

    if (!accountId || !dateStart || !dateEnd) {
      return NextResponse.json({ error: 'accountId, dateStart, dateEnd required' }, { status: 400 })
    }

    const { data: account } = await getAdAccount(accountId)
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const customerId = account.platform_account_id

    const { terms } = await fetchSearchTerms(accountId, customerId, dateStart, dateEnd)

    const analysis = await analyzeSearchTerms({
      searchTerms: terms.map(t => ({
        query: t.query,
        impressions: t.impressions,
        clicks: t.clicks,
        cost: t.cost,
        conversions: t.conversions,
        conversionValue: t.conversionValue,
        ctr: t.ctr,
        cpc: t.averageCpc,
        matchType: t.matchType,
      })),
      campaignName: campaignName || 'All Campaigns',
    })

    return NextResponse.json({
      totalTerms: terms.length,
      totalSpend: terms.reduce((s, t) => s + t.cost, 0),
      analysis,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
