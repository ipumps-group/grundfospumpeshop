import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export type Role = 'customer' | 'manager' | 'superadmin'

export interface AuthResult {
  userId: string
  role: Role
  email: string
}

const ERR = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status })

export async function requireAuth(): Promise<AuthResult> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw ERR('Unauthorized', 401)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw ERR('User profile not found', 403)
  }

  return {
    userId: user.id,
    role: profile.role as Role,
    email: user.email ?? '',
  }
}

export async function requireRole(...roles: Role[]): Promise<AuthResult> {
  const auth = await requireAuth()
  if (!roles.includes(auth.role)) {
    throw ERR('Forbidden', 403)
  }
  return auth
}

export async function requireAdmin(): Promise<AuthResult> {
  return requireRole('manager', 'superadmin')
}

export async function requireSuperadmin(): Promise<AuthResult> {
  return requireRole('superadmin')
}
