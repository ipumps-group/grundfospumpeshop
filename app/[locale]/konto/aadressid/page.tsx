'use client'

import { useState, useEffect, FormEvent } from 'react'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AccountNav from '@/components/konto/AccountNav'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface Address {
  id: string
  label: string | null
  first_name: string | null
  last_name: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  phone: string | null
  is_default: boolean
}

const emptyForm = {
  label: '',
  first_name: '',
  last_name: '',
  address: '',
  city: '',
  postal_code: '',
  country: 'Eesti',
  phone: '',
  is_default: false,
}

export default function AadressidPage() {
  return (
    <ProtectedRoute>
      <Aadressid />
    </ProtectedRoute>
  )
}

function Aadressid() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!user) return
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
    setAddresses(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(addr: Address) {
    setForm({
      label: addr.label ?? '',
      first_name: addr.first_name ?? '',
      last_name: addr.last_name ?? '',
      address: addr.address ?? '',
      city: addr.city ?? '',
      postal_code: addr.postal_code ?? '',
      country: addr.country ?? 'Eesti',
      phone: addr.phone ?? '',
      is_default: addr.is_default,
    })
    setEditId(addr.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Kustuta aadress?')) return
    await supabase.from('addresses').delete().eq('id', id)
    await load()
  }

  async function setDefault(id: string) {
    if (!user) return
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    await load()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    if (form.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    }
    if (editId) {
      await supabase.from('addresses').update({ ...form }).eq('id', editId)
    } else {
      await supabase.from('addresses').insert({ ...form, user_id: user.id })
    }
    setShowForm(false)
    setEditId(null)
    await load()
    setSaving(false)
  }

  const input = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <AccountNav />

        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Minu aadressid</h1>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-[#003366] hover:bg-[#004080] text-white px-4 py-2 rounded-xl font-semibold text-[14px] transition-colors"
            >
              <Plus size={16} /> Lisa aadress
            </button>
          </div>

          {/* Vorm */}
          {showForm && (
            <div className="bg-white rounded-2xl border border-[#003366]/20 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                {editId ? 'Muuda aadressi' : 'Lisa uus aadress'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Silt (nt. Kodu)</label>
                    <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className={input} placeholder="Kodu" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Telefon</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={input} placeholder="+372 5555 1234" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Eesnimi</label>
                    <input required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className={input} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Perekonnanimi</label>
                    <input required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className={input} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Aadress</label>
                    <input required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={input} placeholder="Tänav 1" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Linn</label>
                    <input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={input} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Postiindeks</label>
                    <input required value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} className={input} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">Riik</label>
                    <input required value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className={input} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-[14px] text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={e => setForm({ ...form, is_default: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  Määra vaikimisi aadressiks
                </label>
                <div className="flex gap-3">
                  <button type="submit" disabled={saving} className="bg-[#003366] hover:bg-[#004080] text-white px-5 py-2.5 rounded-xl font-semibold text-[14px] transition-colors disabled:opacity-60">
                    {saving ? 'Salvestamine...' : 'Salvesta'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-semibold text-[14px] hover:bg-gray-50 transition-colors">
                    Tühista
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Aadresside loend */}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-[15px] text-gray-500">
              Aadresse pole lisatud. Lisa esimene aadress.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <div key={addr.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${addr.is_default ? 'border-[#003366]/30' : 'border-gray-100'}`}>
                  {addr.is_default && (
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#003366] bg-blue-50 px-2 py-0.5 rounded-full mb-2">
                      <Star size={10} fill="currentColor" /> Vaikimisi
                    </span>
                  )}
                  {addr.label && <div className="font-semibold text-gray-900 text-[15px] mb-1">{addr.label}</div>}
                  <div className="text-[14px] text-gray-700 space-y-0.5">
                    <p>{addr.first_name} {addr.last_name}</p>
                    <p>{addr.address}</p>
                    <p>{addr.postal_code} {addr.city}</p>
                    <p>{addr.country}</p>
                    {addr.phone && <p>{addr.phone}</p>}
                  </div>
                  <div className="flex gap-2 mt-4">
                    {!addr.is_default && (
                      <button onClick={() => setDefault(addr.id)} className="text-[13px] text-gray-500 hover:text-[#003366] font-medium transition-colors flex items-center gap-1">
                        <Star size={13} /> Vaikimisi
                      </button>
                    )}
                    <button onClick={() => openEdit(addr)} className="text-[13px] text-gray-500 hover:text-[#003366] font-medium transition-colors flex items-center gap-1 ml-auto">
                      <Pencil size={13} /> Muuda
                    </button>
                    <button onClick={() => handleDelete(addr.id)} className="text-[13px] text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1">
                      <Trash2 size={13} /> Kustuta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
