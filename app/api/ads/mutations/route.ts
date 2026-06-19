/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildChangeRequestFromAction } from '@/lib/ads/mutations'
import { requireAdmin } from '@/lib/api-auth'
import { rateLimit, STRICT_RATE } from '@/lib/rate-limit'

// This endpoint creates a change request from a mutation action.
// The actual mutation is NOT executed here — it goes through the approval flow.
export async function POST(request: NextRequest) {
  try { await requireAdmin() } catch (e) { return e as NextResponse }
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(ip, STRICT_RATE.maxRequests)
  if (rl.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await request.json()
    const { action, target_type, target_id, platform, values } = body

    if (!action || !target_type || !target_id || !platform) {
      return NextResponse.json({
        error: 'action, target_type, target_id, and platform required',
      }, { status: 400 })
    }

    const { data: accounts } = await supabaseAdmin
      .from('ad_accounts')
      .select('company_id')
      .limit(1)

    const companyId = accounts?.[0]?.company_id || '00000000-0000-0000-0000-000000000000'
    const userId = body.userId || null

    const crData = await buildChangeRequestFromAction(
      { action, target_type, target_id, platform, values: values || {} },
      companyId,
      userId,
    )

    const { data, error } = await supabaseAdmin
      .from('change_requests')
      .insert(crData)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      message: 'Change request created. Approve it to execute.',
      change_request: data,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
