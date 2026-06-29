'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAdAccounts } from '@/lib/ads/supabase'
import { StatusBadge } from '@/components/ads/status-badge'
import { cn } from '@/lib/ads/utils'
import type { AdAccount, IntegrationStatus } from '@/lib/ads/types'
import {
  RefreshCw, CheckCircle2, XCircle, AlertCircle, ExternalLink,
  Key, Eye, EyeOff, Play,
} from 'lucide-react'

interface ConfigStatus {
  connected: boolean
  vars: Record<string, boolean>
  doc: string
}

const ENV_LABELS: Record<string, string> = {
  GOOGLE_ADS_DEVELOPER_TOKEN: 'Google Ads Developer Token',
  GOOGLE_ADS_CLIENT_ID: 'Google Ads OAuth Client ID',
  GOOGLE_ADS_CLIENT_SECRET: 'Google Ads OAuth Client Secret',
  GOOGLE_ADS_REFRESH_TOKEN: 'Google Ads Refresh Token',
  GOOGLE_ADS_CUSTOMER_ID: 'Google Ads Customer ID (no dashes)',
  GOOGLE_ADS_LOGIN_CUSTOMER_ID: 'Google Ads MCC Login ID (optional)',
  META_GRAPH_API_VERSION: 'Meta Graph API Version',
  META_APP_SECRET: 'Meta App Secret',
  META_ACCESS_TOKEN: 'Meta System User Token',
  META_AD_ACCOUNT_ID: 'Meta Ad Account ID (with act_ prefix)',
  META_BUSINESS_ID: 'Meta Business ID (optional)',
  META_PAGE_ID: 'Meta Page ID (optional)',
  GA4_PROPERTY_ID: 'GA4 Property ID',
  OPENAI_API_KEY: 'OpenAI API Key',
}

const PLATFORM_LABELS: Record<string, string> = {
  google_ads: 'Google Ads',
  meta_ads: 'Meta Ads',
  ga4: 'GA4',
  openai: 'OpenAI',
}

export default function IntegrationsPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [configStatus, setConfigStatus] = useState<Record<string, ConfigStatus> | null>(null)
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [showTokens, setShowTokens] = useState(false)
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; steps: any[] }>>({})

  const loadConfigStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ads/config-status')
      if (res.ok) {
        const data = await res.json()
        setConfigStatus(data)
      }
    } catch (err) {
      console.error('Config status load error:', err)
    }
  }, [])

  const checkConnection = useCallback(async () => {
    const st: IntegrationStatus = {
      google_ads: { connected: false, error: null, lastSync: null, permissions: [] },
      meta_ads: { connected: false, error: null, lastSync: null, permissions: [] },
      ga4: { connected: false, error: null, lastSync: null, propertyId: null },
    }

    if (configStatus) {
      st.google_ads.connected = configStatus.google_ads?.connected ?? false
      st.meta_ads.connected = configStatus.meta_ads?.connected ?? false
      st.ga4.connected = configStatus.ga4?.connected ?? false
      st.ga4.propertyId = process.env.NEXT_PUBLIC_GA4_PROPERTY_ID || null
    }

    for (const acc of accounts) {
      const platform = acc.platform?.slug
      if (platform === 'google_ads') st.google_ads.lastSync = acc.last_sync_at
      else if (platform === 'meta_ads') st.meta_ads.lastSync = acc.last_sync_at
    }

    setStatus(st)
  }, [accounts, configStatus])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getAdAccounts()
      if (data) setAccounts(data)
      await loadConfigStatus()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [loadConfigStatus])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (accounts.length > 0 || configStatus) checkConnection() }, [accounts, configStatus, checkConnection])

  const testConnection = async (platform: string) => {
    setTestingPlatform(platform)
    try {
      const res = await fetch(`/api/ads/test?platform=${platform}`)
      const data = await res.json()
      setTestResults(prev => ({ ...prev, [platform]: data }))
    } catch (err: any) {
      setTestResults(prev => ({ ...prev, [platform]: { ok: false, steps: [{ step: 'error', ok: false, detail: err.message }] } }))
    } finally {
      setTestingPlatform(null)
    }
  }

  const quickSync = async (platform: string) => {
    setTestingPlatform(`sync-${platform}`)
    try {
      await fetch('/api/ads/sync/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, syncType: 'manual' }),
      })
      await load()
    } catch (err: any) {
      console.error(err)
    } finally {
      setTestingPlatform(null)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">Connect your ad platforms and configure API credentials</p>
        </div>
        <button
          onClick={() => { load() }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Check Status
        </button>
      </div>

      {/* Connection Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['google_ads', 'meta_ads', 'ga4'] as const).map(platform => {
          const s = status?.[platform]
          const cs = configStatus?.[platform]
          return (
            <div key={platform} className={cn(
              'bg-white rounded-xl border p-5',
              s?.connected ? 'border-green-200' : 'border-gray-200',
            )}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 capitalize">{platform.replace('_', ' ')}</h3>
                {s?.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-300" />
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={cn('font-medium', s?.connected ? 'text-green-600' : 'text-gray-400')}>
                    {s?.connected ? 'Connected' : 'Not configured'}
                  </span>
                </div>
                {s?.lastSync && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Sync</span>
                    <span className="text-gray-700">{new Date(s.lastSync).toLocaleDateString()}</span>
                  </div>
                )}
                {s?.error && (
                  <div className="flex items-start gap-2 text-red-600 mt-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{s.error}</span>
                  </div>
                )}
                <button
                  onClick={() => testConnection(platform)}
                  disabled={testingPlatform === platform}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  {testingPlatform === platform ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                  {testingPlatform === platform ? 'Testing...' : 'Test Connection'}
                </button>
                {cs?.connected && (
                  <button
                    onClick={() => quickSync(platform)}
                    disabled={testingPlatform === `sync-${platform}`}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" />
                    {testingPlatform === `sync-${platform}` ? 'Syncing...' : 'Sync Now'}
                  </button>
                )}
                {testResults[platform] && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-2 max-h-40 overflow-y-auto text-xs">
                    {testResults[platform].steps?.filter((s: any) => !s.step.startsWith('  ')).map((s: any, i: number) => (
                      <div key={i} className={cn('flex items-start gap-1 py-0.5', s.ok ? 'text-green-700' : 'text-red-600')}>
                        <span>{s.ok ? '✅' : '❌'}</span>
                        <span className="font-medium">{s.step}:</span>
                        <span className="truncate">{s.detail || 'ok'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Environment Variables */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Required Environment Variables</h3>
          <button
            onClick={() => setShowTokens(!showTokens)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showTokens ? 'Hide' : 'Show'} values
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {Object.entries(ENV_LABELS).map(([key, label]) => {
            if (!configStatus) return null
            // Find which platform this var belongs to
            let isSet = false
            for (const status of Object.values(configStatus)) {
              if (key in status.vars && status.vars[key]) {
                isSet = true
                break
              }
            }
            return (
              <div key={key} className="px-5 py-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                  </div>
                  <code className="text-xs text-gray-400">{key}</code>
                </div>
                <div className="flex items-center gap-3">
                  {isSet ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-300 flex-shrink-0" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Connected Accounts</h3>
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No accounts connected. Configure environment variables and run a sync.
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{acc.account_name}</p>
                  <p className="text-xs text-gray-500">{acc.platform?.name} · {acc.platform_account_id}</p>
                </div>
                <StatusBadge status={acc.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
