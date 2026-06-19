'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ShoppingBag, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const canManageOrders = (role: string) => ['manager', 'superadmin'].includes(role)

const PAGE_SIZE = 20

const STATUS_LABELS: Record<string, string> = {
  pending:    'Ootel',
  paid:       'Makstud',
  processing: 'Töötlemisel',
  shipped:    'Saadetud',
  delivered:  'Kohale toimetatud',
  cancelled:  'Tühistatud',
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-gray-100 text-gray-600',
  paid:       'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-amber-100 text-amber-700',
  delivered:  'bg-emerald-100 text-emerald-700',
  cancelled:  'bg-red-100 text-red-600',
}

interface Order {
  id: string
  montonio_order_id: string | null
  status: string
  total: number
  created_at: string
  shipping_address: Record<string, string> | null
}

export default function TellimusedPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [orders, setOrders]   = useState<Order[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(0)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (profile && !canManageOrders(profile.role)) {
      router.replace('/haldus')
    }
  }, [profile, router])

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('orders')
      .select('id, montonio_order_id, status, total, created_at, shipping_address', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (statusFilter) q = q.eq('status', statusFilter)

    const { data, count } = await q
    setOrders(data ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  // Client-side search filter
  const filtered = search.trim()
    ? orders.filter(o => {
        const s = search.trim().toLowerCase()
        const sa = o.shipping_address ?? {}
        return (
          (sa.full_name ?? '').toLowerCase().includes(s) ||
          (sa.customer_email ?? '').toLowerCase().includes(s) ||
          (o.montonio_order_id ?? '').toLowerCase().includes(s) ||
          o.id.toLowerCase().includes(s)
        )
      })
    : orders

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function orderRef(o: Order) {
    return (o.montonio_order_id ?? o.id).toString().slice(-8).toUpperCase()
  }

  function toggleSelect(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(o => o.id)))
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return
    if (!confirm(`Kustuta ${selected.size} tellimus?`)) return

    setDeleting(true)
    const ids = Array.from(selected)
    const token = (await supabase.auth.getSession()).data.session?.access_token
    
    const results = await Promise.allSettled(
      ids.map(id =>
        fetch(`/api/haldus/orders/${id}/delete`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(e => { console.error(`Failed to delete order ${id}:`, e); return null })
      )
    )

    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value && !r.value.ok)).length
    if (failed > 0) {
      alert(`${failed} of ${ids.length} orders failed to delete`)
    }

    setSelected(new Set())
    await load()
    setDeleting(false)
  }

  async function deleteSingle(id: string) {
    if (!confirm('Kustuta see tellimus?')) return
    
    setDeleting(true)
    const token = (await supabase.auth.getSession()).data.session?.access_token
    
    await fetch(`/api/haldus/orders/${id}/delete`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    
    await load()
    setDeleting(false)
  }

  if (profile && !canManageOrders(profile.role)) return null

  const isSuperadmin = profile?.role === 'superadmin'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tellimused</h1>
        <span className="text-sm text-gray-500">Kokku {total}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Otsi nime, emaili, nr..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] bg-white"
        >
          <option value="">Kõik staatused</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {isSuperadmin && selected.size > 0 && (
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[15px] font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={16} />
            Kustuta ({selected.size})
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
                {isSuperadmin && (
                  <th className="text-left px-4 py-3 font-semibold w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
                    />
                  </th>
                )}
                <th className="text-left px-4 py-3 font-semibold">Nr</th>
                <th className="text-left px-4 py-3 font-semibold">Klient</th>
                <th className="text-left px-4 py-3 font-semibold">E-post</th>
                <th className="text-right px-4 py-3 font-semibold">Summa</th>
                <th className="text-center px-4 py-3 font-semibold">Staatus</th>
                <th className="text-left px-4 py-3 font-semibold">Kuupäev</th>
                <th className="w-24 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={isSuperadmin ? 8 : 7} className="py-16 text-center">
                    <div className="w-7 h-7 border-2 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={isSuperadmin ? 8 : 7} className="py-16 text-center text-gray-400">
                    <ShoppingBag size={30} className="mx-auto mb-2 text-gray-300" />
                    Tellimusi ei leitud
                  </td>
                </tr>
              ) : filtered.map(o => {
                const sa = o.shipping_address ?? {}
                return (
                  <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                    {isSuperadmin && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(o.id)}
                          onChange={() => toggleSelect(o.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono text-[13px] font-semibold text-[#003366]">
                      #{orderRef(o)}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {sa.full_name ?? sa.customer_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{sa.customer_email ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {o.total.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[12px] font-semibold ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-[13px]">
                      {new Date(o.created_at).toLocaleDateString('et-EE')}
                    </td>
                    <td className="px-4 py-3 text-right flex items-center gap-2">
                      <Link href={`/haldus/tellimused/${o.id}`} className="text-[14px] text-[#003366] hover:underline font-medium">
                        Vaata
                      </Link>
                      {isSuperadmin && (
                        <button
                          onClick={() => deleteSingle(o.id)}
                          disabled={deleting}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          title="Kustuta"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
            <span className="text-[14px] text-gray-500">Lk {page + 1} / {totalPages}</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-[14px] font-medium rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Eelmine
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-[14px] font-medium rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Järgmine →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}