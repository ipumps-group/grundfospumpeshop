import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkPages() {
  // Check pages
  console.log('=== Pages in database ===')
  const { data: pages } = await supabase.from('pages').select('id, slug, title, status')
  console.log(JSON.stringify(pages, null, 2))
  
  // Check settings table
  console.log('\n=== Settings ===')
  const { data: settings } = await supabase.from('settings').select('*')
  console.log(JSON.stringify(settings, null, 2))
}

checkPages().then(() => process.exit()).catch(e => { console.error(e); process.exit(1) })