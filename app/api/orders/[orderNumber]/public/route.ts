import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyOrderViewToken } from '@/lib/order-view-token'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params

  let body: { email?: string; token?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!body.email && !body.token) {
    return NextResponse.json({ error: 'Email or token required' }, { status: 400 })
  }

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Tellimust ei leitud' }, { status: 404 })
  }

  const shippingAddress = (order.shipping_address ?? {}) as Record<string, unknown>
  const customerEmail = typeof shippingAddress.customer_email === 'string'
    ? shippingAddress.customer_email
    : ''
  const orderEmail = order.email || customerEmail
  const validToken = body.token
    ? verifyOrderViewToken(orderNumber, body.token)
    : false
  const validEmail = body.email && orderEmail
    ? orderEmail.toLowerCase() === body.email.toLowerCase()
    : false

  if (!validToken && !validEmail) {
    return NextResponse.json({ error: 'Email ei ühti tellimusega' }, { status: 403 })
  }

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', order.id)

  return NextResponse.json({
    order,
    items: items ?? [],
  })
}
