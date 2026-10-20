-- ============================================================================
-- 008 — Explicit GRANTs for ALL existing public tables (run once, live DB)
--
-- Background: from 2026-10-30 Supabase no longer gives new public tables
-- automatic Data API privileges. Existing tables keep their grants, so this
-- script does not fix anything broken — it makes the current access explicit
-- and auditable, and acts as a safety net in case any table was created
-- without the old defaults.
--
-- Safe to re-run: every statement checks object existence first and GRANT is
-- idempotent by nature. Ends with a verification matrix to eyeball.
-- ============================================================================

-- Cleanup of the throwaway pattern-test table (no-op if already dropped)
drop table if exists public.grant_test;

-- ============================================================================
-- 1. service_role — full access to every app table (server-side API routes)
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    -- store
    'profiles', 'categories', 'settings', 'pages', 'products',
    'product_attributes', 'product_categories', 'bulk_pricing', 'product_documents',
    'addresses', 'coupons', 'orders', 'order_items', 'order_status_history',
    'coupon_usage', 'contact_submissions', 'attribute_name_translations',
    'ui_translations', 'series_activity_areas', 'activity_areas', 'product_series',
    'payment_events', 'email_events', 'email_logs',
    -- ads control panel
    'companies', 'ad_platforms', 'ad_accounts', 'campaigns', 'ad_groups',
    'ad_sets', 'ads', 'creatives', 'daily_insights', 'conversion_events',
    'recommendations', 'change_requests', 'change_logs', 'report_templates',
    'generated_reports', 'report_sections', 'scheduled_reports', 'sync_logs',
    'api_error_logs', 'sync_state', 'search_terms', 'keywords',
    'auction_insights', 'budget_alerts',
    -- gsc + reporting
    'gsc_search_analytics', 'gsc_sync_logs', 'gsc_sync_state', 'weekly_reports'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('grant select, insert, update, delete on public.%I to service_role', t);
    end if;
  end loop;
end $$;

-- ============================================================================
-- 2. anon + authenticated — public storefront reads
--    (RLS policies decide which rows; e.g. products only published = true)
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'settings', 'pages', 'products', 'product_attributes',
    'product_categories', 'bulk_pricing', 'product_documents', 'coupons',
    'attribute_name_translations', 'ui_translations',
    'series_activity_areas', 'activity_areas', 'product_series'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('grant select on public.%I to anon, authenticated', t);
    end if;
  end loop;
end $$;

-- Contact form accepts public submissions (RLS: insert with check true)
do $$
begin
  if to_regclass('public.contact_submissions') is not null then
    grant insert on public.contact_submissions to anon, authenticated;
  end if;
end $$;

-- ============================================================================
-- 3. authenticated — signed-in customers (own rows, enforced by RLS)
-- ============================================================================
do $$
begin
  if to_regclass('public.profiles') is not null then
    grant select, update on public.profiles to authenticated;
  end if;
  if to_regclass('public.addresses') is not null then
    grant select, insert, update, delete on public.addresses to authenticated;
  end if;
  if to_regclass('public.orders') is not null then
    grant select on public.orders to authenticated;
  end if;
  if to_regclass('public.order_items') is not null then
    grant select on public.order_items to authenticated;
  end if;
  if to_regclass('public.order_status_history') is not null then
    grant select on public.order_status_history to authenticated;
  end if;
  if to_regclass('public.coupon_usage') is not null then
    grant select, delete on public.coupon_usage to authenticated;
  end if;
end $$;

-- ============================================================================
-- 4. authenticated — ads dashboard read-only (browser client, RLS-scoped)
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'ad_accounts', 'campaigns', 'ad_groups', 'ad_sets', 'ads', 'creatives',
    'daily_insights', 'conversion_events', 'recommendations', 'change_requests',
    'change_logs', 'report_templates', 'generated_reports', 'report_sections',
    'scheduled_reports', 'sync_logs', 'api_error_logs', 'sync_state',
    'search_terms', 'keywords', 'auction_insights', 'budget_alerts',
    'gsc_search_analytics', 'gsc_sync_logs', 'gsc_sync_state'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('grant select on public.%I to authenticated', t);
    end if;
  end loop;
end $$;

-- ============================================================================
-- 5. Sequences — service_role needs USAGE for INSERTs with default ids
-- ============================================================================
do $$
declare s text;
begin
  foreach s in array array[
    'categories_id_seq', 'products_id_seq', 'product_attributes_id_seq',
    'product_documents_id_seq', 'email_logs_id_seq',
    'activity_areas_id_seq', 'product_series_id_seq'
  ] loop
    if to_regclass('public.' || s) is not null then
      execute format('grant usage, select on sequence public.%I to service_role', s);
    end if;
  end loop;
end $$;

-- ============================================================================
-- 6. RPC functions — called via supabase-js .rpc() from browser + API routes
-- ============================================================================
do $$
begin
  if to_regprocedure('public.get_aggregated_insights(uuid,date,date,text,uuid,uuid)') is not null then
    grant execute on function public.get_aggregated_insights(uuid, date, date, text, uuid, uuid) to authenticated, service_role;
  end if;
  if to_regprocedure('public.get_period_comparison(uuid,date,date,date,date,text)') is not null then
    grant execute on function public.get_period_comparison(uuid, date, date, date, date, text) to authenticated, service_role;
  end if;
end $$;

-- ============================================================================
-- 7. VERIFICATION — run the whole file, then eyeball this matrix.
--    Every app table should show service_sel = t and service_ins = t.
--    Public storefront tables should additionally show anon_sel = t.
-- ============================================================================
select
  tablename,
  has_table_privilege('anon',          'public.' || tablename, 'SELECT') as anon_sel,
  has_table_privilege('authenticated', 'public.' || tablename, 'SELECT') as auth_sel,
  has_table_privilege('service_role',  'public.' || tablename, 'SELECT') as service_sel,
  has_table_privilege('service_role',  'public.' || tablename, 'INSERT') as service_ins
from pg_tables
where schemaname = 'public'
order by tablename;
