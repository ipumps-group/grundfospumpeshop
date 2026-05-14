import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const raw = readFileSync('D:/WORKS/iPumps/MayRepo/.env.local', 'utf-8')
const env = Object.fromEntries(
  raw.split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.substring(0, i).trim(), l.substring(i + 1).trim().replace(/^["']|["']$/g, '')] })
)

// Use admin/service role key
console.log('Has service role:', !!env.SUPABASE_SERVICE_ROLE_KEY)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const r1 = await admin.from('pages').select('id,slug,title').ilike('slug', '%esileht%')
console.log('\nADMIN view:')
r1.data?.forEach(p => console.log(`  ${p.id} | ${p.slug} | ${p.title}`))
if (r1.error) console.log('  Error:', r1.error.message)

const r2 = await anon.from('pages').select('id,slug,title').ilike('slug', '%esileht%')
console.log('\nANON view:')
r2.data?.forEach(p => console.log(`  ${p.id} | ${p.slug} | ${p.title}`))
if (r2.error) console.log('  Error:', r2.error.message)
