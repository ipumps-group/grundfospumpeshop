import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createOrderViewToken, verifyOrderViewToken } from '@/lib/order-view-token'
import { rateLimit, STRICT_RATE } from '@/lib/rate-limit'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimit(`order-view:${ip}`, STRICT_RATE.maxRequests).blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

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
    .select('id, order_number, status, total, created_at, email, customer_name, shipping_address, payment_method')
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
    .select('id, product_name, quantity, unit_price')
    .eq('order_id', order.id)

  return NextResponse.json({
    order,
    items: items ?? [],
    accessToken: createOrderViewToken(orderNumber),
  })
}
