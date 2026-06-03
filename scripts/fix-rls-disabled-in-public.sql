-- ============================================================
-- Complete schema + RLS setup — run once in Supabase SQL Editor
-- Project: sdqnzyfmanflslsjhytf
-- Idempotent: safe to re-run
-- ============================================================

-- ============================================================
-- 1. CREATE TABLES (if not exist)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid, email text, full_name text, phone text,
  role text NOT NULL DEFAULT 'customer'::text,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id serial, slug text,
  name_et text, name_en text, name_lv text, name_lt text, name_ru text,
  parent_slug text, created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
  key text, value text NOT NULL DEFAULT ''::text,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(), slug text, title text,
  short_description text, content text, image_url text,
  published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  template text NOT NULL DEFAULT 'default'::text,
  title_en text, title_ru text, title_lv text, title_lt text,
  content_en text, content_ru text, content_lv text, content_lt text,
  short_description_en text, short_description_ru text,
  short_description_lv text, short_description_lt text,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft'::text,
  visibility text NOT NULL DEFAULT 'public'::text,
  nav_label text, show_in_nav boolean DEFAULT false,
  meta_title text, meta_description text, og_image_url text,
  show_title boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.products (
  id serial, woo_id integer, sku text, slug text, name text,
  short_description_et text, description_et text,
  short_description_en text, description_en text,
  short_description_lv text, description_lv text,
  short_description_lt text, description_lt text,
  short_description_ru text, description_ru text,
  price numeric, sale_price numeric, image_url text,
  in_stock boolean DEFAULT true,
  weight_kg numeric, length_cm numeric, width_cm numeric, height_cm numeric,
  published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  curve_url text, drawing_url text, tags text, category_gf text, url_gf text,
  importance smallint DEFAULT 5
);

CREATE TABLE IF NOT EXISTS public.product_attributes (
  id serial, product_id integer, attribute_name text, attribute_value text
);

CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id integer, category_slug text
);

CREATE TABLE IF NOT EXISTS public.bulk_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id integer, min_quantity integer, price numeric
);

