import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendOrderStatusUpdate } from '@/lib/email'

// Only manager and superadmin may update order status
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const role = await getCallerRole()
  if (!role || !['manager', 'superadmin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  console.log('[status] PATCH called for order:', id, 'body:', JSON.stringify(body))
  const { status, note, sendEmail = true } = body as {
    status: string
    note?: string
    sendEmail?: boolean
  }

  const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Check current order
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('status')
    .eq('id', id)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.status === status) {
    return NextResponse.json({ ok: true }) // no-op
  }

  // Update order status using raw SQL to bypass constraint
  // This is needed because the DB constraint is missing 'processing' and 'failed'
  const now = new Date().toISOString()
  const timestampFields: Record<string, string> = {
    shipped: 'shipped_at',
    delivered: 'delivered_at', 
    cancelled: 'cancelled_at',
    paid: 'paid_at'
  }
  
  const updates: Record<string, unknown> = {
    status,
    updated_at: now,
  }
  
  if (timestampFields[status]) {
    updates[timestampFields[status]] = now
  }

  // Update order status
  const { error: updateErr } = await supabaseAdmin
    .from('orders')
    .update(updates)
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Insert history entry
  await supabaseAdmin.from('order_status_history').insert({
    order_id: id,
    status,
    note: note ?? null,
    changed_by: role,
  })

  // Send email notification to customer
  if (sendEmail) {
    await sendOrderStatusUpdate({ orderId: id, newStatus: status, note })
  }

  return NextResponse.json({ ok: true })
}