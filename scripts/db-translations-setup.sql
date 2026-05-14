-- ── DB translation tables setup ───────────────────────────────────────────
-- Run this in the Supabase SQL editor once before using /api/haldus/db-translate

-- 1. Attribute name translations dictionary
--    Keyed by Estonian name; one row per unique attribute name across all products
create table if not exists attribute_name_translations (
  name_et text primary key,
  name_en text,
  name_ru text,
  name_lv text,
  name_lt text,
  updated_at timestamptz default now()
);

-- 2. Add language columns to categories (if not already present)
alter table categories
  add column if not exists name_en text,
  add column if not exists name_ru text,
  add column if not exists name_lv text,
  add column if not exists name_lt text;

-- 3. UI translations table (for /api/haldus/ui-translate)
--    One row per locale; the value column is a full JSON object (deep-merged over static messages/*.json)
create table if not exists ui_translations (
  locale text primary key,
  value  jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Enable RLS with open read access (translations are public) and service-role write
alter table attribute_name_translations enable row level security;
alter table ui_translations enable row level security;

create policy if not exists "public read attribute_name_translations"
  on attribute_name_translations for select using (true);

create policy if not exists "public read ui_translations"
  on ui_translations for select using (true);
