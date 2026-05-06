import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

const PAGE_SIZE = 25

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

export async function GET(req: NextRequest) {
  const caller = await getCallerProfile()
  if (!caller || !['manager', 'superadmin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page   = Math.max(0, Number(searchParams.get('page') ?? '0'))
  const search = searchParams.get('search')?.trim() ?? ''

  // 1. Query profiles with admin client (bypasses RLS) — confirmed/active users
  let profilesQuery = supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, phone, role, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (search) {
    profilesQuery = profilesQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: profiles, count: profileCount } = await profilesQuery

  // 2. Find auth users who have no profile row yet (unconfirmed — profile trigger hasn't run)
  //    Only fetch on first page with no search to avoid complexity
  let pending: Array<{
    id: string; email: string; full_name: string | null; phone: null
    role: string; status: string; created_at: string; unconfirmed: boolean
  }> = []

  if (page === 0 && !search) {
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const { data: allProfileIds } = await supabaseAdmin.from('profiles').select('id')
    const knownIds = new Set((allProfileIds ?? []).map((r: { id: string }) => r.id))

    pending = (authData?.users ?? [])
      .filter(u => !knownIds.has(u.id))
      .map(u => ({
        id:           u.id,
        email:        u.email ?? '',
        full_name:    (u.user_metadata?.full_name as string | undefined) ?? null,
        phone:        null,
        role:         'customer',
        status:       'unconfirmed',
        created_at:   u.created_at,
        unconfirmed:  true,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  return NextResponse.json({
    clients: [...pending, ...(profiles ?? [])],
    total:   (profileCount ?? 0) + pending.length,
  })
}

export async function POST(req: NextRequest) {
  const caller = await getCallerProfile()
  if (!caller || !['manager', 'superadmin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { email, password, full_name, phone, role } = body as {
    email?: string; password?: string; full_name?: string; phone?: string; role?: string
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email ja parool on kohustuslikud' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Parool peab olema vähemalt 6 tähemärki' }, { status: 400 })
  }

  const allowedRole = caller.role === 'superadmin'
    ? (['customer', 'manager', 'superadmin'].includes(role ?? '') ? role! : 'customer')
    : 'customer'

  // Create auth user with email pre-confirmed — bypasses rate limits & email flow
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name ?? '' },
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Viga kasutaja loomisel' }, { status: 500 })
  }

  // Upsert profile row (trigger may not have run yet)
  await supabaseAdmin.from('profiles').upsert({
    id:        authData.user.id,
    email,
    full_name: full_name ?? null,
    phone:     phone ?? null,
    role:      allowedRole,
    status:    'active',
  }, { onConflict: 'id' })

  return NextResponse.json({ id: authData.user.id })
}
