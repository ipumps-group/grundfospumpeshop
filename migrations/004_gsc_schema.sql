-- ============================================================================
-- Google Search Console — Schema
-- Run this in Supabase SQL Editor to add GSC support
-- ============================================================================

-- GSC Search Analytics: stores query and page-level search performance data
create table if not exists public.gsc_search_analytics (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  dimension_type text not null check (dimension_type in ('query', 'page')),
  dimension_value text not null,
  clicks bigint default 0,
  impressions bigint default 0,
  ctr numeric(8,4) default 0,
  avg_position numeric(8,2) default 0,
  created_at timestamptz not null default now(),
  unique(date, dimension_type, dimension_value)
);

create index idx_gsc_search_analytics_date on public.gsc_search_analytics(date);
create index idx_gsc_search_analytics_type on public.gsc_search_analytics(dimension_type);
create index idx_gsc_search_analytics_impressions on public.gsc_search_analytics(impressions desc);

-- Add 'gsc' to the platform check constraint on recommendations table
-- This allows GSC recommendations to coexist with Google Ads and Meta Ads recommendations
alter table public.recommendations
  drop constraint if exists recommendations_platform_check;

alter table public.recommendations
  add constraint recommendations_platform_check
  check (platform in ('google_ads', 'meta_ads', 'ga4', 'all', 'gsc'));

-- RLS for the new table
alter table public.gsc_search_analytics enable row level security;

create policy "Service role has full access"
  on public.gsc_search_analytics for all to service_role using (true) with check (true);

create policy "Users can read gsc_search_analytics"
  on public.gsc_search_analytics for select to authenticated
  using (true);

-- GSC sync log table (tracks when search console data was last synced)
create table if not exists public.gsc_sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_type text not null default 'scheduled' check (sync_type in ('manual', 'scheduled')),
  status text not null check (status in ('running', 'completed', 'failed', 'partial')),
  date_start date,
  date_end date,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds numeric(10,2),
  queries_imported int default 0,
  pages_imported int default 0,
  recommendations_created int default 0,
  error_message text,
  error_details jsonb,
  created_at timestamptz not null default now()
);

alter table public.gsc_sync_logs enable row level security;

create policy "Service role has full access"
  on public.gsc_sync_logs for all to service_role using (true) with check (true);

create policy "Users can read gsc_sync_logs"
  on public.gsc_sync_logs for select to authenticated using (true);

-- GSC sync state (tracks last sync for incremental updates)
create table if not exists public.gsc_sync_state (
  id uuid primary key default gen_random_uuid(),
  site_url text not null,
  last_sync_date date,
  full_sync_completed boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(site_url)
);

alter table public.gsc_sync_state enable row level security;

create policy "Service role has full access"
  on public.gsc_sync_state for all to service_role using (true) with check (true);

create policy "Users can read gsc_sync_state"
  on public.gsc_sync_state for select to authenticated using (true);
