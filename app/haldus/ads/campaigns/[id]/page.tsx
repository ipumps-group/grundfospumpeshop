'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MetricCard } from '@/components/ads/metric-card'
import { StatusBadge } from '@/components/ads/status-badge'
import { DataTable } from '@/components/ads/data-table'
import { SparkChart } from '@/components/ads/chart'
import { formatCurrency, formatNumber, formatCTR, daysAgo, today, cn } from '@/lib/ads/utils'
import type { DailyInsight, Recommendation, ChangeLog } from '@/lib/ads/types'
import { ArrowLeft, RefreshCw, Lightbulb } from 'lucide-react'

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [campaign, setCampaign] = useState<any>(null)
  const [insights, setInsights] = useState<DailyInsight[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'adgroups' | 'adsets' | 'ads' | 'insights' | 'recommendations' | 'history'>('overview')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/ads/campaigns/${id}`)
      if (!res.ok) { setCampaign(null); return }
      const data = await res.json()
      setCampaign(data.campaign)
      setInsights(data.insights || [])
      setRecommendations(data.recommendations || [])
      setChangeLogs(data.changeLogs || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Campaign not found</p>
      </div>
    )
  }

  const totals = insights.reduce((acc, i) => ({
    spend: acc.spend + i.spend,
    impressions: acc.impressions + i.impressions,
    clicks: acc.clicks + i.clicks,
    conversions: acc.conversions + i.conversions,
    revenue: acc.revenue + i.conversion_value,
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 })

  const chartData = insights
    .sort((a, b) => a.date.localeCompare(b.date))
    .reduce((acc: any[], i) => {
      const existing = acc.find(d => d.date === i.date)
      if (existing) {
        existing.spend += i.spend
        existing.conversions += i.conversions
      } else {
        acc.push({ date: i.date, spend: i.spend, conversions: i.conversions })
      }
      return acc
    }, [])

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'adgroups', label: 'Ad Groups' },
    { key: 'adsets', label: 'Ad Sets' },
    { key: 'ads', label: 'Ads' },
    { key: 'insights', label: 'Daily Data' },
    { key: 'recommendations', label: `Recommendations (${recommendations.length})` },
    { key: 'history', label: 'Change History' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.campaign_name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-gray-500">
            {campaign.platform.replace('_', ' ')} · {campaign.objective || 'No objective'} · Budget: {campaign.daily_budget ? `€${campaign.daily_budget}/day` : 'N/A'}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Spend (30d)" value={totals.spend} format="currency" />
        <MetricCard label="Impressions" value={totals.impressions} />
        <MetricCard label="Clicks" value={totals.clicks} />
        <MetricCard label="Conversions" value={totals.conversions} />
        <MetricCard label="Revenue" value={totals.revenue} format="currency" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">30-Day Performance Trend</h3>
        <SparkChart data={chartData.map(d => ({ date: d.date, value: d.spend, secondary: d.conversions }))} height={200} color="#3b82f6" secondaryColor="#10b981" />
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Spend</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Conversions</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={cn(
                'pb-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Campaign Details</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Platform ID</dt><dd className="font-medium">{campaign.platform_campaign_id}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd><StatusBadge status={campaign.status} /></dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Objective</dt><dd className="font-medium">{campaign.objective || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Daily Budget</dt><dd className="font-medium">{campaign.daily_budget ? `€${campaign.daily_budget}` : '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Lifetime Budget</dt><dd className="font-medium">{campaign.lifetime_budget ? `€${campaign.lifetime_budget}` : '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Start Date</dt><dd className="font-medium">{campaign.start_date || '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">End Date</dt><dd className="font-medium">{campaign.end_date || '-'}</dd></div>
              </dl>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Performance Summary</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">CTR</dt><dd className="font-medium">{totals.impressions > 0 ? formatCTR((totals.clicks / totals.impressions) * 100) : '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">CPC</dt><dd className="font-medium">{totals.clicks > 0 ? formatCurrency(totals.spend / totals.clicks) : '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">CPM</dt><dd className="font-medium">{totals.impressions > 0 ? formatCurrency((totals.spend / totals.impressions) * 1000) : '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">CPA</dt><dd className="font-medium">{totals.conversions > 0 ? formatCurrency(totals.spend / totals.conversions) : '-'}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">ROAS</dt><dd className="font-medium">{totals.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) + 'x' : '-'}</dd></div>
              </dl>
            </div>
          </div>
        )}

        {tab === 'adgroups' && campaign.ad_groups && (
          <DataTable
            columns={[
              { key: 'ad_group_name', label: 'Name', sortable: true },
              { key: 'status', label: 'Status', sortable: true, render: (r: any) => <StatusBadge status={r.status} /> },
              { key: 'type', label: 'Type', sortable: true },
            ]}
            data={campaign.ad_groups}
            keyField="id"
            emptyMessage="No ad groups found"
          />
        )}

        {tab === 'adsets' && campaign.ad_sets && (
          <DataTable
            columns={[
              { key: 'ad_set_name', label: 'Name', sortable: true },
              { key: 'status', label: 'Status', sortable: true, render: (r: any) => <StatusBadge status={r.status} /> },
              { key: 'daily_budget', label: 'Budget', render: (r: any) => r.daily_budget ? formatCurrency(r.daily_budget) : '-' },
            ]}
            data={campaign.ad_sets}
            keyField="id"
            emptyMessage="No ad sets found"
          />
        )}

        {tab === 'ads' && campaign.ads && (
          <DataTable
            columns={[
              { key: 'ad_name', label: 'Name', sortable: true },
              { key: 'status', label: 'Status', sortable: true, render: (r: any) => <StatusBadge status={r.status} /> },
              { key: 'ad_type', label: 'Type', sortable: true },
            ]}
            data={campaign.ads}
            keyField="id"
            emptyMessage="No ads found"
          />
        )}

        {tab === 'insights' && (
          <DataTable
            columns={[
              { key: 'date', label: 'Date', sortable: true },
              { key: 'spend', label: 'Spend', sortable: true, render: (r: DailyInsight) => formatCurrency(r.spend) },
              { key: 'impressions', label: 'Impressions', sortable: true, render: (r: DailyInsight) => formatNumber(r.impressions) },
              { key: 'clicks', label: 'Clicks', sortable: true, render: (r: DailyInsight) => formatNumber(r.clicks) },
              { key: 'ctr', label: 'CTR', sortable: true, render: (r: DailyInsight) => formatCTR(r.ctr) },
              { key: 'cpc', label: 'CPC', sortable: true, render: (r: DailyInsight) => formatCurrency(r.cpc) },
              { key: 'conversions', label: 'Conv.', sortable: true },
              { key: 'roas', label: 'ROAS', sortable: true, render: (r: DailyInsight) => r.roas.toFixed(2) + 'x' },
            ]}
            data={insights}
            keyField="id"
            emptyMessage="No daily data yet"
          />
        )}

        {tab === 'recommendations' && (
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No recommendations for this campaign.</div>
            ) : recommendations.map(rec => (
              <div key={rec.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <StatusBadge status={rec.severity} />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                    {rec.expected_impact && (
                      <p className="text-sm text-green-600"><strong>Impact:</strong> {rec.expected_impact}</p>
                    )}
                    {rec.suggested_action && (
                      <p className="text-sm text-blue-600"><strong>Action:</strong> {rec.suggested_action}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <DataTable
            columns={[
              { key: 'action_type', label: 'Action', sortable: true },
              { key: 'target_name', label: 'Target' },
              { key: 'result', label: 'Result', render: (r: ChangeLog) => <StatusBadge status={r.result} /> },
              { key: 'performed_at', label: 'Date', render: (r: ChangeLog) => new Date(r.performed_at).toLocaleString() },
            ]}
            data={changeLogs}
            keyField="id"
            emptyMessage="No change history"
          />
        )}
      </div>
    </div>
  )
}
