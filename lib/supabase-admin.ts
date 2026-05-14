import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-side admin client — möödub RLS reeglitest.
// Kasuta ainult server-side koodis (API routes), mitte kliendipoolses koodis.
let _admin: SupabaseClient | null = null
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    if (!_admin) _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    return (_admin as unknown as Record<string | symbol, unknown>)[prop]
  },
})
