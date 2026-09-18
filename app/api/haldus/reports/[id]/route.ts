import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { getWeeklyReport } from '@/lib/reporting/store'
import { sendReportEmail } from '@/lib/reporting/notify'

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

/** GET — one stored report with the full snapshot. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await guard()
  if (denied) return denied
  try {
    const { id } = await context.params
    const report = await getWeeklyReport(Number(id))
    if (!report) {
      return NextResponse.json({ error: 'Raportit ei leitud' }, { status: 404, headers: NO_STORE })
    }
    return NextResponse.json({ report }, { headers: NO_STORE })
  } catch (error) {
    console.error('Report GET error:', error)
    return NextResponse.json({ error: 'Raporti laadimine ebaõnnestus' }, { status: 500, headers: NO_STORE })
  }
}

/** POST — resend the report e-mail to the configured recipients. */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await guard()
  if (denied) return denied
  try {
    const { id } = await context.params
    const report = await getWeeklyReport(Number(id))
    if (!report) {
      return NextResponse.json({ error: 'Raportit ei leitud' }, { status: 404, headers: NO_STORE })
    }

    const email = await sendReportEmail(report)
    return NextResponse.json({ email }, { headers: NO_STORE })
  } catch (error) {
    console.error('Report resend error:', error)
    return NextResponse.json({ error: 'E-kirja saatmine ebaõnnestus' }, { status: 500, headers: NO_STORE })
  }
}
