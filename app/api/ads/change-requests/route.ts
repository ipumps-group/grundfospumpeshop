/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createChangeRequest, updateChangeRequest, getChangeRequests } from '@/lib/ads/admin-queries'
import { buildChangeRequestFromAction, executeMutation } from '@/lib/ads/mutations'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/api-auth'
import { rateLimit, STRICT_RATE } from '@/lib/rate-limit'

// Create a change request
export async function POST(request: NextRequest) {
  try { await requireAdmin() } catch (e) { return e as NextResponse }
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(ip, STRICT_RATE.maxRequests)
  if (rl.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await request.json()

    // If it includes mutation action fields, build the change request first
    if (body.action && body.target_type && body.target_id) {
      const { data: accounts } = await supabaseAdmin
        .from('ad_accounts')
        .select('company_id')
        .limit(1)
      const companyId = accounts?.[0]?.company_id || '00000000-0000-0000-0000-000000000000'
      const userId = body.userId || null

      const crData = await buildChangeRequestFromAction(
        body,
        companyId,
        userId,
      )

      const { data, error } = await createChangeRequest(crData)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    // Direct change request creation
    const { data, error } = await createChangeRequest({
      company_id: body.company_id,
      title: body.title,
      description: body.description,
      platform: body.platform,
      action_type: body.action_type,
      target_type: body.target_type,
      target_id: body.target_id,
      target_platform_id: body.target_platform_id,
      before_values: body.before_values,
      after_values: body.after_values,
      status: 'pending',
      created_by: body.created_by,
      source: body.source || 'manual',
      recommendation_id: body.recommendation_id,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Approve / reject / update a change request
export async function PATCH(request: NextRequest) {
  try { await requireAdmin() } catch (e) { return e as NextResponse }
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(ip, STRICT_RATE.maxRequests)
  if (rl.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    if (status === 'approved') {
      // Get the change request
      const { data: cr } = await supabaseAdmin
        .from('change_requests')
        .select('*')
        .eq('id', id)
        .single()

      if (!cr) return NextResponse.json({ error: 'Change request not found' }, { status: 404 })

      // Update status to approved
      await updateChangeRequest(id, {
        status: 'approved',
        reviewed_by: body.reviewed_by,
        reviewed_at: new Date().toISOString(),
      })

      // Execute the mutation
      const result = await executeMutation(cr)
      return NextResponse.json(result)
    }

    if (status === 'rejected') {
      await updateChangeRequest(id, {
        status: 'rejected',
        reviewed_by: body.reviewed_by,
        reviewed_at: new Date().toISOString(),
      })
      return NextResponse.json({ success: true })
    }

    // Generic update
    await updateChangeRequest(id, body)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// List change requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const status = searchParams.get('status') || undefined

    if (!companyId) {
      const { data: accounts } = await supabaseAdmin
        .from('ad_accounts')
        .select('company_id')
        .limit(1)
      if (!accounts?.length) return NextResponse.json({ error: 'No accounts' }, { status: 400 })
      const { data, error } = await getChangeRequests(accounts[0].company_id, status)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    const { data, error } = await getChangeRequests(companyId, status)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
