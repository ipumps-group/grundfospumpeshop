'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ShoppingBag, MailCheck, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const canManageOrders   = (role: string) => ['manager', 'superadmin'].includes(role)
const canManageProducts = (role: string) => role === 'superadmin'

const ROLE_LABELS: Record<string, string> = {
  customer:   'Klient',
  manager:    'Manager',
  superadmin: 'Superadmin',
}

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

interface Client {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: string
  status: string | null
  created_at: string
}

interface Order {
  id: string
  montonio_order_id: string | null
  status: string
  total: number
  created_at: string
}

export default function KlientDetailPage() {
  const { profile } = useAuth()
  const router      = useRouter()
  const { id }      = useParams<{ id: string }>()

  const [client, setClient]         = useState<Client | null>(null)
  const [orders, setOrders]         = useState<Order[]>([])
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)
  const [emailConfirmed, setEmailConfirmed] = useState<boolean | null>(null)

  const [saving, setSaving]       = useState(false)
  const [saveMsg, setSaveMsg]     = useState('')
  const [newRole, setNewRole]     = useState('')
  const [editName, setEditName]   = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (profile && !canManageOrders(profile.role)) router.replace('/haldus')
  }, [profile, router])

  useEffect(() => {
    if (!id) return
    async function load() {
      const res = await fetch(`/api/haldus/clients/${id}`)
      if (!res.ok) { setNotFound(true); setLoading(false); return }
      const data = await res.json()
      setClient(data.profile)
      setNewRole(data.profile.role)
      setEditName(data.profile.full_name ?? '')
      setEditPhone(data.profile.phone ?? '')
      setOrders(data.orders ?? [])
      setEmailConfirmed(!!data.emailConfirmedAt)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleBlockToggle() {
    if (!client) return
    setSaving(true); setSaveMsg('')
    const newStatus = client.status === 'blocked' ? 'active' : 'blocked'
    const res = await fetch(`/api/haldus/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setClient(c => c ? { ...c, status: newStatus } : c)
      setSaveMsg(newStatus === 'blocked' ? 'Klient blokeeritud.' : 'Klient aktiveeritud.')
    } else {
      setSaveMsg('Viga!')
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function handleConfirmEmail() {
    setSaving(true); setSaveMsg('')
    const res = await fetch(`/api/haldus/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm_email' }),
    })
    if (res.ok) {
      setEmailConfirmed(true)
      setSaveMsg('Email kinnitatud.')
    } else {
      setSaveMsg('Viga!')
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function handleSaveProfile() {
    setSaving(true); setSaveMsg('')
    const res = await fetch(`/api/haldus/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: editName, phone: editPhone }),
    })
    if (res.ok) {
      setClient(c => c ? { ...c, full_name: editName || null, phone: editPhone || null } : c)
      setSaveMsg('Profiil salvestatud.')
    } else {
      setSaveMsg('Viga!')
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function handleRoleChange() {
    if (!client || newRole === client.role) return
    setSaving(true); setSaveMsg('')
    const res = await fetch(`/api/haldus/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      setClient(c => c ? { ...c, role: newRole } : c)
      setSaveMsg('Roll uuendatud.')
    } else {
      setSaveMsg('Viga!')
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function handleDelete() {
    setSaving(true); setSaveMsg('')
    const res = await fetch(`/api/haldus/clients/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.replace('/haldus/kliendid')
    } else {
      const data = await res.json().catch(() => ({}))
      setSaveMsg(data.error ?? 'Viga!')
      setSaving(false)
    }
  }

  if (profile && !canManageOrders(profile.role)) return null
  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (notFound || !client) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">Klienti ei leitud.</p>
      <Link href="/haldus/kliendid" className="text-[#003366] hover:underline">← Tagasi</Link>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/haldus/kliendid" className="text-gray-400 hover:text-[#003366] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{client.full_name ?? client.email}</h1>
        {client.status === 'blocked' && (
          <span className="px-2.5 py-0.5 rounded-full text-[13px] font-semibold bg-red-100 text-red-600">Blokeeritud</span>
        )}
      </div>

      {saveMsg && (
        <div className={`px-4 py-3 rounded-xl text-[14px] ${saveMsg.includes('Viga') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {saveMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left */}
        <div className="lg:col-span-2 space-y-5">

          {/* Tellimused */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag size={16} className="text-gray-400" />
              Tellimused ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <p className="text-gray-400 text-[14px]">Tellimusi pole</p>
            ) : (
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-left">
                    <th className="pb-2 font-semibold">Nr</th>
                    <th className="pb-2 font-semibold text-right">Summa</th>
                    <th className="pb-2 font-semibold text-center">Staatus</th>
                    <th className="pb-2 font-semibold">Kuupäev</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => {
                    const ref = (o.montonio_order_id ?? o.id).toString().slice(-8).toUpperCase()
                    return (
                      <tr key={o.id}>
                        <td className="py-2.5 font-mono font-semibold text-[#003366] text-[13px]">#{ref}</td>
                        <td className="py-2.5 text-right font-semibold text-gray-900">{o.total.toFixed(2)} €</td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[12px] font-semibold ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[o.status] ?? o.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-gray-500 text-[13px]">{new Date(o.created_at).toLocaleDateString('et-EE')}</td>
                        <td className="py-2.5 text-right">
                          <Link href={`/haldus/tellimused/${o.id}`} className="text-[13px] text-[#003366] hover:underline">Vaata</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">

          {/* Profiil */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3 text-[14px]">
            <h2 className="font-semibold text-gray-900 mb-3">Profiil</h2>
            <div>
              <span className="text-gray-500">E-post</span>
              <p className="font-medium text-gray-900">{client.email}</p>
            </div>
            <div>
              <label className="text-gray-500 block mb-1">Täisnimi</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Nimi puudub"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[14px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-gray-500 block mb-1">Telefon</label>
              <input
                type="tel"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="+372 ..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[14px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full px-4 py-2 text-[14px] font-semibold bg-[#003366] text-white rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvestatakse...' : 'Salvesta andmed'}
            </button>
            <div className="pt-2 border-t border-gray-50 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Roll</span>
                <span className="font-medium text-gray-900">{ROLE_LABELS[client.role] ?? client.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Liitus</span>
                <span className="font-medium text-gray-900">{new Date(client.created_at).toLocaleDateString('et-EE')}</span>
              </div>
              {emailConfirmed !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className={`font-medium text-[13px] ${emailConfirmed ? 'text-green-700' : 'text-amber-600'}`}>
                    {emailConfirmed ? 'Kinnitatud' : 'Kinnitamata'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Haldustoimingud */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Toimingud</h2>

            {/* Blokeerimine */}
            <div>
              <button
                onClick={handleBlockToggle}
                disabled={saving}
                className={`w-full px-4 py-2.5 text-[14px] font-semibold rounded-xl transition-colors disabled:opacity-50 ${
                  client.status === 'blocked'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'border border-red-200 text-red-600 hover:bg-red-50'
                }`}
              >
                {saving ? 'Töötleb...' : client.status === 'blocked' ? 'Aktiveeri klient' : 'Blokeeri klient'}
              </button>
            </div>

            {/* Email kinnitus — ainult superadmin, ainult kui kinnitamata */}
            {canManageProducts(profile?.role ?? '') && emailConfirmed === false && (
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={handleConfirmEmail}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  <MailCheck size={15} />
                  {saving ? 'Töötleb...' : 'Kinnita email käsitsi'}
                </button>
                <p className="text-[12px] text-gray-400 mt-1.5">
                  Kasuta kui klient ei saanud kinnituskirja.
                </p>
              </div>
            )}

            {/* Roll — ainult superadmin */}
            {canManageProducts(profile?.role ?? '') && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="block text-[14px] font-medium text-gray-700">Muuda roll</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] bg-white"
                >
                  <option value="customer">Klient</option>
                  <option value="manager">Manager</option>
                  <option value="superadmin">Superadmin</option>
                </select>
                <button
                  onClick={handleRoleChange}
                  disabled={saving || newRole === client.role}
                  className="w-full px-4 py-2.5 text-[14px] font-semibold bg-[#003366] text-white rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-50"
                >
                  Salvesta roll
                </button>
              </div>
            )}

            {/* Kustuta konto — ainult superadmin */}
            {canManageProducts(profile?.role ?? '') && (
              <div className="pt-2 border-t border-gray-100">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Kustuta konto
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[13px] text-red-600 font-medium text-center">
                      Konto kustutatakse jäädavalt. Tellimused säilivad.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        disabled={saving}
                        className="flex-1 px-3 py-2 text-[14px] font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Tühista
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={saving}
                        className="flex-1 px-3 py-2 text-[14px] font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Töötleb...' : 'Jah, kustuta'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
