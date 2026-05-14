'use client'

import { useState } from 'react'
import { Tag, X, Loader2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTranslations } from 'next-intl'

interface AppliedCoupon {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  discountAmount: number
}

interface CouponInputProps {
  subtotal: number
  onApply: (coupon: AppliedCoupon | null) => void
  applied: AppliedCoupon | null
}

export default function CouponInput({ subtotal, onApply, applied }: CouponInputProps) {
  const t = useTranslations('checkout')
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleApply() {
    const code = input.trim().toUpperCase()
    if (!code) return
    setLoading(true); setError('')

    const { data, error: dbErr } = await supabase
      .from('coupons')
      .select('id, code, type, value, min_order_amount, usage_limit, used_count, valid_from, valid_until, active')
      .eq('code', code)
      .single()

    if (dbErr || !data) {
      setError(t('couponNotFound'))
      setLoading(false)
      return
    }

    // Valideerimine
    if (!data.active) {
      setError(t('couponInactive'))
      setLoading(false)
      return
    }

    const now = Date.now()
    if (data.valid_from && new Date(data.valid_from).getTime() > now) {
      setError(t('couponNotYetValid'))
      setLoading(false)
      return
    }
    if (data.valid_until && new Date(data.valid_until).getTime() < now) {
      setError(t('couponExpired'))
      setLoading(false)
      return
    }
    if (data.usage_limit !== null && data.used_count >= data.usage_limit) {
      setError(t('couponLimitReached'))
      setLoading(false)
      return
    }
    if (data.min_order_amount > 0 && subtotal < data.min_order_amount) {
      setError(t('couponMinOrder', { amount: Number(data.min_order_amount).toFixed(2).replace('.', ',') }))
      setLoading(false)
      return
    }

    const discountAmount = data.type === 'percent'
      ? Number((subtotal * data.value / 100).toFixed(2))
      : Math.min(Number(data.value), subtotal)

    onApply({
      id:             data.id,
      code:           data.code,
      type:           data.type,
      value:          data.value,
      discountAmount,
    })
    setInput('')
    setLoading(false)
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <Check size={16} className="text-green-600 flex-shrink-0" />
          <div>
            <span className="font-mono font-semibold text-green-800 text-[15px]">{applied.code}</span>
            <span className="text-[13px] text-green-600 ml-2">
              −{applied.discountAmount.toFixed(2).replace('.', ',')} €
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onApply(null)}
          className="text-green-600 hover:text-green-800 transition-colors"
          title={t('couponRemove')}
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApply())}
            placeholder={t('couponPlaceholder')}
            className={`w-full pl-9 pr-3 py-3 border rounded-xl text-[15px] text-gray-900 outline-none transition-colors ${
              error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#003366]'
            }`}
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={loading || !input.trim()}
          className="px-4 py-3 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[15px] flex items-center gap-2"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : t('couponApply')}
        </button>
      </div>
      {error && <p className="text-[13px] text-red-600">{error}</p>}
    </div>
  )
}
