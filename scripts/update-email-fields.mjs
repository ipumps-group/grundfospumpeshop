import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function updateEmailFields() {
  // Get current email settings
  const { data: settings } = await supabase.from('settings').select('key, value')
  const currentSettings = {}
  settings?.forEach((s) => { currentSettings[s.key] = s.value })
  
  // Combine user and domain into full email
  const user = currentSettings.header_email_user || 'info'
  const domain = currentSettings.header_email_domain || 'ipumps.ee'
  const fullEmail = `${user}@${domain}`
  
  console.log('Current email:', fullEmail)
  
  // Delete old split fields
  await supabase.from('settings').delete().eq('key', 'header_email_user')
  await supabase.from('settings').delete().eq('key', 'header_email_domain')
  
  // Insert full email
  await supabase.from('settings').insert({ key: 'header_email', value: fullEmail })
  
  console.log('Updated to full email:', fullEmail)
}

updateEmailFields().then(() => process.exit()).catch(e => { console.error(e); process.exit(1) })