import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// PUT /api/haldus/settings — upsert settings key-value pairs
export async function PUT(req: NextRequest) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  let body: { settings?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  if (!body.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) {
    return NextResponse.json({ error: 'Väli "settings" peab olema objekt' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const upserts = Object.entries(body.settings as Record<string, unknown>)
    .filter(([key]) => /^[a-z0-9_]+$/i.test(key) && key.length <= 100)
    .map(([key, value]) => ({ key, value: String(value ?? ''), updated_at: now }))

  if (upserts.length === 0) return NextResponse.json({ saved: true, count: 0 })

  const { error } = await supabaseAdmin.from('settings').upsert(upserts, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ saved: true, count: upserts.length })
}
