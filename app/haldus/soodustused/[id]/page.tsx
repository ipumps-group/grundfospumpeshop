'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trash2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import StatusToggle from '@/components/haldus/StatusToggle'
import ConfirmDialog from '@/components/haldus/ConfirmDialog'

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
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export default function MuudaKupong() {
  const router   = useRouter()
  const { id }   = useParams<{ id: string }>()
  const { profile } = useAuth()

  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError]         = useState('')
  const [saved, setSaved]         = useState(false)

  const [code, setCode]           = useState('')
  const [type, setType]           = useState<'percent' | 'fixed'>('percent')
  const [value, setValue]         = useState('')
  const [minOrder, setMinOrder]   = useState('')
  const [usageLimit, setUsageLimit] = useState('')
  const [usedCount, setUsedCount] = useState(0)
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [active, setActive]       = useState(true)

  useEffect(() => {
    if (profile && !canManageProducts(profile.role)) router.replace('/haldus')
  }, [profile, router])

  useEffect(() => {
    if (!id) return
    supabase.from('coupons').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error || !data) { setNotFound(true); setLoading(false); return }
      const c = data as Coupon
      setCode(c.code)
      setType(c.type)
      setValue(String(c.value))
      setMinOrder(c.min_order_amount > 0 ? String(c.min_order_amount) : '')
      setUsageLimit(c.usage_limit !== null ? String(c.usage_limit) : '')
      setUsedCount(c.used_count)
      setValidFrom(toDatetimeLocal(c.valid_from))
      setValidUntil(toDatetimeLocal(c.valid_until))
      setActive(c.active)
      setLoading(false)
    })
  }, [id])

  if (!canManageProducts(profile?.role ?? '')) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) { setError('Kood on kohustuslik'); return }
    if (!value || Number(value) <= 0) { setError('Väärtus peab olema positiivne'); return }
    if (type === 'percent' && Number(value) > 100) { setError('Protsent ei saa olla üle 100'); return }
    setSaving(true); setError(''); setSaved(false)

    const { error: err } = await supabase.from('coupons').update({
      code:             code.trim().toUpperCase(),
      type,
      value:            Number(value),
      min_order_amount: minOrder   ? Number(minOrder)   : 0,
      usage_limit:      usageLimit ? Number(usageLimit) : null,
      valid_from:       validFrom  || null,
      valid_until:      validUntil || null,
      active,
    }).eq('id', id)

    if (err) {
      setError(err.code === '23505' ? 'See kood on juba olemas' : err.message)
      setSaving(false)
      return
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('coupon_usage').delete().eq('coupon_id', id)
    await supabase.from('coupons').delete().eq('id', id)
    router.push('/haldus/soodustused')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Kupongi ei leitud.</p>
        <Link href="/haldus/soodustused" className="text-[#003366] hover:underline">← Tagasi soodustustele</Link>
      </div>
    )
  }

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title="Kustuta kupong"
        message={`Kas oled kindel, et soovid kustutada kupongi "${code}"? Kasutusajalugu kustutatakse samuti.`}
        confirmLabel={deleting ? 'Kustutan...' : 'Kustuta'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/haldus/soodustused" className="text-gray-400 hover:text-[#003366] transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{code}</h1>
          </div>
          <button type="button" onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-[14px] font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
            <Trash2 size={14} /> Kustuta
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[15px]">{error}</div>}
        {saved  && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-[15px]">Muudatused salvestatud!</div>}

        {usedCount > 0 && (
          <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-xl px-4 py-3 text-[15px]">
            Seda kupongi on kasutatud <strong>{usedCount}</strong> korda.
          </div>
        )}

        {/* Kood */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Kupongikood</h2>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-[15px] font-mono text-gray-900 outline-none focus:border-[#003366] uppercase"
            />
            <button
              type="button"
              onClick={() => {
                const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
                setCode(Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''))
              }}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-600 hover:border-[#003366] hover:text-[#003366] transition-colors"
            >
              <RefreshCw size={15} /> Auto
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
            {saving ? 'Salvestan...' : 'Salvesta muudatused'}
          </button>
        </div>
      </form>
    </>
  )
}
