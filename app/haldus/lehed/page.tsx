'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ExternalLink, Eye, Save, Mail, Phone, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const canManage = (role: string) => role === 'superadmin'

interface Page {
  id: string
  slug: string
  title: string
  status: string | null
  show_in_nav: boolean | null
  created_at: string
}

interface Settings {
  header_phone: string
  header_email: string
  header_opening_hours: string
  footer_company: string
  footer_address: string
  footer_city: string
  footer_phone: string
  footer_reg: string
  footer_vat: string
  footer_team_1_name: string
  footer_team_1_email: string
  footer_team_1_phone: string
  footer_team_2_name: string
  footer_team_2_email: string
  footer_team_2_phone: string
  footer_team_3_name: string
  footer_team_3_email: string
  footer_team_3_phone: string
}

const defaultSettings: Settings = {
  header_phone: '', header_email: '', header_opening_hours: '',
  footer_company: '', footer_address: '', footer_city: '', footer_phone: '', footer_reg: '', footer_vat: '',
  footer_team_1_name: '', footer_team_1_email: '', footer_team_1_phone: '',
  footer_team_2_name: '', footer_team_2_email: '', footer_team_2_phone: '',
  footer_team_3_name: '', footer_team_3_email: '', footer_team_3_phone: '',
}

export default function HaldusLehedPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settingsExpanded, setSettingsExpanded] = useState(false)

  useEffect(() => {
    if (profile && !canManage(profile.role)) router.replace('/haldus')
  }, [profile, router])

  async function load() {
    const { data } = await supabase
      .from('pages')
      .select('id, slug, title, status, show_in_nav, created_at')
      .order('created_at', { ascending: false })
    setPages(data ?? [])
    setLoading(false)
  }

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('key, value')
    if (data) {
      const newSettings = { ...defaultSettings }
      data.forEach((item: { key: string; value: string }) => {
        if (item.key in newSettings) (newSettings as Record<string, string>)[item.key] = item.value
      })
      setSettings(newSettings)
    }
    setSettingsLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { loadSettings() }, [])

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Kustuta leht "${title}"?`)) return
    await supabase.from('pages').delete().eq('id', id)
    await load()
  }

  async function handleSaveSettings() {
    setSaving(true)
    const keys = Object.keys(settings) as (keyof Settings)[]
    for (const key of keys) {
      await supabase.from('settings').update({ value: settings[key] }).eq('key', key)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!canManage(profile?.role ?? '')) return null

  if (loading || settingsLoading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lehed</h1>
          <p className="text-[14px] text-gray-500 mt-0.5">Page builderiga koostatud staatilised lehed</p>
        </div>
        <Link href="/haldus/lehed/uus" className="flex items-center gap-2 bg-[#003366] hover:bg-[#004080] text-white px-4 py-2.5 rounded-xl font-semibold text-[15px] transition-colors">
          <Plus size={16} /> Lisa leht
        </Link>
      </div>

      {saved && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-[15px]">✓ Seaded salvestatud</div>}

      {/* Päis & Jalus Settings - Collapsible */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <button onClick={() => setSettingsExpanded(!settingsExpanded)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <Phone size={18} className="text-[#003366]" />
            <span className="font-semibold text-gray-900">Päis & Jalus seaded</span>
          </div>
          {settingsExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>
        
        {settingsExpanded && (
          <div className="px-6 pb-6 space-y-6">
            {/* Päis */}
            <div>
              <h3 className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Päis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] text-gray-500 mb-1">Telefon</label>
                  <input value={settings.header_phone} onChange={e => setSettings({...settings, header_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#003366]" placeholder="+372 503 3978" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-500 mb-1">Email</label>
                  <input value={settings.header_email} onChange={e => setSettings({...settings, header_email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#003366]" placeholder="info@email.ee" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-500 mb-1">Lahtioleku aeg</label>
                  <input value={settings.header_opening_hours} onChange={e => setSettings({...settings, header_opening_hours: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#003366]" placeholder="E-R 8:00-17:00" />
                </div>
              </div>
            </div>

            {/* Jalus - Ettevõte */}
            <div>
              <h3 className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Jalus - Ettevõte</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] text-gray-500 mb-1">Ettevõte</label>
                  <input value={settings.footer_company} onChange={e => setSettings({...settings, footer_company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#003366]" placeholder="iPumps OÜ" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-500 mb-1">Aadress</label>
                  <input value={settings.footer_address} onChange={e => setSettings({...settings, footer_address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#003366]" placeholder="Sepamäe tee 11-2" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-500 mb-1">Linn/asukoht</label>
                  <input value={settings.footer_city} onChange={e => setSettings({...settings, footer_city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#003366]" placeholder="74009 Leppneeme" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-500 mb-1">Telefon</label>
                  <input value={settings.footer_phone} onChange={e => setSettings({...settings, footer_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#003366]" placeholder="+372 503 3978" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-500 mb-1">Reg. nr</label>
                  <input value={settings.footer_reg} onChange={e => setSettings({...settings, footer_reg: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#003366]" placeholder="Reg. nr: 12345678" />
                </div>
                <div>
                  <label className="block text-[13px] text-gray-500 mb-1">KMKR</label>
                  <input value={settings.footer_vat} onChange={e => setSettings({...settings, footer_vat: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#003366]" placeholder="KMKR: EE123456789" />
                </div>
              </div>
            </div>

            {/* Jalus - Meeskond */}
            <div>
              <h3 className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Jalus - Meeskond</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(num => (
                  <div key={num} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <div className="text-[12px] font-semibold text-gray-400">Liige {num}</div>
                    <input value={settings[`footer_team_${num}_name` as keyof Settings] as string} onChange={e => setSettings({...settings, [`footer_team_${num}_name`]: e.target.value})}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-[14px]" placeholder="Nimi" />
                    <input value={settings[`footer_team_${num}_email` as keyof Settings] as string} onChange={e => setSettings({...settings, [`footer_team_${num}_email`]: e.target.value})}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-[14px]" placeholder="Email" />
                    <input value={settings[`footer_team_${num}_phone` as keyof Settings] as string} onChange={e => setSettings({...settings, [`footer_team_${num}_phone`]: e.target.value})}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-[14px]" placeholder="Telefon" />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSaveSettings} disabled={saving}
              className="flex items-center gap-2 bg-[#003366] hover:bg-[#004080] text-white px-4 py-2 rounded-lg font-medium text-[14px]">
              <Save size={16} /> {saving ? 'Salvestan...' : 'Salvesta seaded'}
            </button>
          </div>
        )}
      </div>

      {/* Pages List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {pages.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[15px] text-gray-500 mb-4">Lehti pole lisatud.</p>
            <Link href="/haldus/lehed/uus" className="text-[#003366] font-semibold hover:underline text-[15px]">+ Lisa esimene leht</Link>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3 border-b border-gray-100 text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
              <span>Pealkiri / slug</span><span className="text-center">Menüüs</span><span />
            </div>
            <div className="divide-y divide-gray-50">
              {pages.map(page => {
                const inNav = !!page.show_in_nav
                return (
                  <div key={page.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-[15px]">{page.title}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[13px] text-gray-400">/leht/{page.slug}</span>
                        <a href={`/leht/${page.slug}?preview=1`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#003366]"><ExternalLink size={12} /></a>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${inNav ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                      {inNav ? 'Jah' : 'Ei'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Link href={`/haldus/lehed/${page.id}/eelvaade`} className="p-2 text-gray-400 hover:text-[#003366] rounded-lg hover:bg-blue-50"><Eye size={15} /></Link>
                      <Link href={`/haldus/lehed/${page.id}`} className="p-2 text-gray-400 hover:text-[#003366] rounded-lg hover:bg-blue-50"><Pencil size={15} /></Link>
                      <button onClick={() => handleDelete(page.id, page.title)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}