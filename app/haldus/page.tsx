'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, ShoppingBag, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import OrderStatusBadge from '@/components/konto/OrderStatusBadge'

interface Stats { orders: number; products: number; customers: number }
interface RecentOrder {
  id: string
  montonio_order_id: string | null
  status: string
  total: number
  created_at: string
  shipping_address: { customer_name?: string } | null
}

export default function HaldusDashboard() {
  const [stats, setStats] = useState<Stats>({ orders: 0, products: 0, customers: 0 })
  const [recent, setRecent]   = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [ord, prod, cust, rec] = await Promise.all([
        supabase.from('orders').select('id',    { count: 'exact', head: true }),
        supabase.from('products').select('id',  { count: 'exact', head: true }),
        supabase.from('profiles').select('id',  { count: 'exact', head: true }),
        supabase.from('orders')
          .select('id, montonio_order_id, status, total, created_at, shipping_address')
          .order('created_at', { ascending: false })
          .limit(5),
      ])
      setStats({ orders: ord.count ?? 0, products: prod.count ?? 0, customers: cust.count ?? 0 })
      setRecent(rec.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Tellimusi',  value: stats.orders,    icon: ShoppingBag, bg: 'bg-blue-50',    color: 'text-blue-600'    },
    { label: 'Tooteid',    value: stats.products,  icon: Package,     bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'Kliente',    value: stats.customers, icon: Users,       bg: 'bg-violet-50',  color: 'text-violet-600'  },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ülevaade</h1>
        <p className="text-[15px] text-gray-500 mt-0.5">Haldusala pealeht</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map(c => (
              <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <c.icon size={20} className={c.color} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{c.value}</div>
                    <div className="text-[13px] text-gray-500">{c.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Viimased tellimused</h2>
              <Link href="/haldus/tellimused" className="text-[14px] text-[#003366] hover:underline font-medium">
                Vaata kõiki →
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="px-6 py-10 text-center text-[15px] text-gray-400">Tellimusi pole veel</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recent.map(o => (
                  <div key={o.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                    <div className="flex-1 min-w-[160px]">
                      <div className="font-medium text-gray-900 text-[15px]">
                        #{o.montonio_order_id || o.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="text-[13px] text-gray-500">
                        {o.shipping_address?.customer_name || '—'} · {new Date(o.created_at).toLocaleDateString('et-EE')}
                      </div>
                    </div>
                    <OrderStatusBadge status={o.status} />
                    <div className="font-semibold text-gray-900 text-[15px] min-w-[70px] text-right">
                      {o.total.toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
