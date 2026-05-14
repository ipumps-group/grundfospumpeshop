import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params

  // 1. Kontrolli Bearer tokenit
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Loo Supabase client koos kasutaja tokeniga (RLS järgib user_id)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  // 3. Laadi order + items
  const [{ data: order, error: orderError }, { data: items, error: itemsError }] = await Promise.all([
    supabase.from('orders').select('*').eq('id', orderId).single(),
    supabase.from('order_items').select('*').eq('order_id', orderId),
  ])

  if (orderError || !order) {
    return NextResponse.json({ error: 'Tellimust ei leitud' }, { status: 404 })
  }

  if (itemsError) {
    return NextResponse.json({ error: 'Veateade' }, { status: 500 })
  }

  // 4. Laadi kasutaja info
  const { data: { user } } = await supabase.auth.getUser(token)

  // 5. Genereeri PDF
  const { generateInvoicePDF } = await import('@/lib/invoice-pdf')
  const pdfBuffer = await generateInvoicePDF(
    order,
    items ?? [],
    user?.user_metadata?.full_name,
    user?.email
  )

  // 6. Tagasta PDF
  return new Response(pdfBuffer.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="arve-${orderId.slice(0, 8)}.pdf"`,
    },
  })
}
