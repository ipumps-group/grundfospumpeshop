'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback, useEffect } from 'react'
import { getAdAccounts, getAggregatedInsights, getPeriodComparison, getGeneratedReports } from '@/lib/ads/supabase'
import { MetricCard } from '@/components/ads/metric-card'
import { StatusBadge } from '@/components/ads/status-badge'
import { DataTable } from '@/components/ads/data-table'
import { getDateRangePreset, getPreviousPeriod, daysAgo, today, cn, formatCurrency, formatNumber } from '@/lib/ads/utils'
import type { AggregatedInsight, PeriodComparison, GeneratedReport, Platform, ReportType } from '@/lib/ads/types'
import {
  RefreshCw, FileDown, FileSpreadsheet, Printer, Calendar,
  BarChart3, TrendingUp, Loader2, FileText,
} from 'lucide-react'

const reportTypes: { value: ReportType; label: string; description: string }[] = [
  { value: 'executive_summary', label: 'Executive Summary', description: 'High-level overview for stakeholders' },
  { value: 'campaign_performance', label: 'Campaign Performance', description: 'Detailed campaign-level metrics' },
  { value: 'channel_comparison', label: 'Channel Comparison', description: 'Google vs Meta vs GA4' },
  { value: 'budget_efficiency', label: 'Budget Efficiency', description: 'Spend analysis and waste detection' },
  { value: 'conversion', label: 'Conversion Report', description: 'Conversion tracking and attribution' },
  { value: 'roas', label: 'ROAS Report', description: 'Return on ad spend analysis' },
  { value: 'lead_generation', label: 'Lead Generation', description: 'Lead-focused performance' },
  { value: 'creative_performance', label: 'Creative Performance', description: 'Ad creative analysis' },
  { value: 'ai_audit', label: 'AI Audit Report', description: 'Comprehensive AI audit' },
]

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [companyId, setCompanyId] = useState('')
  const [accounts, setAccounts] = useState<any[]>([])
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [aggregated, setAggregated] = useState<AggregatedInsight[]>([])
  const [comparison, setComparison] = useState<PeriodComparison[]>([])

  // Report form state
  const [reportType, setReportType] = useState<ReportType>('executive_summary')
  const [dateRange, setDateRange] = useState('last_30_days')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['google_ads', 'meta_ads'])
  const [includeComparison, setIncludeComparison] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: accs } = await getAdAccounts()
      if (accs?.length) {
        setAccounts(accs)
        const cid = accs[0].company_id
        setCompanyId(cid)

        const { start, end } = getDateRangePreset('last_30_days')
        const prev = getPreviousPeriod(start, end)

        const [aggRes, compRes, repRes] = await Promise.all([
          getAggregatedInsights(cid, start, end),
          getPeriodComparison(cid, start, end, prev.start, prev.end),
          getGeneratedReports(cid),
        ])
        if (aggRes.data) setAggregated(aggRes.data as AggregatedInsight[])
        if (compRes.data) setComparison(compRes.data as PeriodComparison[])
        if (repRes.data) setGeneratedReports(repRes.data as GeneratedReport[])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const generateReport = async () => {
    setGenerating(true)
    try {
      const { start, end } = getDateRangePreset(dateRange)
      const payload: any = {
        reportType,
        title: `${reportTypes.find(r => r.value === reportType)?.label} — ${start} to ${end}`,
        dateStart: start,
        dateEnd: end,
        platforms: selectedPlatforms,
      }
      if (includeComparison) {
        const prev = getPreviousPeriod(start, end)
        payload.compareStart = prev.start
        payload.compareEnd = prev.end
      }

      const res = await fetch('/api/ads/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) await load()
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const exportReport = async (reportId: string, format: 'csv' | 'xlsx') => {
    const res = await fetch(`/api/ads/reports/export?id=${reportId}&format=${format}`)
    if (!res.ok) return

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${reportId}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totals = aggregated.reduce((acc, r) => ({
    spend: acc.spend + r.total_spend,
    impressions: acc.impressions + r.total_impressions,
    clicks: acc.clicks + r.total_clicks,
    conversions: acc.conversions + r.total_conversions,
    revenue: acc.revenue + r.total_conversion_value,
    leads: acc.leads + r.total_leads,
    purchases: acc.purchases + r.total_purchases,
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, leads: 0, purchases: 0 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and view advertising reports</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Report Generator */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Generate Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value as ReportType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {reportTypes.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">{reportTypes.find(r => r.value === reportType)?.description}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_14_days">Last 14 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platforms</label>
            <div className="flex gap-2 mt-2">
              {(['google_ads', 'meta_ads', 'ga4'] as const).map(p => (
                <label key={p} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(p)}
                    onChange={e => {
                      if (e.target.checked) setSelectedPlatforms([...selectedPlatforms, p])
                      else setSelectedPlatforms(selectedPlatforms.filter(x => x !== p))
                    }}
                    className="rounded"
                  />
                  <span className="capitalize">{p.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeComparison}
                onChange={e => setIncludeComparison(e.target.checked)}
                className="rounded"
              />
              Compare with previous period
            </label>
            <button
              onClick={generateReport}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Preview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <MetricCard label="Total Spend (30d)" value={totals.spend} format="currency" loading={loading} />
        <MetricCard label="Impressions" value={totals.impressions} loading={loading} />
        <MetricCard label="Clicks" value={totals.clicks} loading={loading} />
        <MetricCard label="Conversions" value={totals.conversions} loading={loading} />
        <MetricCard label="Revenue" value={totals.revenue} format="currency" loading={loading} />
        <MetricCard label="Leads" value={totals.leads} loading={loading} />
        <MetricCard label="Purchases" value={totals.purchases} loading={loading} />
      </div>

      {/* Period Comparison */}
      {comparison.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Period Comparison</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {comparison.map(c => (
              <div key={c.metric} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase mb-1">{c.metric}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-gray-900">{formatNumber(Math.round(c.current_value))}</span>
                  {c.change_pct !== null && (
                    <span className={cn('text-sm font-medium', c.change_pct >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {c.change_pct >= 0 ? '+' : ''}{c.change_pct.toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">Previous: {formatNumber(Math.round(c.previous_value))}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Reports History */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Generated Reports</h3>
        <DataTable
          columns={[
            { key: 'title', label: 'Title', sortable: true, render: (r: GeneratedReport) => (
              <span className="font-medium text-gray-900">{r.title}</span>
            )},
            { key: 'report_type', label: 'Type', sortable: true, render: (r: GeneratedReport) => (
              <span className="capitalize">{r.report_type.replace(/_/g, ' ')}</span>
            )},
            { key: 'date_start', label: 'Period', render: (r: GeneratedReport) => `${r.date_start} to ${r.date_end}` },
            { key: 'created_at', label: 'Generated', render: (r: GeneratedReport) => new Date(r.created_at).toLocaleDateString() },
            { key: 'actions', label: '', render: (r: GeneratedReport) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportReport(r.id, 'csv')}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Export CSV"
                >
                  <FileDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => exportReport(r.id, 'xlsx')}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Export XLSX"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              </div>
            )},
          ]}
          data={generatedReports}
          keyField="id"
          emptyMessage="No reports generated yet."
        />
      </div>
    </div>
  )
}
