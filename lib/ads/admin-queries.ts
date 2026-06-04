/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase-admin'
import type {
  AdAccount, Campaign, AdGroup, AdSet, Ad, Creative, DailyInsight,
  Recommendation, ChangeRequest, ChangeLog, SyncLog, ReportTemplate,
  GeneratedReport, ScheduledReport, ApiErrorLog, ConversionEvent,
} from './types'

function admin() {
  return supabaseAdmin
}

// ─── Ad Accounts ─────────────────────────────────────────
export async function getAdAccounts(companyId?: string) {
  let q = admin().from('ad_accounts').select('*, platform:ad_platforms(*)')
  if (companyId) q = q.eq('company_id', companyId)
  return (await q) as { data: AdAccount[] | null; error: any }
}

export async function getAdAccount(id: string) {
  return (await admin().from('ad_accounts').select('*, platform:ad_platforms(*)').eq('id', id).single()) as {
    data: AdAccount | null; error: any
  }
}

// ─── Campaigns ─────────────────────────────────────────
export async function getCampaigns(accountId?: string) {
  let q = admin().from('campaigns').select('*')
  if (accountId) q = q.eq('account_id', accountId)
  return (await q.order('campaign_name')) as { data: Campaign[] | null; error: any }
}

export async function getCampaign(id: string) {
  return (await admin().from('campaigns').select('*, ad_groups(*), ad_sets(*), ads(*)').eq('id', id).single()) as {
    data: any; error: any
  }
}

export async function upsertCampaign(c: Partial<Campaign>) {
  return await admin().from('campaigns').upsert(c, {
    onConflict: 'account_id, platform_campaign_id',
  })
}

// ─── Ad Groups ─────────────────────────────────────────
export async function getAdGroups(campaignId?: string) {
  let q = admin().from('ad_groups').select('*, ads(*)')
  if (campaignId) q = q.eq('campaign_id', campaignId)
  return (await q) as { data: any; error: any }
}

export async function upsertAdGroup(g: Partial<AdGroup>) {
  return await admin().from('ad_groups').upsert(g, {
    onConflict: 'campaign_id, platform_ad_group_id',
  })
}

// ─── Ad Sets ──────────────────────────────────────────
export async function getAdSets(campaignId?: string) {
  let q = admin().from('ad_sets').select('*, ads(*)')
  if (campaignId) q = q.eq('campaign_id', campaignId)
  return (await q) as { data: any; error: any }
}

export async function upsertAdSet(s: Partial<AdSet>) {
  return await admin().from('ad_sets').upsert(s, {
    onConflict: 'campaign_id, platform_ad_set_id',
  })
}

// ─── Ads ─────────────────────────────────────────────
export async function getAds(campaignId?: string) {
  let q = admin().from('ads').select('*, creatives(*)')
  if (campaignId) q = q.eq('campaign_id', campaignId)
  return (await q) as { data: any; error: any }
}

export async function upsertAd(a: Partial<Ad>) {
  return await admin().from('ads').upsert(a, {
    onConflict: 'campaign_id, platform_ad_id',
  })
}

// ─── Creatives ─────────────────────────────────────────
export async function upsertCreative(c: Partial<Creative>) {
  return await admin().from('creatives').upsert(c, {
    onConflict: 'ad_id, platform_creative_id',
  })
}

// ─── Daily Insights ─────────────────────────────────────
export async function upsertDailyInsight(i: Partial<DailyInsight>) {
  const ZERO = '00000000-0000-0000-0000-000000000000'
  const row = {
    ...i,
    ad_group_id: i.ad_group_id || ZERO,
    ad_set_id: i.ad_set_id || ZERO,
    ad_id: i.ad_id || ZERO,
  }
  return await admin().from('daily_insights').upsert(row, {
    onConflict: 'date, platform, account_id, campaign_id, ad_group_id, ad_set_id, ad_id',
  })
}

export async function getDailyInsights(filters: {
  accountId?: string
  campaignId?: string
  adId?: string
  platform?: string
  dateStart?: string
  dateEnd?: string
  limit?: number
  offset?: number
}) {
  let q = admin().from('daily_insights').select('*')
  if (filters.accountId) q = q.eq('account_id', filters.accountId)
  if (filters.campaignId) q = q.eq('campaign_id', filters.campaignId)
  if (filters.adId) q = q.eq('ad_id', filters.adId)
  if (filters.platform) q = q.eq('platform', filters.platform)
  if (filters.dateStart) q = q.gte('date', filters.dateStart)
  if (filters.dateEnd) q = q.lte('date', filters.dateEnd)
  if (filters.limit) q = q.limit(filters.limit)
  if (filters.offset) q = q.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
  return (await q.order('date', { ascending: false })) as { data: DailyInsight[] | null; error: any }
}

// ─── Recommendations ─────────────────────────────────────
export async function getRecommendations(companyId: string, status?: string) {
  let q = admin().from('recommendations').select('*, campaign:campaigns(*)').eq('company_id', companyId)
  if (status) q = q.eq('status', status)
  return (await q.order('created_at', { ascending: false })) as { data: Recommendation[] | null; error: any }
}

