import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdqnzyfmanflslsjhytf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcW56eWZtYW5mbHNsc2poeXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU1MDY3NSwiZXhwIjoyMDkxMTI2Njc1fQ.H3LiyHS8ZEgoqGd3TYmPoINGGwneMffASgzML2Aei8k'

const supabase = createClient(supabaseUrl, supabaseKey)

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