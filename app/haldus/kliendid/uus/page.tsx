'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const canManageOrders   = (role: string) => ['manager', 'superadmin'].includes(role)
const canManageProducts = (role: string) => role === 'superadmin'

export default function UusKlientPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [fullName,  setFullName]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [role,      setRole]      = useState('customer')
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState('')

  if (profile && !canManageOrders(profile.role)) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const res = await fetch('/api/haldus/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, phone, role }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Viga kasutaja loomisel')
      setSubmitting(false)
      return
    }

    router.push(`/haldus/kliendid/${data.id}`)
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/haldus/kliendid" className="text-gray-400 hover:text-[#003366] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Uus klient</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-[14px] text-gray-500 mb-5">
          Konto luuakse kohe kinnitatult — kinnituskirja ei saadeta.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1">E-post *</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
              placeholder="klient@email.ee"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1">Parool *</label>
            <input
              type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
              placeholder="Vähemalt 6 tähemärki"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1">Täisnimi</label>
            <input
              type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
              placeholder="Mari Mets"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
              placeholder="+372 5000 0000"
            />
          </div>

          {canManageProducts(profile?.role ?? '') && (
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1">Roll</label>
              <select
                value={role} onChange={e => setRole(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none bg-white transition-colors"
              >
                <option value="customer">Klient</option>
                <option value="manager">Manager</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-[14px] text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit" disabled={submitting}
            className="w-full bg-[#003366] hover:bg-[#004080] text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
          >
            {submitting ? 'Loon konto...' : 'Loo konto'}
          </button>
        </form>
      </div>
    </div>
  )
}
