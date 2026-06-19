import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function testQueries() {
  // Test 1: The embedded resource query (what the slider uses)
  console.log('=== Test 1: Embedded resource query (what slider uses) ===')
  const { data: embedded, error: embeddedError } = await supabase
    .from('product_categories')
    .select('product:products(id, slug, name, sku, price, sale_price, image_url, in_stock, published)')
    .eq('category_slug', 'esiletostetud')
  console.log('Data:', JSON.stringify(embedded, null, 2))
  console.log('Error:', embeddedError)

  // Test 2: Simple join manually
  console.log('\n=== Test 2: Manual join ===')
  const { data: pc } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_slug', 'esiletostetud')
  
  if (pc && pc.length > 0) {
    const productIds = pc.map(p => p.product_id)
    const { data: products } = await supabase
      .from('products')
      .select('id, slug, name, sku, price, sale_price, image_url, in_stock, published')
      .in('id', productIds)
    console.log('Products found:', JSON.stringify(products, null, 2))
  }

  // Test 3: Check if any products with these IDs exist and are published
  console.log('\n=== Test 3: Check individual product IDs ===')
  const productIds = [124, 167, 193, 19, 289, 129, 281, 161]
  for (const id of productIds) {
    const { data: p } = await supabase
      .from('products')
      .select('id, slug, name, published')
      .eq('id', id)
      .single()
    console.log(`ID ${id}:`, p ? 'found' : 'NOT FOUND', p ? p.published : '')
  }
}

testQueries().then(() => process.exit()).catch(e => { console.error(e); process.exit(1) })