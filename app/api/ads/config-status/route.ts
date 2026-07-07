import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'

interface PlatformCheck {
  vars: string[]
  optionalVars: string[]
  doc: string
  note?: string
}

const ENV_CHECKS: Record<string, PlatformCheck> = {
  google_ads: {
    vars: [
      'GOOGLE_ADS_DEVELOPER_TOKEN',
      'GOOGLE_ADS_CLIENT_ID',
      'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_REFRESH_TOKEN',
      'GOOGLE_ADS_CUSTOMER_ID',
      'GOOGLE_ADS_LOGIN_CUSTOMER_ID',
    ],
    optionalVars: ['GOOGLE_ADS_LOGIN_CUSTOMER_ID'],
    doc: 'https://developers.google.com/google-ads/api/docs/get-started/dev-token',
  },
  meta_ads: {
    vars: [
      'META_ACCESS_TOKEN',
      'META_AD_ACCOUNT_ID',
      'META_APP_SECRET',
      'META_BUSINESS_ID',
      'META_PAGE_ID',
      'META_GRAPH_API_VERSION',
    ],
    optionalVars: ['META_APP_SECRET', 'META_BUSINESS_ID', 'META_PAGE_ID', 'META_GRAPH_API_VERSION'],
    doc: 'https://developers.facebook.com/docs/marketing-api/access',
  },
  ga4: {
    vars: [
      'GA4_PROPERTY_ID',
      'GOOGLE_ADS_CLIENT_ID',
      'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_REFRESH_TOKEN',
    ],
    optionalVars: [],
    doc: 'https://developers.google.com/analytics/devguides/reporting/data/v1',
    note: 'GA4 uses the same Google OAuth credentials as Google Ads',
  },
  openai: {
    vars: ['OPENAI_API_KEY'],
    optionalVars: [],
    doc: 'https://platform.openai.com/api-keys',
  },
}

export async function GET() {
  try { await requireAdmin() } catch (e) { return e as NextResponse }

  const result: Record<string, { connected: boolean; vars: Record<string, boolean>; doc: string; note?: string }> = {}

  for (const [platform, config] of Object.entries(ENV_CHECKS)) {
    const varsStatus: Record<string, boolean> = {}
    let allSet = true
    for (const key of config.vars) {
      const val = process.env[key]
      const set = !!val
      varsStatus[key] = set
      if (!config.optionalVars.includes(key) && !set) {
        allSet = false
      }
    }
    result[platform] = {
      connected: allSet,
      vars: varsStatus,
      doc: config.doc,
      note: config.note,
    }
  }

  return NextResponse.json(result)
}
