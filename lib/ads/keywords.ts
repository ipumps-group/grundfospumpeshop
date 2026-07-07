/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAccessToken } from './google-ads'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { logApiError } from './admin-queries'

const GOOGLE_ADS_API_VERSION = 'v24'

function getConfig() {
  return {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    clientId: process.env.GOOGLE_ADS_CLIENT_ID,
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
    loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  }
}

async function queryGoogleAds(query: string, customerId: string): Promise<any[]> {
  const config = getConfig()
  const accessToken = await getAccessToken()
  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:search`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken!,
    'Content-Type': 'application/json',
  }
  if (config.loginCustomerId) {
    headers['login-customer-id'] = config.loginCustomerId
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    await logApiError({
      platform: 'google_ads',
      endpoint: url,
      request_body: { query },
      response_body: { status: res.status, body: errBody },
      status_code: res.status,
      error_message: errBody,
    })
    throw new Error(`Google Ads API error (${res.status}): ${errBody}`)
  }

  const data = await res.json()
  const allResults = data.results || []
  let nextPageToken = data.nextPageToken
  while (nextPageToken) {
    const nextRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, pageToken: nextPageToken }),
    })
    if (!nextRes.ok) break
    const nextData = await nextRes.json()
    if (nextData.results) allResults.push(...nextData.results)
    nextPageToken = nextData.nextPageToken || null
  }

  return allResults
}

export interface SearchTermData {
  campaignId: string
  campaignName: string
  adGroupId: string
  adGroupName: string
  query: string
  matchType: string
  impressions: number
  clicks: number
  ctr: number
  averageCpc: number
  cost: number
  conversions: number
  conversionValue: number
  costPerConversion: number
  roas: number
}

export async function fetchSearchTerms(
  accountId: string,
  customerId: string,
  dateStart: string,
  dateEnd: string,
): Promise<{ terms: SearchTermData[]; savedCount: number }> {
  const gaql = `
    SELECT
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      search_term_view.search_term,
      search_term_view.ad_group_criterion_keyword.match_type,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_per_conversion
    FROM search_term_view
    WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
      AND campaign.status != 'REMOVED'
      AND metrics.impressions > 0
    ORDER BY metrics.cost_micros DESC
  `

  const results = await queryGoogleAds(gaql, customerId)
  const terms: SearchTermData[] = []

  for (const row of results) {
    const c = row.campaign
    const ag = row.adGroup
    const st = row.searchTermView
    const m = row.metrics
    if (!st?.searchTerm) continue

    const costMicros = Number(m?.costMicros || 0)
    const spend = costMicros / 1_000_000
    const clicks = Number(m?.clicks || 0)
    const conversions = Number(m?.conversions || 0)
    const conversionValue = Number(m?.conversionsValue || 0)

    terms.push({
      campaignId: c?.id?.toString() || '',
      campaignName: c?.name || 'Unknown',
      adGroupId: ag?.id?.toString() || '',
      adGroupName: ag?.name || 'Unknown',
      query: st.searchTerm,
      matchType: st.adGroupCriterionKeyword?.matchType || 'UNKNOWN',
      impressions: Number(m?.impressions || 0),
      clicks,
      ctr: Number(m?.ctr || 0),
      averageCpc: Number(m?.averageCpc || 0) / 1_000_000,
      cost: spend,
      conversions,
      conversionValue,
      costPerConversion: Number(m?.costPerConversion || 0) / 1_000_000,
      roas: spend > 0 ? conversionValue / spend : 0,
    })
  }

  // Save to search_terms table
  let savedCount = 0
  if (terms.length > 0) {
    const rows = terms.map(t => ({
      account_id: accountId,
      campaign_id: null, // Will be resolved by sync
      query_text: t.query,
      match_type: t.matchType,
      impressions: t.impressions,
      clicks: t.clicks,
      ctr: t.ctr,
      cpc: t.averageCpc,
      spend: t.cost,
      conversions: t.conversions,
      conversion_value: t.conversionValue,
      cost_per_conversion: t.costPerConversion,
      roas: t.roas,
      date_range_start: dateStart,
      date_range_end: dateEnd,
    }))

    const { error } = await supabaseAdmin.from('search_terms').upsert(rows, {
      onConflict: 'account_id, query_text, date_range_start, date_range_end',
      ignoreDuplicates: false,
    })
    if (!error) savedCount = rows.length
  }

  return { terms, savedCount }
}

export interface KeywordData {
  campaignId: string
  campaignName: string
  adGroupId: string
  adGroupName: string
  keywordId: string
  keywordText: string
  matchType: string
  status: string
  cpcBidMicros: number
  qualityScore: number | null
  impressions: number
  clicks: number
  ctr: number
  averageCpc: number
  cost: number
  conversions: number
  conversionValue: number
  impressionShare: number
}

export async function fetchKeywords(
  accountId: string,
  customerId: string,
  dateStart: string,
  dateEnd: string,
): Promise<KeywordData[]> {
  const gaql = `
    SELECT
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.cpc_bid_micros,
      ad_group_criterion.quality_info.quality_score,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.impression_share
    FROM keyword_view
    WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
      AND campaign.status != 'REMOVED'
      AND ad_group_criterion.status != 'REMOVED'
      AND metrics.impressions > 0
    ORDER BY metrics.cost_micros DESC
  `

  const results = await queryGoogleAds(gaql, customerId)
  const keywords: KeywordData[] = []

  for (const row of results) {
    const c = row.campaign
    const ag = row.adGroup
    const kw = row.adGroupCriterion
    const m = row.metrics
    if (!kw?.keyword?.text) continue

    const costMicros = Number(m?.costMicros || 0)
    const spend = costMicros / 1_000_000

    keywords.push({
      campaignId: c?.id?.toString() || '',
      campaignName: c?.name || 'Unknown',
      adGroupId: ag?.id?.toString() || '',
      adGroupName: ag?.name || 'Unknown',
      keywordId: kw.resourceName?.split('/').pop() || '',
      keywordText: kw.keyword.text,
      matchType: kw.keyword.matchType || 'UNKNOWN',
      status: kw.status || 'UNKNOWN',
      cpcBidMicros: Number(kw?.cpcBidMicros || 0),
      qualityScore: kw?.qualityInfo?.qualityScore || null,
      impressions: Number(m?.impressions || 0),
      clicks: Number(m?.clicks || 0),
      ctr: Number(m?.ctr || 0),
      averageCpc: Number(m?.averageCpc || 0) / 1_000_000,
      cost: spend,
      conversions: Number(m?.conversions || 0),
      conversionValue: Number(m?.conversionsValue || 0),
      impressionShare: Number(m?.impressionShare || 0),
    })
  }

  // Save to keywords table
  if (keywords.length > 0) {
    const rows = keywords.map(k => ({
      account_id: accountId,
      keyword_text: k.keywordText,
      match_type: k.matchType,
      status: k.status,
      cpc_bid_micros: k.cpcBidMicros,
      quality_score: k.qualityScore,
      impressions: k.impressions,
      clicks: k.clicks,
      ctr: k.ctr,
      cpc: k.averageCpc,
      spend: k.cost,
      conversions: k.conversions,
      conversion_value: k.conversionValue,
      impression_share: k.impressionShare,
      date_range_start: dateStart,
      date_range_end: dateEnd,
    }))

    await supabaseAdmin.from('keywords').upsert(rows, {
      onConflict: 'account_id, keyword_text, match_type, date_range_start, date_range_end',
      ignoreDuplicates: false,
    })
  }

  return keywords
}

export interface AuctionInsightData {
  campaignId: string
  campaignName: string
  competitorDomain: string
  impressionShare: number
  avgPosition: number
  overlapRate: number
  positionAboveRate: number
  topOfPageRate: number
  outrankingShare: number
}

export async function fetchAuctionInsights(
  customerId: string,
  dateStart: string,
  dateEnd: string,
  campaignIds?: string[],
): Promise<AuctionInsightData[]> {
  const campaignFilter = campaignIds?.length
    ? `AND campaign.id IN (${campaignIds.map(id => `'${id}'`).join(',')})`
    : ''

  const gaql = `
    SELECT
      campaign.id,
      campaign.name,
      campaign_auction_insight.domain,
      campaign_auction_insight.impression_share,
      campaign_auction_insight.average_position,
      campaign_auction_insight.overlap_rate,
      campaign_auction_insight.position_above_rate,
      campaign_auction_insight.top_of_page_rate,
      campaign_auction_insight.outranking_share
    FROM campaign_auction_insight
    WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
      ${campaignFilter}
  `

  const results = await queryGoogleAds(gaql, customerId)

  return results.map(row => ({
    campaignId: row.campaign?.id?.toString() || '',
    campaignName: row.campaign?.name || 'Unknown',
    competitorDomain: row.campaignAuctionInsight?.domain || '',
    impressionShare: Number(row.campaignAuctionInsight?.impressionShare || 0),
    avgPosition: Number(row.campaignAuctionInsight?.averagePosition || 0),
    overlapRate: Number(row.campaignAuctionInsight?.overlapRate || 0),
    positionAboveRate: Number(row.campaignAuctionInsight?.positionAboveRate || 0),
    topOfPageRate: Number(row.campaignAuctionInsight?.topOfPageRate || 0),
    outrankingShare: Number(row.campaignAuctionInsight?.outrankingShare || 0),
  }))
}
