import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const { data, error, count } = await supabase
  .from('contact_submissions')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false })

if (error) { console.error('Query failed:', error); process.exit(1) }

console.log(`Kokku: ${count} sisestust\n`)
for (const r of data ?? []) {
  console.log('─'.repeat(70))
  console.log(`ID:       ${r.id}`)
  console.log(`Aeg:      ${r.created_at}`)
  console.log(`Nimi:     ${r.name}`)
  console.log(`E-post:   ${r.email}`)
  console.log(`Telefon:  ${r.phone ?? '—'}`)
  console.log(`Aadress:  ${r.address ?? '—'}`)
  console.log(`Leht:     ${r.page_id ?? '—'}`)
  console.log(`Sõnum:    ${(r.message ?? '').slice(0, 300)}${(r.message ?? '').length > 300 ? '…' : ''}`)
}
process.exit(0)
