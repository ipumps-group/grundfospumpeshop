import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type CouponPayload = {
  code?: unknown
  type?: unknown
  value?: unknown
  min_order_amount?: unknown
  usage_limit?: unknown
  valid_from?: unknown
  valid_until?: unknown
  active?: unknown
}

export function parseCouponPayload(body: CouponPayload) {
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
  const type = body.type === 'fixed' ? 'fixed' : body.type === 'percent' ? 'percent' : null
  const value = Number(body.value)
  const minOrder = body.min_order_amount == null || body.min_order_amount === '' ? 0 : Number(body.min_order_amount)
  const usageLimit = body.usage_limit == null || body.usage_limit === '' ? null : Number(body.usage_limit)

  if (!code) return { error: 'Kood on kohustuslik' }
  if (!type) return { error: 'Vigane tüüp' }
  if (!Number.isFinite(value) || value <= 0) return { error: 'Väärtus peab olema positiivne' }
  if (type === 'percent' && value > 100) return { error: 'Protsent ei saa olla üle 100' }
  if (!Number.isFinite(minOrder) || minOrder < 0) return { error: 'Vigane miinimumsumma' }
  if (usageLimit != null && (!Number.isSafeInteger(usageLimit) || usageLimit <= 0)) {
    return { error: 'Vigane kasutuste limiit' }
  }

  return {
    data: {
      code,
      type,
      value,
      min_order_amount: minOrder,
      usage_limit: usageLimit,
      valid_from: typeof body.valid_from === 'string' && body.valid_from ? body.valid_from : null,
      valid_until: typeof body.valid_until === 'string' && body.valid_until ? body.valid_until : null,
      active: body.active === true,
    },
  }
}

// POST /api/haldus/coupons — create coupon
export async function POST(req: NextRequest) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  let body: CouponPayload
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const parsed = parseCouponPayload(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 })

  const { data: coupon, error } = await supabaseAdmin
    .from('coupons').insert(parsed.data).select('id').single()

  if (error) {
    const duplicate = error.code === '23505'
    return NextResponse.json(
      { error: duplicate ? 'See kood on juba olemas' : error.message },
      { status: duplicate ? 409 : 500 },
    )
  }

  return NextResponse.json({ coupon })
}
