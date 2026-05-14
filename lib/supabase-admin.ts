import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _admin: SupabaseClient | null = null

export function getAdminClient(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    )
  }
  return _admin
}

export const supabaseAdmin = {
  get from() { return getAdminClient().from.bind(getAdminClient()) },
  get rpc() { return getAdminClient().rpc.bind(getAdminClient()) },
  get auth() { return getAdminClient().auth },
  get storage() { return getAdminClient().storage },
} as unknown as SupabaseClient