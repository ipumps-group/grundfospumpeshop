'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, User, MapPin, ChevronRight } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AccountNav from '@/components/konto/AccountNav'
import OrderStatusBadge from '@/components/konto/OrderStatusBadge'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { useTranslations } from 'next-intl'

interface Order {
  id: string
  status: string
  total: number
  created_at: string
  reference: string | null
}

export default function KontoDashboard() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  )
}

function Dashboard() {
  const t = useTranslations('account')
  const tCommon = useTranslations('common')
  const { user, profile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('orders')
      .select('id, status, total, created_at, reference')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setOrders(data ?? [])
        setLoadingOrders(false)
      })
  }, [user])

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'kasutaja'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <AccountNav />

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Tere, {displayName}!
          </h1>
          <p className="text-[15px] text-gray-500 mb-6">Siin saad hallata oma tellimusi ja kontoandmeid.</p>

          {/* Kiirlingid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { href: '/konto/tellimused', icon: ShoppingBag, label: t('orders'),    desc: tCommon('viewAll') },
              { href: '/konto/profiil',   icon: User,         label: t('profile'),   desc: tCommon('edit') },
              { href: '/konto/aadressid', icon: MapPin,       label: t('addresses'), desc: tCommon('edit') },
            ].map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:border-[#003366]/30 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Icon size={18} className="text-[#003366]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-[15px]">{label}</div>
                  <div className="text-[13px] text-gray-500">{desc}</div>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-[#003366] transition-colors" />
              </Link>
            ))}
          </div>

          {/* Viimased tellimused */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{t('orders')}</h2>
              <Link href="/konto/tellimused" className="text-[13px] text-[#003366] hover:underline font-medium">
                {tCommon('viewAll')}
              </Link>
            </div>

            {loadingOrders ? (
              <div className="p-6 flex justify-center">
                <div className="w-6 h-6 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-[15px] text-gray-500">
                <Link href="/tooted" className="text-[#003366] hover:underline">{tCommon('viewAll')}</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {orders.map(order => (
                  <div key={order.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium text-gray-900">
                        #{order.reference || order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="text-[13px] text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('et-EE')}
                      </div>
                    </div>
                    <OrderStatusBadge status={order.status} />
                    <div className="text-[15px] font-semibold text-gray-900 text-right min-w-[80px]">
                      {order.total.toFixed(2)} €
                    </div>
                    <Link
                      href={`/konto/tellimused/${order.id}`}
                      className="text-[13px] text-[#003366] hover:underline font-medium"
                    >
                      {tCommon('open')} →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