export async function createRecommendation(r: Partial<Recommendation>) {
  return await admin().from('recommendations').insert(r).select().single()
}

export async function updateRecommendation(id: string, updates: Partial<Recommendation>) {
  return await admin().from('recommendations').update(updates).eq('id', id)
}

// ─── Change Requests ─────────────────────────────────────
export async function getChangeRequests(companyId: string, status?: string) {
  let q = admin().from('change_requests').select('*').eq('company_id', companyId)
  if (status) q = q.eq('status', status)
  return (await q.order('created_at', { ascending: false })) as { data: ChangeRequest[] | null; error: any }
}

export async function createChangeRequest(cr: Partial<ChangeRequest>) {
  return await admin().from('change_requests').insert(cr).select().single()
}

export async function updateChangeRequest(id: string, updates: Partial<ChangeRequest>) {
  return await admin().from('change_requests').update(updates).eq('id', id)
}

// ─── Change Logs ─────────────────────────────────────────
export async function getChangeLogs(companyId: string, limit = 50) {
  return (await admin()
    .from('change_logs')
    .select('*')
    .eq('company_id', companyId)
    .order('performed_at', { ascending: false })
    .limit(limit)) as { data: ChangeLog[] | null; error: any }
}

export async function createChangeLog(cl: Partial<ChangeLog>) {
  return await admin().from('change_logs').insert(cl).select().single()
}

// ─── Sync Logs ─────────────────────────────────────────
export async function getSyncLogs(accountId?: string, limit = 20) {
  let q = admin().from('sync_logs').select('*')
  if (accountId) q = q.eq('account_id', accountId)
  return (await q.order('started_at', { ascending: false }).limit(limit)) as { data: SyncLog[] | null; error: any }
}

export async function createSyncLog(sl: Partial<SyncLog>) {
  return await admin().from('sync_logs').insert(sl).select().single()
}

export async function updateSyncLog(id: string, updates: Partial<SyncLog>) {
  return await admin().from('sync_logs').update(updates).eq('id', id)
}

// ─── Reports ──────────────────────────────────────────
export async function getReportTemplates(companyId: string) {
  return (await admin().from('report_templates').select('*').eq('company_id', companyId)) as {
    data: ReportTemplate[] | null; error: any
  }
}

export async function createReportTemplate(t: Partial<ReportTemplate>) {
  return await admin().from('report_templates').insert(t).select().single()
}

export async function getGeneratedReports(companyId: string, limit = 20) {
  return (await admin()
    .from('generated_reports')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit)) as { data: GeneratedReport[] | null; error: any }
}

export async function createGeneratedReport(r: Partial<GeneratedReport>) {
  return await admin().from('generated_reports').insert(r).select().single()
}

// ─── Scheduled Reports ─────────────────────────────────
export async function getScheduledReports(companyId: string) {
  return (await admin().from('scheduled_reports').select('*').eq('company_id', companyId)) as {
    data: ScheduledReport[] | null; error: any
  }
}

// ─── Conversions ─────────────────────────────────────────
export async function getConversionEvents(accountId?: string) {
  let q = admin().from('conversion_events').select('*')
  if (accountId) q = q.eq('account_id', accountId)
  return (await q) as { data: ConversionEvent[] | null; error: any }
}

// ─── Aggregation ─────────────────────────────────────────
export async function getAggregatedInsights(
  companyId: string,
  dateStart: string,
  dateEnd: string,
  platform?: string,
  accountId?: string,
  campaignId?: string,
) {
  const { data, error } = await admin().rpc('get_aggregated_insights', {
    p_company_id: companyId,
    p_date_start: dateStart,
    p_date_end: dateEnd,
    p_platform: platform || null,
    p_account_id: accountId || null,
    p_campaign_id: campaignId || null,
  })
  return { data, error }
}

export async function getPeriodComparison(
  companyId: string,
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
  platform?: string,
) {
  const { data, error } = await admin().rpc('get_period_comparison', {
    p_company_id: companyId,
    p_current_start: currentStart,
    p_current_end: currentEnd,
    p_previous_start: previousStart,
    p_previous_end: previousEnd,
    p_platform: platform || null,
  })
  return { data, error }
}

// ─── API Error Logs ─────────────────────────────────────
export async function logApiError(err: Partial<ApiErrorLog>) {
  return await admin().from('api_error_logs').insert(err)
}

// ─── Sync State ────────────────────────────────────────
export async function getSyncState(accountId: string, platform: string) {
  return (await admin()
    .from('sync_state')
    .select('*')
    .eq('account_id', accountId)
    .eq('platform', platform)
    .maybeSingle()) as { data: any; error: any }
}

export async function upsertSyncState(s: { account_id: string; platform: string; last_sync_date?: string; last_sync_cursor?: string; full_sync_completed?: boolean }) {
  return await admin().from('sync_state').upsert(s, {
    onConflict: 'account_id, platform',
  })
}
