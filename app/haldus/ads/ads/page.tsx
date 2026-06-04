'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatusBadge } from '@/components/ads/status-badge'
import { DataTable } from '@/components/ads/data-table'
import { cn } from '@/lib/ads/utils'
import type { Ad } from '@/lib/ads/types'
import { RefreshCw } from 'lucide-react'

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ads/ads')
      const data = await res.json()
      setAds(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ads & Creatives</h1>
          <p className="text-sm text-gray-500 mt-1">{ads.length} ads across all campaigns</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <DataTable
        loading={loading}
        columns={[
          { key: 'ad_name', label: 'Name', sortable: true, render: (r: Ad) => <span className="font-medium">{r.ad_name}</span> },
          { key: 'platform', label: 'Platform', sortable: true, render: (r: Ad) => <span className="capitalize">{r.platform.replace('_', ' ')}</span> },
          { key: 'status', label: 'Status', sortable: true, render: (r: Ad) => <StatusBadge status={r.status} /> },
          { key: 'ad_type', label: 'Type' },
        ]}
        data={ads}
        keyField="id"
        searchable
        emptyMessage="No ads found. Sync your ad accounts first."
      />
    </div>
  )
}
