'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AccountNav from '@/components/konto/AccountNav'
import OrderStatusBadge from '@/components/konto/OrderStatusBadge'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface Order {
  id: string
  status: string
  total: number
  created_at: string
  montonio_order_id: string | null
}

export default function TellimusedPage() {
  return (
    <ProtectedRoute>
      <TellimusedList />
    </ProtectedRoute>
  )
}

function TellimusedList() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('orders')
      .select('id, status, total, created_at, montonio_order_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? [])
        setLoading(false)
      })
  }, [user])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <AccountNav />

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Minu tellimused</h1>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            {loading ? (
              <div className="p-10 flex justify-center">
                <div className="w-7 h-7 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="p-10 text-center text-[15px] text-gray-500">
                Tellimusi veel pole.{' '}
                <Link href="/tooted" className="text-[#003366] hover:underline">Sirvi tooteid</Link>
              </div>
            ) : (
              <>
                {/* Tabelipäis */}
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-gray-100 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                  <span>Kuupäev / nr</span>
                  <span className="text-center">Staatus</span>
                  <span className="text-right">Summa</span>
                  <span />
                </div>

                <div className="divide-y divide-gray-50">
                  {orders.map(order => (
                    <div key={order.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 items-center px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 text-[15px]">
                          #{order.montonio_order_id || order.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="text-[13px] text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('et-EE', {
                            day: '2-digit', month: 'long', year: 'numeric',
                          })}
                        </div>
                      </div>
                      <div className="sm:text-center">
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="text-[15px] font-semibold text-gray-900 sm:text-right">
                        {order.total.toFixed(2)} €
                      </div>
                      <div className="sm:text-right">
                        <Link
                          href={`/konto/tellimused/${order.id}`}
                          className="text-[14px] text-[#003366] hover:underline font-medium"
                        >
                          Detailid →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
