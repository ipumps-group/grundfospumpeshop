-- ============================================================
-- RLS Security Fixes — run in Supabase SQL Editor
-- Fixes overly broad policies, missing RLS, and user scoping
-- ============================================================

-- ----------------------------------------
-- 1. email_logs — ENABLE RLS + service_role only
-- ----------------------------------------
ALTER TABLE IF EXISTS public.email_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "email_logs_service_role_all" ON public.email_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 2. email_events — add explicit service_role policy
-- ----------------------------------------
DO $$ BEGIN
  CREATE POLICY "email_events_service_role_all" ON public.email_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 3. payment_events — add explicit service_role policy
-- ----------------------------------------
DO $$ BEGIN
  CREATE POLICY "payment_events_service_role_all" ON public.payment_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 4. orders — scope authenticated reads to own orders
-- ----------------------------------------
DROP POLICY IF EXISTS "authenticated_can_read_orders" ON public.orders;

DO $$ BEGIN
  CREATE POLICY "orders_select_own" ON public.orders
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 5. order_items — scope to order owner
-- ----------------------------------------
DROP POLICY IF EXISTS "authenticated_can_read_order_items" ON public.order_items;

DO $$ BEGIN
  CREATE POLICY "order_items_select_own" ON public.order_items
    FOR SELECT TO authenticated
    USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 6. order_status_history — scope to order owner
-- ----------------------------------------
DROP POLICY IF EXISTS "authenticated_can_read_status_history" ON public.order_status_history;

DO $$ BEGIN
  CREATE POLICY "order_status_history_select_own" ON public.order_status_history
    FOR SELECT TO authenticated
    USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 7. coupon_usage — scope to own usage
-- ----------------------------------------
DROP POLICY IF EXISTS "coupon_usage_select_authenticated" ON public.coupon_usage;
DROP POLICY IF EXISTS "coupon_usage_delete_authenticated" ON public.coupon_usage;

DO $$ BEGIN
  CREATE POLICY "coupon_usage_select_own" ON public.coupon_usage
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "coupon_usage_delete_own" ON public.coupon_usage
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 8. contact_submissions — restrict authenticated reads/writes to service_role
-- ----------------------------------------
DROP POLICY IF EXISTS "contact_submissions_select_authenticated" ON public.contact_submissions;
DROP POLICY IF EXISTS "contact_submissions_update_authenticated" ON public.contact_submissions;
DROP POLICY IF EXISTS "contact_submissions_delete_authenticated" ON public.contact_submissions;

DO $$ BEGIN
  CREATE POLICY "contact_submissions_manage_service_role" ON public.contact_submissions
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 9. categories — restrict writes to service_role only
-- ----------------------------------------
DROP POLICY IF EXISTS "categories_insert_authenticated" ON public.categories;
DROP POLICY IF EXISTS "categories_update_authenticated" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_authenticated" ON public.categories;

DO $$ BEGIN
  CREATE POLICY "categories_write_service_role" ON public.categories
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 10. products — restrict writes to service_role only
-- ----------------------------------------
DROP POLICY IF EXISTS "Authenticated insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated update products table" ON public.products;
DROP POLICY IF EXISTS "Authenticated delete products table" ON public.products;

DO $$ BEGIN
  CREATE POLICY "products_write_service_role" ON public.products
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 11. product_attributes — restrict writes to service_role only
-- ----------------------------------------
DROP POLICY IF EXISTS "product_attributes_insert_authenticated" ON public.product_attributes;
DROP POLICY IF EXISTS "product_attributes_update_authenticated" ON public.product_attributes;
DROP POLICY IF EXISTS "product_attributes_delete_authenticated" ON public.product_attributes;

DO $$ BEGIN
  CREATE POLICY "product_attributes_write_service_role" ON public.product_attributes
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 12. product_categories — restrict writes to service_role only
-- ----------------------------------------
DROP POLICY IF EXISTS "product_categories_insert_authenticated" ON public.product_categories;
DROP POLICY IF EXISTS "product_categories_delete_authenticated" ON public.product_categories;

DO $$ BEGIN
  CREATE POLICY "product_categories_write_service_role" ON public.product_categories
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 13. bulk_pricing — restrict writes to service_role only
-- ----------------------------------------
DROP POLICY IF EXISTS "bulk_pricing_insert_authenticated" ON public.bulk_pricing;
DROP POLICY IF EXISTS "bulk_pricing_update_authenticated" ON public.bulk_pricing;
DROP POLICY IF EXISTS "bulk_pricing_delete_authenticated" ON public.bulk_pricing;

DO $$ BEGIN
  CREATE POLICY "bulk_pricing_write_service_role" ON public.bulk_pricing
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 14. pages — restrict writes to service_role only
-- ----------------------------------------
DROP POLICY IF EXISTS "pages_insert_authenticated" ON public.pages;
DROP POLICY IF EXISTS "pages_update_authenticated" ON public.pages;
DROP POLICY IF EXISTS "pages_delete_authenticated" ON public.pages;

DO $$ BEGIN
  CREATE POLICY "pages_write_service_role" ON public.pages
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 15. coupons — restrict writes to service_role only
-- ----------------------------------------
DROP POLICY IF EXISTS "coupons_insert_authenticated" ON public.coupons;
DROP POLICY IF EXISTS "coupons_update_authenticated" ON public.coupons;
DROP POLICY IF EXISTS "coupons_delete_authenticated" ON public.coupons;

DO $$ BEGIN
  CREATE POLICY "coupons_write_service_role" ON public.coupons
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 16. series_activity_areas — restrict writes to service_role only
-- ----------------------------------------
DROP POLICY IF EXISTS "series_activity_areas_insert_authenticated" ON public.series_activity_areas;
DROP POLICY IF EXISTS "series_activity_areas_update_authenticated" ON public.series_activity_areas;
DROP POLICY IF EXISTS "series_activity_areas_delete_authenticated" ON public.series_activity_areas;

DO $$ BEGIN
  CREATE POLICY "series_activity_areas_write_service_role" ON public.series_activity_areas
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 17. Storage — restrict product uploads/deletes to service_role
-- ----------------------------------------
DROP POLICY IF EXISTS "Authenticated upload products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete" ON storage.objects;

DO $$ BEGIN
  CREATE POLICY "products_storage_write_service_role" ON storage.objects
    FOR ALL TO service_role USING (bucket_id IN ('products', 'product-documents'))
    WITH CHECK (bucket_id IN ('products', 'product-documents'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- 18. Add missing indexes for performance
-- ----------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON public.product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_name ON public.product_attributes(attribute_name);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(published);
CREATE INDEX IF NOT EXISTS idx_products_series_slug ON public.products(series_slug);
CREATE INDEX IF NOT EXISTS idx_products_primary_activity_area_slug ON public.products(primary_activity_area_slug);
CREATE INDEX IF NOT EXISTS idx_pages_slug_published ON public.pages(slug, published);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
