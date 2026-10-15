-- Fix: kontaktivormi / hinnapakkumise esitused ebaõnnestusid (PGRST204),
-- sest live-andmebaasi tabelil contact_submissions puudus veerg address.
-- Käivita Supabase SQL Editoris.
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS address text;
