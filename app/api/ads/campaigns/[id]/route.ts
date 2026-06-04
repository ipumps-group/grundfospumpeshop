import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('*, ad_groups(*), ad_sets(*), ads(*)')
      .eq('id', id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const { data: insights } = await supabaseAdmin
      .from('daily_insights')
      .select('*')
      .eq('campaign_id', id)
      .order('date', { ascending: false })
      .limit(365)

    const { data: recommendations } = await supabaseAdmin
      .from('recommendations')
      .select('*, campaign:campaigns(*)')
      .eq('affected_campaign_id', id)
      .order('created_at', { ascending: false })

    const { data: changeLogs } = await supabaseAdmin
      .from('change_logs')
      .select('*')
      .order('performed_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      campaign,
      insights: insights || [],
      recommendations: recommendations || [],
      changeLogs: changeLogs || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
