import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateInvoicePDF } from '@/lib/invoice-pdf'

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params
  const role = await getCallerRole()
  if (!role || !['manager', 'superadmin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const { data: itemsRaw } = await supabaseAdmin
    .from('order_items')
    .select('product_name, quantity, unit_price')
    .eq('order_id', orderId)

  const items = (itemsRaw ?? []).map(i => ({
    product_name: i.product_name,
    qty:   i.quantity,
    price: i.unit_price,
  }))

  const sa: Record<string, string> = order.shipping_address ?? {}

  let customerName: string | undefined = sa.full_name ?? sa.customer_name
  let customerEmail: string | undefined = sa.customer_email

  if (order.user_id && (!customerName || !customerEmail)) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', order.user_id)
      .single()
    customerName  ??= profile?.full_name ?? undefined
    customerEmail ??= profile?.email ?? undefined
  }

  const orderRef = (order.montonio_order_id ?? order.id).toString().slice(-8).toUpperCase()

  const pdfBytes = await generateInvoicePDF(
    {
      id: orderId,
      created_at: order.created_at,
      total: order.total,
      reference: orderRef,
    },
    items,
    customerName,
    customerEmail,
  )

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="arve-${orderRef}.pdf"`,
    },
  })
}
