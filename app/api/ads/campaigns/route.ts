import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .order('campaign_name')

    const { data: accounts } = await supabaseAdmin
      .from('ad_accounts')
      .select('*, platform:ad_platforms(*)')

    const { data: syncLogs } = await supabaseAdmin
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ campaigns: campaigns || [], accounts: accounts || [], syncLogs: syncLogs || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
