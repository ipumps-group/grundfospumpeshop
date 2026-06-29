'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MetricCard } from '@/components/ads/metric-card'
import { StatusBadge } from '@/components/ads/status-badge'
import { getDateRangePreset, getPreviousPeriod, cn } from '@/lib/ads/utils'
import type { AggregatedInsight, PeriodComparison, Recommendation, ChangeLog, SyncLog } from '@/lib/ads/types'
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Play, Filter } from 'lucide-react'

type RangePreset = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days'
type PlatformFilter = 'all' | 'google_ads' | 'meta_ads'

export default function AdsDashboard() {
  const [range, setRange] = useState<RangePreset>('last_7_days')
  const [platform, setPlatform] = useState<PlatformFilter>('all')
  const [loading, setLoading] = useState(true)
  const [aggregated, setAggregated] = useState<AggregatedInsight[]>([])
  const [comparison, setComparison] = useState<PeriodComparison[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [recentChanges, setRecentChanges] = useState<ChangeLog[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [companyId, setCompanyId] = useState<string>('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { start, end } = getDateRangePreset(range)
      const prev = getPreviousPeriod(start, end)

      const initRes = await fetch('/api/ads/init')
      const initData = await initRes.json()
      const cid = initData.companyId || ''
      setCompanyId(cid)
      setAccounts(initData.accounts || [])
      setRecommendations(initData.recommendations || [])
      setRecentChanges(initData.changeLogs || [])
      setSyncLogs(initData.syncLogs || [])

      const p = platform !== 'all' ? platform : undefined

      const aggRes = await fetch(`/api/ads/insights?type=aggregated&companyId=${cid}&dateStart=${start}&dateEnd=${end}${p ? `&platform=${p}` : ''}`)
      if (aggRes.ok) { const d = await aggRes.json(); setAggregated(d || []) }

      const compRes = await fetch(`/api/ads/insights?type=comparison&companyId=${cid}&dateStart=${start}&dateEnd=${end}&prevStart=${prev.start}&prevEnd=${prev.end}${p ? `&platform=${p}` : ''}`)
      if (compRes.ok) { const d = await compRes.json(); setComparison(d || []) }
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }, [range, platform])

  useEffect(() => { loadData() }, [loadData])

  const totals = aggregated.reduce((acc, row) => ({
    spend: acc.spend + row.total_spend,
    impressions: acc.impressions + row.total_impressions,
    clicks: acc.clicks + row.total_clicks,
    conversions: acc.conversions + row.total_conversions,
    revenue: acc.revenue + row.total_conversion_value,
    leads: acc.leads + row.total_leads,
    purchases: acc.purchases + row.total_purchases,
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, leads: 0, purchases: 0 })

  const getComp = (metric: string) => comparison.find(c => c.metric === metric)

  const googleMetrics = aggregated.filter(a => a.platform === 'google_ads')
  const metaMetrics = aggregated.filter(a => a.platform === 'meta_ads')
  const googleTotal = googleMetrics.reduce((s, a) => s + a.total_spend, 0)
  const metaTotal = metaMetrics.reduce((s, a) => s + a.total_spend, 0)
  const hasData = aggregated.length > 0
  const lastSync = syncLogs.length > 0 ? syncLogs[0] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {hasData
              ? `Showing ${platform === 'all' ? 'Google Ads + Meta Ads' : platform === 'google_ads' ? 'Google Ads' : 'Meta Ads'} metrics`
              : 'No ad data yet — run a sync to get started'}
            {lastSync && <span className="ml-2 text-xs text-gray-400">· Last sync: {new Date(lastSync.started_at).toLocaleString()}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value as PlatformFilter)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Platforms</option>
            <option value="google_ads">Google Ads</option>
            <option value="meta_ads">Meta Ads</option>
          </select>
          <select
            value={range}
            onChange={e => setRange(e.target.value as RangePreset)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Zero state */}
      {!hasData && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Ad Data Available</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Your dashboard is empty because no ad platform data has been synced yet.
            Go to the Sync page to import campaigns and performance metrics from Google Ads and Meta Ads.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/haldus/ads/sync"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Play className="w-4 h-4" />
              Go to Sync
            </Link>
            <Link
              href="/haldus/ads/settings/integrations"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Configure Integrations
            </Link>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      {hasData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <MetricCard label="Total Spend" value={totals.spend} format="currency" loading={loading} change={getComp('spend')?.change_pct} />
            <MetricCard label="Conversions" value={totals.conversions} loading={loading} change={getComp('conversions')?.change_pct} />
            <MetricCard label="CPA" value={totals.conversions > 0 ? totals.spend / totals.conversions : 0} format="currency" loading={loading} />
            <MetricCard label="ROAS" value={totals.spend > 0 ? totals.revenue / totals.spend : 0} format="ratio" loading={loading} />
            <MetricCard label="Revenue" value={totals.revenue} format="currency" loading={loading} change={getComp('revenue')?.change_pct} />
            <MetricCard label="Leads" value={totals.leads} loading={loading} change={getComp('leads')?.change_pct} />
            <MetricCard label="Purchases" value={totals.purchases} loading={loading} change={getComp('purchases')?.change_pct} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Impressions" value={totals.impressions} loading={loading} change={getComp('impressions')?.change_pct} />
            <MetricCard label="Clicks" value={totals.clicks} loading={loading} change={getComp('clicks')?.change_pct} />
            <MetricCard label="CTR" value={totals.impressions > 0 ? totals.clicks / totals.impressions : 0} format="percentage" loading={loading} />
            <MetricCard label="CPC" value={totals.clicks > 0 ? totals.spend / totals.clicks : 0} format="currency" loading={loading} />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Platform Spend Comparison</h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ) : !hasData ? (
            <div className="text-center py-4 text-gray-400 text-sm">No spend data yet</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Google Ads</span>
                <span className="text-sm font-semibold">€{googleTotal.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{
                  width: `${(googleTotal + metaTotal) > 0 ? (googleTotal / (googleTotal + metaTotal)) * 100 : 0}%`
                }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Meta Ads</span>
                <span className="text-sm font-semibold">€{metaTotal.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{
                  width: `${(googleTotal + metaTotal) > 0 ? (metaTotal / (googleTotal + metaTotal)) * 100 : 0}%`
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Latest Recommendations</h3>
            <span className="text-xs text-gray-400">{recommendations.length} open</span>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No recommendations yet.<br />Sync your data first.</div>
          ) : (
            <div className="space-y-2">
              {recommendations.slice(0, 5).map(rec => (
                <div key={rec.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                  {rec.severity === 'high' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : rec.severity === 'medium' ? (
                    <TrendingDown className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{rec.title}</p>
                    <p className="text-xs text-gray-500 truncate">{rec.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Sync Status</h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded" />
              ))}
            </div>
          ) : syncLogs.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm space-y-2">
              <p>No syncs yet.</p>
              <Link href="/haldus/ads/sync" className="text-blue-600 hover:underline text-xs">
                Go to Sync →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {syncLogs.slice(0, 3).map(log => (
                <div key={log.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{log.platform.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">{new Date(log.started_at).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={log.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Changes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Changes</h3>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        ) : recentChanges.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No changes yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium">Target</th>
                  <th className="pb-2 font-medium">Platform</th>
                  <th className="pb-2 font-medium">Result</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentChanges.map(cl => (
                  <tr key={cl.id}>
                    <td className="py-2.5 text-gray-900">{cl.action_type}</td>
                    <td className="py-2.5 text-gray-600">{cl.target_name || cl.target_type}</td>
                    <td className="py-2.5 capitalize">{cl.platform.replace('_', ' ')}</td>
                    <td className="py-2.5"><StatusBadge status={cl.result} /></td>
                    <td className="py-2.5 text-gray-500">{new Date(cl.performed_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
