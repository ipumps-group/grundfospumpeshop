/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSyncLog, updateSyncLog, getAdAccount, upsertSyncState } from './admin-queries'
import type { Platform, SyncResult } from './types'
import * as google from './google-ads'
import * as meta from './meta-ads'
import * as ga4 from './ga4'

export interface SyncOptions {
  accountId: string
  platform: Platform
  dateStart?: string
  dateEnd?: string
  syncType?: 'manual' | 'scheduled' | 'webhook'
  includeKeywords?: boolean
}

export async function runSync(options: SyncOptions): Promise<SyncResult> {
  const { accountId, platform, dateStart, dateEnd, syncType = 'manual', includeKeywords = false } = options

  const now = new Date()
  const end = dateEnd || now.toISOString().split('T')[0]
  const start = dateStart || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Create sync log
  const { data: syncLog } = await createSyncLog({
    account_id: accountId,
    platform: platform as any,
    sync_type: syncType,
    status: 'running',
    date_start: start,
    date_end: end,
    started_at: now.toISOString(),
  })

  const logId = syncLog?.id
  const startedAt = Date.now()
  const errors: string[] = []
  let rowsImported = 0

  try {
    const { data: account } = await getAdAccount(accountId)
    if (!account) throw new Error('Ad account not found')

    // Platform-specific sync
    if (platform === 'google_ads') {
      const customerId = account.platform_account_id

      // Fetch campaigns and ad groups in parallel
      const [campaigns, adGroups] = await Promise.all([
        google.fetchCampaigns(accountId, customerId),
        google.fetchAdGroups(accountId, customerId),
      ])
      rowsImported += campaigns.length + adGroups.length

      // Ads depend on ad groups (need campaign_id lookup)
      rowsImported += (await google.fetchAds(accountId, customerId)).length

      // Performance metrics and keywords can run in parallel
      const perfPromise = google.fetchPerformanceMetrics(accountId, customerId, start, end)
      const keywordPromise = includeKeywords ? (async () => {
        try {
          const keywords = await import('./keywords')
          const [stResult, kwResult] = await Promise.all([
            keywords.fetchSearchTerms(accountId, customerId, start, end),
            keywords.fetchKeywords(accountId, customerId, start, end),
          ])
          return stResult.savedCount + kwResult.length
        } catch (e: any) {
          errors.push(`Keywords sync failed: ${e.message}`)
          return 0
        }
      })() : Promise.resolve(0)

      const [perfRows, keywordRows] = await Promise.all([perfPromise, keywordPromise])
      rowsImported += perfRows + keywordRows
    } else if (platform === 'meta_ads') {
      const [mc, ms] = await Promise.all([
        meta.fetchCampaigns(accountId),
        meta.fetchAdSets(accountId),
      ])
      rowsImported += mc.length + ms.length
      rowsImported += (await meta.fetchAds(accountId)).length
      rowsImported += await meta.fetchPerformanceMetrics(accountId, start, end)
    } else if (platform === 'ga4') {
      const result = await ga4.fetchAllMetrics(accountId, start, end)
      rowsImported += result.traffic + result.conversions
    }

    // Update sync state
    await upsertSyncState({
      account_id: accountId,
      platform,
      last_sync_date: end,
      full_sync_completed: true,
    })

    const durationSeconds = (Date.now() - startedAt) / 1000

    if (logId) {
      await updateSyncLog(logId, {
        status: errors.length > 0 ? 'partial' : 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        rows_imported: rowsImported,
        error_message: errors.length > 0 ? errors.join('; ') : null,
      })
    }

    return {
      success: errors.length === 0,
      platform,
      rowsImported,
      durationSeconds,
      errors,
    }
  } catch (err: any) {
    const durationSeconds = (Date.now() - startedAt) / 1000
    errors.push(err.message)

    if (logId) {
      await updateSyncLog(logId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        rows_imported: rowsImported,
        error_message: err.message,
        error_details: { stack: err.stack },
      })
    }

    return {
      success: false,
      platform,
      rowsImported,
      durationSeconds,
      errors,
    }
  }
}

export async function runFullSync(accountId: string): Promise<SyncResult[]> {
  const results: SyncResult[] = []
  const platforms: Platform[] = ['google_ads', 'meta_ads', 'ga4']

  // Run platforms in parallel for full sync
  const platformResults = await Promise.allSettled(
    platforms.map(platform =>
      runSync({ accountId, platform, syncType: 'manual', includeKeywords: platform === 'google_ads' }),
    ),
  )

  for (const result of platformResults) {
    if (result.status === 'fulfilled') {
      results.push(result.value)
    } else {
      results.push({
        success: false,
        platform: 'google_ads',
        rowsImported: 0,
        durationSeconds: 0,
        errors: [result.reason?.message || 'Unknown error'],
      })
    }
  }

  return results
}
