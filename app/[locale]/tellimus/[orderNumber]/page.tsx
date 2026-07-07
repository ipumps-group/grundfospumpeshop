'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import OrderStatusBadge from '@/components/konto/OrderStatusBadge'
import { supabase } from '@/lib/supabase'

interface ShippingAddress {
  carrier_name?: string
  pickup_name?: string
  pickup_address?: string
  pickup_city?: string
  pickup_postal?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  company?: string
  notes?: string
  country?: string
}

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
  email: string
  customer_name: string
  shipping_address: ShippingAddress | null
  payment_method?: string
}

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
}

export default function PublicOrderPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [emailInput, setEmailInput] = useState(searchParams.get('email') || '')
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)

  // Auto-verify if email is in URL and matches order
  useEffect(() => {
    if (!orderNumber) return
    loadOrder()
  }, [orderNumber])

  // Auto-verify when order loads with email in URL
  useEffect(() => {
    if (order && emailInput && !verified) {
      const orderEmail = order.email || order.shipping_address?.customer_email
      if (orderEmail?.toLowerCase() === emailInput.toLowerCase()) {
        setVerified(true)
      }
    }
  }, [order, emailInput])

  async function loadOrder() {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single()

    if (orderError || !orderData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setOrder(orderData)
    setLoading(false)
  }

  async function verifyEmailAndLoad() {
    if (!order) return
    if (emailInput.toLowerCase() === order.email.toLowerCase()) {
      setVerified(true)
      setError('')
      setLoading(true)
      try {
        const res = await fetch(`/api/orders/${orderNumber}/public`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput }),
        })
        const data = await res.json()
        if (res.ok) {
          setItems(data.items ?? [])
        } else {
          setError(data.error || 'Viga andmete laadimisel')
        }
      } catch {
        setError('Ühenduse viga')
      }
      setLoading(false)
    } else {
      setError('Email ei ühti tellimusega')
    }
  }

  function verifyEmail() {
    verifyEmailAndLoad()
  }

  async function retryPayment() {
    if (!order) return
    setRetrying(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retry_order_id: order.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.payment_url) {
        alert(data.error || 'Makselingi loomine ebaõnnestus')
      } else {
        window.location.href = data.payment_url
      }
    } catch {
      alert('Ühenduse viga')
    }
    setRetrying(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tellimust ei leitud</h1>
          <p className="text-gray-500 mb-4">Kontrollige, kas tellimuse number on õige.</p>
          <Link href="/" className="text-[#003366] hover:underline">← Tagasi avalehele</Link>
        </div>
      </div>
    )
  }

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Vaata tellimust</h1>
          <p className="text-gray-500 mb-6">
            Sisestage tellimusega seotud e-posti aadress, et vaadata tellimuse detaile.
          </p>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Teie e-posti aadress"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] mb-3"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            onClick={verifyEmail}
            className="w-full bg-[#003366] hover:bg-[#004080] text-white py-3 rounded-xl font-semibold transition-colors"
          >
            Kinnita
          </button>
        </div>
      </div>
    )
  }

  const sa = order.shipping_address ?? {}
  const subtotal = Number((order.total / 1.24).toFixed(2))
  const vat = Number((order.total - subtotal).toFixed(2))

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[13px] text-gray-500 hover:text-[#003366] mb-4 inline-block">
          ← Avaleht
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tellimus #{order.order_number}
              </h1>
              <p className="text-[14px] text-gray-500">
                {new Date(order.created_at).toLocaleDateString('et-EE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} />
              {order.status === 'pending' && (
                <button
                  onClick={retryPayment}
                  disabled={retrying}
                  className="bg-[#003366] hover:bg-[#004080] text-white px-4 py-2 rounded-xl text-[14px] font-semibold transition-colors disabled:opacity-60"
                >
                  {retrying ? 'Laadimine...' : 'Maksa uuesti'}
                </button>
              )}
            </div>
          </div>

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

        {order.shipping_address && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-6 p-6">
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
        )}
      </div>
    </div>
  )
}