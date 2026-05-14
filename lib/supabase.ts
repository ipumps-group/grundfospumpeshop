import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Browser client — stores session in cookies so server-side API routes can read it.
// Do NOT use createClient() from @supabase/supabase-js here — it uses localStorage,
// which is invisible to Next.js API routes.
let _supabase: SupabaseClient | null = null
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    if (!_supabase) _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ) as unknown as SupabaseClient
    return (_supabase as unknown as Record<string | symbol, unknown>)[prop]
  },
})
