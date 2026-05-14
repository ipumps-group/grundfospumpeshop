'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import StatusToggle from '@/components/haldus/StatusToggle'

const canManageProducts = (role: string) => role === 'superadmin'

type Settings = Record<string, string>

const DEFAULT_SETTINGS: Settings = {
  order_notification_email: '',
  sender_email:             '',
  company_name:             '',
  company_reg:              '',
  company_vat:              '',
  company_address:          '',
  notify_pending:           'true',
  notify_processing:        'true',
  notify_shipped:           'true',
  notify_delivered:         'true',
  notify_cancelled:         'true',
  out_of_stock_visible:     'true',
  out_of_stock_purchasable: 'false',
}

const NOTIFICATION_STATUSES = [
  { key: 'notify_pending',    label: 'Ootel (tellimus vastu võetud)' },
  { key: 'notify_processing', label: 'Töötlemisel' },
  { key: 'notify_shipped',    label: 'Saadetud' },
  { key: 'notify_delivered',  label: 'Kohale toimetatud' },
  { key: 'notify_cancelled',  label: 'Tühistatud' },
]

export default function SeadedPage() {
  const router = useRouter()
  const { profile } = useAuth()

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  // Translation state
  const [missing, setMissing]               = useState<number | null>(null)
  const [translating, setTranslating]       = useState(false)
  const [translateDone, setTranslateDone]   = useState(false)
  const [translateProgress, setTranslateProgress] = useState({ done: 0, total: 0 })
  const translateRunning = useRef(false)

  useEffect(() => {
    if (profile && !canManageProducts(profile.role)) router.replace('/haldus')
  }, [profile, router])

  useEffect(() => {
    fetch('/api/translate-missing')
      .then(r => r.json())
      .then(d => setMissing(d.missing ?? 0))
      .catch(() => setMissing(0))
  }, [])

  async function runTranslateAll() {
    if (translateRunning.current) return
    translateRunning.current = true
    setTranslating(true); setTranslateDone(false)
    const total = missing ?? 0
    setTranslateProgress({ done: 0, total })
    let remaining = total; let done = 0
    while (remaining > 0 && translateRunning.current) {
      try {
        const res  = await fetch('/api/translate-missing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 5 }) })
        const data = await res.json()
        done      += data.processed ?? 0
        remaining  = data.remaining ?? 0
        setTranslateProgress({ done, total })
      } catch { break }
    }
    translateRunning.current = false
    setTranslating(false); setMissing(0); setTranslateDone(true)
    setTimeout(() => setTranslateDone(false), 5000)
  }

  useEffect(() => {
    supabase.from('settings').select('key, value').then(({ data }) => {
      if (data) {
        const map: Settings = { ...DEFAULT_SETTINGS }
        data.forEach(row => { map[row.key] = row.value })
        setSettings(map)
      }
      setLoading(false)
    })
  }, [])

  function set(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)

    const upserts = Object.entries(settings).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }))

    const { error: err } = await supabase
      .from('settings')
      .upsert(upserts, { onConflict: 'key' })

    if (err) { setError(err.message); setSaving(false); return }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!canManageProducts(profile?.role ?? '')) return null

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Seaded</h1>
        <button type="submit" disabled={saving}
          className="px-5 py-2.5 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-60 text-[15px]">
          {saving ? 'Salvestan...' : 'Salvesta kõik'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[15px]">{error}</div>}
      {saved  && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-[15px]">Seaded salvestatud!</div>}

      {/* E-posti seaded */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">E-posti seaded</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
              Tellimuse teavituse e-post
              <span className="block text-[13px] font-normal text-gray-400">Siia saadetakse kõigi uute tellimuste teavitused</span>
            </label>
            <input
              type="email"
              value={settings.order_notification_email}
              onChange={e => set('order_notification_email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
              placeholder="admin@ipumps.ee"
            />
          </div>
          <div>
            <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
              Saatja e-post (from)
              <span className="block text-[13px] font-normal text-gray-400">Kasutatakse Resend kaudu saadetud kirjades</span>
            </label>
            <input
              type="email"
              value={settings.sender_email}
              onChange={e => set('sender_email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
              placeholder="tellimused@ipumps.ee"
            />
          </div>
        </div>
      </div>

      {/* Firma andmed */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Firma andmed</h2>
        <p className="text-[14px] text-gray-500">Kasutatakse PDF arvetel.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Ärinimi</label>
            <input value={settings.company_name} onChange={e => set('company_name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
              placeholder="iPumps OÜ" />
          </div>
          <div>
            <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Registrikood</label>
            <input value={settings.company_reg} onChange={e => set('company_reg', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
              placeholder="12345678" />
          </div>
          <div>
            <label className="block text-[15px] font-medium text-gray-700 mb-1.5">KMKR number</label>
            <input value={settings.company_vat} onChange={e => set('company_vat', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
              placeholder="EE123456789" />
          </div>
          <div>
            <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Aadress</label>
            <input value={settings.company_address} onChange={e => set('company_address', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
              placeholder="Tallinn, Eesti" />
          </div>
        </div>
      </div>

      {/* Teavitused */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">E-posti teavitused kliendile</h2>
          <p className="text-[14px] text-gray-500 mt-0.5">Vali, millal saadetakse kliendile automaatne e-kiri staatuse muutmisel.</p>
        </div>
        <div className="space-y-3">
          {NOTIFICATION_STATUSES.map(({ key, label }) => (
            <StatusToggle
              key={key}
              checked={settings[key] === 'true'}
              onChange={v => set(key, v ? 'true' : 'false')}
              label={label}
            />
          ))}
        </div>
      </div>

      {/* Laoseis */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Laoseis</h2>
          <p className="text-[14px] text-gray-500 mt-0.5">
            Globaalsed vaikimisi seaded kõigile toodetele. Üksiku toote seaded kirjutavad globaalse üle.
          </p>
        </div>
        <div className="space-y-3">
          <StatusToggle
            checked={settings.out_of_stock_visible === 'true'}
            onChange={v => set('out_of_stock_visible', v ? 'true' : 'false')}
            label="Laost otsas tooted nähtavad klientidele"
          />
          <StatusToggle
            checked={settings.out_of_stock_purchasable === 'true'}
            onChange={v => set('out_of_stock_purchasable', v ? 'true' : 'false')}
            label="Laost otsas tooted tellitavad (eeltellimus)"
          />
        </div>
      </div>

      {/* Tõlge */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Toodete tõlge</h2>
          <p className="text-[14px] text-gray-500 mt-0.5">
            Tõlgi puuduvad tõlked kõigi avaldatud toodete jaoks korraga.
          </p>
        </div>

        {missing !== null && (
          <div className="flex items-center gap-3 text-[14px]">
            <span className={`px-2.5 py-1 rounded-full font-semibold text-[13px] ${missing > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
              {missing > 0 ? `${missing} toodet vajab tõlkimist` : 'Kõik tõlked on olemas'}
            </span>
          </div>
        )}

        {translating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[14px] text-gray-600">
              <span>Tõlgin... {translateProgress.done} / {translateProgress.total}</span>
              <span className="text-gray-400">{translateProgress.total > 0 ? Math.round((translateProgress.done / translateProgress.total) * 100) : 0}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#003366] rounded-full transition-all duration-300"
                style={{ width: `${translateProgress.total > 0 ? (translateProgress.done / translateProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {translateDone && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-[14px]">
            Tõlkimine lõpetatud!
          </div>
        )}

        <button
          type="button"
          onClick={runTranslateAll}
          disabled={translating || missing === 0}
          className="px-5 py-2.5 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-50 text-[15px]"
        >
          {translating ? 'Tõlgin...' : 'Tõlgi kõik puuduvad'}
        </button>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="px-6 py-3 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-60">
          {saving ? 'Salvestan...' : 'Salvesta kõik seaded'}
        </button>
      </div>
    </form>
  )
}
