/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { logApiError, upsertCampaign, upsertAdGroup, upsertDailyInsight } from './admin-queries'
import type { Campaign, AdGroup, Ad } from './types'

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

// ─── OAUTH with caching ────────────────────────────────
let cachedToken: { token: string; expiresAt: number } | null = null

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token
  }

  const config = getConfig()
  if (!config.clientId || !config.clientSecret || !config.refreshToken) {
    throw new Error('Google Ads OAuth credentials not configured')
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: 'refresh_token',
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to get Google Ads access token: ${err}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  }
  return data.access_token
}

// ─── GAQL QUERY HELPER ─────────────────────────────────
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 1000

async function queryGoogleAds(accessToken: string, query: string, customerId: string): Promise<any[]> {
  const config = getConfig()
  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:search`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken!,
    'Content-Type': 'application/json',
  }
  if (config.loginCustomerId) {
    headers['login-customer-id'] = config.loginCustomerId
  }

  let lastError: Error | null = null
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      })

      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After')
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : INITIAL_BACKOFF_MS * Math.pow(2, attempt)
        await new Promise(r => setTimeout(r, delay))
        continue
      }

      if (!res.ok) {
        const errBody = await res.text()
        const statusCode = res.status
        if (statusCode >= 500) {
          lastError = new Error(`Google Ads API error (${statusCode}): ${errBody}`)
          await new Promise(r => setTimeout(r, INITIAL_BACKOFF_MS * Math.pow(2, attempt)))
          continue
        }
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
        if (!nextRes.ok) {
          const errBody = await nextRes.text()
          throw new Error(`Google Ads API pagination error (${nextRes.status}): ${errBody}`)
        }
        const nextData = await nextRes.json()
        if (nextData.results) allResults.push(...nextData.results)
        nextPageToken = nextData.nextPageToken || null
      }

      return allResults
    } catch (err) {
      lastError = err as Error
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, INITIAL_BACKOFF_MS * Math.pow(2, attempt)))
        continue
      }
      throw err
    }
  }

  throw lastError || new Error('Google Ads API query failed after retries')
}

// ─── CAMPAIGNS ─────────────────────────────────────────
export async function fetchCampaigns(accountId: string, customerId: string): Promise<Campaign[]> {
  const accessToken = await getAccessToken()
  const gaql = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      campaign_budget.type
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.name
  `

  const results = await queryGoogleAds(accessToken, gaql, customerId)
  const campaigns: Campaign[] = []

  for (const row of results) {
    const c = row.campaign
    const budget = row.campaignBudget
    const campaign: Partial<Campaign> = {
      account_id: accountId,
      platform_campaign_id: c.id?.toString(),
      campaign_name: c.name || 'Unknown',
      platform: 'google_ads',
      status: (c.status || 'UNKNOWN').toLowerCase(),
      objective: c.advertisingChannelType || null,
      daily_budget: budget?.amountMicros ? Number(budget.amountMicros) / 1_000_000 : null,
      budget_type: budget?.type === 'DAILY' ? 'daily' : budget?.type === 'LIFETIME' ? 'lifetime' : null,
      start_date: c.startDate || null,
      end_date: c.endDate || null,
      raw_data: c,
      last_sync_at: new Date().toISOString(),
    }
    campaigns.push(campaign as Campaign)
    await upsertCampaign(campaign)
  }

  return campaigns
}

// ─── AD GROUPS ─────────────────────────────────────────
export async function fetchAdGroups(accountId: string, customerId: string): Promise<AdGroup[]> {
  const accessToken = await getAccessToken()
  const gaql = `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group.status,
      ad_group.type,
      ad_group.campaign,
      ad_group.cpc_bid_micros,
      ad_group.target_cpa_micros,
      ad_group.target_roas
    FROM ad_group
    WHERE ad_group.status != 'REMOVED'
  `

  const results = await queryGoogleAds(accessToken, gaql, customerId)
  const groups: AdGroup[] = []

  for (const row of results) {
    const ag = row.adGroup
    const campId = ag.campaign?.split('/').pop()
    const group: Partial<AdGroup> = {
      platform_ad_group_id: ag.id?.toString(),
      ad_group_name: ag.name || 'Unknown',
      status: (ag.status || 'UNKNOWN').toLowerCase(),
      type: ag.type || null,
      raw_data: ag,
      last_sync_at: new Date().toISOString(),
    }

    if (campId) {
      const { data: dbCampaign } = await supabaseAdmin
        .from('campaigns')
        .select('id')
        .eq('account_id', accountId)
        .eq('platform_campaign_id', campId)
        .maybeSingle()

      if (dbCampaign) {
        group.campaign_id = dbCampaign.id
      }
    }

    groups.push(group as AdGroup)
    await upsertAdGroup(group)
  }

  return groups
}

