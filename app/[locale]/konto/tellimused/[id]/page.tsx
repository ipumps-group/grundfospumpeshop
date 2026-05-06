'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Download } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AccountNav from '@/components/konto/AccountNav'
import OrderStatusBadge from '@/components/konto/OrderStatusBadge'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface ShippingAddress {
  carrier_name?:   string
  pickup_name?:    string
  pickup_address?: string
  pickup_city?:    string
  pickup_postal?:  string
  customer_name?:  string
  customer_email?: string
  customer_phone?: string
  company?:        string
  notes?:          string
  country?:        string
}

interface Order {
  id: string
  status: string
  total: number
  created_at: string
  montonio_order_id: string | null
  shipping_address: ShippingAddress | null
}

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
}

interface StatusHistory {
  id: string
  status: string
  note: string | null
  created_at: string
}

export default function TellimusDetailPage() {
  return (
    <ProtectedRoute>
      <TellimusDetail />
    </ProtectedRoute>
  )
}

function TellimusDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!user || !id) return

    Promise.all([
      supabase.from('orders').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('order_items').select('*').eq('order_id', id),
      supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at', { ascending: true }),
    ]).then(([orderRes, itemsRes, historyRes]) => {
      if (orderRes.error || !orderRes.data) {
        setNotFound(true)
      } else {
        setOrder(orderRes.data)
        setItems(itemsRes.data ?? [])
        setHistory(historyRes.data ?? [])
      }
      setLoading(false)
    })
  }, [user, id])

  async function downloadInvoice() {
    if (!user || !id) return
    setDownloading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/invoice/${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (!res.ok) throw new Error('PDF genereerimine ebaõnnestus')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `arve-${id.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Arve allalaadimine ebaõnnestus.')
    }
    setDownloading(false)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <AccountNav />
          <div className="flex-1 flex justify-center pt-10">
            <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <AccountNav />
          <div className="flex-1 text-center pt-10">
            <p className="text-[15px] text-gray-500 mb-4">Tellimust ei leitud.</p>
            <Link href="/konto/tellimused" className="text-[#003366] hover:underline">← Tagasi tellimustele</Link>
          </div>
        </div>
      </div>
    )
  }

  const sa      = order.shipping_address ?? {}
  const subtotal = Number((order.total / 1.22).toFixed(2))
  const vat      = Number((order.total - subtotal).toFixed(2))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <AccountNav />

        <div className="flex-1 min-w-0 space-y-6">
          {/* Päis */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href="/konto/tellimused" className="text-[13px] text-gray-500 hover:text-[#003366] mb-1 inline-block">
                ← Tellimused
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Tellimus #{order.montonio_order_id || order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-[14px] text-gray-500">
                {new Date(order.created_at).toLocaleDateString('et-EE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} />
              <button
                onClick={downloadInvoice}
                disabled={downloading}
                className="flex items-center gap-2 bg-[#003366] hover:bg-[#004080] text-white px-4 py-2 rounded-xl text-[14px] font-semibold transition-colors disabled:opacity-60"
              >
                <Download size={15} />
                {downloading ? 'Laadimine...' : 'Laadi arve alla'}
              </button>
            </div>
          </div>

          {/* Tooted */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">Tellitud tooted</div>
            <div className="divide-y divide-gray-50">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-[15px]">{item.product_name}</div>
                  </div>
                  <div className="text-[14px] text-gray-500 text-right">
                    {item.quantity} × {item.unit_price.toFixed(2)} €
                  </div>
                  <div className="text-[15px] font-semibold text-gray-900 text-right min-w-[80px]">
                    {(item.quantity * item.unit_price).toFixed(2)} €
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 space-y-1.5">
              <div className="flex justify-between text-[14px] text-gray-600">
                <span>Vahesumma (km-ta)</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-[14px] text-gray-600">
                <span>KM 24%</span>
                <span>{vat.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-[16px] font-bold text-gray-900 pt-1 border-t border-gray-100">
                <span>Kokku</span>
                <span>{order.total.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Tarneinfo */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Tarneinfo</h3>
              <div className="text-[15px] text-gray-700 space-y-0.5">
                {sa.customer_name && <p className="font-medium">{sa.customer_name}</p>}
                {sa.customer_email && <p className="text-gray-500">{sa.customer_email}</p>}
                {sa.customer_phone && <p className="text-gray-500">{sa.customer_phone}</p>}
                {sa.company && <p className="text-gray-500">{sa.company}</p>}
                {(sa.carrier_name || sa.pickup_name) && (
                  <p className="mt-2">
                    {sa.carrier_name && <span className="font-medium">{sa.carrier_name}: </span>}
                    {sa.pickup_name}
                  </p>
                )}
                {sa.pickup_address && <p className="text-gray-500">{sa.pickup_address}</p>}
                {(sa.pickup_city || sa.pickup_postal) && (
                  <p className="text-gray-500">{sa.pickup_postal} {sa.pickup_city}</p>
                )}
                {sa.notes && (
                  <p className="mt-2 italic text-gray-500">Märkus: {sa.notes}</p>
                )}
              </div>
            </div>

            {/* Staatuse ajalugu */}
            {history.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Staatuse ajalugu</h3>
                <div className="space-y-3">
                  {history.map((h, i) => (
                    <div key={h.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${i === history.length - 1 ? 'bg-[#003366]' : 'bg-gray-300'}`} />
                        {i < history.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <OrderStatusBadge status={h.status} />
                        {h.note && <p className="text-[13px] text-gray-500 mt-1">{h.note}</p>}
                        <p className="text-[12px] text-gray-400 mt-0.5">
                          {new Date(h.created_at).toLocaleString('et-EE')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
