'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Download, Truck, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const canManageOrders = (role: string) => ['manager', 'superadmin'].includes(role)

const STATUS_LABELS: Record<string, string> = {
    pending: 'Ootel',
    paid: 'Makstud',
    processing: 'Töötlemisel',
    shipped: 'Saadetud',
    delivered: 'Kätte saadud',
    cancelled: 'Tühistatud',
    failed: 'Ebaõnnestunud',
  }

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-gray-100 text-gray-600',
  paid:       'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-amber-100 text-amber-700',
  delivered:  'bg-emerald-100 text-emerald-700',
  cancelled:  'bg-red-100 text-red-600',
}

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
}

interface HistoryEntry {
  id: string
  status: string
  note: string | null
  created_at: string
  changed_by: string | null
}

interface Order {
  id: string
  montonio_order_id: string | null
  status: string
  total: number
  created_at: string
  shipping_address: Record<string, string> | null
  user_id: string | null
}

export default function TellimusDetailPage() {
  const { profile } = useAuth()
  const router      = useRouter()
  const { id }      = useParams<{ id: string }>()

  const [order, setOrder]     = useState<Order | null>(null)
  const [items, setItems]     = useState<OrderItem[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [newStatus, setNewStatus] = useState('')
  const [note, setNote]           = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saveMsg, setSaveMsg]     = useState('')

  // Shipping dialog state
  const [shipOpen, setShipOpen] = useState(false)
  const [shipCarrier, setShipCarrier] = useState<'omniva' | 'dpd' | 'itella' | 'venipak' | 'other'>('omniva')
  const [shipMethod, setShipMethod] = useState<'courier' | 'pickup'>('courier')
  const [shipTrackingNumber, setShipTrackingNumber] = useState('')
  const [shipLoading, setShipLoading] = useState(false)
  const [shipError, setShipError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const isSuperadmin = profile?.role === 'superadmin'

  async function handleDelete() {
    if (!confirm('Kustuta see tellimus? Tegevus on pöördumatu.')) return
    setDeleting(true)
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch(`/api/haldus/orders/${id}/delete`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      router.push('/haldus/tellimused')
    } else {
      alert('Kustutamine ebaõnnestus')
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (profile && !canManageOrders(profile.role)) router.replace('/haldus')
  }, [profile, router])

  useEffect(() => {
    if (!id) return
    async function load() {
      const [orderRes, itemsRes, histRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id).single(),
        supabase.from('order_items').select('*').eq('order_id', id),
        supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at', { ascending: false }),
      ])
      if (orderRes.error || !orderRes.data) { setNotFound(true); setLoading(false); return }
      setOrder(orderRes.data)
      setItems(itemsRes.data ?? [])
      setHistory(histRes.data ?? [])
      setNewStatus(orderRes.data.status)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleStatusSave() {
    if (!order || !newStatus) return
    setSaving(true); setSaveMsg('')

    const res = await fetch(`/api/haldus/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, note: note.trim() || undefined, sendEmail }),
    })

    if (res.ok) {
      setSaveMsg('Staatus uuendatud!')
      setOrder(o => o ? { ...o, status: newStatus } : o)
      setNote('')
      // Reload history
      const { data } = await supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at', { ascending: false })
      setHistory(data ?? [])
      setTimeout(() => setSaveMsg(''), 3000)
    } else {
      const j = await res.json().catch(() => ({}))
      setSaveMsg(j.error ?? 'Viga!')
    }
    setSaving(false)
  }

  async function handleShip() {
    if (!order || !shipTrackingNumber.trim()) return
    setShipLoading(true)
    setShipError('')
    try {
      const res = await fetch(`/api/haldus/orders/${order.id}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          carrier: shipCarrier, 
          deliveryMethod: shipMethod,
          trackingNumber: shipTrackingNumber.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      // Reload order
      const { data: updated } = await supabase.from('orders').select('*').eq('id', id).single()
      if (updated) setOrder(updated)
      // Reload history
      const { data: hist } = await supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at', { ascending: false })
      setHistory(hist ?? [])
      setShipOpen(false)
      setShipTrackingNumber('')
      alert(`Tellimus saadetud! Tracking: ${data.trackingNumber}`)
    } catch (e: any) {
      setShipError(e.message)
    } finally {
      setShipLoading(false)
    }
  }

  if (profile && !canManageOrders(profile.role)) return null
  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (notFound || !order) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">Tellimust ei leitud.</p>
      <Link href="/haldus/tellimused" className="text-[#003366] hover:underline">← Tagasi</Link>
    </div>
  )

  const sa       = order.shipping_address ?? {}
  const orderRef = (order.montonio_order_id ?? order.id).toString().slice(-8).toUpperCase()
  const subtotal = Number((order.total / 1.22).toFixed(2))
  const vat      = Number((order.total - subtotal).toFixed(2))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/haldus/tellimused" className="text-gray-400 hover:text-[#003366] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Tellimus #{orderRef}</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-[13px] font-semibold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
        <a
          href={`/api/haldus/invoice/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 text-[14px] font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
        >
          <Download size={14} /> Arve PDF
        </a>
        {isSuperadmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2 text-[14px] font-medium text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} /> Kustuta
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Tooted */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Tellitud tooted</h2>
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-left">
                  <th className="pb-2 font-semibold">Toode</th>
                  <th className="pb-2 font-semibold text-center">Kogus</th>
                  <th className="pb-2 font-semibold text-right">Hind</th>
                  <th className="pb-2 font-semibold text-right">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="py-3 text-gray-900">{item.product_name}</td>
                    <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">{item.unit_price.toFixed(2)} €</td>
                    <td className="py-3 text-right font-semibold text-gray-900">{(item.quantity * item.unit_price).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-[14px]">
              <div className="flex justify-between text-gray-500">
                <span>Vahesumma (km-ta)</span><span>{subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>KM 24%</span><span>{vat.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-bold text-[16px] text-gray-900 pt-1">
                <span>Kokku</span><span className="text-[#003366]">{order.total.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Staatuse muutus */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Muuda staatust</h2>
            {saveMsg && (
              <p className={`text-[14px] ${saveMsg.startsWith('Staatus') ? 'text-green-600' : 'text-red-600'}`}>{saveMsg}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-1">Uus staatus</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] bg-white"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-1">Märkus kliendile (valikuline)</label>
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Nt. pakk saadetud DPD-ga"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-[14px] text-gray-700">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={e => setSendEmail(e.target.checked)}
                  className="w-4 h-4 accent-[#003366]"
                />
                Saada kliendile e-kiri
              </label>
              <button
                onClick={handleStatusSave}
                disabled={saving || newStatus === order.status}
                className="px-4 py-2 text-[14px] font-semibold bg-[#003366] text-white rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvestab...' : 'Salvesta'}
              </button>
              {order.status === 'paid' && (
                <button
                  onClick={() => setShipOpen(true)}
                  className="ml-2 px-4 py-2 text-[14px] font-semibold bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  <Truck size={16} /> Saada teele
                </button>
              )}
            </div>
          </div>

          {/* Ajalugu */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Staatuse ajalugu</h2>
            {history.length === 0 ? (
              <p className="text-gray-400 text-[14px]">Ajalugu puudub</p>
            ) : (
              <ol className="space-y-3">
                {history.map(h => (
                  <li key={h.id} className="flex gap-3 text-[14px]">
                    <div className="mt-1 w-2 h-2 rounded-full bg-[#003366] flex-shrink-0" />
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[12px] font-semibold mr-2 ${STATUS_COLORS[h.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[h.status] ?? h.status}
                      </span>
                      <span className="text-gray-400 text-[13px]">
                        {new Date(h.created_at).toLocaleString('et-EE')}
                      </span>
                      {h.note && <p className="text-gray-600 mt-0.5">{h.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Tellimuse info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Tellimuse info</h2>
            <div className="text-[14px] space-y-2">
              <div>
                <span className="text-gray-500">Kuupäev</span>
                <p className="font-medium text-gray-900">{new Date(order.created_at).toLocaleString('et-EE')}</p>
              </div>
              {order.montonio_order_id && (
                <div>
                  <span className="text-gray-500">Montonio ID</span>
                  <p className="font-mono text-[13px] text-gray-700">{order.montonio_order_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Klient */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-2">
            <h2 className="font-semibold text-gray-900 mb-3">Klient</h2>
            <div className="text-[14px] space-y-1">
              {sa.full_name && <p className="font-semibold text-gray-900">{sa.full_name}</p>}
              {sa.customer_email && (
                <p className="text-gray-500">
                  <a href={`mailto:${sa.customer_email}`} className="hover:text-[#003366]">{sa.customer_email}</a>
                </p>
              )}
              {sa.customer_phone && <p className="text-gray-500">{sa.customer_phone}</p>}
              {sa.company && <p className="text-gray-500">{sa.company}</p>}
              {sa.reg_code && <p className="text-gray-500">Reg: {sa.reg_code}</p>}
              {sa.vat_number && <p className="text-gray-500">KM nr: {sa.vat_number}</p>}
            </div>
            {order.user_id && (
              <Link href={`/haldus/kliendid/${order.user_id}`} className="text-[13px] text-[#003366] hover:underline block mt-2">
                Vaata kliendi profiili →
              </Link>
            )}
          </div>

          {/* Tarne */}
          {(sa.carrier_name || sa.pickup_name) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Tarne</h2>
              <div className="text-[14px] space-y-1">
                {sa.carrier_name && <p className="font-semibold text-gray-900">{sa.carrier_name}</p>}
                {sa.pickup_name && <p className="text-gray-700">{sa.pickup_name}</p>}
                {sa.pickup_address && <p className="text-gray-500">{sa.pickup_address}</p>}
                {(sa.pickup_city || sa.pickup_postal) && (
                  <p className="text-gray-500">{sa.pickup_postal} {sa.pickup_city}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Dialog */}
      {shipOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Saada tellimus teele</h2>

            <label className="block mb-3">
              <span className="text-sm font-medium">Kuller</span>
              <select
                value={shipCarrier}
                onChange={e => setShipCarrier(e.target.value as any)}
                className="mt-1 w-full border rounded px-3 py-2"
              >
                <option value="omniva">Omniva</option>
                <option value="dpd">DPD</option>
                <option value="itella">Itella</option>
                <option value="venipak">Venipak</option>
                <option value="other">Muu</option>
              </select>
            </label>

            <label className="block mb-3">
              <span className="text-sm font-medium">Kohaletoimetamise viis</span>
              <select
                value={shipMethod}
                onChange={e => setShipMethod(e.target.value as any)}
                className="mt-1 w-full border rounded px-3 py-2"
              >
                <option value="courier">Kuller</option>
                <option value="pickup">Iseteenindus</option>
              </select>
            </label>

            <label className="block mb-4">
              <span className="text-sm font-medium">Jälgimisnumber</span>
              <input
                type="text"
                value={shipTrackingNumber}
                onChange={e => setShipTrackingNumber(e.target.value)}
                placeholder="nt CC123456789EE"
                className="mt-1 w-full border rounded px-3 py-2 font-mono"
                autoFocus
              />
            </label>

            {shipError && <p className="text-red-600 text-sm mb-3">{shipError}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShipOpen(false)}
                disabled={shipLoading}
                className="px-4 py-2 border rounded"
              >
                Tühista
              </button>
              <button
                onClick={handleShip}
                disabled={shipLoading || !shipTrackingNumber.trim()}
                className="px-4 py-2 bg-amber-600 text-white rounded disabled:opacity-50"
              >
                {shipLoading ? 'Saadan...' : 'Kinnita saatmine'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
