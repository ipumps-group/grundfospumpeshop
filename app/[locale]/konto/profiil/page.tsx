'use client'

import { useState, useEffect, FormEvent } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AccountNav from '@/components/konto/AccountNav'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

export default function ProfiilPage() {
  return (
    <ProtectedRoute>
      <Profiil />
    </ProtectedRoute>
  )
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-[14px] font-medium text-white ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`}>
      {msg}
    </div>
  )
}

function Profiil() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setPhone(profile.phone ?? '')
    }
  }, [profile])

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', user.id)
    if (error) {
      showToast('Salvestamine ebaõnnestus.', 'error')
    } else {
      await refreshProfile()
      showToast('Profiil salvestatud!', 'success')
    }
    setSaving(false)
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast('Paroolid ei kattu.', 'error')
      return
    }
    if (newPassword.length < 6) {
      showToast('Parool peab olema vähemalt 6 tähemärki.', 'error')
      return
    }
    setChangingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      showToast('Paroolivahetus ebaõnnestus.', 'error')
    } else {
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast('Parool vahetatud!', 'success')
    }
    setChangingPw(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="flex flex-col md:flex-row gap-8">
        <AccountNav />

        <div className="flex-1 min-w-0 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Minu profiil</h1>

          {/* Isikuandmed */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Isikuandmed</h2>
            <form onSubmit={handleProfileSave} className="space-y-4 max-w-md">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Täisnimi</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
                  placeholder="+372 5555 1234"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">E-posti aadress</label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-[15px] bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#003366] hover:bg-[#004080] text-white px-6 py-2.5 rounded-xl font-semibold text-[15px] transition-colors disabled:opacity-60"
              >
                {saving ? 'Salvestamine...' : 'Salvesta muutused'}
              </button>
            </form>
          </div>

          {/* Paroolivahetus */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Vaheta parool</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Uus parool</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
                  placeholder="Vähemalt 6 tähemärki"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Kinnita uus parool</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={changingPw}
                className="bg-[#003366] hover:bg-[#004080] text-white px-6 py-2.5 rounded-xl font-semibold text-[15px] transition-colors disabled:opacity-60"
              >
                {changingPw ? 'Vahetamine...' : 'Vaheta parool'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
