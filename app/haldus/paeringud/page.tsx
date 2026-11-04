'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Inbox, Mail, Phone, MapPin, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import ConfirmDialog from '@/components/haldus/ConfirmDialog'

const canView = (role: string) => ['manager', 'superadmin'].includes(role)

interface Submission {
  id: string
  created_at: string
  name: string
  email: string
  phone: string | null
  address: string | null
  message: string
  page_id: string | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('et-EE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function PaeringudPage() {
  const { profile } = useAuth()
  const router = useRouter()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [deleteId, setDeleteId]       = useState<string | null>(null)
  const [deleting, setDeleting]       = useState(false)

  useEffect(() => {
    if (profile && !canView(profile.role)) router.replace('/haldus')
  }, [profile, router])

  const load = useCallback(async () => {
    const res = await fetch('/api/haldus/contact-submissions')
    if (res.ok) {
      const data = await res.json()
      setSubmissions(data.submissions ?? [])
      setError('')
    } else {
      const err = await res.json().catch(() => ({}))
      setError(err.error ?? `Viga (${res.status})`)
    }
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- esmane andmete laadimine; setState toimub alles pärast await'i
  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/haldus/contact-submissions?id=${deleteId}`, { method: 'DELETE' })
    if (res.ok) setSubmissions(prev => prev.filter(s => s.id !== deleteId))
    setDeleting(false)
    setDeleteId(null)
  }

  if (profile && !canView(profile.role)) return null

  const deleteTarget = submissions.find(s => s.id === deleteId)

  return (
    <>
      <ConfirmDialog
        open={!!deleteId}
        title="Kustuta päring"
        message={`Kustuta "${deleteTarget?.name}" päring? Seda ei saa tagasi võtta.`}
        confirmLabel={deleting ? 'Kustutan...' : 'Kustuta'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Päringud</h1>
            <p className="text-[14px] text-gray-500 mt-0.5">Kontaktivormi kaudu saabunud sõnumid</p>
          </div>
          <span className="text-sm text-gray-500">Kokku {submissions.length}</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[15px]">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center text-gray-400">
            <Inbox size={32} className="mx-auto mb-3 text-gray-300" />
            Päringuid pole veel saabunud
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold text-gray-900 text-[15px]">{s.name}</span>
                      <span className="text-[13px] text-gray-400">{fmtDate(s.created_at)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[14px]">
                      <a href={`mailto:${s.email}`}
                        className="flex items-center gap-1.5 text-[#003366] hover:underline">
                        <Mail size={13} /> {s.email}
                      </a>
                      {s.phone && (
                        <a href={`tel:${s.phone}`}
                          className="flex items-center gap-1.5 text-gray-600 hover:text-[#003366]">
                          <Phone size={13} /> {s.phone}
                        </a>
                      )}
                      {s.address && (
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <MapPin size={13} /> {s.address}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-[14px] text-gray-700 whitespace-pre-wrap">{s.message}</p>
                  </div>
                  <button type="button" title="Kustuta"
                    onClick={() => setDeleteId(s.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
