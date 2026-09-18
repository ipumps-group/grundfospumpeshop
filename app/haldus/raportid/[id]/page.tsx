'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Insight, ReportChange, StoredReport } from '@/lib/reporting/types'
import { markdownToHtml } from '@/lib/reporting/email-html'

interface ReportSummary {
  id: number
  weekEnd: string
  stats: { gscClicksPerDay: number | null; sessions: number | null; adsCost: number | null; orders: number | null }
}

const SEV_META: Record<Insight['severity'], { label: string; classes: string }> = {
  negative: { label: 'Kriitiline', classes: 'bg-red-100 text-red-700' },
  warning: { label: 'Tähelepanu', classes: 'bg-amber-100 text-amber-800' },
  opportunity: { label: 'Võimalus', classes: 'bg-blue-100 text-blue-700' },
  positive: { label: 'Positiivne', classes: 'bg-green-100 text-green-700' },
}

const AREA_LABELS: Record<Insight['area'], string> = {
  seo: 'SEO / Search Console',
  ads: 'Google Ads',
  ga4: 'Liiklus (GA4)',
  orders: 'Tellimused',
  strategy: 'Strateegia',
}

const AREA_ORDER: Insight['area'][] = ['seo', 'ads', 'ga4', 'orders', 'strategy']

const CHANGE_META: Record<ReportChange['direction'], { label: string; classes: string; arrow: string }> = {
  improved: { label: 'Paranes', classes: 'bg-green-100 text-green-700', arrow: '▲' },
  worsened: { label: 'Halvenes', classes: 'bg-red-100 text-red-700', arrow: '▼' },
  unchanged: { label: 'Stabiilne', classes: 'bg-slate-100 text-gray-500', arrow: '■' },
}

const ORDER_STATUS: Record<string, string> = {
  pending: 'Ootel',
  paid: 'Makstud',
  processing: 'Töötlemisel',
  shipped: 'Saadetud',
  delivered: 'Kohale toimetatud',
  cancelled: 'Tühistatud',
  failed: 'Ebaõnnestunud',
}

const r1 = (n: number) => Math.round(n * 10) / 10
const fmtPos = (p: number | null | undefined) => (p === null || p === undefined ? '–' : r1(p).toFixed(1).replace('.', ','))
const fmtMoney = (n: number) => `${n.toFixed(2).replace('.', ',')} €`
const fmtPct = (n: number | null) => (n === null ? '–' : `${Math.round(n * 100)} %`)
const fmtChangeValue = (c: ReportChange, v: number | null) => {
  if (v === null) return '–'
  const s = String(v).replace('.', ',')
  return c.unit === '€' ? `${s} €` : c.unit === '%' ? `${s} %` : s
}

/** ▲ improved · ■ stable (±2) · ▼ dropped — the manual reports' convention. */
function posArrow(cur: number | null, prev: number | null): { symbol: string; classes: string } {
  if (cur === null || prev === null) return { symbol: '–', classes: 'text-gray-400' }
  const delta = prev - cur
  if (delta >= 2) return { symbol: '▲', classes: 'text-green-600' }
  if (delta <= -2) return { symbol: '▼', classes: 'text-red-600' }
  return { symbol: '■', classes: 'text-gray-400' }
}

function Delta({ cur, prev, invert = false, suffix = '%' }: { cur: number; prev: number; invert?: boolean; suffix?: string }) {
  if (prev === 0) return <span className="text-gray-400">eelmine: 0</span>
  const pct = Math.round(((cur - prev) / prev) * 100)
  const good = invert ? pct < 0 : pct > 0
  const cls = pct === 0 ? 'text-gray-400' : good ? 'text-green-600' : 'text-red-600'
  const arrow = pct === 0 ? '■' : pct > 0 ? '▲' : '▼'
  return <span className={cls}>{arrow} {pct > 0 ? '+' : ''}{pct} {suffix} vs eelmine nädal</span>
}

function Card({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <div className="text-[13px] text-gray-500">{label}</div>
      <div className="text-[24px] font-bold text-gray-900 my-1">{value}</div>
      {children && <div className="text-[13px]">{children}</div>}
    </div>
  )
}