CREATE TABLE IF NOT EXISTS public.product_documents (
  id bigserial primary key,
  sku text not null, product_id bigint,
  label text not null, storage_path text not null unique,
  public_url text not null,
  created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_product_documents_sku ON product_documents(sku);
CREATE INDEX IF NOT EXISTS idx_product_documents_product_id ON product_documents(product_id);

CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(), user_id uuid,
  full_name text, address_line text, city text, postal_code text,
  country text NOT NULL DEFAULT 'EE'::text, is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(), code text, type text,
  value numeric, min_order_amount numeric DEFAULT 0,
  usage_limit integer, used_count integer DEFAULT 0,
  valid_from timestamp with time zone, valid_until timestamp with time zone,
  active boolean DEFAULT true, created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(), user_id uuid,
  status text NOT NULL DEFAULT 'pending'::text, total numeric,
  shipping_address jsonb, montonio_order_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  coupon_code text, discount_amount numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(), order_id uuid,
  product_id integer, product_name text, quantity integer, unit_price numeric
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(), order_id uuid,
  status text, note text, changed_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coupon_id uuid, user_id uuid, order_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(), page_id uuid,
  name text, email text, phone text, address text, message text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attribute_name_translations (
  name_et text primary key,
  name_en text, name_ru text, name_lv text, name_lt text,
  updated_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.ui_translations (
  locale text primary key,
  messages jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. SCHEMA MIGRATIONS (add language columns to categories)
-- ============================================================

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_ru text,
  ADD COLUMN IF NOT EXISTS name_lv text,
  ADD COLUMN IF NOT EXISTS name_lt text;

-- ============================================================
-- 3. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('pages', 'pages', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-documents', 'product-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================================
-- 4. ROW LEVEL SECURITY — enable + policies
-- ============================================================

-- ----------------------------------------
-- profiles — own user only (PII)
-- ----------------------------------------
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- categories — public read, auth write
-- ----------------------------------------
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "categories_select_public" ON public.categories
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "categories_insert_authenticated" ON public.categories
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "categories_update_authenticated" ON public.categories
    FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "categories_delete_authenticated" ON public.categories
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- settings — public read
-- ----------------------------------------
ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to settings" ON public.settings;
CREATE POLICY "Allow read access to settings" ON public.settings
  FOR SELECT USING (true);

GRANT SELECT ON public.settings TO anon;
GRANT SELECT ON public.settings TO authenticated;
GRANT SELECT ON public.settings TO service_role;

-- ----------------------------------------
-- pages — public: published only; auth: all
-- ----------------------------------------
ALTER TABLE IF EXISTS public.pages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "pages_select_published_public" ON public.pages
    FOR SELECT USING (published = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pages_select_all_authenticated" ON public.pages
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pages_insert_authenticated" ON public.pages
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pages_update_authenticated" ON public.pages
    FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pages_delete_authenticated" ON public.pages
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- products — public read, auth write
-- ----------------------------------------
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read products table" ON public.products
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated insert products" ON public.products
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated update products table" ON public.products
    FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated delete products table" ON public.products
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- product_attributes — public read, auth write
-- ----------------------------------------
ALTER TABLE IF EXISTS public.product_attributes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "product_attributes_select_public" ON public.product_attributes
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "product_attributes_insert_authenticated" ON public.product_attributes
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "product_attributes_update_authenticated" ON public.product_attributes
    FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "product_attributes_delete_authenticated" ON public.product_attributes
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- product_categories — public read, auth write
-- ----------------------------------------
ALTER TABLE IF EXISTS public.product_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "product_categories_select_public" ON public.product_categories
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "product_categories_insert_authenticated" ON public.product_categories
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "product_categories_delete_authenticated" ON public.product_categories
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- bulk_pricing — public read, auth write
-- ----------------------------------------
ALTER TABLE IF EXISTS public.bulk_pricing ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bulk_pricing_select_public" ON public.bulk_pricing
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "bulk_pricing_insert_authenticated" ON public.bulk_pricing
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "bulk_pricing_update_authenticated" ON public.bulk_pricing
    FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "bulk_pricing_delete_authenticated" ON public.bulk_pricing
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- product_documents — public read, auth write
-- ----------------------------------------
ALTER TABLE IF EXISTS public.product_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read" ON public.product_documents
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- addresses — own user only (PII)
-- ----------------------------------------
ALTER TABLE IF EXISTS public.addresses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "addresses_select_own" ON public.addresses
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "addresses_insert_own" ON public.addresses
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "addresses_update_own" ON public.addresses
    FOR UPDATE TO authenticated USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "addresses_delete_own" ON public.addresses
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- coupons — public: active only; auth: all
-- ----------------------------------------
ALTER TABLE IF EXISTS public.coupons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "coupons_select_active_public" ON public.coupons
    FOR SELECT USING (active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "coupons_select_all_authenticated" ON public.coupons
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "coupons_insert_authenticated" ON public.coupons
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "coupons_update_authenticated" ON public.coupons
    FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "coupons_delete_authenticated" ON public.coupons
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- orders — auth read, service_role write
-- ----------------------------------------
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_row_level_security_policy" ON public.orders;

DO $$ BEGIN
  CREATE POLICY "authenticated_can_read_orders" ON public.orders
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_can_read_orders" ON public.orders
    FOR SELECT TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_can_insert_orders" ON public.orders
    FOR INSERT TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_can_update_orders" ON public.orders
    FOR UPDATE TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- order_items — auth read, service_role write
-- ----------------------------------------
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_row_level_security_policy" ON public.order_items;

DO $$ BEGIN
  CREATE POLICY "authenticated_can_read_order_items" ON public.order_items
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_can_read_order_items" ON public.order_items
    FOR SELECT TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_can_insert_order_items" ON public.order_items
    FOR INSERT TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- order_status_history — auth read, service_role write
-- ----------------------------------------
ALTER TABLE IF EXISTS public.order_status_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "authenticated_can_read_status_history" ON public.order_status_history
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_can_read_status_history" ON public.order_status_history
    FOR SELECT TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_role_can_insert_status_history" ON public.order_status_history
    FOR INSERT TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- coupon_usage — auth select/delete, service_role insert
-- ----------------------------------------
ALTER TABLE IF EXISTS public.coupon_usage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "coupon_usage_select_authenticated" ON public.coupon_usage
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "coupon_usage_delete_authenticated" ON public.coupon_usage
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- contact_submissions — public insert, auth read/manage (PII)
-- ----------------------------------------
ALTER TABLE IF EXISTS public.contact_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "contact_submissions_insert_public" ON public.contact_submissions
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "contact_submissions_select_authenticated" ON public.contact_submissions
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "contact_submissions_update_authenticated" ON public.contact_submissions
    FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "contact_submissions_delete_authenticated" ON public.contact_submissions
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- attribute_name_translations — public read
-- ----------------------------------------
ALTER TABLE IF EXISTS public.attribute_name_translations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public read attribute_name_translations" ON public.attribute_name_translations
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- ui_translations — public read
-- ----------------------------------------
ALTER TABLE IF EXISTS public.ui_translations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public read ui_translations" ON public.ui_translations
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- series_activity_areas — public read, auth write
-- ----------------------------------------
ALTER TABLE IF EXISTS public.series_activity_areas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "series_activity_areas_select_public" ON public.series_activity_areas
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "series_activity_areas_insert_authenticated" ON public.series_activity_areas
    FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "series_activity_areas_update_authenticated" ON public.series_activity_areas
    FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "series_activity_areas_delete_authenticated" ON public.series_activity_areas
    FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------
-- payment_events — service role only (SENSITIVE)
-- ----------------------------------------
ALTER TABLE IF EXISTS public.payment_events ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- email_events — service role only (SENSITIVE)
-- ----------------------------------------
ALTER TABLE IF EXISTS public.email_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. STORAGE POLICIES
-- ============================================================

-- Products bucket
DO $$ BEGIN
  CREATE POLICY "Public read products" ON storage.objects
    FOR SELECT USING (bucket_id = 'products');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated upload products" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated update products" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'products');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated delete products" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'products');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Pages bucket
DO $$ BEGIN
  CREATE POLICY "Public read pages" ON storage.objects
    FOR SELECT USING (bucket_id = 'pages');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Product-documents bucket
DO $$ BEGIN
  CREATE POLICY "Public read product-documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-documents');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated upload" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-documents');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated delete" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'product-documents');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
