import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const { data: ads } = await supabaseAdmin
      .from('ads')
      .select('*, creatives(*)')

    return NextResponse.json(ads || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
