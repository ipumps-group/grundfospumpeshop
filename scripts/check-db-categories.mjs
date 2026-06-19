import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkCategories() {
  console.log('=== Categories (from categories table - admin) ===')
  const { data: categories } = await supabase.from('categories').select('*').order('name_et')
  console.log(JSON.stringify(categories, null, 2))
  
  console.log('\n=== Product Categories (distinct slugs in product_categories table) ===')
  const { data: productCategories } = await supabase.from('product_categories').select('category_slug')
  const slugs = [...new Set(productCategories?.map(pc => pc.category_slug) || [])]
  console.log(slugs)
  
  console.log('\n=== Products in esiletostetud category ===')
  const { data: featuredProducts } = await supabase
    .from('product_categories')
    .select('product:products(id, slug, name, published)')
    .eq('category_slug', 'esiletostetud')
  console.log(JSON.stringify(featuredProducts, null, 2))
}

checkCategories().then(() => process.exit()).catch(e => { console.error(e); process.exit(1) })