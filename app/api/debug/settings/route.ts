import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireSuperadmin } from '@/lib/api-auth'

export async function GET() {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', ['notif_status_update', 'notif_order_confirmation', 'notif_new_order_admin', 'email_from', 'email_admin', 'company_name'])

  return NextResponse.json({ data, error })
}
