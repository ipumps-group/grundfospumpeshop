// Run: node scripts/diagnose-orders.mjs
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } from './env.mjs'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 1. Check total orders
const { count: total } = await admin.from('orders').select('*', { count: 'exact', head: true })
console.log('Total orders (admin):', total)

// 2. Check orders visible to anon (no auth)
const { data: anonData, error: anonErr } = await anon.from('orders').select('*', { count: 'exact', head: true })
console.log('Orders visible to anon (unauthenticated):', anonData?.length ?? 'ERROR:', anonErr?.message)

// 3. Check RLS policy for orders
const policies = await admin.rpc('get_policies_for_table', { table_name: 'orders' }).catch(() => null)
if (policies) {
  console.log('\nRLS policies for orders:')
  for (const p of policies) console.log(`  ${p.policyname}: ${p.cmd} - ${p.qual}(${p.using})`)
} else {
  const { data: rlsEnabled } = await admin.rpc('check_rls', { tbl: 'orders' }).catch(() => null)
  console.log('\nRLS check:', rlsEnabled ?? '(could not check)')
}

// 4. Check if RLS is enabled on orders
const { data: rls } = await admin
  .from('pg_tables')
  .select('rowsecurity')
  .eq('tablename', 'orders')
  .single()
  .catch(() => ({ data: null }))
if (rls) console.log('\nRLS enabled on orders:', rls)

console.log('\nIf admin shows data but UI shows none → RLS policy is too restrictive for authenticated users.')
