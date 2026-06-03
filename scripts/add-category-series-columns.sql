-- Add denormalized columns for Category > Series > Product navigation
DO $$ BEGIN
  ALTER TABLE products ADD COLUMN IF NOT EXISTS series_slug TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_activity_area_slug TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Add indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_series_slug ON products(series_slug);
CREATE INDEX IF NOT EXISTS idx_products_primary_activity_area_slug ON products(primary_activity_area_slug);

-- Ensure activity_areas table has all needed fields
DO $$ BEGIN
  ALTER TABLE activity_areas ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE activity_areas ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE activity_areas ADD COLUMN IF NOT EXISTS meta_title TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE activity_areas ADD COLUMN IF NOT EXISTS meta_description TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE activity_areas ADD COLUMN IF NOT EXISTS h1 TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE activity_areas ADD COLUMN IF NOT EXISTS description TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE activity_areas ADD COLUMN IF NOT EXISTS description_en TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE activity_areas ADD COLUMN IF NOT EXISTS description_ru TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE activity_areas ADD COLUMN IF NOT EXISTS description_lv TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE activity_areas ADD COLUMN IF NOT EXISTS description_lt TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Ensure product_series table has all needed fields
DO $$ BEGIN
  ALTER TABLE product_series ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE product_series ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE product_series ADD COLUMN IF NOT EXISTS primary_activity_area_id INTEGER REFERENCES activity_areas(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE product_series ADD COLUMN IF NOT EXISTS meta_title TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE product_series ADD COLUMN IF NOT EXISTS meta_description TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE product_series ADD COLUMN IF NOT EXISTS description TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE product_series ADD COLUMN IF NOT EXISTS description_en TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE product_series ADD COLUMN IF NOT EXISTS description_ru TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE product_series ADD COLUMN IF NOT EXISTS description_lv TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE product_series ADD COLUMN IF NOT EXISTS description_lt TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Ensure series_activity_areas table exists
CREATE TABLE IF NOT EXISTS series_activity_areas (
  series_id INTEGER REFERENCES product_series(id) ON DELETE CASCADE,
  activity_area_id INTEGER REFERENCES activity_areas(id) ON DELETE CASCADE,
  PRIMARY KEY (series_id, activity_area_id)
);
