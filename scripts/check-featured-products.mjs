import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdqnzyfmanflslsjhytf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcW56eWZtYW5mbHNsc2poeXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU1MDY3NSwiZXhwIjoyMDkxMTI2Njc1fQ.H3LiyHS8ZEgoqGd3TYmPoINGGwneMffASgzML2Aei8k'

const supabase = createClient(supabaseUrl, supabaseKey)

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