// ─── ADS ────────────────────────────────────────────────
export async function fetchAds(accountId: string, customerId: string): Promise<Ad[]> {
  const accessToken = await getAccessToken()
  const gaql = `
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      ad_group_ad.status,
      ad_group_ad.ad.type,
      ad_group_ad.ad_group,
      ad_group_ad.ad.final_urls,
      ad_group_ad.ad.display_url
    FROM ad_group_ad
    WHERE ad_group_ad.status != 'REMOVED'
  `

  const results = await queryGoogleAds(accessToken, gaql, customerId)
  const ads: Ad[] = []

  for (const row of results) {
    const aga = row.adGroupAd
    const ad = aga.ad
    const adGroupId = aga.adGroup?.split('/').pop()
    const adObj: Partial<Ad> = {
      platform_ad_id: ad.id?.toString(),
      ad_name: ad.name || 'Ad ' + ad.id,
      status: (aga.status || 'UNKNOWN').toLowerCase(),
      ad_type: ad.type || null,
      platform: 'google_ads',
      raw_data: aga,
      last_sync_at: new Date().toISOString(),
    }

    if (adGroupId) {
      const { data: dbAdGroup } = await supabaseAdmin
        .from('ad_groups')
        .select('id, campaign_id')
        .eq('platform_ad_group_id', adGroupId)
        .maybeSingle()

      if (dbAdGroup) {
        adObj.ad_group_id = dbAdGroup.id
        adObj.campaign_id = dbAdGroup.campaign_id
      }
    }

    const upsertResult = await supabaseAdmin.from('ads').upsert(adObj, {
      onConflict: 'campaign_id, platform_ad_id',
    }).select().single()
    const insertedAd = upsertResult.data
    if (insertedAd) ads.push(insertedAd as Ad)
  }

  return ads
}

// ─── PERFORMANCE METRICS ────────────────────────────────
export async function fetchPerformanceMetrics(
  accountId: string,
  customerId: string,
  dateStart: string,
  dateEnd: string,
) {
  const accessToken = await getAccessToken()
  const gaql = `
    SELECT
      campaign.id,
      ad_group.id,
      ad_group_ad.ad.id,
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.cost_per_conversion
    FROM ad_group_ad
    WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
      AND campaign.status != 'REMOVED'
  `

  const results = await queryGoogleAds(accessToken, gaql, customerId)
  const campaignCache = new Map<string, string>()
  const adGroupCache = new Map<string, string>()
  const adCache = new Map<string, string>()

  for (const row of results) {
    const campId = row.campaign?.id?.toString()
    const adGroupId = row.adGroup?.id?.toString()
    const adId = row.adGroupAd?.ad?.id?.toString()
    const seg = row.segments
    const m = row.metrics

    if (!campId || !seg?.date) continue

    if (!campaignCache.has(campId)) {
      const { data: dbCamp } = await supabaseAdmin
        .from('campaigns')
        .select('id')
        .eq('account_id', accountId)
        .eq('platform_campaign_id', campId)
        .maybeSingle()
      if (dbCamp) campaignCache.set(campId, dbCamp.id)
    }

    const dbCampaignId = campaignCache.get(campId)
    if (!dbCampaignId) continue

    let dbAdGroupId: string | null = null
    if (adGroupId) {
      if (!adGroupCache.has(adGroupId)) {
        const { data: dbAg } = await supabaseAdmin
          .from('ad_groups')
          .select('id')
          .eq('platform_ad_group_id', adGroupId)
          .maybeSingle()
        adGroupCache.set(adGroupId, dbAg?.id || '')
      }
      dbAdGroupId = adGroupCache.get(adGroupId) || null
    }

    let dbAdId: string | null = null
    if (adId) {
      if (!adCache.has(adId)) {
        const { data: dbAd } = await supabaseAdmin
          .from('ads')
          .select('id')
          .eq('platform_ad_id', adId)
          .maybeSingle()
        adCache.set(adId, dbAd?.id || '')
      }
      dbAdId = adCache.get(adId) || null
    }

    const costMicros = Number(m?.costMicros || 0)
    const spend = costMicros / 1_000_000
    const impressions = Number(m?.impressions || 0)
    const clicks = Number(m?.clicks || 0)
    const conversions = Number(m?.conversions || 0)
    const conversionValue = Number(m?.conversionsValue || 0)

    await upsertDailyInsight({
      date: seg.date,
      platform: 'google_ads',
      account_id: accountId,
      campaign_id: dbCampaignId,
      ad_group_id: dbAdGroupId,
      ad_id: dbAdId,
      spend,
      impressions,
      clicks,
      ctr: Number(m?.ctr || 0),
      cpc: Number(m?.averageCpc || 0) / 1_000_000,
      cpm: Number(m?.averageCpm || 0) / 1_000_000,
      conversions,
      conversion_value: conversionValue,
      cost_per_conversion: Number(m?.costPerConversion || 0) / 1_000_000,
      roas: spend > 0 ? conversionValue / spend : 0,
      video_views: Number(m?.videoViews || 0),
      raw_data: { ...row },
    })
  }

  return results.length
}

