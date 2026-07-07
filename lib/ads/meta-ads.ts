/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHmac } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { logApiError, upsertCampaign, upsertAdSet, upsertAd, upsertDailyInsight } from './admin-queries'
import type { Campaign, AdSet, Ad } from './types'

function getConfig() {
  return {
    accessToken: process.env.META_ACCESS_TOKEN,
    appSecret: process.env.META_APP_SECRET,
    adAccountId: process.env.META_AD_ACCOUNT_ID,
    businessId: process.env.META_BUSINESS_ID,
    pageId: process.env.META_PAGE_ID,
    apiVersion: process.env.META_GRAPH_API_VERSION || 'v25.0',
  }
}

function getBaseUrl(): string {
  const cfg = getConfig()
  return `https://graph.facebook.com/${cfg.apiVersion}`
}

function stripActPrefix(id: string): string {
  return id.replace(/^act_/, '')
}

async function metaFetch(path: string, params: Record<string, string> = {}): Promise<any> {
  const cfg = getConfig()
  if (!cfg.accessToken) throw new Error('Meta access token not configured')

  const url = new URL(`${getBaseUrl()}${path}`)
  url.searchParams.set('access_token', cfg.accessToken)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data.error) {
    await logApiError({
      platform: 'meta_ads',
      endpoint: path,
      request_body: params,
      response_body: data.error,
      status_code: res.status,
      error_code: data.error.code?.toString(),
      error_message: data.error.message,
      is_permission_error: data.error.code === 200 || data.error.code === 10,
    })
    throw new Error(`Meta API error (${data.error.code}): ${data.error.message}`)
  }

  return data
}

// ─── CAMPAIGNS ─────────────────────────────────────────
export async function fetchCampaigns(accountId: string): Promise<Campaign[]> {
  const cfg = getConfig()
  const adAccountId = stripActPrefix(cfg.adAccountId!)
  const campaigns: Campaign[] = []

  const data = await metaFetch(`/act_${adAccountId}/campaigns`, {
    fields: 'id,name,status,objective,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,special_ad_categories,created_time',
    limit: '200',
  })

  for (const c of data.data || []) {
    const campaign: Partial<Campaign> = {
      account_id: accountId,
      platform_campaign_id: c.id,
      campaign_name: c.name || 'Unknown',
      platform: 'meta_ads',
      status: (c.status || 'UNKNOWN').toLowerCase(),
      objective: c.objective || null,
      daily_budget: c.daily_budget ? Number(c.daily_budget) / 100 : null,
      lifetime_budget: c.lifetime_budget ? Number(c.lifetime_budget) / 100 : null,
      budget_type: c.daily_budget ? 'daily' : c.lifetime_budget ? 'lifetime' : null,
      start_date: c.start_time ? c.start_time.split('T')[0] : null,
      end_date: c.stop_time ? c.stop_time.split('T')[0] : null,
      raw_data: c,
      last_sync_at: new Date().toISOString(),
    }
    campaigns.push(campaign as Campaign)
    await upsertCampaign(campaign)
  }

  return campaigns
}

// ─── AD SETS ─────────────────────────────────────────
export async function fetchAdSets(accountId: string): Promise<AdSet[]> {
  const cfg = getConfig()
  const adAccountId = stripActPrefix(cfg.adAccountId!)
  const adSets: AdSet[] = []

  const data = await metaFetch(`/act_${adAccountId}/adsets`, {
    fields: 'id,name,campaign_id,status,daily_budget,lifetime_budget,budget_remaining,targeting,created_time,start_time,end_time,bid_strategy,optimization_goal',
    limit: '200',
  })

  for (const s of data.data || []) {
    let dbCampaignId: string | null = null
    if (s.campaign_id) {
      const { data: dbC } = await supabaseAdmin
        .from('campaigns')
        .select('id')
        .eq('account_id', accountId)
        .eq('platform_campaign_id', s.campaign_id)
        .maybeSingle()
      if (dbC) dbCampaignId = dbC.id
    }

    const adSet: Partial<AdSet> = {
      campaign_id: dbCampaignId || undefined,
      platform_ad_set_id: s.id,
      ad_set_name: s.name || 'Unknown',
      status: (s.status || 'UNKNOWN').toLowerCase(),
      daily_budget: s.daily_budget ? Number(s.daily_budget) / 100 : null,
      lifetime_budget: s.lifetime_budget ? Number(s.lifetime_budget) / 100 : null,
      budget_type: s.daily_budget ? 'daily' : s.lifetime_budget ? 'lifetime' : null,
      targeting: s.targeting || null,
      raw_data: s,
      last_sync_at: new Date().toISOString(),
    }
    adSets.push(adSet as AdSet)
    await upsertAdSet(adSet)
  }

  return adSets
}

