import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  console.log('=== UNILIFT PRODUCTS (name match) ===')
  const { data: prods, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', '%unilift%')
  if (error) { console.error(error.message); return }
  console.log('count:', (prods || []).length)
  for (const p of prods || []) {
    console.log(`  [${p.published ? 'PUB' : 'draft'}] ${p.name}`)
    console.log(`     slug: ${p.slug} | price: ${p.price} | id: ${p.id}`)
    if (p.series) console.log(`     series: ${JSON.stringify(p.series)}`)
    const keys = Object.keys(p).filter(k => /categor|series|seo|url/i.test(k))
    if (keys.length) console.log(`     keys: ${keys.map(k => k + '=' + JSON.stringify(p[k])).join(' ')}`)
  }

  console.log('\n=== product_categories entries for unilift products ===')
  for (const p of prods || []) {
    const { data: pcs } = await supabase.from('product_categories').select('*').eq('product_slug', p.slug)
    for (const pc of pcs || []) console.log(`  ${p.slug} -> ${JSON.stringify(pc)}`)
  }

  console.log('\n=== sample: full column list of products ===')
  if (prods && prods[0]) console.log(Object.keys(prods[0]).join(', '))
}
main().then(() => process.exit()).catch(e => { console.error(e); process.exit(1) })
