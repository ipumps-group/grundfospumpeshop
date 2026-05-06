import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Only superadmin may delete orders
async function getCallerRole(): Promise<string | null> {
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role ?? null
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const role = await getCallerRole()
  if (!role || role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden - only superadmin can delete orders' }, { status: 403 })
  }

  // Check order exists
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('id', id)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Delete related items first
  await supabaseAdmin.from('order_items').delete().eq('order_id', id)
  
  // Delete status history
  await supabaseAdmin.from('order_status_history').delete().eq('order_id', id)

  // Delete payment events
  await supabaseAdmin.from('payment_events').delete().eq('order_id', id)

  // Delete the order
  const { error: deleteErr } = await supabaseAdmin
    .from('orders')
    .delete()
    .eq('id', id)

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}