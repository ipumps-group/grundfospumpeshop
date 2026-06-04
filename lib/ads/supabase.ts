/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import type {
  AdAccount, Campaign, DailyInsight,
  Recommendation, ChangeLog, GeneratedReport,
} from './types'

function client() {
  return supabase
}

// ─── Ad Accounts ─────────────────────────────────────────
export async function getAdAccounts(companyId?: string) {
  let q = client().from('ad_accounts').select('*, platform:ad_platforms(*)')
  if (companyId) q = q.eq('company_id', companyId)
  return (await q) as { data: AdAccount[] | null; error: any }
}

export async function getAdAccount(id: string) {
  return (await client().from('ad_accounts').select('*, platform:ad_platforms(*)').eq('id', id).single()) as {
    data: AdAccount | null; error: any
  }
}

// ─── Campaigns ─────────────────────────────────────────
export async function getCampaigns(accountId?: string) {
  let q = client().from('campaigns').select('*')
  if (accountId) q = q.eq('account_id', accountId)
  return (await q.order('campaign_name')) as { data: Campaign[] | null; error: any }
}

export async function getCampaign(id: string) {
  return (await client().from('campaigns').select('*, ad_groups(*), ad_sets(*), ads(*)').eq('id', id).single()) as {
    data: any; error: any
  }
}

// ─── Ad Groups ─────────────────────────────────────────
export async function getAdGroups(campaignId?: string) {
  let q = client().from('ad_groups').select('*, ads(*)')
  if (campaignId) q = q.eq('campaign_id', campaignId)
  return (await q) as { data: any; error: any }
}

// ─── Ad Sets ──────────────────────────────────────────
export async function getAdSets(campaignId?: string) {
  let q = client().from('ad_sets').select('*, ads(*)')
  if (campaignId) q = q.eq('campaign_id', campaignId)
  return (await q) as { data: any; error: any }
}

// ─── Ads ─────────────────────────────────────────────
export async function getAds(campaignId?: string) {
  let q = client().from('ads').select('*, creatives(*)')
  if (campaignId) q = q.eq('campaign_id', campaignId)
  return (await q) as { data: any; error: any }
}

// ─── Daily Insights ─────────────────────────────────────
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
  let q = client().from('daily_insights').select('*')
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
  let q = client().from('recommendations').select('*, campaign:campaigns(*)').eq('company_id', companyId)
  if (status) q = q.eq('status', status)
  return (await q.order('created_at', { ascending: false })) as { data: Recommendation[] | null; error: any }
}

export async function updateRecommendation(id: string, updates: Partial<Recommendation>) {
  return await client().from('recommendations').update(updates).eq('id', id)
}

// ─── Change Requests ─────────────────────────────────────
export async function getChangeRequests(companyId: string, status?: string) {
  let q = client().from('change_requests').select('*').eq('company_id', companyId)
  if (status) q = q.eq('status', status)
  return (await q.order('created_at', { ascending: false })) as { data: any; error: any }
}

// ─── Change Logs ─────────────────────────────────────────
export async function getChangeLogs(companyId: string, limit = 50) {
  return (await client()
    .from('change_logs')
    .select('*')
    .eq('company_id', companyId)
    .order('performed_at', { ascending: false })
    .limit(limit)) as { data: ChangeLog[] | null; error: any }
}

// ─── Sync Logs ─────────────────────────────────────────
export async function getSyncLogs(accountId?: string, limit = 20) {
  let q = client().from('sync_logs').select('*')
  if (accountId) q = q.eq('account_id', accountId)
  return (await q.order('started_at', { ascending: false }).limit(limit)) as { data: any; error: any }
}

// ─── Reports ──────────────────────────────────────────
export async function getGeneratedReports(companyId: string, limit = 20) {
  return (await client()
    .from('generated_reports')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit)) as { data: GeneratedReport[] | null; error: any }
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
  const { data, error } = await client().rpc('get_aggregated_insights', {
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
  const { data, error } = await client().rpc('get_period_comparison', {
    p_company_id: companyId,
    p_current_start: currentStart,
    p_current_end: currentEnd,
    p_previous_start: previousStart,
    p_previous_end: previousEnd,
    p_platform: platform || null,
  })
  return { data, error }
}
