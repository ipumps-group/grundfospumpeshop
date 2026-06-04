/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSyncLog, updateSyncLog, getAdAccount, upsertSyncState, getSyncState } from './admin-queries'
import type { Platform, SyncResult, SyncLog } from './types'
import * as google from './google-ads'
import * as meta from './meta-ads'
import * as ga4 from './ga4'

export interface SyncOptions {
  accountId: string
  platform: Platform
  dateStart?: string
  dateEnd?: string
  syncType?: 'manual' | 'scheduled' | 'webhook'
}

export async function runSync(options: SyncOptions): Promise<SyncResult> {
  const { accountId, platform, dateStart, dateEnd, syncType = 'manual' } = options

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
      rowsImported += (await google.fetchCampaigns(accountId, customerId)).length
      rowsImported += (await google.fetchAdGroups(accountId, customerId)).length
      rowsImported += (await google.fetchAds(accountId, customerId)).length
      rowsImported += await google.fetchPerformanceMetrics(accountId, customerId, start, end)
    } else if (platform === 'meta_ads') {
      rowsImported += (await meta.fetchCampaigns(accountId)).length
      rowsImported += (await meta.fetchAdSets(accountId)).length
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
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        rows_imported: rowsImported,
      })
    }

    return {
      success: true,
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

  for (const platform of platforms) {
    const result = await runSync({ accountId, platform, syncType: 'manual' })
    results.push(result)
  }

  return results
}
