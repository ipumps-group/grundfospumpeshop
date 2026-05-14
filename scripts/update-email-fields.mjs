import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdqnzyfmanflslsjhytf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcW56eWZtYW5mbHNsc2poeXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU1MDY3NSwiZXhwIjoyMDkxMTI2Njc1fQ.H3LiyHS8ZEgoqGd3TYmPoINGGwneMffASgzML2Aei8k'

const supabase = createClient(supabaseUrl, supabaseKey)

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