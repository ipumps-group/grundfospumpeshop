import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await sb.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['manager', 'superadmin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [{ data: items, error: itemsErr }, { data: history, error: histErr }] = await Promise.all([
    supabaseAdmin.from('order_items').select('*').eq('order_id', id),
    supabaseAdmin.from('order_status_history').select('*').eq('order_id', id).order('created_at', { ascending: false }),
  ])

  if (itemsErr || histErr) {
    return NextResponse.json({ error: 'Failed to load order data' }, { status: 500 })
  }

  return NextResponse.json({
    items: items ?? [],
    history: history ?? [],
  })
}
