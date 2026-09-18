import { NextResponse } from 'next/server'
import { generateWeeklyReport } from '@/lib/reporting/generate'
import { sendReportEmail } from '@/lib/reporting/notify'

/**
 * Weekly marketing report — Vercel Cron every Friday 06:00 UTC (09:00 EEST,
 * see vercel.json). Generates the report, stores it and e-mails it to the
 * `report_email_recipients` setting (fallback info@pumbapood.ee).
 *
 * Protected by CRON_SECRET like /api/cron/weather-pulse. `?send=0` generates
 * and stores the report without sending the e-mail (manual testing).
 *
 * Requires env (Pumbapood's OWN credentials, NOT the SPS ones):
 * GOOGLE_ADS_CLIENT_ID/SECRET/REFRESH_TOKEN + GOOGLE_ADS_DEVELOPER_TOKEN +
 * GOOGLE_ADS_CUSTOMER_ID (Ads + GA4 OAuth), GA4_PROPERTY_ID,
 * GSC_SERVICE_ACCOUNT_EMAIL / GSC_SERVICE_ACCOUNT_KEY (+ GSC_SITE_URL),
 * RESEND_API_KEY — plus ANTHROPIC_API_KEY for the LLM narrative (optional,
 * degrades gracefully to rules-only).
 */

// GSC + GA4 + Ads + DB pulls + the LLM narrative can take 1–3 minutes.
export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return new Response('Not found', { status: 404 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  }

  const { searchParams } = new URL(request.url)
  const shouldSend = searchParams.get('send') !== '0'

  try {
    const report = await generateWeeklyReport()
    const email = shouldSend
      ? { attempted: true, ...(await sendReportEmail(report)) }
      : { attempted: false }
    return NextResponse.json(
      {
        ok: true,
        reportId: report.id,
        week: `${report.weekStart} → ${report.weekEnd}`,
        insights: report.insights.length,
        changes: report.changes.length,
        narrative: report.narrative ? 'llm' : 'rules-only',
        dataErrors: report.snapshot.errors,
        email,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (error) {
    console.error('Weekly report cron failed:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Report generation failed' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  }
}
