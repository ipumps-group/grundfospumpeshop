import { NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/ads/google-ads'

async function runGaql(gaql: string, label: string): Promise<{ step: string; ok: boolean; detail: string }[]> {
  const steps: { step: string; ok: boolean; detail: string }[] = []
  const token = await getAccessToken()
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'developer-token': devToken,
    'Content-Type': 'application/json',
  }
  if (loginCustomerId) headers['login-customer-id'] = loginCustomerId

  try {
    const res = await fetch(
      `https://googleads.googleapis.com/v24/customers/${customerId}/googleAds:search`,
      { method: 'POST', headers, body: JSON.stringify({ query: gaql }) },
    )
    const body = await res.json()

    if (!res.ok) {
      const errs = body?.error?.details?.[0]?.errors || []
      for (const e of errs) {
        const code = e.errorCode ? Object.keys(e.errorCode).join(',') : ''
        steps.push({ step: `❌ ${label}`, ok: false, detail: `${code}: ${e.message}` })
      }
      if (!errs.length) {
        steps.push({ step: `❌ ${label}`, ok: false, detail: `HTTP ${res.status}: ${body.error?.message || JSON.stringify(body).slice(0, 200)}` })
      }
    } else {
      const rows = body.results || []
      steps.push({ step: `✅ ${label}`, ok: true, detail: `${rows.length} rows` })
      for (const row of rows.slice(0, 3)) {
        steps.push({ step: `  row`, ok: true, detail: JSON.stringify(row).slice(0, 250) })
      }
      // Check if there's a nextPageToken (pagination)
      if (body.nextPageToken) steps.push({ step: `  ⚠`, ok: true, detail: 'more pages available (nextPageToken present)' })
    }
  } catch (e: any) {
    steps.push({ step: `❌ ${label}`, ok: false, detail: e.message })
  }

  return steps
}

async function googleTest() {
  const steps: { step: string; ok: boolean; detail?: string }[] = []

  // 1. Check env vars
  const required = [
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_REFRESH_TOKEN',
    'GOOGLE_ADS_CUSTOMER_ID',
  ]
  for (const key of required) {
    const val = process.env[key]
    steps.push({ step: `env.${key}`, ok: !!val, detail: val ? `${val.slice(0, 8)}...` : 'missing' })
  }

  // 2. OAuth
  try {
    const token = await getAccessToken()
    steps.push({ step: 'oauth_token', ok: true, detail: `got token` })
  } catch (e: any) {
    steps.push({ step: 'oauth_token', ok: false, detail: e.message })
    return steps
  }

  // 3. Run exact GAQL queries used by sync
  const queries = [
    {
      label: 'fetchCampaigns',
      gaql: `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign_budget.amount_micros, campaign_budget.type FROM campaign WHERE campaign.status != 'REMOVED' ORDER BY campaign.name`,
    },
    {
      label: 'fetchAdGroups',
      gaql: `SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.type, ad_group.campaign, ad_group.cpc_bid_micros, ad_group.target_cpa_micros, ad_group.target_roas FROM ad_group WHERE ad_group.status != 'REMOVED'`,
    },
    {
      label: 'fetchAds',
      gaql: `SELECT ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.status, ad_group_ad.ad.type, ad_group_ad.ad_group, ad_group_ad.ad.final_urls, ad_group_ad.ad.display_url FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED'`,
    },
    {
      label: 'fetchPerformanceMetrics (7d)',
      gaql: `SELECT campaign.id, ad_group.id, ad_group_ad.ad.id, segments.date, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.cost_per_conversion FROM ad_group_ad WHERE segments.date BETWEEN '20260528' AND '20260604' AND campaign.status != 'REMOVED'`,
    },
  ]

  for (const q of queries) {
    const result = await runGaql(q.gaql, q.label)
    steps.push(...result)
  }

  return steps
}

async function metaTest() {
  const steps: { step: string; ok: boolean; detail?: string }[] = []

  const required = ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID']
  for (const key of required) {
    const val = process.env[key]
    steps.push({ step: `env.${key}`, ok: !!val, detail: val ? `${val.slice(0, 12)}...` : 'missing' })
  }

  const token = process.env.META_ACCESS_TOKEN
  const adAccountId = process.env.META_AD_ACCOUNT_ID
  if (!token || !adAccountId) return steps

  // Account info
  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${adAccountId}?fields=id,name,account_status,currency,timezone_name&access_token=${token}`)
    const body = await res.json()
    if (body.error) {
      steps.push({ step: 'account_info', ok: false, detail: body.error.message })
    } else {
      steps.push({ step: 'account_info', ok: true, detail: `${body.name} · ${body.currency} · status=${body.account_status}` })
    }
  } catch (e: any) {
    steps.push({ step: 'account_info', ok: false, detail: e.message })
  }

  // Campaigns
  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&limit=3&access_token=${token}`)
    const body = await res.json()
    if (body.error) {
      steps.push({ step: 'campaigns', ok: false, detail: body.error.message })
    } else {
      const campaigns = body.data || []
      steps.push({ step: 'campaigns', ok: true, detail: `${campaigns.length} campaigns` })
      for (const c of campaigns) {
        steps.push({ step: `  ${c.id}`, ok: true, detail: `${c.name} (${c.status}) ${c.daily_budget ? '€' + (c.daily_budget/100) : ''}` })
      }
    }
  } catch (e: any) {
    steps.push({ step: 'campaigns', ok: false, detail: e.message })
  }

  // Ad sets
  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${adAccountId}/adsets?fields=id,name,campaign_id,status,daily_budget&limit=3&access_token=${token}`)
    const body = await res.json()
    if (body.error) {
      steps.push({ step: 'adsets', ok: false, detail: body.error.message })
    } else {
      const adsets = body.data || []
      steps.push({ step: 'adsets', ok: true, detail: `${adsets.length} ad sets` })
      for (const a of adsets) {
        steps.push({ step: `  ${a.id}`, ok: true, detail: `${a.name} (${a.status}) campaign=${a.campaign_id}` })
      }
    }
  } catch (e: any) {
    steps.push({ step: 'adsets', ok: false, detail: e.message })
  }

  // Ads
  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${adAccountId}/ads?fields=id,name,adset_id,campaign_id,status,creative{id,title,body}&limit=3&access_token=${token}`)
    const body = await res.json()
    if (body.error) {
      steps.push({ step: 'ads', ok: false, detail: body.error.message })
    } else {
      const ads = body.data || []
      steps.push({ step: 'ads', ok: true, detail: `${ads.length} ads` })
      for (const a of ads) {
        steps.push({ step: `  ${a.id}`, ok: true, detail: `${a.name} (${a.status}) creative=${a.creative?.id || 'none'}` })
      }
    }
  } catch (e: any) {
    steps.push({ step: 'ads', ok: false, detail: e.message })
  }

  return steps
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') || 'google_ads'

  let steps: { step: string; ok: boolean; detail?: string }[] = []
  if (platform === 'google_ads') steps = await googleTest()
  else if (platform === 'meta_ads') steps = await metaTest()
  else {
    const [g, m] = await Promise.all([googleTest(), metaTest()])
    steps = [{ step: '=== GOOGLE ADS ===', ok: true }, ...g, { step: '=== META ADS ===', ok: true }, ...m]
  }

  const allOk = steps.filter(s => !s.step.startsWith('  ') && !s.step.startsWith('===') && s.step).every(s => s.ok)
  return NextResponse.json({ ok: allOk, steps })
}
