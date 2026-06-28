import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const settings = [
  { key: 'notif_order_confirmation', value: 'true' },
  { key: 'notif_status_update', value: 'true' },
  { key: 'notif_new_order_admin', value: 'true' },
  { key: 'company_name', value: 'Pump OÜ' },
  { key: 'email_from', value: 'info@pumbapood.ee' },
  { key: 'email_admin', value: 'info@pumbapood.ee' },
]

async function addSettings() {
  for (const s of settings) {
    const { data: existing } = await supabase.from('settings').select('key').eq('key', s.key).single()
    if (existing) {
      await supabase.from('settings').update({ value: s.value }).eq('key', s.key)
      console.log(`Updated: ${s.key}`)
    } else {
      await supabase.from('settings').insert(s)
      console.log(`Inserted: ${s.key}`)
    }
  }
  console.log('Done!')
}

addSettings().then(() => process.exit()).catch(e => { console.error(e); process.exit(1) })