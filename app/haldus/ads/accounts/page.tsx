'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatusBadge } from '@/components/ads/status-badge'
import { DataTable } from '@/components/ads/data-table'
import { cn } from '@/lib/ads/utils'
import type { AdAccount } from '@/lib/ads/types'
import { RefreshCw, Plus } from 'lucide-react'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ads/init')
      const data = await res.json()
      setAccounts(data.accounts || [])
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
          <h1 className="text-2xl font-bold text-gray-900">Ad Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">{accounts.length} connected accounts</p>
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
          { key: 'account_name', label: 'Name', sortable: true, render: (r: AdAccount) => <span className="font-medium">{r.account_name}</span> },
          { key: 'platform', label: 'Platform', render: (r: AdAccount) => r.platform?.name || 'Unknown' },
          { key: 'platform_account_id', label: 'Account ID' },
          { key: 'status', label: 'Status', render: (r: AdAccount) => <StatusBadge status={r.status} /> },
          { key: 'last_sync_at', label: 'Last Sync', render: (r: AdAccount) => r.last_sync_at ? new Date(r.last_sync_at).toLocaleString() : 'Never' },
        ]}
        data={accounts}
        keyField="id"
        emptyMessage="No accounts connected. Go to Integrations settings."
      />
    </div>
  )
}
