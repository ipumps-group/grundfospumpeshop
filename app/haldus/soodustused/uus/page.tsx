'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import StatusToggle from '@/components/haldus/StatusToggle'

const canManageProducts = (role: string) => role === 'superadmin'

function randomCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function UusKupong() {
  const router = useRouter()
  const { profile } = useAuth()

  const [code, setCode]           = useState(randomCode())
  const [type, setType]           = useState<'percent' | 'fixed'>('percent')
  const [value, setValue]         = useState('')
  const [minOrder, setMinOrder]   = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [active, setActive]       = useState(true)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  if (!canManageProducts(profile?.role ?? '')) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) { setError('Kood on kohustuslik'); return }
    if (!value || Number(value) <= 0) { setError('Väärtus peab olema positiivne'); return }
    if (type === 'percent' && Number(value) > 100) { setError('Protsent ei saa olla üle 100'); return }
    setSaving(true); setError('')

    const { error: err } = await supabase.from('coupons').insert({
      code:              code.trim().toUpperCase(),
      type,
      value:             Number(value),
      min_order_amount:  minOrder   ? Number(minOrder)   : 0,
      usage_limit:       usageLimit ? Number(usageLimit) : null,
      valid_from:        validFrom  || null,
      valid_until:       validUntil || null,
      active,
    })

    if (err) {
      setError(err.code === '23505' ? 'See kood on juba olemas' : err.message)
      setSaving(false)
      return
    }

    router.push('/haldus/soodustused')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/haldus/soodustused" className="text-gray-400 hover:text-[#003366] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Lisa kupong</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[15px]">{error}</div>
      )}

      {/* Kood */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Kupongikood</h2>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="nt SUVESALE20"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[15px] font-mono text-gray-900 outline-none focus:border-[#003366] uppercase"
          />
          <button
            type="button"
            onClick={() => setCode(randomCode())}
            className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-600 hover:border-[#003366] hover:text-[#003366] transition-colors"
            title="Genereeri juhuslik kood"
          >
            <RefreshCw size={15} />
            Auto
          </button>
        </div>
      </div>

      {/* Tüüp ja väärtus */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Soodustuse tüüp</h2>
        <div className="flex gap-3">
          {(['percent', 'fixed'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-3 rounded-xl border text-[15px] font-medium transition-colors ${
                type === t
                  ? 'bg-[#003366] text-white border-[#003366]'
                  : 'border-gray-200 text-gray-600 hover:border-[#003366] hover:text-[#003366]'
              }`}
            >
              {t === 'percent' ? 'Protsent (%)' : 'Fikseeritud (€)'}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
            Väärtus {type === 'percent' ? '(%)' : '(€)'} <span className="text-red-500">*</span>
          </label>
          <input
            type="number" step="0.01" min="0.01" max={type === 'percent' ? '100' : undefined}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={type === 'percent' ? 'nt 15' : 'nt 10.00'}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
          />
        </div>
        <div>
          <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
            Minimaalne ostusumma (€)
            <span className="block text-[13px] font-normal text-gray-400">Jäta tühjaks, kui piirangut pole</span>
          </label>
          <input
            type="number" step="0.01" min="0"
            value={minOrder}
            onChange={e => setMinOrder(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
          />
        </div>
        <div>
          <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
            Kasutuslimiit
            <span className="block text-[13px] font-normal text-gray-400">Jäta tühjaks, kui piiramatu</span>
          </label>
          <input
            type="number" step="1" min="1"
            value={usageLimit}
            onChange={e => setUsageLimit(e.target.value)}
            placeholder="Piiramatu"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
          />
        </div>
      </div>

      {/* Kehtivusaeg */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Kehtivusaeg</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Algus</label>
            <input
              type="datetime-local"
              value={validFrom}
              onChange={e => setValidFrom(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
            />
          </div>
          <div>
            <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Lõpp</label>
            <input
              type="datetime-local"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
            />
          </div>
        </div>
      </div>

      {/* Staatus */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <StatusToggle
          checked={active}
          onChange={setActive}
          label={active ? 'Kupong on aktiivne' : 'Kupong on mitteaktiivne'}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/haldus/soodustused"
          className="px-5 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-600 hover:border-gray-300 transition-colors font-medium">
          Tühista
        </Link>
        <button type="submit" disabled={saving}
          className="flex-1 py-3 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-60">
          {saving ? 'Salvestan...' : 'Lisa kupong'}
        </button>
      </div>
    </form>
  )
}
