'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Users, UserPlus } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const canManageOrders = (role: string) => ['manager', 'superadmin'].includes(role)

const PAGE_SIZE = 25

const ROLE_LABELS: Record<string, string> = {
  customer:   'Klient',
  manager:    'Manager',
  superadmin: 'Superadmin',
}

const STATUS_COLORS: Record<string, string> = {
  active:       'bg-green-100 text-green-700',
  blocked:      'bg-red-100 text-red-600',
  unconfirmed:  'bg-amber-100 text-amber-700',
}

const STATUS_LABELS: Record<string, string> = {
  active:       'Aktiivne',
  blocked:      'Blokeeritud',
  unconfirmed:  'Kinnitamata',
}

interface Client {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: string
  status: string | null
  created_at: string
  unconfirmed?: boolean
}

export default function KliendidPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(0)
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    if (profile && !canManageOrders(profile.role)) router.replace('/haldus')
  }, [profile, router])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search.trim()) params.set('search', search.trim())
    const res = await fetch(`/api/haldus/clients?${params}`)
    if (res.ok) {
      const data = await res.json()
      setClients(data.clients ?? [])
      setTotal(data.total ?? 0)
      setApiError(null)
    } else {
      const err = await res.json().catch(() => ({}))
      setApiError(err.error ?? `Viga (${res.status})`)
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (profile && !canManageOrders(profile.role)) return null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kliendid</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Kokku {total}</span>
          <Link
            href="/haldus/kliendid/uus"
            className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white text-[14px] font-semibold rounded-xl hover:bg-[#004080] transition-colors"
          >
            <UserPlus size={15} />
            Uus klient
          </Link>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Otsi nime või emaili..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] bg-white"
        />
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[14px] text-red-700">
          <strong>API viga:</strong> {apiError}
          {apiError === 'Forbidden' && (
            <span className="block mt-1 text-[13px] text-red-500">
              Teie profiil puudub andmebaasist või rolliks on seatud &quot;customer&quot;. Parandage Supabase SQL editoris (vt allpool).
            </span>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
                <th className="text-left px-4 py-3 font-semibold">Nimi</th>
                <th className="text-left px-4 py-3 font-semibold">E-post</th>
                <th className="text-left px-4 py-3 font-semibold">Telefon</th>
                <th className="text-center px-4 py-3 font-semibold">Roll</th>
                <th className="text-center px-4 py-3 font-semibold">Staatus</th>
                <th className="text-left px-4 py-3 font-semibold">Liitus</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-7 h-7 border-2 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <Users size={30} className="mx-auto mb-2 text-gray-300" />
                    Kliente ei leitud
                  </td>
                </tr>
              ) : clients.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[12px] font-semibold bg-blue-50 text-blue-700">
                      {ROLE_LABELS[c.role] ?? c.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[12px] font-semibold ${STATUS_COLORS[c.status ?? 'active'] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[c.status ?? 'active'] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-[13px]">
                    {new Date(c.created_at).toLocaleDateString('et-EE')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/haldus/kliendid/${c.id}`} className="text-[14px] text-[#003366] hover:underline font-medium">
                      Vaata
                    </Link>
                  </td>
                </tr>
              ))}
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
