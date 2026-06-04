/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { insightsToCSV, insightsToXLSX } from '@/lib/ads/export'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const format = searchParams.get('format') || 'csv'

  if (!id) {
    return NextResponse.json({ error: 'Report ID required' }, { status: 400 })
  }

  try {
    const { data: report } = await supabaseAdmin
      .from('generated_reports')
      .select('*')
      .eq('id', id)
      .single()

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Get the insights data for this report period
    const { data: insights } = await supabaseAdmin
      .from('daily_insights')
      .select('*')
      .gte('date', report.date_start)
      .lte('date', report.date_end)
      .limit(10000)

    if (!insights?.length) {
      return NextResponse.json({ error: 'No data for export' }, { status: 404 })
    }

    if (format === 'csv') {
      const csv = insightsToCSV(insights)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${id}.csv"`,
        },
      })
    }

    if (format === 'xlsx') {
      const buf = insightsToXLSX(insights, report.title)
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="report-${id}.xlsx"`,
        },
      })
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