// ─── MUTATIONS ─────────────────────────────────────────
export async function mutateCampaign(
  customerId: string,
  campaignId: string,
  action: string,
  value?: Record<string, unknown>,
): Promise<{ success: boolean; data?: any; error?: string }> {
  const accessToken = await getAccessToken()
  const config = getConfig()

  let operations: any[]

  if (action === 'pause_campaign' || action === 'resume_campaign') {
    const status = action === 'pause_campaign' ? 'PAUSED' : 'ENABLED'
    operations = [{
      update: {
        resourceName: `customers/${customerId}/campaigns/${campaignId}`,
        campaign: { resourceName: `customers/${customerId}/campaigns/${campaignId}`, status },
        updateMask: 'status',
      },
    }]
  } else if (action === 'update_budget' && value?.daily_budget) {
    const budgetMicros = Math.round(Number(value.daily_budget) * 1_000_000)
    operations = [{
      update: {
        resourceName: `customers/${customerId}/campaigns/${campaignId}`,
        campaign: {
          resourceName: `customers/${customerId}/campaigns/${campaignId}`,
          campaignBudget: { amountMicros: budgetMicros },
        },
        updateMask: 'campaignBudget.amountMicros',
      },
    }]
  } else {
    return { success: false, error: `Unsupported action: ${action}` }
  }

  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:mutate`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken!,
    'Content-Type': 'application/json',
  }
  if (config.loginCustomerId) {
    headers['login-customer-id'] = config.loginCustomerId
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mutateOperations: operations.map(op => ({ operation: op })) }),
    })

    const body = await res.json()
    if (!res.ok) {
      return { success: false, error: body.error?.message || JSON.stringify(body) }
    }

    return { success: true, data: body }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function mutateAdGroup(
  customerId: string,
  adGroupId: string,
  action: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  const accessToken = await getAccessToken()
  const config = getConfig()

  const status = action === 'pause_ad_group' ? 'PAUSED' : 'ENABLED'
  const operations = [{
    update: {
      resourceName: `customers/${customerId}/adGroups/${adGroupId}`,
      adGroup: { resourceName: `customers/${customerId}/adGroups/${adGroupId}`, status },
      updateMask: 'status',
    },
  }]

  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:mutate`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken!,
    'Content-Type': 'application/json',
  }
  if (config.loginCustomerId) headers['login-customer-id'] = config.loginCustomerId

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mutateOperations: operations.map(op => ({ operation: op })) }),
    })

    const body = await res.json()
    if (!res.ok) return { success: false, error: body.error?.message || JSON.stringify(body) }
    return { success: true, data: body }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function mutateAd(
  customerId: string,
  adId: string,
  action: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  const accessToken = await getAccessToken()
  const config = getConfig()

  const status = action === 'pause_ad' ? 'PAUSED' : 'ENABLED'
  const operations = [{
    update: {
      resourceName: `customers/${customerId}/adGroupAds/${adId}`,
      adGroupAd: {
        resourceName: `customers/${customerId}/adGroupAds/${adId}`,
        status,
      },
      updateMask: 'status',
    },
  }]

  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:mutate`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken!,
    'Content-Type': 'application/json',
  }
  if (config.loginCustomerId) headers['login-customer-id'] = config.loginCustomerId

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mutateOperations: operations.map(op => ({ operation: op })) }),
    })

    const body = await res.json()
    if (!res.ok) return { success: false, error: body.error?.message || JSON.stringify(body) }
    return { success: true, data: body }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