/** Tiny inline-SVG bar trend of the last N weekly values. */
function Trend({ label, values }: { label: string; values: (number | null)[] }) {
  const nums = values.filter((v): v is number => v !== null)
  if (nums.length < 2) return null
  const max = Math.max(...nums, 1)
  const w = 120
  const h = 36
  const bw = w / nums.length
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <div className="text-[13px] text-gray-500 mb-1">{label}</div>
      <svg width={w} height={h} className="block" role="img" aria-label={label}>
        {nums.map((v, i) => {
          const bh = Math.max(2, (v / max) * (h - 4))
          return <rect key={i} x={i * bw + 1} y={h - bh} width={bw - 2} height={bh} rx={2} fill={i === nums.length - 1 ? '#003366' : '#3abeff'} />
        })}
      </svg>
      <div className="text-[13px] text-gray-900 font-medium mt-1">viimane: {r1(nums[nums.length - 1]).toString().replace('.', ',')}</div>
    </div>
  )
}

export default function ReportDetailPage() {
  const params = useParams()
  const id = Number(params?.id)
  const [report, setReport] = useState<StoredReport | null>(null)
  const [trend, setTrend] = useState<ReportSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')

  const resendEmail = async () => {
    setSending(true)
    setEmailMessage('')
    try {
      const res = await fetch(`/api/haldus/reports/${id}`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.email?.success) {
        setEmailMessage(`E-kiri saadetud: ${data.email.recipients}`)
        const fresh = await fetch(`/api/haldus/reports/${id}`).then((r) => r.json()).catch(() => null)
        if (fresh?.report) setReport(fresh.report)
      } else {
        setEmailMessage(`Viga: ${data.email?.error || data.error || 'saatmine ebaõnnestus'}`)
      }
    } catch {
      setEmailMessage('Viga: e-kirja saatmine ebaõnnestus')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (!Number.isFinite(id)) return
    Promise.all([
      fetch(`/api/haldus/reports/${id}`).then((r) => r.json()),
      fetch('/api/haldus/reports').then((r) => r.json()),
    ])
      .then(([detail, list]) => {
        if (detail.report) setReport(detail.report)
        else setError(detail.error || 'Raportit ei leitud')
        setTrend((list.reports ?? []).slice(0, 8).reverse())
      })
      .catch(() => setError('Raporti laadimine ebaõnnestus'))
      .finally(() => setLoading(false))
  }, [id])

  const narrativeHtml = useMemo(() => (report?.narrative ? markdownToHtml(report.narrative) : ''), [report])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (error || !report) return <p className="text-[15px] text-red-600">{error || 'Raportit ei leitud'}</p>

  const s = report.snapshot
  const changes = report.changes ?? []
  const insightsByArea = new Map<Insight['area'], Insight[]>()
  for (const ins of report.insights) {
    insightsByArea.set(ins.area, [...(insightsByArea.get(ins.area) ?? []), ins])
  }

  const prevQueryMap = new Map((s.gsc?.prevQueries ?? []).map((q) => [q.query, q]))
  const families = (s.gsc?.families ?? []).filter((f) => f.current.impressions > 0 || f.previous.impressions > 0)

  return (
    <div className="max-w-[1100px] space-y-6">
      <Link href="/haldus/raportid/" className="text-[15px] text-[#003366] hover:underline">← Kõik raportid</Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nädalaraport {s.period.start.split('-').reverse().join('.')} – {s.period.end.split('-').reverse().join('.')}
          </h1>
          <p className="text-[15px] text-gray-500 mt-1">
            Võrdlusperiood {s.period.prevStart.split('-').reverse().join('.')} – {s.period.prevEnd.split('-').reverse().join('.')} ·
            genereeritud {new Date(report.createdAt).toLocaleString('et-EE')} ·{' '}
            {report.emailSentAt
              ? <span className="text-emerald-600">e-kiri saadetud {new Date(report.emailSentAt).toLocaleString('et-EE')}</span>
              : report.emailError
                ? <span className="text-red-600">e-kirja viga: {report.emailError}</span>
                : 'e-kirja pole saadetud'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={resendEmail}
            disabled={sending}
            className="bg-[#003366] text-white py-2 px-5 rounded-xl text-[15px] font-medium hover:bg-[#004488] transition-colors disabled:opacity-60"
          >
            {sending ? 'Saadan…' : report.emailSentAt ? 'Saada e-kiri uuesti' : 'Saada e-kiri'}
          </button>
          {emailMessage && (
            <p className={`text-[15px] ${emailMessage.startsWith('Viga') ? 'text-red-600' : 'text-emerald-600'}`}>{emailMessage}</p>
          )}
        </div>
      </div>

      {s.errors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-[15px] text-amber-800 font-medium">Osad andmeallikad ebaõnnestusid:</p>
          <ul className="text-[14px] text-amber-800 list-disc pl-5 mt-1">
            {s.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {s.gsc && (
          <>
            <Card label="GSC klikke/päevas" value={r1(s.gsc.current.clicks / s.gsc.current.days).toFixed(1).replace('.', ',')}>
              <Delta cur={s.gsc.current.clicks / s.gsc.current.days} prev={s.gsc.previous.clicks / s.gsc.previous.days} />
            </Card>
            <Card label="Näitamisi/päevas" value={String(Math.round(s.gsc.current.impressions / s.gsc.current.days))}>
              <Delta cur={s.gsc.current.impressions / s.gsc.current.days} prev={s.gsc.previous.impressions / s.gsc.previous.days} />
            </Card>
            <Card label="Keskmine positsioon" value={fmtPos(s.gsc.current.position)}>
              <Delta cur={s.gsc.current.position} prev={s.gsc.previous.position} invert suffix="%" />
            </Card>
            <Card label="CTR" value={`${(s.gsc.current.ctr * 100).toFixed(1).replace('.', ',')} %`}>
              <span className="text-gray-400">eelmine: {(s.gsc.previous.ctr * 100).toFixed(1).replace('.', ',')} %</span>
            </Card>
          </>
        )}
        {s.ga4 && (
          <>
            <Card label="Sessioonid (GA4)" value={String(Math.round(s.ga4.current.sessions))}>
              <Delta cur={s.ga4.current.sessions} prev={s.ga4.previous.sessions} />
            </Card>
            <Card label="Kasutajad" value={String(Math.round(s.ga4.current.users))}>
              <Delta cur={s.ga4.current.users} prev={s.ga4.previous.users} />
            </Card>
            <Card label="Kaasatus" value={`${(s.ga4.current.engagementRate * 100).toFixed(1).replace('.', ',')} %`}>
              <span className="text-gray-400">eelmine: {(s.ga4.previous.engagementRate * 100).toFixed(1).replace('.', ',')} %</span>
            </Card>
          </>
        )}
        {s.ads?.available && (
          <Card label="Ads kulu" value={fmtMoney(s.ads.totals.cost)}>
            <span className="text-gray-400">
              {s.ads.totals.clicks} klikki · {s.ads.totals.conversions.toFixed(1).replace('.', ',')} konv (Ads)
            </span>
          </Card>
        )}
        {s.orders && (
          <>
            <Card label="Tellimused" value={String(s.orders.current.orders)}>
              <Delta cur={s.orders.current.orders} prev={s.orders.previous.orders} suffix="" />
            </Card>
            <Card label="Käive" value={fmtMoney(s.orders.current.revenue)}>
              <span className="text-gray-400">eelmine nädal: {fmtMoney(s.orders.previous.revenue)} · keskm. tellimus {fmtMoney(s.orders.current.avgOrderValue)}</span>
            </Card>
          </>
        )}
      </div>

      {/* Changes vs the previous stored report */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-[18px] font-bold text-gray-900 mb-1">Muutused eelmise raportiga</h2>
        {changes.length === 0 ? (
          <p className="text-[14px] text-gray-500">Esimene raport — võrdluspunkti pole. Järgmisest raportist näidatakse siin paranemisi ja halvenemisi.</p>
        ) : (
          <>
            <p className="text-[13px] text-gray-500 mb-3">▲ paranes · ▼ halvenes · ■ stabiilne (&lt;5 % muutus) · võrdlus eelmise salvestatud raportiga</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px] min-w-[520px]">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-2 pr-3 font-medium">Näitaja</th>
                    <th className="py-2 pr-3 font-medium text-right">Eelmine raport</th>
                    <th className="py-2 pr-3 font-medium text-right">See raport</th>
                    <th className="py-2 pr-3 font-medium text-right">Muutus</th>
                    <th className="py-2 font-medium text-right">Hinnang</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.map((c) => {
                    const m = CHANGE_META[c.direction]
                    return (
                      <tr key={c.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 pr-3 font-medium text-gray-900">{c.label}</td>
                        <td className="py-2 pr-3 text-right text-gray-500">{fmtChangeValue(c, c.previous)}</td>
                        <td className="py-2 pr-3 text-right font-medium text-gray-900">{fmtChangeValue(c, c.current)}</td>
                        <td className="py-2 pr-3 text-right text-gray-500">
                          {c.deltaPct === null ? '–' : `${c.deltaPct > 0 ? '+' : ''}${String(c.deltaPct).replace('.', ',')} %`}
                        </td>
                        <td className="py-2 text-right">
                          <span className={`inline-block text-[12px] font-bold rounded-lg px-2 py-0.5 ${m.classes}`}>
                            {m.arrow} {m.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 8-week trends */}
      {trend.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-[18px] font-bold text-gray-900 mb-3">Trend (viimased {trend.length} nädalat)</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Trend label="GSC klikke/päevas" values={trend.map((t) => t.stats.gscClicksPerDay)} />
            <Trend label="Sessioonid" values={trend.map((t) => t.stats.sessions)} />
            <Trend label="Ads kulu €" values={trend.map((t) => t.stats.adsCost)} />
            <Trend label="Tellimused" values={trend.map((t) => t.stats.orders)} />
          </div>
        </div>
      )}

      {/* LLM narrative */}
      {narrativeHtml && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-[18px] font-bold text-gray-900 mb-2">Analüüs ja soovitused</h2>
          {/* LLM-generated Estonian narrative, sanitized via escapeHtml in markdownToHtml */}
          <div dangerouslySetInnerHTML={{ __html: narrativeHtml }} />
        </div>
      )}

      {/* Insights */}
      {report.insights.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-[18px] font-bold text-gray-900 mb-4">Leiud ja järgmised sammud</h2>
          {AREA_ORDER.filter((a) => insightsByArea.has(a)).map((area) => (
            <div key={area} className="mb-5 last:mb-0">
              <h3 className="text-[16px] font-bold text-gray-900 mb-2">{AREA_LABELS[area]}</h3>
              <div className="flex flex-col gap-2">
                {(insightsByArea.get(area) ?? []).map((ins, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4">
                    <span className={`inline-block text-[12px] font-bold rounded-lg px-2 py-0.5 mb-1.5 ${SEV_META[ins.severity].classes}`}>
                      {SEV_META[ins.severity].label}
                    </span>
                    <div className="text-[15px] font-bold text-gray-900">{ins.title}</div>
                    <div className="text-[14px] text-gray-600 mt-1">{ins.detail}</div>
                    <div className="text-[14px] text-blue-700 mt-1.5"><strong>Järgmine samm:</strong> {ins.action}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Keyword families */}
      {families.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
          <h2 className="text-[18px] font-bold text-gray-900 mb-1">Märksõnade peatabel</h2>
          <p className="text-[13px] text-gray-500 mb-3">▲ tõus ≥2 kohta · ■ stabiilne · ▼ langus · positsioon = näitamistega kaalutud keskmine · &lt;10 näitamist = müra</p>
          <table className="w-full text-[14px] min-w-[560px]">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-3 font-medium">Märksõnapere</th>
                <th className="py-2 pr-3 font-medium text-right">Pos (7p)</th>
                <th className="py-2 pr-3 font-medium text-right">Eelmine</th>
                <th className="py-2 pr-3 font-medium text-center">Muutus</th>
                <th className="py-2 pr-3 font-medium text-right">Näitamised</th>
                <th className="py-2 font-medium text-right">Klikid</th>
              </tr>
            </thead>
            <tbody>
              {families.map((f) => {
                const arrow = posArrow(f.current.position, f.previous.position)
                const noise = f.current.impressions < 10 && f.previous.impressions < 10
                return (
                  <tr key={f.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-3 font-medium text-gray-900">{f.label}{noise && <span className="text-gray-400 font-normal"> (müra)</span>}</td>
                    <td className="py-2 pr-3 text-right">{fmtPos(f.current.position)}</td>
                    <td className="py-2 pr-3 text-right text-gray-500">{fmtPos(f.previous.position)}</td>
                    <td className={`py-2 pr-3 text-center ${arrow.classes}`}>{arrow.symbol}</td>
                    <td className="py-2 pr-3 text-right">{f.current.impressions}</td>
                    <td className="py-2 text-right">{f.current.clicks}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Top queries */}
      {s.gsc && s.gsc.topQueries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
          <h2 className="text-[18px] font-bold text-gray-900 mb-3">Top päringud (näitamiste järgi)</h2>
          <table className="w-full text-[14px] min-w-[620px]">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-3 font-medium">Päring</th>
                <th className="py-2 pr-3 font-medium text-right">Näitamised</th>
                <th className="py-2 pr-3 font-medium text-right">Klikid</th>
                <th className="py-2 pr-3 font-medium text-right">CTR</th>
                <th className="py-2 pr-3 font-medium text-right">Pos</th>
                <th className="py-2 font-medium text-right">Eelmine pos</th>
              </tr>
            </thead>
            <tbody>
              {s.gsc.topQueries.slice(0, 20).map((q) => {
                const prev = prevQueryMap.get(q.query)
                const arrow = posArrow(q.position, prev?.position ?? null)
                return (
                  <tr key={q.query} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-3 text-gray-900">{q.query}</td>
                    <td className="py-2 pr-3 text-right">{q.impressions}</td>
                    <td className="py-2 pr-3 text-right">{q.clicks}</td>
                    <td className="py-2 pr-3 text-right">{(q.ctr * 100).toFixed(1).replace('.', ',')} %</td>
                    <td className="py-2 pr-3 text-right">{fmtPos(q.position)} <span className={arrow.classes}>{arrow.symbol}</span></td>
                    <td className="py-2 text-right text-gray-500">{prev ? fmtPos(prev.position) : '–'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New queries */}
      {s.gsc && s.gsc.newQueries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
          <h2 className="text-[18px] font-bold text-gray-900 mb-1">Uued päringud (võimalikud uued märksõnad)</h2>
          <p className="text-[13px] text-gray-500 mb-3">Ilmunud sel nädalal (eelmisel praktiliselt puudusid), brändipäringud välja arvatud.</p>
          <table className="w-full text-[14px] min-w-[480px]">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-3 font-medium">Päring</th>
                <th className="py-2 pr-3 font-medium text-right">Näitamised</th>
                <th className="py-2 font-medium text-right">Pos</th>
              </tr>
            </thead>
            <tbody>
              {s.gsc.newQueries.map((q) => (
                <tr key={q.query} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 pr-3 text-gray-900">{q.query}</td>
                  <td className="py-2 pr-3 text-right">{q.impressions}</td>
                  <td className="py-2 text-right">{fmtPos(q.position)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ads campaigns */}
      {s.ads?.available && s.ads.campaigns.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-x-auto">
          <h2 className="text-[18px] font-bold text-gray-900 mb-3">Google Ads kampaaniad</h2>
          <table className="w-full text-[14px] min-w-[760px]">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-3 font-medium">Kampaania</th>
                <th className="py-2 pr-3 font-medium text-right">Kulu</th>
                <th className="py-2 pr-3 font-medium text-right">Klikid</th>
                <th className="py-2 pr-3 font-medium text-right">CPC</th>
                <th className="py-2 pr-3 font-medium text-right">Konv</th>
                <th className="py-2 pr-3 font-medium text-right">Näitam. osa</th>
                <th className="py-2 pr-3 font-medium text-right">Kaotatud (koht)</th>
                <th className="py-2 font-medium text-right">Kaotatud (eelarve)</th>
              </tr>
            </thead>
            <tbody>
              {s.ads.campaigns.map((c) => (
                <tr key={c.name} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 pr-3 text-gray-900 font-medium">{c.name}</td>
                  <td className="py-2 pr-3 text-right">{fmtMoney(c.cost)}</td>
                  <td className="py-2 pr-3 text-right">{c.clicks}</td>
                  <td className="py-2 pr-3 text-right">{fmtMoney(c.avgCpc)}</td>
                  <td className="py-2 pr-3 text-right">{c.allConversions.toFixed(1).replace('.', ',')}</td>
                  <td className="py-2 pr-3 text-right">{fmtPct(c.impressionShare)}</td>
                  <td className="py-2 pr-3 text-right">{fmtPct(c.rankLostIS)}</td>
                  <td className="py-2 text-right">{fmtPct(c.budgetLostIS)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[13px] text-gray-500 mt-3">
            Brändi päringud: {fmtMoney(s.ads.brand.cost)} / {s.ads.brand.clicks} klikki · mitte-brändi: {fmtMoney(s.ads.nonBrand.cost)} / {s.ads.nonBrand.clicks} klikki.
            {s.ads.totals.cost > 0 ? ` Otsingupäringute andmed katavad ${Math.round(((s.ads.brand.cost + s.ads.nonBrand.cost) / s.ads.totals.cost) * 100)} % kogukulust — ülejäänud osa jaotab Google privaatsuskünnise tõttu („Muud otsingupäringud"), see EI OLE brändi- ega konkurentide kulu.` : ''}
            {" „Kaotatud (koht)“ = konkurentsikaotus (ad rank), „kaotatud (eelarve)“ = eelarve piirang."}
          </p>
        </div>
      )}

      {/* Orders */}
      {s.orders && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-[18px] font-bold text-gray-900 mb-3">Tellimused (andmebaas = tõde)</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Card label="Tellimused" value={String(s.orders.current.orders)}>
              <span className="text-gray-400">eelmine nädal: {s.orders.previous.orders}</span>
            </Card>
            <Card label="Käive" value={fmtMoney(s.orders.current.revenue)}>
              <span className="text-gray-400">eelmine nädal: {fmtMoney(s.orders.previous.revenue)}</span>
            </Card>
            <Card label="Keskmine tellimus" value={fmtMoney(s.orders.current.avgOrderValue)}>
              <span className="text-gray-400">eelmine nädal: {fmtMoney(s.orders.previous.avgOrderValue)}</span>
            </Card>
            <Card label="Tühistatud / ebaõnnestunud" value={`${s.orders.current.cancelled} / ${s.orders.current.failed}`}>
              <span className="text-gray-400">eelmine nädal: {s.orders.previous.cancelled} / {s.orders.previous.failed}</span>
            </Card>
          </div>
          {s.orders.topProducts.length > 0 && (
            <>
              <h3 className="text-[15px] font-bold text-gray-900 mb-2">Top tooted (käibe järgi)</h3>
              <table className="w-full text-[14px] mb-4">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-1.5 pr-3 font-medium">Toode</th>
                    <th className="py-1.5 pr-3 font-medium text-right w-20">Kogus</th>
                    <th className="py-1.5 font-medium text-right w-24">Käive</th>
                  </tr>
                </thead>
                <tbody>
                  {s.orders.topProducts.map((p) => (
                    <tr key={p.name} className="border-b border-gray-50 last:border-0">
                      <td className="py-1.5 pr-3 text-gray-900">{p.name}</td>
                      <td className="py-1.5 pr-3 text-right">{p.quantity}</td>
                      <td className="py-1.5 text-right">{fmtMoney(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {(s.orders.orders ?? []).length > 0 && (
            <div className="mt-5">
              <h3 className="text-[15px] font-bold text-gray-900 mb-2">Nädala tellimused</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[14px] min-w-[640px]">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="py-2 pr-3 font-medium">Kuupäev</th>
                      <th className="py-2 pr-3 font-medium">Klient</th>
                      <th className="py-2 pr-3 font-medium text-right">Summa</th>
                      <th className="py-2 pr-3 font-medium">Staatus</th>
                      <th className="py-2 font-medium">Tooted (lühidalt)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(s.orders.orders ?? []).map((o) => (
                      <tr key={o.id} className="border-b border-gray-50 last:border-0 align-top">
                        <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">{o.createdAt.slice(0, 10).split('-').reverse().join('.')}</td>
                        <td className="py-2 pr-3 font-medium text-gray-900">{o.customer || '—'}</td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap">{fmtMoney(o.total)}</td>
                        <td className="py-2 pr-3 text-gray-600">{ORDER_STATUS[o.status] ?? o.status}</td>
                        <td className="py-2 text-gray-600">{o.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GA4 channels + top pages */}
      {s.ga4 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-[18px] font-bold text-gray-900 mb-3">Kanalid (GA4)</h2>
            <table className="w-full text-[14px]">
              <tbody>
                {s.ga4.channels.map((c) => (
                  <tr key={c.channel} className="border-b border-gray-50 last:border-0">
                    <td className="py-1.5 pr-3 text-gray-900">{c.channel}</td>
                    <td className="py-1.5 pr-3 text-right w-20">{Math.round(c.sessions)}</td>
                    <td className="py-1.5 text-right w-24 text-gray-500">{Math.round(c.keyEvents)} key ev</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-[18px] font-bold text-gray-900 mb-3">Top lehed (GA4)</h2>
            <table className="w-full text-[14px]">
              <tbody>
                {s.ga4.topPages.slice(0, 10).map((p) => (
                  <tr key={p.path} className="border-b border-gray-50 last:border-0">
                    <td className="py-1.5 pr-3 text-gray-900 break-all">{p.path}</td>
                    <td className="py-1.5 text-right w-16">{Math.round(p.sessions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
