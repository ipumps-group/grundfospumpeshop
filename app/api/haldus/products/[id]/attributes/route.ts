import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// PUT /api/haldus/products/[id]/attributes — replace all product attributes
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  const id = Number((await params).id)
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Vigane toote ID' }, { status: 400 })
  }

  let body: { attributes?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const rows = (Array.isArray(body.attributes) ? body.attributes : [])
    .map((a: unknown) => {
      const r = a as { attribute_name?: unknown; attribute_value?: unknown }
      return {
        product_id: id,
        attribute_name: typeof r?.attribute_name === 'string' ? r.attribute_name.trim() : '',
        attribute_value: typeof r?.attribute_value === 'string' ? r.attribute_value.trim() : '',
      }
    })
    .filter(r => r.attribute_name && r.attribute_value)

  const { error: deleteError } = await supabaseAdmin
    .from('product_attributes').delete().eq('product_id', id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  if (rows.length > 0) {
    const { error: insertError } = await supabaseAdmin.from('product_attributes').insert(rows)
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ saved: true, count: rows.length })
}
