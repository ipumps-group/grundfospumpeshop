-- Run this in Supabase SQL Editor
ALTER TABLE pages ADD COLUMN IF NOT EXISTS show_title BOOLEAN DEFAULT TRUE;
