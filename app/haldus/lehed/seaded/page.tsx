'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, FileText, Mail, Phone, Clock, Users } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const canManage = (role: string) => role === 'superadmin'

interface Settings {
  // Header
  header_phone: string
  header_email: string
  header_opening_hours: string
  // Footer
  footer_company: string
  footer_address: string
  footer_city: string
  footer_phone: string
  footer_reg: string
  footer_vat: string
  // Team
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
  header_phone: '',
  header_email: '',
  header_opening_hours: '',
  footer_company: '',
  footer_address: '',
  footer_city: '',
  footer_phone: '',
  footer_reg: '',
  footer_vat: '',
  footer_team_1_name: '',
  footer_team_1_email: '',
  footer_team_1_phone: '',
  footer_team_2_name: '',
  footer_team_2_email: '',
  footer_team_2_phone: '',
  footer_team_3_name: '',
  footer_team_3_email: '',
  footer_team_3_phone: '',
}

export default function HaldusLehedPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile && !canManage(profile.role)) router.replace('/haldus')
  }, [profile, router])

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('key, value')
    if (data) {
      const newSettings = { ...defaultSettings }
      data.forEach((item: { key: string; value: string }) => {
        if (item.key in newSettings) {
          (newSettings as Record<string, string>)[item.key] = item.value
        }
      })
      setSettings(newSettings)
    }
    setLoading(false)
  }

  useEffect(() => { loadSettings() }, [])

  async function handleSave() {
    setSaving(true)
    const keys = Object.keys(settings) as (keyof Settings)[]
    
    for (const key of keys) {
      await supabase
        .from('settings')
        .update({ value: settings[key] })
        .eq('key', key)
    }
    
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!canManage(profile?.role ?? '')) return null

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lehed</h1>
          <p className="text-[14px] text-gray-500 mt-0.5">Lehe päise ja jaluse seaded</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#003366] hover:bg-[#004080] disabled:bg-gray-400 text-white px-4 py-2.5 rounded-xl font-semibold text-[15px] transition-colors"
        >
          <Save size={16} />
          {saving ? 'Salvestan...' : 'Salvesta'}
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-[15px]">
          ✓ Seaded salvestatud
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText size={20} className="text-[#003366]" />
          <h2 className="text-lg font-bold text-gray-900">Päis</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">
              <Phone size={14} className="inline mr-1" /> Telefon
            </label>
            <input
              value={settings.header_phone}
              onChange={e => setSettings({ ...settings, header_phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#003366]"
              placeholder="+372 503 3978"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">
              <Clock size={14} className="inline mr-1" /> Lahtioleku aeg
            </label>
            <input
              value={settings.header_opening_hours}
              onChange={e => setSettings({ ...settings, header_opening_hours: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#003366]"
              placeholder="E-R 8:00–17:00"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">
              <Mail size={14} className="inline mr-1" /> Email
            </label>
            <input
              value={settings.header_email}
              onChange={e => setSettings({ ...settings, header_email: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#003366]"
              placeholder="info@ipumps.ee"
            />
          </div>
        </div>
      </div>

      {/* Footer Section - Company Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText size={20} className="text-[#003366]" />
          <h2 className="text-lg font-bold text-gray-900">Jalus - Ettevõte</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">Ettevõte</label>
            <input
              value={settings.footer_company}
              onChange={e => setSettings({ ...settings, footer_company: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#003366]"
              placeholder="iPumps OÜ"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">Telefon</label>
            <input
              value={settings.footer_phone}
              onChange={e => setSettings({ ...settings, footer_phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#003366]"
              placeholder="+372 503 3978"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">Aadress</label>
            <input
              value={settings.footer_address}
              onChange={e => setSettings({ ...settings, footer_address: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#003366]"
              placeholder="Sepamäe tee 11-2"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">Linn /asukoht</label>
            <input
              value={settings.footer_city}
              onChange={e => setSettings({ ...settings, footer_city: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#003366]"
              placeholder="74009 Leppneeme küla, Viimsi vald, Harju maakond"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">Reg. nr</label>
            <input
              value={settings.footer_reg}
              onChange={e => setSettings({ ...settings, footer_reg: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#003366]"
              placeholder="Reg. nr: 12345678"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium text-gray-700 mb-1.5">KMKR</label>
            <input
              value={settings.footer_vat}
              onChange={e => setSettings({ ...settings, footer_vat: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#003366]"
              placeholder="KMKR: EE123456789"
            />
          </div>
        </div>
      </div>

      {/* Footer Section - Team */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users size={20} className="text-[#003366]" />
          <h2 className="text-lg font-bold text-gray-900">Jalus - Meeskond</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(num => (
            <div key={num} className="space-y-3">
              <h3 className="text-[14px] font-semibold text-gray-500 uppercase tracking-wider">Liige {num}</h3>
              <div>
                <label className="block text-[13px] text-gray-500 mb-1">Nimi</label>
                <input
                  value={settings[`footer_team_${num}_name` as keyof Settings] as string}
                  onChange={e => setSettings({ ...settings, [`footer_team_${num}_name`]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#003366]"
                  placeholder={`Liige ${num} nimi`}
                />
              </div>
              <div>
                <label className="block text-[13px] text-gray-500 mb-1">Email</label>
                <input
                  value={settings[`footer_team_${num}_email` as keyof Settings] as string}
                  onChange={e => setSettings({ ...settings, [`footer_team_${num}_email`]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#003366]"
                  placeholder="kasutajanimi@email.ee"
                />
              </div>
              <div>
                <label className="block text-[13px] text-gray-500 mb-1">Telefon</label>
                <input
                  value={settings[`footer_team_${num}_phone` as keyof Settings] as string}
                  onChange={e => setSettings({ ...settings, [`footer_team_${num}_phone`]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#003366]"
                  placeholder="+372 5XX XXXX"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}