import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { listWeeklyReports, deleteWeeklyReports } from '@/lib/reporting/store'
import { generateWeeklyReport } from '@/lib/reporting/generate'
import { sendReportEmail } from '@/lib/reporting/notify'

/** Report generation pulls ~10 API calls + optional LLM narrative. */
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' }

async function guard(): Promise<NextResponse | null> {
  try {
    await requireAdmin()
    return null
  } catch (res) {
    return res as NextResponse
  }
}

/** GET — list stored weekly reports (light summaries), newest first. */
export async function GET() {
  const denied = await guard()
  if (denied) return denied
  try {
    const reports = await listWeeklyReports()
    const summaries = reports.map((r) => {
      const s = r.snapshot
      return {
        id: r.id,
        weekStart: r.weekStart,
        weekEnd: r.weekEnd,
        createdAt: r.createdAt,
        emailSentAt: r.emailSentAt,
        emailError: r.emailError,
        hasNarrative: Boolean(r.narrative),
        insightsCount: r.insights.length,
        changesSummary: {
          improved: r.changes.filter((c) => c.direction === 'improved').length,
          worsened: r.changes.filter((c) => c.direction === 'worsened').length,
        },
        stats: {
          gscClicksPerDay: s.gsc ? Math.round((s.gsc.current.clicks / s.gsc.current.days) * 10) / 10 : null,
          gscImpressionsPerDay: s.gsc ? Math.round(s.gsc.current.impressions / s.gsc.current.days) : null,
          sessions: s.ga4 ? Math.round(s.ga4.current.sessions) : null,
          adsCost: s.ads?.available ? Math.round(s.ads.totals.cost * 100) / 100 : null,
          orders: s.orders ? s.orders.current.orders : null,
          revenue: s.orders ? s.orders.current.revenue : null,
        },
      }
    })
    return NextResponse.json({ reports: summaries }, { headers: NO_STORE })
  } catch (error) {
    console.error('Reports GET error:', error)
    return NextResponse.json({ error: 'Raportite laadimine ebaõnnestus' }, { status: 500, headers: NO_STORE })
  }
}

/** POST — generate a report now. Body: { sendEmail?: boolean } (default false). */
export async function POST(request: Request) {
  const denied = await guard()
  if (denied) return denied
  try {
    let sendEmailFlag = false
    try {
      const body = (await request.json()) as { sendEmail?: boolean }
      sendEmailFlag = body.sendEmail === true
    } catch {
      // empty body is fine
    }

    const report = await generateWeeklyReport()
    const email = sendEmailFlag
      ? { attempted: true, ...(await sendReportEmail(report)) }
      : { attempted: false }
    return NextResponse.json({ report, email }, { headers: NO_STORE })
  } catch (error) {
    console.error('Reports POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Raporti genereerimine ebaõnnestus' },
      { status: 500, headers: NO_STORE },
    )
  }
}

/** DELETE — remove stored reports. Body: { ids: number[] }. */
export async function DELETE(request: Request) {
  const denied = await guard()
  if (denied) return denied
  try {
    const body = (await request.json().catch(() => null)) as { ids?: unknown } | null
    const ids = Array.isArray(body?.ids)
      ? body!.ids.map(Number).filter((n) => Number.isInteger(n) && n > 0)
      : []
    if (ids.length === 0 || ids.length > 200) {
      return NextResponse.json({ error: 'Invalid ids' }, { status: 400, headers: NO_STORE })
    }

    const deleted = await deleteWeeklyReports(ids)
    return NextResponse.json({ success: true, deleted }, { headers: NO_STORE })
  } catch (error) {
    console.error('Reports DELETE error:', error)
    return NextResponse.json({ error: 'Raporti kustutamine ebaõnnestus' }, { status: 500, headers: NO_STORE })
  }
}
