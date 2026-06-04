'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAdAccounts, getChangeLogs, getChangeRequests } from '@/lib/ads/supabase'
import { StatusBadge } from '@/components/ads/status-badge'
import { DataTable } from '@/components/ads/data-table'
import { cn } from '@/lib/ads/utils'
import type { ChangeLog, ChangeRequest } from '@/lib/ads/types'
import { RefreshCw, History, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react'

export default function ChangeLogPage() {
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([])
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'logs' | 'requests'>('logs')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: accounts } = await getAdAccounts()
      if (accounts?.length) {
        const cid = accounts[0].company_id
        const [logsRes, reqRes] = await Promise.all([
          getChangeLogs(cid, 100),
          getChangeRequests(cid),
        ])
        if (logsRes.data) setChangeLogs(logsRes.data)
        if (reqRes.data) setChangeRequests(reqRes.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const approveRequest = async (id: string) => {
    const res = await fetch('/api/ads/change-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'approved' }),
    })
    if (res.ok) await load()
  }

  const rejectRequest = async (id: string) => {
    const res = await fetch('/api/ads/change-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'rejected' }),
    })
    if (res.ok) await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Change Log</h1>
          <p className="text-sm text-gray-500 mt-1">Track all mutations and approval requests</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setTab('logs')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-colors',
              tab === 'logs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500',
            )}
          >
            <History className="w-4 h-4 inline mr-1" />
            Executed Changes ({changeLogs.length})
          </button>
          <button
            onClick={() => setTab('requests')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-colors',
              tab === 'requests' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500',
            )}
          >
            <Clock className="w-4 h-4 inline mr-1" />
            Pending Approvals ({changeRequests.filter(r => r.status === 'pending').length})
          </button>
        </div>
      </div>

      {tab === 'logs' ? (
        <DataTable
          loading={loading}
          columns={[
            { key: 'action_type', label: 'Action', sortable: true, render: (r: ChangeLog) => (
              <span className="font-medium text-gray-900 capitalize">{r.action_type.replace(/_/g, ' ')}</span>
            )},
            { key: 'target_name', label: 'Target', render: (r: ChangeLog) => r.target_name || r.target_type || '-' },
            { key: 'platform', label: 'Platform', sortable: true, render: (r: ChangeLog) => (
              <span className="capitalize">{r.platform.replace('_', ' ')}</span>
            )},
            { key: 'result', label: 'Result', sortable: true, render: (r: ChangeLog) => (
              <StatusBadge status={r.result} />
            )},
            { key: 'performed_at', label: 'Date', sortable: true, render: (r: ChangeLog) => (
              new Date(r.performed_at).toLocaleString()
            )},
          ]}
          data={changeLogs}
          keyField="id"
          emptyMessage="No changes have been executed yet."
        />
      ) : (
        <div className="space-y-3">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : changeRequests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
              <p>No pending approvals.</p>
            </div>
          ) : (
            changeRequests.filter(r => r.status === 'pending').map(cr => (
              <div key={cr.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{cr.title}</h3>
                      <StatusBadge status={cr.status} />
                    </div>
                    {cr.description && <p className="text-sm text-gray-600 mb-2">{cr.description}</p>}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                      <span>Platform: <strong className="capitalize">{cr.platform.replace('_', ' ')}</strong></span>
                      <span>Action: <strong className="capitalize">{cr.action_type.replace(/_/g, ' ')}</strong></span>
                      <span>Target: <strong>{cr.target_type}</strong></span>
                    </div>
                    {(cr.before_values || cr.after_values) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {cr.before_values && (
                          <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-700 mb-1">Before</p>
                            <pre className="text-xs text-red-600">{JSON.stringify(cr.before_values, null, 2)}</pre>
                          </div>
                        )}
                        {cr.after_values && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-green-700 mb-1">After</p>
                            <pre className="text-xs text-green-600">{JSON.stringify(cr.after_values, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => approveRequest(cr.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => rejectRequest(cr.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
