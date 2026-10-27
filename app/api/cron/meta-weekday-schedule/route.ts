import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Meta weekday schedule: pauses managed ACTIVE ad sets for the weekend
// (Sat/Sun, Europe/Tallinn) and resumes them on Monday. Meta's native ad
// scheduling (adset_schedule) requires lifetime budgets, so we keep daily
// budgets and toggle status via cron instead (see vercel.json:
// daily 22:00 UTC = 00:00 Tallinn next day, + 03:00 UTC safety net).
// Protected by CRON_SECRET like /api/cron/weather-pulse.
//
// Only ad sets WE paused are resumed (ids stored in Supabase `settings`),
// so manual pauses are never undone. Managed list is explicit on purpose —
// paused/retired campaigns (Unilift etc.) are never touched.

const MANAGED_ADSETS: { id: string; label: string }[] = [
  { id: '120253844083270120', label: 'Paigaldajad - ALPHA GO' },
  { id: '120253844084170120', label: 'Edasimüüjad ja ehitusettevõtted - ALPHA GO' },
  { id: '120254269938500120', label: 'RMK külastajad 30p (excl ostjad)' },
  { id: '120254269938960120', label: 'RMK tootevaatajad + kampaanialehed 30p (excl ostjad)' },
]
const SETTINGS_KEY = 'meta_weekday_pause_state'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function metaGet(id: string) {
  const v = process.env.META_GRAPH_API_VERSION || 'v25.0'
  const r = await fetch(`https://graph.facebook.com/${v}/${id}?fields=status&access_token=${process.env.META_ACCESS_TOKEN}`)
  return r.json()
}

async function metaSetStatus(id: string, status: 'ACTIVE' | 'PAUSED') {
  const v = process.env.META_GRAPH_API_VERSION || 'v25.0'
  const r = await fetch(`https://graph.facebook.com/${v}/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, access_token: process.env.META_ACCESS_TOKEN }),
  })
  const d = await r.json()
  if (d.error) throw new Error(`Meta ${id} -> ${status}: ${d.error.message}`)
  return d
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Estonian local weekday (0=Sun … 6=Sat)
  const tallinn = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Tallinn' }))
  const day = tallinn.getDay()
  const isWeekend = day === 0 || day === 6
  const today = tallinn.toLocaleDateString('sv-SE')

  try {
    const db = supabase()

    if (isWeekend) {
      const paused: string[] = []
      const skipped: string[] = []
      for (const a of MANAGED_ADSETS) {
        const cur = await metaGet(a.id)
        if (cur.status === 'ACTIVE') {
          await metaSetStatus(a.id, 'PAUSED')
          paused.push(a.id)
        } else {
          skipped.push(`${a.label} (${cur.status ?? 'unknown'})`)
        }
      }
      if (paused.length > 0) {
        await db.from('settings').upsert({ key: SETTINGS_KEY, value: JSON.stringify(paused), updated_at: new Date().toISOString() })
      }
      return NextResponse.json({ action: 'pause', today, paused, skipped })
    }

    // Weekday: resume only what the weekend logic paused
    const { data } = await db.from('settings').select('value').eq('key', SETTINGS_KEY).maybeSingle()
    const ids: string[] = data?.value ? JSON.parse(data.value) : []
    const resumed: string[] = []
    const failed: string[] = []
    for (const id of ids) {
      try {
        await metaSetStatus(id, 'ACTIVE')
        resumed.push(id)
      } catch (e: any) {
        failed.push(`${id}: ${e.message}`)
      }
    }
    if (ids.length > 0) {
      await db.from('settings').upsert({ key: SETTINGS_KEY, value: '[]', updated_at: new Date().toISOString() })
    }
    return NextResponse.json({ action: 'resume', today, resumed, failed })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
