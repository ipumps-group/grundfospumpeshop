import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    // Find or create a company
    let { data: companies } = await supabaseAdmin.from('companies').select('id').limit(1)
    let companyId: string
    if (!companies?.length) {
      const { data: c } = await supabaseAdmin.from('companies').insert({ name: 'Default Company', slug: 'default' }).select('id').single()
      companyId = c!.id
    } else {
      companyId = companies[0].id
    }

    // Link all profiles without a company
    await supabaseAdmin.from('profiles').update({ company_id: companyId }).is('company_id', null)

    // Backfill accounts that are missing a company_id
    await supabaseAdmin.from('ad_accounts').update({ company_id: companyId }).is('company_id', null)

    // Return accounts, campaigns, sync logs via admin client (bypass RLS)
    const { data: accounts } = await supabaseAdmin.from('ad_accounts').select('*, platform:ad_platforms(*)')
    const { data: campaigns } = await supabaseAdmin.from('campaigns').select('*').order('campaign_name')
    const { data: recommendations } = await supabaseAdmin.from('recommendations').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(20)
    const { data: changeLogs } = await supabaseAdmin.from('change_logs').select('*').eq('company_id', companyId).order('performed_at', { ascending: false }).limit(20)
    const { data: syncLogs } = await supabaseAdmin.from('sync_logs').select('*').order('started_at', { ascending: false }).limit(20)

    return NextResponse.json({
      companyId,
      accounts: accounts || [],
      campaigns: campaigns || [],
      recommendations: recommendations || [],
      changeLogs: changeLogs || [],
      syncLogs: syncLogs || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
