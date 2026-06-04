/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getDailyInsights, getAggregatedInsights, getPeriodComparison } from '@/lib/ads/admin-queries'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'daily'
  const companyId = searchParams.get('companyId')

  try {
    if (type === 'aggregated' && companyId) {
      const dateStart = searchParams.get('dateStart') || ''
      const dateEnd = searchParams.get('dateEnd') || ''
      const platform = searchParams.get('platform') || undefined
      const accountId = searchParams.get('accountId') || undefined
      const campaignId = searchParams.get('campaignId') || undefined

      const { data, error } = await getAggregatedInsights(
        companyId, dateStart, dateEnd, platform, accountId, campaignId,
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    if (type === 'comparison' && companyId) {
      const dateStart = searchParams.get('dateStart') || ''
      const dateEnd = searchParams.get('dateEnd') || ''
      const prevStart = searchParams.get('prevStart') || ''
      const prevEnd = searchParams.get('prevEnd') || ''
      const platform = searchParams.get('platform') || undefined

      const { data, error } = await getPeriodComparison(
        companyId, dateStart, dateEnd, prevStart, prevEnd, platform,
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    const campaignId = searchParams.get('campaignId') || undefined
    const accountId = searchParams.get('accountId') || undefined
    const dateStart = searchParams.get('dateStart') || undefined
    const dateEnd = searchParams.get('dateEnd') || undefined

    const { data, error } = await getDailyInsights({
      accountId, campaignId, dateStart, dateEnd,
      limit: 1000,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
