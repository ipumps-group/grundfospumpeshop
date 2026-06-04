/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { runSync } from '@/lib/ads/sync'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getOrCreateCompany(): Promise<string> {
  // Find first company, or create a default one
  const { data: companies } = await supabaseAdmin.from('companies').select('id').limit(1)
  if (companies?.length) return companies[0].id

  const { data: newCompany } = await supabaseAdmin.from('companies').insert({
    name: 'Default Company',
    slug: 'default',
  }).select('id').single()

  return newCompany?.id || '00000000-0000-0000-0000-000000000000'
}

async function ensureAdAccount(platform: string): Promise<{ id: string; companyId: string } | null> {
  // Find the platform record
  const { data: platformRow } = await supabaseAdmin
    .from('ad_platforms')
    .select('id')
    .eq('slug', platform)
    .single()

  if (!platformRow) return null
  const platformId = platformRow.id

  // Look for existing ad account
  const { data: existing } = await supabaseAdmin
    .from('ad_accounts')
    .select('id, company_id')
    .eq('platform_id', platformId)
    .maybeSingle()

  if (existing) return { id: existing.id, companyId: existing.company_id }

  // Ensure a company exists
  const companyId = await getOrCreateCompany()

  // Auto-create from env vars
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
    // Associate this user with the company
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
  // Link ALL profiles that don't yet have a company
  await supabaseAdmin.from('profiles').update({ company_id: companyId }).is('company_id', null)
}

// GET — return recent sync logs (admin client bypasses RLS)
export async function GET() {
  try {
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

export async function POST(request: NextRequest) {
  try {
    let { accountId, platform, dateStart, dateEnd } = await request.json()

    if (!platform) {
      return NextResponse.json({ error: 'platform required' }, { status: 400 })
    }

    // Auto-create account if not provided
    if (!accountId) {
      const result = await ensureAdAccount(platform)
      if (!result) {
        return NextResponse.json({
          success: false,
          error: `No ad account configured for ${platform}. Go to /haldus/ads/settings/integrations to check credentials.`,
          hint: `Ensure GOOGLE_ADS_CUSTOMER_ID or META_AD_ACCOUNT_ID or GA4_PROPERTY_ID is set in .env.local`,
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
