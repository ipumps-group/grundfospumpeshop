-- ============================================================
-- Make storage_path nullable + clean up migrated documents
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Make storage_path nullable (supports external URL documents)
ALTER TABLE product_documents
  ALTER COLUMN storage_path DROP NOT NULL;

-- 2. Drop the UNIQUE constraint on storage_path
--    (NULLs are not equal in SQL so duplicates aren't an issue,
--     but the constraint definition may still reject NULL in some Postgres versions)
ALTER TABLE product_documents
  DROP CONSTRAINT IF EXISTS product_documents_storage_path_key;

-- 3. Set storage_path = NULL for all records whose public_url already
--    points to api.grundfos.com (files have been deleted from Supabase storage)
UPDATE product_documents
SET storage_path = NULL
WHERE public_url LIKE 'https://api.grundfos.com/%'
   OR public_url LIKE 'https://product-selection.grundfos.com/%';
