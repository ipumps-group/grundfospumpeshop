-- Add full-text search vector column to products table
-- Run this in Supabase SQL Editor

ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(name,'')) ||
    to_tsvector('simple', coalesce(sku,'')) ||
    to_tsvector('simple', coalesce(short_description_et,'')) ||
    to_tsvector('simple', coalesce(short_description_en,'')) ||
    to_tsvector('simple', coalesce(short_description_ru,'')) ||
    to_tsvector('simple', coalesce(short_description_lv,'')) ||
    to_tsvector('simple', coalesce(short_description_lt,''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search ON products USING GIN(search_vector);
