import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', ['notif_status_update', 'notif_order_confirmation', 'notif_new_order_admin', 'email_from', 'email_admin', 'company_name'])

  return NextResponse.json({ data, error })
}