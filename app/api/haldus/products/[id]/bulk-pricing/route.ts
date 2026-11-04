import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// PUT /api/haldus/products/[id]/bulk-pricing — replace all bulk pricing rows
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  const id = Number((await params).id)
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Vigane toote ID' }, { status: 400 })
  }

  let body: { rows?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const rows = (Array.isArray(body.rows) ? body.rows : [])
    .map((r: unknown) => {
      const row = r as { min_quantity?: unknown; price?: unknown }
      return {
        product_id: id,
        min_quantity: Number(row?.min_quantity),
        price: Number(row?.price),
      }
    })
    .filter(r => Number.isFinite(r.min_quantity) && Number.isFinite(r.price) && r.min_quantity > 0 && r.price > 0)

  const { error: deleteError } = await supabaseAdmin
    .from('bulk_pricing').delete().eq('product_id', id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  if (rows.length > 0) {
    const { error: insertError } = await supabaseAdmin.from('bulk_pricing').insert(rows)
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ saved: true, count: rows.length })
}