// ─── ADS ────────────────────────────────────────────────
export async function fetchAds(accountId: string): Promise<Ad[]> {
  const cfg = getConfig()
  const adAccountId = stripActPrefix(cfg.adAccountId!)
  const ads: Ad[] = []

  const data = await metaFetch(`/act_${adAccountId}/ads`, {
    fields: 'id,name,adset_id,campaign_id,status,creative{id,title,body,image_url,thumbnail_url,video_id,object_story_spec,call_to_action_type,link_url},created_time',
    limit: '200',
  })

  for (const a of data.data || []) {
    let dbCampaignId: string | null = null
    let dbAdSetId: string | null = null

    if (a.campaign_id) {
      const { data: dbC } = await supabaseAdmin
        .from('campaigns')
        .select('id')
        .eq('account_id', accountId)
        .eq('platform_campaign_id', a.campaign_id)
        .maybeSingle()
      if (dbC) dbCampaignId = dbC.id
    }
    if (a.adset_id) {
      const { data: dbAS } = await supabaseAdmin
        .from('ad_sets')
        .select('id')
        .eq('platform_ad_set_id', a.adset_id)
        .maybeSingle()
      if (dbAS) dbAdSetId = dbAS.id
    }

    const ad: Partial<Ad> = {
      campaign_id: dbCampaignId || undefined,
      ad_set_id: dbAdSetId || undefined,
      platform_ad_id: a.id,
      ad_name: a.name || 'Unknown',
      status: (a.status || 'UNKNOWN').toLowerCase(),
      ad_type: a.creative?.call_to_action_type || null,
      platform: 'meta_ads',
      raw_data: a,
      last_sync_at: new Date().toISOString(),
    }
    ads.push(ad as Ad)

    const upsertResult = await supabaseAdmin.from('ads').upsert(ad, {
      onConflict: 'campaign_id, platform_ad_id',
    }).select().single()
    const insertedAd = upsertResult.data ?? null

    if (insertedAd && a.creative) {
      await supabaseAdmin.from('creatives').upsert({
        ad_id: insertedAd.id,
        platform_creative_id: a.creative.id,
        headline: a.creative.title || null,
        description: a.creative.body || null,
        cta: a.creative.call_to_action_type || null,
        image_url: a.creative.image_url || null,
        video_url: a.creative.video_id ? `https://www.facebook.com/watch/?v=${a.creative.video_id}` : null,
        thumbnail_url: a.creative.thumbnail_url || null,
        destination_url: a.creative.link_url || a.creative.object_story_spec?.link_data?.link || null,
        creative_type: 'meta_ad',
        raw_data: a.creative,
      }, { onConflict: 'ad_id, platform_creative_id' })
    }
  }

  return ads
}

// ─── PERFORMANCE METRICS ────────────────────────────────
export async function fetchPerformanceMetrics(
  accountId: string,
  dateStart: string,
  dateEnd: string,
): Promise<number> {
  const cfg = getConfig()
  const adAccountId = stripActPrefix(cfg.adAccountId!)

  const data = await metaFetch(`/act_${adAccountId}/insights`, {
    fields: [
      'campaign_id',
      'campaign_name',
      'adset_id',
      'adset_name',
      'ad_id',
      'ad_name',
      'impressions',
      'reach',
      'frequency',
      'clicks',
      'unique_clicks',
      'ctr',
      'cpc',
      'cpm',
      'spend',
      'actions',
      'action_values',
      'cost_per_action_type',
      'video_avg_time_watched_actions',
      'video_p25_watched_actions',
      'video_p50_watched_actions',
      'video_p75_watched_actions',
      'video_p95_watched_actions',
    ].join(','),
    level: 'ad',
    time_range: JSON.stringify({ since: dateStart, until: dateEnd }),
    time_increment: '1',
    limit: '500',
  })

  let count = 0
  for (const row of data.data || []) {
    const campId = row.campaign_id
    if (!campId) continue

    const { data: dbCampaign } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('account_id', accountId)
      .eq('platform_campaign_id', campId)
      .maybeSingle()
    if (!dbCampaign) continue

    let dbAdSetId: string | null = null
    if (row.adset_id) {
      const { data: dbAS } = await supabaseAdmin
        .from('ad_sets')
        .select('id')
        .eq('platform_ad_set_id', row.adset_id)
        .maybeSingle()
      if (dbAS) dbAdSetId = dbAS.id
    }

    let dbAdId: string | null = null
    if (row.ad_id) {
      const { data: dbA } = await supabaseAdmin
        .from('ads')
        .select('id')
        .eq('platform_ad_id', row.ad_id)
        .maybeSingle()
      if (dbA) dbAdId = dbA.id
    }

    const spend = Number(row.spend) || 0
    const impressions = Number(row.impressions) || 0
    const clicks = Number(row.clicks) || 0
    const ctr = Number(row.ctr) || 0
    const cpc = Number(row.cpc) || 0
    const cpm = Number(row.cpm) || 0

    // Parse actions
    let conversions = 0
    let leads = 0
    let purchases = 0
    let addToCart = 0
    let conversionValue = 0

    for (const action of row.actions || []) {
      if (action.action_type === 'OFFSITE_CONVERSION' || action.action_type === 'PURCHASE') {
        conversions += Number(action.value) || 0
      }
      if (action.action_type === 'LEAD') leads += Number(action.value) || 0
      if (action.action_type === 'PURCHASE') purchases += Number(action.value) || 0
      if (action.action_type === 'ADD_TO_CART') addToCart += Number(action.value) || 0
    }

    for (const cv of row.conversion_values || []) {
      conversionValue += Number(cv.value) || 0
    }

    for (const actionValue of row.action_values || []) {
      if (actionValue.action_type === 'OFFSITE_CONVERSION' || actionValue.action_type === 'PURCHASE') {
        conversionValue += Number(actionValue.value) || 0
      }
    }

    const roas = spend > 0 ? conversionValue / spend : 0

    const dateStr = row.date_start || dateStart

    await upsertDailyInsight({
      date: dateStr,
      platform: 'meta_ads',
      account_id: accountId,
      campaign_id: dbCampaign.id,
      ad_set_id: dbAdSetId,
      ad_id: dbAdId,
      spend,
      impressions,
      reach: Number(row.reach || 0),
      frequency: Number(row.frequency || 0),
      clicks,
      link_clicks: Number(row.unique_clicks || 0),
      ctr,
      cpc,
      cpm,
      conversions,
      conversion_value: conversionValue,
      cost_per_conversion: conversions > 0 ? spend / conversions : 0,
      roas,
      leads,
      purchases,
      add_to_cart: addToCart,
      video_views: Number(row.video_avg_time_watched_actions || 0),
      raw_data: row,
    })

    count++
  }

  return count
}

