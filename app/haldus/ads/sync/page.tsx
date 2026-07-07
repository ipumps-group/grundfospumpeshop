'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatusBadge } from '@/components/ads/status-badge'
import { DataTable } from '@/components/ads/data-table'
import { cn, daysAgo, today } from '@/lib/ads/utils'
import type { AdAccount, SyncLog } from '@/lib/ads/types'
import { RefreshCw, Play, Clock, AlertCircle, CheckCircle2, XCircle, Activity } from 'lucide-react'
import Link from 'next/link'

export default function SyncPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [dateRange, setDateRange] = useState('last_30_days')
  const [health, setHealth] = useState<Record<string, { ok: boolean; detail: string }> | null>(null)
  const [checkingHealth, setCheckingHealth] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const initRes = await fetch('/api/ads/init')
      const initData = await initRes.json()
      setAccounts(initData.accounts || [])
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

  const checkHealth = async () => {
    setCheckingHealth(true)
    try {
      const res = await fetch('/api/ads/sync/run?health=1')
      if (res.ok) {
        const data = await res.json()
        setHealth(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCheckingHealth(false)
    }
  }

  useEffect(() => { checkHealth() }, [])

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
    setSyncResult(null)
    try {
      const { start, end } = getDates()
      const res = await fetch('/api/ads/sync/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, platform, dateStart: start, dateEnd: end }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        setSyncError(result.error || result.requiredEnv || (result.errors && result.errors.join('; ')) || JSON.stringify(result))
      } else {
        setSyncResult(result)
      }
      await load()
    } catch (err: any) {
      setSyncError(err.message || 'Network error')
    } finally {
      setSyncing(null)
    }
  }

  const quickSync = async (platform: string) => {
    setSyncing(`quick-${platform}`)
    setSyncError(null)
    setSyncResult(null)
    try {
      const { start, end } = getDates()
      const res = await fetch('/api/ads/sync/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, dateStart: start, dateEnd: end }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        setSyncError(result.error || result.requiredEnv || (result.errors && result.errors.join('; ')) || result.hint || JSON.stringify(result))
        if (result.requiredEnv) {
          setSyncError(`Missing environment variables for ${platform}: ${result.requiredEnv}. ${result.help || ''}`)
        }
      } else {
        setSyncResult(result)
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
            onClick={() => { load(); checkHealth() }}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Health Check */}
      {health && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Platform Health Check
            </h3>
            <button
              onClick={checkHealth}
              disabled={checkingHealth}
              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
            >
              {checkingHealth ? 'Checking...' : 'Re-check'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {Object.entries(health).map(([key, status]) => (
              <div key={key} className={cn(
                'flex items-center gap-2 p-3 rounded-lg text-sm',
                status.ok ? 'bg-green-50' : 'bg-red-50',
              )}>
                {status.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium capitalize text-gray-900">{key.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500 truncate">{status.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Result */}
      {syncResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Sync Complete</p>
              <p className="text-xs text-green-600">
                Platform: {syncResult.platform} · Rows: {syncResult.rowsImported} · Duration: {syncResult.durationSeconds?.toFixed(1)}s
                {syncResult.errors?.length > 0 && <span className="text-yellow-600"> (with errors)</span>}
              </p>
            </div>
          </div>
          <button onClick={() => setSyncResult(null)} className="text-green-600 hover:text-green-800 text-xs">Dismiss</button>
        </div>
      )}

      {/* Error display */}
      {syncError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">Sync Error</p>
            <p className="text-sm text-red-600 mt-1 whitespace-pre-wrap">{syncError}</p>
            <div className="flex gap-3 mt-3">
              <Link href="/haldus/ads/settings/integrations" className="text-xs text-blue-600 hover:underline">
                Check Environment Variables →
              </Link>
              <button onClick={() => setSyncError(null)} className="text-xs text-red-400 hover:text-red-600">Dismiss</button>
            </div>
          </div>
        </div>
      )}

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
          <div className="flex justify-center gap-3 flex-wrap">
            {['google_ads', 'meta_ads', 'ga4'].map(platform => {
              const h = health?.[platform]
              return (
                <button
                  key={platform}
                  onClick={() => quickSync(platform)}
                  disabled={syncing === `quick-${platform}` || (h && !h.ok)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    (h && !h.ok)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50',
                  )}
                  title={h && !h.ok ? h.detail : `Sync ${platform}`}
                >
                  {syncing === `quick-${platform}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Sync {platform.replace('_', ' ')}
                </button>
              )
            })}
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
              </div>
              <div>
                {(() => {
                  const slug = acc.platform?.slug
                  if (!slug) return null
                  const h = health?.[slug]
                  return (
                    <button
                      onClick={() => runSync(acc.id, slug)}
                      disabled={isSyncing(acc.id, slug) || (h && !h.ok)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-colors',
                        isSyncing(acc.id, slug)
                          ? 'border-blue-300 bg-blue-50'
                          : (h && !h.ok)
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50',
                      )}
                      title={h && !h.ok ? h.detail : ''}
                    >
                      <span className="capitalize font-medium">Sync {slug.replace('_', ' ')}</span>
                      {isSyncing(acc.id, slug) ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                      ) : (
                        <Play className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )
                })()}
              </div>
            </div>
          ))}
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
          emptyMessage="No syncs performed yet. Run a sync above to get started."
        />
      </div>
    </div>
  )
}
