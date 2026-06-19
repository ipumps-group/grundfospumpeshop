import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkProductsInCategory() {
  // Check raw entries in product_categories table for esiletostetud
  console.log('=== Raw product_categories entries for esiletostetud ===')
  const { data: rawEntries } = await supabase
    .from('product_categories')
    .select('*')
    .eq('category_slug', 'esiletostetud')
  console.log(JSON.stringify(rawEntries, null, 2))

  // Count total products
  console.log('\n=== Total products in DB ===')
  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true })
  console.log('Total products:', count)
  
  // Sample products
  console.log('\n=== Sample products (first 5) ===')
  const { data: sampleProducts } = await supabase
    .from('products')
    .select('id, slug, name, published')
    .limit(5)
  console.log(JSON.stringify(sampleProducts, null, 2))
}

checkProductsInCategory().then(() => process.exit()).catch(e => { console.error(e); process.exit(1) })