'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatusBadge } from '@/components/ads/status-badge'
import { DataTable } from '@/components/ads/data-table'
import { cn, daysAgo, today } from '@/lib/ads/utils'
import type { AdAccount, SyncLog, Platform } from '@/lib/ads/types'
import { RefreshCw, Play, Clock, AlertCircle } from 'lucide-react'

export default function SyncPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('last_7_days')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const initRes = await fetch('/api/ads/init')
      const initData = await initRes.json()
      setAccounts(initData.accounts || [])
      // Fetch sync logs via API (bypasses RLS)
      const res = await fetch('/api/ads/sync/run')
      if (res.ok) {
        const logs = await res.json()
        setSyncLogs(logs)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const getDates = () => {
    const end = today()
    let start: string
    switch (dateRange) {
      case 'today': start = end; break
      case 'last_7_days': start = daysAgo(7); break
      case 'last_14_days': start = daysAgo(14); break
      case 'last_30_days': start = daysAgo(30); break
      default: start = daysAgo(7)
    }
    return { start, end }
  }

  const runSync = async (accountId: string, platform: string) => {
    const key = `${accountId}-${platform}`
    setSyncing(key)
    setSyncError(null)
    try {
      const { start, end } = getDates()
      const res = await fetch('/api/ads/sync/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, platform, dateStart: start, dateEnd: end }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        const errMsg = result.error || (result.errors && result.errors.join('; ')) || JSON.stringify(result)
        setSyncError(errMsg)
      }
      await load()
    } catch (err: any) {
      setSyncError(err.message || 'Network error')
    } finally {
      setSyncing(null)
    }
  }

  const runFullSync = async (accountId: string) => {
    setSyncing(`full-${accountId}`)
    try {
      const { start, end } = getDates()
      for (const platform of ['google_ads', 'meta_ads', 'ga4']) {
        await fetch('/api/ads/sync/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId, platform, dateStart: start, dateEnd: end }),
        })
      }
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setSyncing(null)
    }
  }

  const quickSync = async (platform: string) => {
    setSyncing(`quick-${platform}`)
    setSyncError(null)
    try {
      const { start, end } = getDates()
      const res = await fetch('/api/ads/sync/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, dateStart: start, dateEnd: end }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        const errMsg = result.error || (result.errors && result.errors.join('; ')) || result.hint || JSON.stringify(result)
        setSyncError(errMsg)
      }
      await load()
    } catch (err: any) {
      setSyncError(err.message || 'Network error')
    } finally {
      setSyncing(null)
    }
  }

  const isSyncing = (accountId: string, platform?: string) => {
    if (platform) return syncing === `${accountId}-${platform}` || syncing === `quick-${platform}`
    return syncing === `full-${accountId}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Sync</h1>
          <p className="text-sm text-gray-500 mt-1">Import data from ad platforms</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_14_days">Last 14 Days</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Account Sync Cards */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-4">No accounts in database yet. Quick-sync from environment variables:</p>
          <div className="flex justify-center gap-3">
            {['google_ads', 'meta_ads', 'ga4'].map(platform => (
              <button
                key={platform}
                onClick={() => quickSync(platform)}
                disabled={syncing === `quick-${platform}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {syncing === `quick-${platform}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Sync {platform.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map(acc => (
            <div key={acc.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{acc.account_name}</h3>
                  <p className="text-xs text-gray-500">{acc.platform?.name} · {acc.platform_account_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runFullSync(acc.id)}
                    disabled={isSyncing(acc.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    {isSyncing(acc.id) ? 'Syncing...' : 'Sync All'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['google_ads', 'meta_ads', 'ga4'] as const).filter(p => {
                  if (acc.platform?.slug === 'google_ads' && (p === 'google_ads' || p === 'ga4')) return true
                  if (acc.platform?.slug === 'meta_ads' && (p === 'meta_ads' || p === 'ga4')) return true
                  return false
                }).map(platform => (
                  <button
                    key={platform}
                    onClick={() => runSync(acc.id, platform)}
                    disabled={isSyncing(acc.id, platform)}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border text-sm transition-colors',
                      isSyncing(acc.id, platform)
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50',
                    )}
                  >
                    <span className="capitalize font-medium">{platform.replace('_', ' ')}</span>
                    {isSyncing(acc.id, platform) ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    ) : (
                      <Play className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error display */}
      {syncError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Sync Error</p>
            <p className="text-sm text-red-600 mt-1">{syncError}</p>
          </div>
        </div>
      )}

      {/* Sync History */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Sync History</h3>
        <DataTable
          columns={[
            { key: 'platform', label: 'Platform', sortable: true, render: (r: SyncLog) => <span className="capitalize">{r.platform.replace('_', ' ')}</span> },
            { key: 'sync_type', label: 'Type', sortable: true },
            { key: 'status', label: 'Status', sortable: true, render: (r: SyncLog) => <StatusBadge status={r.status} /> },
            { key: 'rows_imported', label: 'Rows', sortable: true },
            { key: 'duration_seconds', label: 'Duration', render: (r: SyncLog) => r.duration_seconds ? `${r.duration_seconds.toFixed(1)}s` : '-' },
            { key: 'started_at', label: 'Started', sortable: true, render: (r: SyncLog) => new Date(r.started_at).toLocaleString() },
          ]}
          data={syncLogs}
          keyField="id"
          emptyMessage="No syncs performed yet."
        />
      </div>
    </div>
  )
}
