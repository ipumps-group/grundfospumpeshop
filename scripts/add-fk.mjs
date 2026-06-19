import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function addForeignKey() {
  // Add foreign key constraint
  console.log('Adding foreign key constraint...')
  
  // This SQL needs to be run via raw SQL since we can't alter tables via JS client
  // But let's try using the postgres function to execute SQL
  try {
    const { error } = await supabase.rpc('exec_sql', { 
      sql: `ALTER TABLE public.product_categories 
ADD CONSTRAINT product_categories_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.products(id) 
ON DELETE CASCADE;`
    })
    
    if (error) {
      console.log('RPC failed, trying alternative...')
      console.log('Error:', error.message)
    }
  } catch (e) {
    console.log('Could not add FK via RPC:', e.message)
  }
  
  console.log('\nManual SQL needed. Run these commands in Supabase SQL Editor:')
  console.log(`
-- Add foreign key relationship
ALTER TABLE public.product_categories 
ADD CONSTRAINT product_categories_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.products(id) 
ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id 
ON public.product_categories(product_id);

CREATE INDEX IF NOT EXISTS idx_product_categories_category_slug 
ON public.product_categories(category_slug);
  `)
}

addForeignKey().then(() => process.exit()).catch(e => { console.error(e); process.exit(1) })