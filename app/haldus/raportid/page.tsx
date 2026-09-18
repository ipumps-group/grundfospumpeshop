'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, Trash2 } from 'lucide-react'

interface ReportSummary {
  id: number
  weekStart: string
  weekEnd: string
  createdAt: string
  emailSentAt: string | null
  emailError: string
  hasNarrative: boolean
  insightsCount: number
  changesSummary: { improved: number; worsened: number }
  stats: {
    gscClicksPerDay: number | null
    gscImpressionsPerDay: number | null
    sessions: number | null
    adsCost: number | null
    orders: number | null
    revenue: number | null
  }
}

const fmtDate = (iso: string) => iso.split('-').reverse().join('.')
const fmtNum = (n: number | null) => (n === null ? '–' : String(n).replace('.', ','))

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  const fetchReports = () => {
    fetch('/api/haldus/reports')
      .then((r) => r.json())
      .then((data) => setReports(data.reports ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const remove = async (r: ReportSummary) => {
    if (!window.confirm(`Kustuta raport ${fmtDate(r.weekStart)} – ${fmtDate(r.weekEnd)}?`)) return
    setDeleting(r.id)
    setMessage('')
    try {
      const res = await fetch('/api/haldus/reports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [r.id] }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMessage('Raport kustutatud.')
        fetchReports()
      } else {
        setMessage(`Viga: ${data.error || 'kustutamine ebaõnnestus'}`)
      }
    } catch {
      setMessage('Viga: kustutamine ebaõnnestus')
    } finally {
      setDeleting(null)
    }
  }

  const generate = async () => {
    setGenerating(true)
    setMessage('')
    try {
      const res = await fetch('/api/haldus/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail: false }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setMessage('Raport genereeritud.')
        fetchReports()
      } else {
        setMessage(`Viga: ${data.error || 'genereerimine ebaõnnestus'}`)
      }
    } catch {
      setMessage('Viga: genereerimine ebaõnnestus')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Raportid</h1>
          <p className="text-[15px] text-gray-500 mt-0.5">
            Iganädalane turundusraport (GSC + GA4 + Ads + tellimused). Automaatselt igal reedel kell 09:00, saadetakse e-postiga.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="bg-[#003366] text-white py-2.5 px-6 rounded-xl text-[15px] font-medium hover:bg-[#004488] transition-colors disabled:opacity-60"
        >
          {generating ? 'Genereerin… (1–3 min)' : 'Genereeri raport kohe'}
        </button>
      </div>

      {message && (
        <p className={`text-[15px] ${message.startsWith('Viga') ? 'text-red-600' : 'text-emerald-600'}`}>{message}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <BarChart3 className="mx-auto text-gray-300 mb-3" size={32} />
          <p className="text-[15px] text-gray-400">
            Raporteid pole veel. Klõpsa „Genereeri raport kohe“ või oota esimest reedest automaatkäivitust.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/haldus/raportid/${r.id}/`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow hover:border-[#3abeff]"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-[17px] font-bold text-gray-900">
                    {fmtDate(r.weekStart)} – {fmtDate(r.weekEnd)}
                  </div>
                  <div className="text-[13px] text-gray-500 mt-0.5">
                    Genereeritud {new Date(r.createdAt).toLocaleString('et-EE')}
                    {r.hasNarrative ? ' · AI-analüüs' : ' · reeglipõhine'}
                    {(r.changesSummary.improved > 0 || r.changesSummary.worsened > 0) && (
                      <>
                        {' · '}
                        {r.changesSummary.improved > 0 && (
                          <span className="text-emerald-600">▲ {r.changesSummary.improved} paranenud</span>
                        )}
                        {r.changesSummary.improved > 0 && r.changesSummary.worsened > 0 && ', '}
                        {r.changesSummary.worsened > 0 && (
                          <span className="text-red-600">▼ {r.changesSummary.worsened} halvenenud</span>
                        )}
                      </>
                    )}
                    {' · '}
                    {r.emailSentAt ? (
                      <span className="text-emerald-600">e-kiri saadetud</span>
                    ) : r.emailError ? (
                      <span className="text-red-600">e-kirja viga: {r.emailError}</span>
                    ) : (
                      'e-kirja pole saadetud'
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-5 text-[15px] text-gray-700">
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{fmtNum(r.stats.gscClicksPerDay)}</div>
                    <div className="text-[12px] text-gray-500">klikki/päev</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{fmtNum(r.stats.sessions)}</div>
                    <div className="text-[12px] text-gray-500">sessiooni</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{r.stats.adsCost === null ? '–' : `${fmtNum(r.stats.adsCost)} €`}</div>
                    <div className="text-[12px] text-gray-500">Ads kulu</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{fmtNum(r.stats.orders)}</div>
                    <div className="text-[12px] text-gray-500">tellimust</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{r.stats.revenue === null ? '–' : `${fmtNum(Math.round(r.stats.revenue))} €`}</div>
                    <div className="text-[12px] text-gray-500">käive</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{r.insightsCount}</div>
                    <div className="text-[12px] text-gray-500">leidu</div>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); void remove(r) }}
                    disabled={deleting === r.id}
                    className="self-center ml-2 inline-flex items-center gap-1.5 text-[14px] text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    <Trash2 size={14} />
                    {deleting === r.id ? 'Kustutan…' : 'Kustuta'}
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
