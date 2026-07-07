import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateInvoicePDF } from '@/lib/invoice-pdf'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  // Verify order ownership via RLS
  const { data: order, error: orderErr } = await supabaseClient
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Tellimust ei leitud' }, { status: 404 })
  }

  // Load full order + items via supabaseAdmin (ownership already verified)
  const { data: fullOrder, error: fullErr } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (fullErr || !fullOrder) {
    return NextResponse.json({ error: 'Tellimust ei leitud' }, { status: 404 })
  }

  const { data: itemsRaw } = await supabaseAdmin
    .from('order_items')
    .select('product_name, quantity, unit_price')
    .eq('order_id', orderId)

  const items = (itemsRaw ?? []).map(i => ({
    product_name: i.product_name,
    qty: i.quantity,
    price: i.unit_price,
  }))

  const sa: Record<string, string> = fullOrder.shipping_address ?? {}

  let customerName: string | undefined = sa.full_name ?? sa.customer_name
  let customerEmail: string | undefined = sa.customer_email

  if (fullOrder.user_id && (!customerName || !customerEmail)) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('id', fullOrder.user_id)
      .single()
    customerName ??= profile?.full_name ?? undefined
    customerEmail ??= profile?.email ?? undefined
  }

  const pdfBytes = await generateInvoicePDF(
    {
      id: orderId,
      order_number: fullOrder.order_number,
      created_at: fullOrder.created_at,
      total: fullOrder.total,
      reference: (fullOrder.montonio_order_id ?? fullOrder.id).toString().slice(-8).toUpperCase(),
      shipping_address: fullOrder.shipping_address as Record<string, string> | null,
    },
    items,
    customerName,
    customerEmail,
  )

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="arve-${orderId.slice(0, 8)}.pdf"`,
    },
  })
}
