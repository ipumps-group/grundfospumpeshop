import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!body.email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Tellimust ei leitud' }, { status: 404 })
  }

  const orderEmail = order.email || (order.shipping_address as any)?.customer_email
  if (!orderEmail || orderEmail.toLowerCase() !== body.email.toLowerCase()) {
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
