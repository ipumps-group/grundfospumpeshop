'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react'
import { getAdAccounts, getRecommendations, updateRecommendation } from '@/lib/ads/supabase'
import { StatusBadge } from '@/components/ads/status-badge'
import { DataTable } from '@/components/ads/data-table'
import { cn, severityColor } from '@/lib/ads/utils'
import type { Recommendation } from '@/lib/ads/types'
import { RefreshCw, Lightbulb, AlertTriangle, CheckCircle2, XCircle, Sparkles, Loader2 } from 'lucide-react'

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filter, setFilter] = useState<string>('open')
  const [selected, setSelected] = useState<Recommendation | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: accounts } = await getAdAccounts()
      if (accounts?.length) {
        const { data } = await getRecommendations(accounts[0].company_id, filter === 'all' ? undefined : filter)
        if (data) setRecommendations(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const generateRecommendations = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ads/recommendations', { method: 'POST' })
      if (res.ok) await load()
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const dismissRecommendation = async (id: string) => {
    await updateRecommendation(id, { status: 'dismissed' } as any)
    await load()
  }

  const applyRecommendation = async (rec: Recommendation) => {
    if (rec.change_request_payload) {
      const res = await fetch('/api/ads/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rec.change_request_payload,
          recommendation_id: rec.id,
          source: 'ai_recommendation',
        }),
      })
      if (res.ok) {
        await updateRecommendation(rec.id, { status: 'applied' } as any)
        await load()
      }
    }
  }

  const severityIcon = (severity: string) => {
    if (severity === 'high') return <AlertTriangle className="w-5 h-5 text-red-500" />
    if (severity === 'medium') return <Lightbulb className="w-5 h-5 text-yellow-500" />
    return <Sparkles className="w-5 h-5 text-blue-500" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Recommendations</h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered analysis and optimization suggestions</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="open">Open</option>
            <option value="applied">Applied</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={generateRecommendations}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Analyzing...' : 'Generate AI Analysis'}
          </button>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">High Priority</p>
          <p className="text-2xl font-bold text-red-600">{recommendations.filter(r => r.severity === 'high').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Medium</p>
          <p className="text-2xl font-bold text-yellow-600">{recommendations.filter(r => r.severity === 'medium').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Low</p>
          <p className="text-2xl font-bold text-blue-600">{recommendations.filter(r => r.severity === 'low').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{recommendations.length}</p>
        </div>
      </div>

      {/* Recommendation cards */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No recommendations yet.</p>
          <p className="text-sm text-gray-400 mt-1">Sync your data and click &quot;Generate AI Analysis&quot;.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map(rec => (
            <div key={rec.id} className={cn('bg-white rounded-xl border p-5', severityColor(rec.severity))}>
              <div className="flex items-start gap-4">
                <div className="mt-1">{severityIcon(rec.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                    <StatusBadge status={rec.severity} />
                    <StatusBadge status={rec.status} />
                  </div>
                  {rec.description && <p className="text-sm text-gray-600 mb-2">{rec.description}</p>}
                  {rec.reason && (
                    <div className="text-sm text-gray-700 mb-2">
                      <strong>Why:</strong> {rec.reason}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    {rec.platform && <span>Platform: <strong className="capitalize">{rec.platform}</strong></span>}
                    {rec.confidence_score && <span>Confidence: <strong>{rec.confidence_score}%</strong></span>}
                    {rec.expected_impact && <span>Impact: <strong>{rec.expected_impact}</strong></span>}
                  </div>
                  {rec.suggested_action && (
                    <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                      <strong>Suggested action:</strong> {rec.suggested_action}
                    </p>
                  )}
                  {rec.data_evidence && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">View data evidence</summary>
                      <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-40 overflow-auto">
                        {JSON.stringify(rec.data_evidence, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {rec.status === 'open' && (
                    <>
                      <button
                        onClick={() => applyRecommendation(rec)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Apply
                      </button>
                      <button
                        onClick={() => dismissRecommendation(rec.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200"
                      >
                        <XCircle className="w-3 h-3" /> Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
