-- Add foreign key relationship between product_categories and products
-- This enables embedded resource queries like:
-- .select('product:products(...)') in Supabase

ALTER TABLE public.product_categories 
ADD CONSTRAINT product_categories_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.products(id) 
ON DELETE CASCADE;

-- Also add index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id 
ON public.product_categories(product_id);

CREATE INDEX IF NOT EXISTS idx_product_categories_category_slug 
ON public.product_categories(category_slug);