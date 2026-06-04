'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/ads/status-badge'
import { DataTable } from '@/components/ads/data-table'
import { formatCurrency, cn } from '@/lib/ads/utils'
import type { Campaign } from '@/lib/ads/types'
import { RefreshCw, Plus } from 'lucide-react'

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ads/init')
      const data = await res.json()
      setCampaigns(data.campaigns || [])
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
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">{campaigns.length} campaigns across all accounts</p>
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
          { key: 'campaign_name', label: 'Name', sortable: true, render: (r: Campaign) => (
            <span className="font-medium text-gray-900">{r.campaign_name}</span>
          )},
          { key: 'platform', label: 'Platform', sortable: true, render: (r: Campaign) => (
            <span className="capitalize">{r.platform.replace('_', ' ')}</span>
          )},
          { key: 'status', label: 'Status', sortable: true, render: (r: Campaign) => <StatusBadge status={r.status} /> },
          { key: 'objective', label: 'Objective', sortable: true },
          { key: 'daily_budget', label: 'Daily Budget', sortable: true, render: (r: Campaign) => r.daily_budget ? formatCurrency(r.daily_budget) : '-' },
          { key: 'start_date', label: 'Start Date', sortable: true },
        ]}
        data={campaigns}
        keyField="id"
        searchable
        onRowClick={(row: Campaign) => router.push(`/haldus/ads/campaigns/${row.id}`)}
        emptyMessage="No campaigns found. Sync your ad accounts first."
      />
    </div>
  )
}
