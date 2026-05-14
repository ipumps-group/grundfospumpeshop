'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Tag, Copy, Check } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const canManageProducts = (role: string) => role === 'superadmin'

interface Coupon {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  min_order_amount: number
  usage_limit: number | null
  used_count: number
  valid_from: string | null
  valid_until: string | null
  active: boolean
  created_at: string
}

function CouponStatus({ coupon }: { coupon: Coupon }) {
  const now = new Date()
  const from  = coupon.valid_from  ? new Date(coupon.valid_from)  : null
  const until = coupon.valid_until ? new Date(coupon.valid_until) : null

  if (!coupon.active) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-medium bg-gray-100 text-gray-500">Mitteaktiivne</span>
  }
  if (from && from > now) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-medium bg-yellow-100 text-yellow-700">Ei alanud</span>
  }
  if (until && until < now) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-medium bg-red-100 text-red-600">Aegunud</span>
  }
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-medium bg-orange-100 text-orange-600">Limiit täis</span>
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-medium bg-green-100 text-green-700">Aktiivne</span>
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async e => {
        e.preventDefault()
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="ml-1 text-gray-400 hover:text-[#003366] transition-colors"
      title="Kopeeri"
    >
      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
    </button>
  )
}

export default function SoodustusedPage() {
  const router = useRouter()
  const { profile } = useAuth()

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile && !canManageProducts(profile.role)) router.replace('/haldus')
  }, [profile, router])

  useEffect(() => {
    supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCoupons((data as Coupon[]) ?? [])
        setLoading(false)
      })
  }, [])

  if (!canManageProducts(profile?.role ?? '')) return null

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Soodustused</h1>
        <Link href="/haldus/soodustused/uus"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors text-[15px]">
          <Plus size={16} /> Lisa kupong
        </Link>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Tag size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-[15px]">Kuponge pole veel lisatud.</p>
          <Link href="/haldus/soodustused/uus"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors text-[15px]">
            <Plus size={15} /> Lisa esimene kupong
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 text-left font-semibold text-gray-600 text-[13px]">Kood</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600 text-[13px]">Tüüp / Väärtus</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600 text-[13px]">Min summa</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600 text-[13px]">Kasutused</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600 text-[13px]">Kehtib kuni</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600 text-[13px]">Staatus</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => (
                  <tr key={coupon.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/haldus/soodustused/${coupon.id}`}
                        className="font-mono font-semibold text-[#003366] hover:underline flex items-center">
                        {coupon.code}
                        <CopyButton text={coupon.code} />
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {coupon.type === 'percent'
                        ? `${coupon.value}% soodustus`
                        : `${Number(coupon.value).toFixed(2).replace('.', ',')} € allahindlus`}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {coupon.min_order_amount > 0
                        ? `${Number(coupon.min_order_amount).toFixed(2).replace('.', ',')} €`
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {coupon.used_count}
                      {coupon.usage_limit !== null ? ` / ${coupon.usage_limit}` : ' / ∞'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {coupon.valid_until
                        ? new Date(coupon.valid_until).toLocaleDateString('et-EE')
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <CouponStatus coupon={coupon} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
