import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getCallerProfile(): Promise<{ id: string; role: string } | null> {
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabaseAdmin.from('profiles').select('id, role').eq('id', user.id).single()
  return profile ?? null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const caller = await getCallerProfile()

  if (!caller || !['manager', 'superadmin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [profileRes, ordersRes, authRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').eq('id', id).single(),
    supabaseAdmin.from('orders')
      .select('id, montonio_order_id, status, total, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabaseAdmin.auth.admin.getUserById(id),
  ])

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const emailConfirmedAt = authRes.data?.user?.email_confirmed_at ?? null

  return NextResponse.json({
    profile: profileRes.data,
    orders: ordersRes.data ?? [],
    emailConfirmedAt,
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const caller = await getCallerProfile()

  if (!caller || caller.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden: requires superadmin' }, { status: 403 })
  }

  // Prevent self-deletion
  if (caller.id === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  // 1. Nullify orders so history is preserved
  await supabaseAdmin.from('orders').update({ user_id: null }).eq('user_id', id)

  // 2. Delete profile (may already cascade from step 3, but be explicit)
  await supabaseAdmin.from('profiles').delete().eq('id', id)

  // 3. Delete auth user — this is the authoritative delete
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const caller = await getCallerProfile()

  if (!caller || !['manager', 'superadmin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { status, role, action, full_name, phone } = body as {
    status?: string; role?: string; action?: string; full_name?: string; phone?: string | null
  }

  // Confirm email action (superadmin only)
  if (action === 'confirm_email') {
    if (caller.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: requires superadmin' }, { status: 403 })
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { email_confirm: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Managers can only toggle block status, not change roles
  if (role !== undefined && caller.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden: role change requires superadmin' }, { status: 403 })
  }

  const updates: Record<string, string | null> = {}
  if (status !== undefined) {
    if (!['active', 'blocked'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updates.status = status
  }
  if (role !== undefined) {
    if (!['customer', 'manager', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    updates.role = role
  }
  if (full_name !== undefined) updates.full_name = full_name?.trim() || null
  if (phone !== undefined) updates.phone = phone?.trim() || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('profiles').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
