import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parseCouponPayload, type CouponPayload } from '../route'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// PATCH /api/haldus/coupons/[id] — update coupon
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  const id = (await params).id
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Vigane kupongi ID' }, { status: 400 })

  let body: CouponPayload
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const parsed = parseCouponPayload(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 })

  const { error } = await supabaseAdmin.from('coupons').update(parsed.data).eq('id', id)

  if (error) {
    const duplicate = error.code === '23505'
    return NextResponse.json(
      { error: duplicate ? 'See kood on juba olemas' : error.message },
      { status: duplicate ? 409 : 500 },
    )
  }

  return NextResponse.json({ saved: true })
}

// DELETE /api/haldus/coupons/[id] — delete coupon + usage rows
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  const id = (await params).id
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Vigane kupongi ID' }, { status: 400 })

  const { error: usageError } = await supabaseAdmin.from('coupon_usage').delete().eq('coupon_id', id)
  if (usageError) return NextResponse.json({ error: usageError.message }, { status: 500 })

  const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: true, id })
}
