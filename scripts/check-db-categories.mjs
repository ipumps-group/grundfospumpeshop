import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdqnzyfmanflslsjhytf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcW56eWZtYW5mbHNsc2poeXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU1MDY3NSwiZXhwIjoyMDkxMTI2Njc1fQ.H3LiyHS8ZEgoqGd3TYmPoINGGwneMffASgzML2Aei8k'

const supabase = createClient(supabaseUrl, supabaseKey)

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