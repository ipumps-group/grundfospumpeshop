'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAdAccounts, getAdAccount } from '@/lib/ads/supabase'
import { StatusBadge } from '@/components/ads/status-badge'
import { cn } from '@/lib/ads/utils'
import type { AdAccount, IntegrationStatus } from '@/lib/ads/types'
import {
  RefreshCw, CheckCircle2, XCircle, AlertCircle, ExternalLink,
  Key, Eye, EyeOff,
} from 'lucide-react'

export default function IntegrationsPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [showTokens, setShowTokens] = useState(false)
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; steps: any[] }>>({})

  const envVars = [
    { key: 'GOOGLE_ADS_DEVELOPER_TOKEN', label: 'Google Ads Developer Token', doc: 'https://developers.google.com/google-ads/api/docs/get-started/dev-token' },
    { key: 'GOOGLE_ADS_CLIENT_ID', label: 'Google Ads OAuth Client ID', doc: 'https://console.cloud.google.com/apis/credentials' },
    { key: 'GOOGLE_ADS_CLIENT_SECRET', label: 'Google Ads OAuth Client Secret', doc: '' },
    { key: 'GOOGLE_ADS_REFRESH_TOKEN', label: 'Google Ads Refresh Token', doc: 'https://developers.google.com/identity/protocols/oauth2/web-server#offline' },
    { key: 'GOOGLE_ADS_CUSTOMER_ID', label: 'Google Ads Customer ID (no dashes)', doc: '' },
    { key: 'GOOGLE_ADS_LOGIN_CUSTOMER_ID', label: 'Google Ads MCC Login ID (optional)', doc: '' },
    { key: 'META_GRAPH_API_VERSION', label: 'Meta Graph API Version', doc: 'https://developers.facebook.com/docs/graph-api/changelog' },
    { key: 'META_APP_ID', label: 'Meta App ID', doc: '' },
    { key: 'META_APP_SECRET', label: 'Meta App Secret', doc: '' },
    { key: 'META_ACCESS_TOKEN', label: 'Meta System User Token', doc: 'https://developers.facebook.com/docs/marketing-api/access' },
    { key: 'META_AD_ACCOUNT_ID', label: 'Meta Ad Account ID (with act_ prefix)', doc: '' },
    { key: 'META_BUSINESS_ID', label: 'Meta Business ID', doc: '' },
    { key: 'META_PAGE_ID', label: 'Meta Page ID', doc: '' },
    { key: 'META_PIXEL_ID', label: 'Meta Pixel ID', doc: '' },
    { key: 'GA4_PROPERTY_ID', label: 'GA4 Property ID', doc: 'https://developers.google.com/analytics/devguides/reporting/data/v1' },
    { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', doc: 'https://platform.openai.com/api-keys' },
  ] as const

  const checkConnection = useCallback(async () => {
    const st: IntegrationStatus = {
      google_ads: { connected: false, error: null, lastSync: null, permissions: [] },
      meta_ads: { connected: false, error: null, lastSync: null, permissions: [] },
      ga4: { connected: false, error: null, lastSync: null, propertyId: null },
    }

    // Checks are best-effort on client side — full validation via API routes
    st.google_ads.connected = !!(
      process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID ||
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    )

    st.meta_ads.connected = !!process.env.NEXT_PUBLIC_META_ACCESS_TOKEN ||
      !!process.env.META_ACCESS_TOKEN

    if (process.env.NEXT_PUBLIC_GA4_PROPERTY_ID || process.env.GA4_PROPERTY_ID) {
      st.ga4.connected = true
      st.ga4.propertyId = process.env.GA4_PROPERTY_ID || process.env.NEXT_PUBLIC_GA4_PROPERTY_ID || null
    }

    // Get last sync times from accounts
    for (const acc of accounts) {
      const platform = acc.platform?.slug
      if (platform === 'google_ads') {
        st.google_ads.lastSync = acc.last_sync_at
      } else if (platform === 'meta_ads') {
        st.meta_ads.lastSync = acc.last_sync_at
      }
    }

    setStatus(st)
  }, [accounts])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getAdAccounts()
      if (data) setAccounts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (accounts.length) checkConnection() }, [accounts, checkConnection])

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

  const envStatus = (key: string) => {
    const val = process.env[key as keyof typeof process.env] || process.env[`NEXT_PUBLIC_${key}` as keyof typeof process.env]
    return !!val
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">Connect your ad platforms and configure API credentials</p>
        </div>
        <button
          onClick={() => { load(); checkConnection() }}
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
          {envVars.map(env => {
            const isSet = envStatus(env.key)
            return (
              <div key={env.key} className="px-5 py-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{env.label}</span>
                    {env.doc && (
                      <a href={env.doc} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <code className="text-xs text-gray-400">{env.key}</code>
                </div>
                <div className="flex items-center gap-3">
                  {showTokens ? (
                    <code className="text-xs text-gray-600 max-w-[200px] truncate">
                      {process.env[env.key as keyof typeof process.env] || process.env[`NEXT_PUBLIC_${env.key}` as keyof typeof process.env] || '(empty)'}
                    </code>
                  ) : null}
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

      {/* TODOs */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="font-semibold text-amber-800 mb-2">TODO: API Credentials &amp; Permissions</h3>
        <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
          <li><strong>Google Ads</strong> (API v24): Apply for Developer Token at <a href="https://developers.google.com/google-ads/api/docs/get-started/dev-token" target="_blank" className="underline">Google Ads Dev Center</a></li>
          <li>Google Ads: Set up OAuth 2.0 Web Application client in <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline">Google Cloud Console</a></li>
          <li>Google Ads: Generate refresh token via <a href="https://developers.google.com/oauthplayground" target="_blank" className="underline">OAuth Playground</a> with scope <code>https://www.googleapis.com/auth/adwords</code></li>
          <li>Google Ads: Add authorized redirect URI <code>https://developers.google.com/oauthplayground</code> to the OAuth client</li>
          <li>Google Ads: Ensure the Google account is added as a <strong>Test user</strong> in OAuth consent screen if app is in Testing mode</li>
          <li>Google Ads: Use <code>GOOGLE_ADS_CUSTOMER_ID</code> (no dashes) for the ad account, <code>GOOGLE_ADS_LOGIN_CUSTOMER_ID</code> only when accessing through an MCC</li>
          <li><strong>Meta</strong> (Graph API v25.0): Create a System User in Business Settings → Users → System Users</li>
          <li>Meta: Assign the System User to the Ad Account, Page, and App with <code>ads_management</code>, <code>ads_read</code>, <code>read_insights</code>, <code>business_management</code>, <code>pages_manage_ads</code></li>
          <li>Meta: Generate a long-lived token from the System User. Include <code>META_APP_SECRET</code> for <code>appsecret_proof</code></li>
          <li>Meta: <code>META_AD_ACCOUNT_ID</code> must include the <code>act_</code> prefix (e.g. <code>act_2215256342558034</code>)</li>
          <li>Meta: The app must be <strong>Live/Public</strong> to create ads (Development mode blocks creative creation)</li>
          <li><strong>GA4</strong>: Uses the same Google OAuth as Google Ads — ensure the Google account has GA4 access</li>
          <li><strong>OpenAI</strong>: Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" className="underline">platform.openai.com</a></li>
          <li>Supabase: Enable the <code>service_role</code> key and run the migration SQL (<code>migrations/001_ads_schema.sql</code>)</li>
          <li>Deploy to Vercel and set all environment variables in Vercel dashboard</li>
        </ul>
      </div>
    </div>
  )
}
