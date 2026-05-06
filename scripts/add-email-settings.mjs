import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdqnzyfmanflslsjhytf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcW56eWZtYW5mbHNsc2poeXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU1MDY3NSwiZXhwIjoyMDkxMTI2Njc1fQ.H3LiyHS8ZEgoqGd3TYmPoINGGwneMffASgzML2Aei8k'

const supabase = createClient(supabaseUrl, supabaseKey)

const settings = [
  { key: 'notif_order_confirmation', value: 'true' },
  { key: 'notif_status_update', value: 'true' },
  { key: 'notif_new_order_admin', value: 'true' },
  { key: 'company_name', value: 'iPumps OÜ' },
  { key: 'email_from', value: 'info@grundfospump.ee' },
  { key: 'email_admin', value: 'info@grundfospump.ee' },
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