// ─── MUTATION HELPERS ──────────────────────────────────
function buildAuthParams(): URLSearchParams {
  const cfg = getConfig()
  const params = new URLSearchParams()
  params.set('access_token', cfg.accessToken!)
  if (cfg.appSecret) {
    params.set('appsecret_proof', createHmac('sha256', cfg.appSecret).update(cfg.accessToken!).digest('hex'))
  }
  return params
}

async function metaPost(path: string, body: Record<string, unknown>): Promise<any> {
  const url = `${getBaseUrl()}${path}?${buildAuthParams().toString()}`
  const res = await fetch(url, {
    method: 'POST',
    // Meta ad copy can contain Estonian characters (ä, õ, ö, ü). Be explicit
    // about UTF-8 so the request cannot be interpreted using a legacy charset.
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  })
  return await res.json()
}

// ─── MUTATIONS ─────────────────────────────────────────
export async function mutateCampaign(
  campaignId: string,
  action: string,
  value?: Record<string, unknown>,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (action === 'pause_campaign' || action === 'resume_campaign') {
      const status = action === 'pause_campaign' ? 'PAUSED' : 'ACTIVE'
      const body = await metaPost(`/${campaignId}`, { status })
      if (body.error) return { success: false, error: body.error.message }
      return { success: true, data: body }
    }

    if (action === 'update_budget' && value?.daily_budget) {
      const body = await metaPost(`/${campaignId}`, { daily_budget: Math.round(Number(value.daily_budget) * 100) })
      if (body.error) return { success: false, error: body.error.message }
      return { success: true, data: body }
    }

    if (action === 'duplicate_campaign') {
      const body = await metaPost(`/${campaignId}/copies`, { campaign_name: value?.name || 'Copy' })
      if (body.error) return { success: false, error: body.error.message }
      return { success: true, data: body }
    }

    return { success: false, error: `Unsupported action: ${action}` }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function mutateAdSet(
  adSetId: string,
  action: string,
  value?: Record<string, unknown>,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (action === 'pause_ad_set' || action === 'resume_ad_set') {
      const status = action === 'pause_ad_set' ? 'PAUSED' : 'ACTIVE'
      const body = await metaPost(`/${adSetId}`, { status })
      if (body.error) return { success: false, error: body.error.message }
      return { success: true, data: body }
    }

    if (action === 'update_ad_set_budget' && value?.daily_budget) {
      const body = await metaPost(`/${adSetId}`, { daily_budget: Math.round(Number(value.daily_budget) * 100) })
      if (body.error) return { success: false, error: body.error.message }
      return { success: true, data: body }
    }

    return { success: false, error: `Unsupported action: ${action}` }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function mutateAd(
  adId: string,
  action: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const status = action === 'pause_ad' ? 'PAUSED' : 'ACTIVE'
    const body = await metaPost(`/${adId}`, { status })
    if (body.error) return { success: false, error: body.error.message }
    return { success: true, data: body }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
