import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')?.trim()
  if (!ref || ref.length > 100) {
    return NextResponse.json({ error: 'Invalid reference' }, { status: 400 })
  }

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select(`
      order_number, status, total, meta_purchase_event_id,
      order_items ( product_id, product_name, quantity, unit_price )
    `)
    .eq('order_number', ref)
    .single()

  if (!order || !['paid', 'shipped', 'delivered'].includes(order.status)) {
    return NextResponse.json({ confirmed: false }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const contents = (order.order_items || []).map(item => ({
    id: String(item.product_id || item.product_name),
    quantity: Number(item.quantity),
    item_price: Number(item.unit_price),
  }))

  return NextResponse.json({
    confirmed: true,
    transaction_id: order.order_number,
    event_id: order.meta_purchase_event_id,
    value: Number(order.total),
    currency: 'EUR',
    contents,
    num_items: contents.reduce((sum, item) => sum + item.quantity, 0),
  }, { headers: { 'Cache-Control': 'no-store' } })
}
