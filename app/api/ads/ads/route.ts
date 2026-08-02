import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/api-auth'

export async function GET() {
  try { await requireAdmin() } catch (response) { return response as NextResponse }
  try {
    const { data: ads } = await supabaseAdmin
      .from('ads')
      .select('*, creatives(*)')

    return NextResponse.json(ads || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
