/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { runSync } from '@/lib/ads/sync'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/api-auth'
import { rateLimit, STRICT_RATE } from '@/lib/rate-limit'

const PLATFORM_SLUGS = [
  { name: 'Google Ads', slug: 'google_ads' },
  { name: 'Meta Ads', slug: 'meta_ads' },
  { name: 'GA4', slug: 'ga4' },
]

async function ensurePlatformsExist() {
  try {
    for (const p of PLATFORM_SLUGS) {
      const { data: existing } = await supabaseAdmin
        .from('ad_platforms')
        .select('id')
        .eq('slug', p.slug)
        .maybeSingle()
      if (!existing) {
        await supabaseAdmin.from('ad_platforms').insert({ name: p.name, slug: p.slug })
      }
    }
  } catch (err: any) {
    console.error('[sync] Failed to ensure platforms exist (table may not be created):', err.message)
  }
}

async function getOrCreateCompany(): Promise<string> {
  const { data: companies } = await supabaseAdmin.from('companies').select('id').limit(1)
  if (companies?.length) return companies[0].id

  const { data: newCompany } = await supabaseAdmin.from('companies').insert({
    name: 'Default Company',
    slug: 'default',
  }).select('id').single()

  return newCompany?.id || '00000000-0000-0000-0000-000000000000'
}

async function ensureAdAccount(platform: string): Promise<{ id: string; companyId: string } | null> {
  await ensurePlatformsExist()

  const { data: platformRow } = await supabaseAdmin
    .from('ad_platforms')
    .select('id')
    .eq('slug', platform)
    .single()

  if (!platformRow) return null
  const platformId = platformRow.id

  const { data: existing } = await supabaseAdmin
    .from('ad_accounts')
    .select('id, company_id')
    .eq('platform_id', platformId)
    .maybeSingle()

  if (existing) return { id: existing.id, companyId: existing.company_id }

  const companyId = await getOrCreateCompany()

  const base = {
    platform_id: platformId,
    company_id: companyId,
    status: 'active' as const,
    connected_at: new Date().toISOString(),
  }

  if (platform === 'google_ads') {
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID
    if (!customerId) return null
    const { data: acc } = await supabaseAdmin.from('ad_accounts').insert({
      ...base,
      platform_account_id: customerId,
      account_name: `Google Ads - ${customerId}`,
      account_currency: 'EUR',
      account_timezone: 'Europe/Tallinn',
    }).select('id, company_id').single()
    if (!acc) return null
    await associateUserWithCompany(companyId)
    return { id: acc.id, companyId: acc.company_id }
  }

  if (platform === 'meta_ads') {
    const adAccountId = process.env.META_AD_ACCOUNT_ID
    if (!adAccountId) return null
    const { data: acc } = await supabaseAdmin.from('ad_accounts').insert({
      ...base,
      platform_account_id: adAccountId.replace('act_', ''),
      account_name: `Meta Ads - ${adAccountId}`,
      account_currency: 'EUR',
      account_timezone: 'Europe/Tallinn',
    }).select('id, company_id').single()
    if (!acc) return null
    await associateUserWithCompany(companyId)
    return { id: acc.id, companyId: acc.company_id }
  }

  if (platform === 'ga4') {
    const propertyId = process.env.GA4_PROPERTY_ID
    if (!propertyId) return null
    // GA4 also needs Google OAuth credentials
    if (!process.env.GOOGLE_ADS_CLIENT_ID || !process.env.GOOGLE_ADS_CLIENT_SECRET || !process.env.GOOGLE_ADS_REFRESH_TOKEN) {
      console.warn('[sync] GA4 configured but Google OAuth credentials missing — GA4 sync will fail')
    }
    const { data: acc } = await supabaseAdmin.from('ad_accounts').insert({
      ...base,
      platform_account_id: propertyId,
      account_name: `GA4 - ${propertyId}`,
      account_currency: 'EUR',
      account_timezone: 'Europe/Tallinn',
    }).select('id, company_id').single()
    if (!acc) return null
    await associateUserWithCompany(companyId)
    return { id: acc.id, companyId: acc.company_id }
  }

  return null
}

async function associateUserWithCompany(companyId: string) {
  await supabaseAdmin.from('profiles').update({ company_id: companyId }).is('company_id', null)
}

// GET — return recent sync logs + account/connection status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const health = searchParams.get('health')

    if (health === '1') {
      // Pre-flight checks
      const checks: Record<string, { ok: boolean; detail: string }> = {}

      // Check platforms table exists
      try {
        await ensurePlatformsExist()
        checks.platforms = { ok: true, detail: 'ad_platforms ready' }
      } catch (e: any) {
        checks.platforms = { ok: false, detail: e.message }
      }

      // Check each platform's env vars
      for (const p of PLATFORM_SLUGS) {
        const result = await checkPlatformHealth(p.slug)
        checks[p.slug] = result
      }

      return NextResponse.json(checks)
    }

    const { data, error } = await supabaseAdmin
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function checkPlatformHealth(platform: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const result = await ensureAdAccount(platform)
    if (result) return { ok: true, detail: `account configured (${result.id})` }
    return { ok: false, detail: `no account — env vars missing or platform not configured` }
  } catch (e: any) {
    return { ok: false, detail: e.message }
  }
}

export async function POST(request: NextRequest) {
  try { await requireAdmin() } catch (e) { return e as NextResponse }
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(ip, STRICT_RATE.maxRequests)
  if (rl.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    let { accountId, platform, dateStart, dateEnd } = await request.json()

    if (!platform) {
      return NextResponse.json({ error: 'platform required' }, { status: 400 })
    }

    // Pre-flight: ensure platforms table has data
    await ensurePlatformsExist()

    if (!accountId) {
      const result = await ensureAdAccount(platform)
      if (!result) {
        const envVars: Record<string, string> = {
          google_ads: 'GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN',
          meta_ads: 'META_AD_ACCOUNT_ID, META_ACCESS_TOKEN',
          ga4: 'GA4_PROPERTY_ID, GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN',
        }
        return NextResponse.json({
          success: false,
          error: `No ad account configured for ${platform}. Check environment variables.`,
          requiredEnv: envVars[platform] || 'platform-specific env vars',
          help: `Go to Settings → Integrations to verify credentials, then return to Sync page.`,
        }, { status: 400 })
      }
      accountId = result.id
    }

    const syncResult = await runSync({
      accountId,
      platform,
      dateStart,
      dateEnd,
      syncType: 'manual',
    })

    return NextResponse.json(syncResult)
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }, { status: 500 })
  }
}
