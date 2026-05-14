import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-side admin client — bypasses RLS.
// Use only in server-side code (API routes, server components), never client-side.
let _admin: SupabaseClient | null = null
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    if (!_admin) _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const value = (_admin as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return (...args: unknown[]) => (value as (...a: unknown[]) => unknown).apply(_admin, args)
    }
    return value
  },
})