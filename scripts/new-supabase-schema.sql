-- Run this in NEW Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.profiles (id uuid, email text, full_name text, phone text, role text NOT NULL DEFAULT 'customer'::text, status text NOT NULL DEFAULT 'active'::text, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now());

CREATE TABLE IF NOT EXISTS public.categories (id serial, slug text, name_et text, name_en text, name_lv text, name_lt text, name_ru text, parent_slug text, created_at timestamp with time zone DEFAULT now());

CREATE TABLE IF NOT EXISTS public.settings (key text PRIMARY KEY, value text NOT NULL DEFAULT ''::text, updated_at timestamp with time zone DEFAULT now());

CREATE TABLE IF NOT EXISTS public.pages (id uuid NOT NULL DEFAULT gen_random_uuid(), slug text, title text, short_description text, content text, image_url text, published boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), template text NOT NULL DEFAULT 'default'::text, title_en text, title_ru text, title_lv text, title_lt text, content_en text, content_ru text, content_lv text, content_lt text, short_description_en text, short_description_ru text, short_description_lv text, short_description_lt text, blocks jsonb NOT NULL DEFAULT '[]'::jsonb, status text NOT NULL DEFAULT 'draft'::text, visibility text NOT NULL DEFAULT 'public'::text, nav_label text, show_in_nav boolean DEFAULT false, meta_title text, meta_description text, og_image_url text, show_title boolean DEFAULT true);

CREATE TABLE IF NOT EXISTS public.products (id serial, woo_id integer, sku text, slug text, name text, short_description_et text, description_et text, short_description_en text, description_en text, short_description_lv text, description_lv text, short_description_lt text, description_lt text, short_description_ru text, description_ru text, price numeric, sale_price numeric, image_url text, in_stock boolean DEFAULT true, weight_kg numeric, length_cm numeric, width_cm numeric, height_cm numeric, published boolean DEFAULT true, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), curve_url text, drawing_url text, tags text, category_gf text, url_gf text, importance smallint DEFAULT 5);

CREATE TABLE IF NOT EXISTS public.product_attributes (id serial, product_id integer, attribute_name text, attribute_value text);

CREATE TABLE IF NOT EXISTS public.product_categories (product_id integer, category_slug text);

CREATE TABLE IF NOT EXISTS public.bulk_pricing (id uuid NOT NULL DEFAULT gen_random_uuid(), product_id integer, min_quantity integer, price numeric);

CREATE TABLE IF NOT EXISTS public.product_documents (id bigserial, sku text, product_id bigint, label text, storage_path text, public_url text, created_at timestamp with time zone DEFAULT now());

CREATE TABLE IF NOT EXISTS public.addresses (id uuid NOT NULL DEFAULT gen_random_uuid(), user_id uuid, full_name text, address_line text, city text, postal_code text, country text NOT NULL DEFAULT 'EE'::text, is_default boolean DEFAULT false, created_at timestamp with time zone DEFAULT now());

CREATE TABLE IF NOT EXISTS public.coupons (id uuid NOT NULL DEFAULT gen_random_uuid(), code text, type text, value numeric, min_order_amount numeric DEFAULT 0, usage_limit integer, used_count integer DEFAULT 0, valid_from timestamp with time zone, valid_until timestamp with time zone, active boolean DEFAULT true, created_at timestamp with time zone DEFAULT now());

CREATE TABLE IF NOT EXISTS public.orders (id uuid NOT NULL DEFAULT gen_random_uuid(), user_id uuid, status text NOT NULL DEFAULT 'pending'::text, total numeric, shipping_address jsonb, montonio_order_id text, created_at timestamp with time zone DEFAULT now(), updated_at timestamp with time zone DEFAULT now(), coupon_code text, discount_amount numeric DEFAULT 0);

CREATE TABLE IF NOT EXISTS public.order_items (id uuid NOT NULL DEFAULT gen_random_uuid(), order_id uuid, product_id integer, product_name text, quantity integer, unit_price numeric);

CREATE TABLE IF NOT EXISTS public.order_status_history (id uuid NOT NULL DEFAULT gen_random_uuid(), order_id uuid, status text, note text, changed_by uuid, created_at timestamp with time zone DEFAULT now());

CREATE TABLE IF NOT EXISTS public.coupon_usage (id uuid NOT NULL DEFAULT gen_random_uuid(), coupon_id uuid, user_id uuid, order_id uuid, created_at timestamp with time zone DEFAULT now());

CREATE TABLE IF NOT EXISTS public.contact_submissions (id uuid NOT NULL DEFAULT gen_random_uuid(), page_id uuid, name text, email text, phone text, address text, message text, created_at timestamp with time zone DEFAULT now());

CREATE TABLE IF NOT EXISTS public.attribute_name_translations (name_et text, name_en text, name_ru text, name_lv text, name_lt text, updated_at timestamp with time zone DEFAULT now());

CREATE TABLE IF NOT EXISTS public.ui_translations (locale text, messages jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamp with time zone DEFAULT now());

-- Table RLS policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read products table" ON public.products FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated update products table" ON public.products FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated delete products table" ON public.products FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pages', 'pages', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('product-documents', 'product-documents', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$ BEGIN
  CREATE POLICY "Public read products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated upload products" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated update products" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'products');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated delete products" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'products');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read pages" ON storage.objects FOR SELECT USING (bucket_id = 'pages');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Public read product-documents" ON storage.objects FOR SELECT USING (bucket_id = 'product-documents');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
