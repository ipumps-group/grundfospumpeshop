-- ============================================================================
-- Ads Control Panel — Supabase Schema
-- Run this in Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================================

-- 0. EXTENSIONS
create extension if not exists "pgcrypto";

-- 1. COMPANIES
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. USER PROFILES (extends the existing profiles table)
alter table public.profiles add column if not exists company_id uuid references public.companies(id);
alter table public.profiles add column if not exists ads_role text check (ads_role in ('admin','manager','viewer')) default 'viewer';

-- 3. AD PLATFORMS
create table if not exists public.ad_platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.ad_platforms (name, slug) values
  ('Google Ads', 'google_ads'),
  ('Meta Ads', 'meta_ads'),
  ('GA4', 'ga4')
on conflict (slug) do nothing;

-- 4. AD ACCOUNTS
create table if not exists public.ad_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  platform_id uuid references public.ad_platforms(id),
  platform_account_id text not null,
  account_name text not null,
  account_currency text default 'EUR',
  account_timezone text default 'Europe/Tallinn',
  status text default 'active',
  credentials jsonb,
  connected_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform_id, platform_account_id)
);

-- 5. CAMPAIGNS
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.ad_accounts(id) on delete cascade,
  platform_campaign_id text not null,
  campaign_name text not null,
  platform text not null check (platform in ('google_ads','meta_ads')),
  status text not null default 'unknown',
  objective text,
  daily_budget numeric(12,2),
  lifetime_budget numeric(12,2),
  budget_type text check (budget_type in ('daily','lifetime')),
  start_date date,
  end_date date,
  targeting jsonb,
  raw_data jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id, platform_campaign_id)
);

create index idx_campaigns_account on public.campaigns(account_id);
create index idx_campaigns_platform on public.campaigns(platform);
create index idx_campaigns_status on public.campaigns(status);

-- 6. AD GROUPS (Google Ads)
create table if not exists public.ad_groups (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  platform_ad_group_id text not null,
  ad_group_name text not null,
  status text default 'unknown',
  type text,
  daily_budget numeric(12,2),
  targeting jsonb,
  raw_data jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_id, platform_ad_group_id)
);

create index idx_ad_groups_campaign on public.ad_groups(campaign_id);

-- 7. AD SETS (Meta Ads)
create table if not exists public.ad_sets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  platform_ad_set_id text not null,
  ad_set_name text not null,
  status text default 'unknown',
  daily_budget numeric(12,2),
  lifetime_budget numeric(12,2),
  budget_type text check (budget_type in ('daily','lifetime')),
  targeting jsonb,
  raw_data jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_id, platform_ad_set_id)
);

create index idx_ad_sets_campaign on public.ad_sets(campaign_id);

-- 8. ADS
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  ad_group_id uuid references public.ad_groups(id) on delete set null,
  ad_set_id uuid references public.ad_sets(id) on delete set null,
  platform_ad_id text not null,
  ad_name text not null,
  status text default 'unknown',
  ad_type text,
  platform text not null check (platform in ('google_ads','meta_ads')),
  raw_data jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_id, platform_ad_id)
);

create index idx_ads_campaign on public.ads(campaign_id);

-- 9. CREATIVES
create table if not exists public.creatives (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid references public.ads(id) on delete cascade,
  platform_creative_id text,
  headline text,
  description text,
  cta text,
  image_url text,
  video_url text,
  thumbnail_url text,
  destination_url text,
  display_url text,
  creative_type text,
  creative_template text,
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_creatives_ad on public.creatives(ad_id);

-- 10. DAILY INSIGHTS
create table if not exists public.daily_insights (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  platform text not null check (platform in ('google_ads','meta_ads','ga4')),
  account_id uuid references public.ad_accounts(id) on delete cascade,
  campaign_id uuid,
  ad_group_id uuid not null default '00000000-0000-0000-0000-000000000000',
  ad_set_id uuid not null default '00000000-0000-0000-0000-000000000000',
  ad_id uuid not null default '00000000-0000-0000-0000-000000000000',
  -- metrics
  spend numeric(12,4) default 0,
  impressions bigint default 0,
  reach bigint default 0,
  frequency numeric(8,2) default 0,
  clicks bigint default 0,
  link_clicks bigint default 0,
  ctr numeric(10,6) default 0,
  cpc numeric(12,6) default 0,
  cpm numeric(12,6) default 0,
  conversions numeric(12,4) default 0,
  conversion_value numeric(14,4) default 0,
  cost_per_conversion numeric(12,6) default 0,
  roas numeric(10,4) default 0,
  leads bigint default 0,
  purchases bigint default 0,
  add_to_cart bigint default 0,
  landing_page_views bigint default 0,
  engagement bigint default 0,
  video_views bigint default 0,
  -- flexible
  custom_events jsonb default '{}',
  raw_data jsonb default '{}',
  created_at timestamptz not null default now(),
  unique(date, platform, account_id, campaign_id, ad_group_id, ad_set_id, ad_id)
);

create index idx_daily_insights_date on public.daily_insights(date);
create index idx_daily_insights_account on public.daily_insights(account_id);
create index idx_daily_insights_campaign on public.daily_insights(campaign_id);
create index idx_daily_insights_platform on public.daily_insights(platform);

-- 11. CONVERSION EVENTS
create table if not exists public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.ad_accounts(id) on delete cascade,
  platform text not null check (platform in ('google_ads','meta_ads','ga4')),
  platform_event_id text,
  event_name text not null,
  event_category text,
  count bigint default 0,
  value numeric(14,4) default 0,
  last_occurrence timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 12. RECOMMENDATIONS
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  description text,
  severity text not null check (severity in ('low','medium','high')),
  platform text check (platform in ('google_ads','meta_ads','ga4','all')),
  category text,
  affected_campaign_id uuid references public.campaigns(id) on delete set null,
  affected_ad_group_id uuid references public.ad_groups(id) on delete set null,
  affected_ad_set_id uuid references public.ad_sets(id) on delete set null,
  affected_ad_id uuid references public.ads(id) on delete set null,
  reason text,
  data_evidence jsonb,
  expected_impact text,
  suggested_action text,
  confidence_score numeric(4,2),
  change_request_payload jsonb,
  status text default 'open' check (status in ('open','applied','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_recommendations_company on public.recommendations(company_id);
create index idx_recommendations_severity on public.recommendations(severity);
create index idx_recommendations_status on public.recommendations(status);

-- 13. CHANGE REQUESTS
create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  description text,
  platform text not null check (platform in ('google_ads','meta_ads')),
  action_type text not null,
  target_type text not null check (target_type in ('campaign','ad_group','ad_set','ad')),
  target_id uuid,
  target_platform_id text,
  before_values jsonb,
  after_values jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected','executed','failed')),
  created_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  executed_at timestamptz,
  api_response jsonb,
  error_message text,
  rollback_notes text,
  source text check (source in ('manual','ai_recommendation')),
  recommendation_id uuid references public.recommendations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_change_requests_company on public.change_requests(company_id);
create index idx_change_requests_status on public.change_requests(status);

-- 14. CHANGE LOGS
create table if not exists public.change_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  change_request_id uuid references public.change_requests(id),
  platform text not null check (platform in ('google_ads','meta_ads')),
  action_type text not null,
  target_type text not null,
  target_name text,
  target_platform_id text,
  before_values jsonb,
  after_values jsonb,
  result text check (result in ('success','partial','failed')),
  api_response jsonb,
  error_message text,
  performed_by uuid references auth.users(id),
  performed_at timestamptz not null default now(),
  rollback_notes text,
  created_at timestamptz not null default now()
);

create index idx_change_logs_company on public.change_logs(company_id);
create index idx_change_logs_performed_at on public.change_logs(performed_at);

-- 15. REPORT TEMPLATES
create table if not exists public.report_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  description text,
  report_type text not null,
  config jsonb not null default '{}',
  is_default boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 16. GENERATED REPORTS
create table if not exists public.generated_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  template_id uuid references public.report_templates(id) on delete set null,
  title text not null,
  report_type text not null,
  date_start date not null,
  date_end date not null,
  compare_start date,
  compare_end date,
  platforms text[],
  filters jsonb default '{}',
  summary jsonb default '{}',
  sections jsonb default '[]',
  ai_summary text,
  ai_action_plan text,
  html_content text,
  pdf_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_generated_reports_company on public.generated_reports(company_id);
create index idx_generated_reports_type on public.generated_reports(report_type);

-- 17. REPORT SECTIONS
create table if not exists public.report_sections (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.generated_reports(id) on delete cascade,
  section_type text not null,
  title text not null,
  content jsonb not null default '{}',
  sort_order int not null default 0
);

-- 18. SCHEDULED REPORTS
create table if not exists public.scheduled_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  template_id uuid references public.report_templates(id) on delete cascade,
  name text not null,
  frequency text not null check (frequency in ('daily','weekly','monthly')),
  day_of_week int check (day_of_week between 0 and 6),
  day_of_month int check (day_of_month between 1 and 31),
  recipients text[] not null default '{}',
  format text not null default 'pdf' check (format in ('pdf','html','csv')),
  enabled boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 19. SYNC LOGS
create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.ad_accounts(id) on delete cascade,
  platform text not null check (platform in ('google_ads','meta_ads','ga4')),
  sync_type text not null default 'manual' check (sync_type in ('manual','scheduled','webhook')),
  status text not null check (status in ('running','completed','failed','partial')),
  date_start date,
  date_end date,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds numeric(10,2),
  rows_imported int default 0,
  error_message text,
  error_details jsonb,
  created_at timestamptz not null default now()
);

create index idx_sync_logs_account on public.sync_logs(account_id);
create index idx_sync_logs_status on public.sync_logs(status);

-- 20. API ERROR LOGS
create table if not exists public.api_error_logs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.ad_accounts(id) on delete set null,
  platform text not null check (platform in ('google_ads','meta_ads','ga4')),
  endpoint text,
  request_body jsonb,
  response_body jsonb,
  status_code int,
  error_code text,
  error_message text,
  is_permission_error boolean default false,
  created_at timestamptz not null default now()
);

-- 21. SYNC STATE (for tracking incremental syncs)
create table if not exists public.sync_state (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.ad_accounts(id) on delete cascade,
  platform text not null check (platform in ('google_ads','meta_ads','ga4')),
  last_sync_date date,
  last_sync_cursor text,
  full_sync_completed boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id, platform)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.companies enable row level security;
alter table public.ad_platforms enable row level security;
alter table public.ad_accounts enable row level security;
alter table public.campaigns enable row level security;
alter table public.ad_groups enable row level security;
alter table public.ad_sets enable row level security;
alter table public.ads enable row level security;
alter table public.creatives enable row level security;
alter table public.daily_insights enable row level security;
alter table public.conversion_events enable row level security;
alter table public.recommendations enable row level security;
alter table public.change_requests enable row level security;
alter table public.change_logs enable row level security;
alter table public.report_templates enable row level security;
alter table public.generated_reports enable row level security;
alter table public.report_sections enable row level security;
alter table public.scheduled_reports enable row level security;
alter table public.sync_logs enable row level security;
alter table public.api_error_logs enable row level security;
alter table public.sync_state enable row level security;

-- Service role bypass (used by API routes)
create policy "Service role has full access"
  on public.companies for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.ad_platforms for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.ad_accounts for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.campaigns for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.ad_groups for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.ad_sets for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.ads for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.creatives for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.daily_insights for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.conversion_events for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.recommendations for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.change_requests for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.change_logs for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.report_templates for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.generated_reports for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.report_sections for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.scheduled_reports for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.sync_logs for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.api_error_logs for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.sync_state for all to service_role using (true) with check (true);

-- Authenticated users can read their company's data
create policy "Users can read their company data"
  on public.ad_accounts for select to authenticated
  using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can read their company campaigns"
  on public.campaigns for select to authenticated
  using (account_id in (
    select id from public.ad_accounts
    where company_id in (select company_id from public.profiles where id = auth.uid())
  ));

-- Per-table read policies for authenticated users
create policy "Users can read ad_groups"
  on public.ad_groups for select to authenticated
  using (campaign_id in (select id from public.campaigns where account_id in (select id from public.ad_accounts where company_id in (select company_id from public.profiles where id = auth.uid()))));

create policy "Users can read ad_sets"
  on public.ad_sets for select to authenticated
  using (campaign_id in (select id from public.campaigns where account_id in (select id from public.ad_accounts where company_id in (select company_id from public.profiles where id = auth.uid()))));

create policy "Users can read ads"
  on public.ads for select to authenticated
  using (campaign_id in (select id from public.campaigns where account_id in (select id from public.ad_accounts where company_id in (select company_id from public.profiles where id = auth.uid()))));

create policy "Users can read creatives"
  on public.creatives for select to authenticated
  using (ad_id in (select id from public.ads where campaign_id in (select id from public.campaigns where account_id in (select id from public.ad_accounts where company_id in (select company_id from public.profiles where id = auth.uid())))));

create policy "Users can read daily_insights"
  on public.daily_insights for select to authenticated
  using (account_id in (select id from public.ad_accounts where company_id in (select company_id from public.profiles where id = auth.uid())));

create policy "Users can read conversion_events"
  on public.conversion_events for select to authenticated
  using (account_id in (select id from public.ad_accounts where company_id in (select company_id from public.profiles where id = auth.uid())));

create policy "Users can read recommendations"
  on public.recommendations for select to authenticated
  using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can read change_requests"
  on public.change_requests for select to authenticated
  using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can read change_logs"
  on public.change_logs for select to authenticated
  using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can read report_templates"
  on public.report_templates for select to authenticated
  using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can read generated_reports"
  on public.generated_reports for select to authenticated
  using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can read report_sections"
  on public.report_sections for select to authenticated
  using (report_id in (select id from public.generated_reports where company_id in (select company_id from public.profiles where id = auth.uid())));

create policy "Users can read scheduled_reports"
  on public.scheduled_reports for select to authenticated
  using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can read sync_logs"
  on public.sync_logs for select to authenticated
  using (account_id in (select id from public.ad_accounts where company_id in (select company_id from public.profiles where id = auth.uid())));

create policy "Users can read api_error_logs"
  on public.api_error_logs for select to authenticated
  using (account_id in (select id from public.ad_accounts where company_id in (select company_id from public.profiles where id = auth.uid())));

create policy "Users can read sync_state"
  on public.sync_state for select to authenticated
  using (account_id in (select id from public.ad_accounts where company_id in (select company_id from public.profiles where id = auth.uid())));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Aggregate daily insights for a given period
create or replace function public.get_aggregated_insights(
  p_company_id uuid,
  p_date_start date,
  p_date_end date,
  p_platform text default null,
  p_account_id uuid default null,
  p_campaign_id uuid default null
)
returns table (
  platform text,
  account_id uuid,
  campaign_id uuid,
  total_spend numeric,
  total_impressions bigint,
  total_clicks bigint,
  total_conversions numeric,
  total_conversion_value numeric,
  avg_ctr numeric,
  avg_cpc numeric,
  avg_cpm numeric,
  avg_cpa numeric,
  avg_roas numeric,
  total_leads bigint,
  total_purchases bigint
)
language plpgsql
as $$
begin
  return query
  select
    di.platform,
    di.account_id,
    di.campaign_id,
    sum(di.spend)::numeric(14,4) as total_spend,
    sum(di.impressions)::bigint as total_impressions,
    sum(di.clicks)::bigint as total_clicks,
    sum(di.conversions)::numeric(12,4) as total_conversions,
    sum(di.conversion_value)::numeric(14,4) as total_conversion_value,
    case when sum(di.impressions) > 0
      then (sum(di.clicks)::numeric / sum(di.impressions)::numeric * 100)::numeric(10,4)
      else 0 end as avg_ctr,
    case when sum(di.clicks) > 0
      then (sum(di.spend) / sum(di.clicks)::numeric)::numeric(12,6)
      else 0 end as avg_cpc,
    case when sum(di.impressions) > 0
      then (sum(di.spend) / sum(di.impressions)::numeric * 1000)::numeric(12,6)
      else 0 end as avg_cpm,
    case when sum(di.conversions) > 0
      then (sum(di.spend) / sum(di.conversions))::numeric(12,6)
      else 0 end as avg_cpa,
    case when sum(di.spend) > 0
      then (sum(di.conversion_value) / sum(di.spend))::numeric(10,4)
      else 0 end as avg_roas,
    sum(di.leads)::bigint as total_leads,
    sum(di.purchases)::bigint as total_purchases
  from public.daily_insights di
  join public.campaigns c on di.campaign_id = c.id
  join public.ad_accounts aa on di.account_id = aa.id
  where aa.company_id = p_company_id
    and di.date >= p_date_start
    and di.date <= p_date_end
    and (p_platform is null or di.platform = p_platform)
    and (p_account_id is null or di.account_id = p_account_id)
    and (p_campaign_id is null or di.campaign_id = p_campaign_id)
  group by di.platform, di.account_id, di.campaign_id
  order by total_spend desc;
end;
$$;

-- Get period-over-period comparison
create or replace function public.get_period_comparison(
  p_company_id uuid,
  p_current_start date,
  p_current_end date,
  p_previous_start date,
  p_previous_end date,
  p_platform text default null
)
returns table (
  metric text,
  current_value numeric,
  previous_value numeric,
  change_pct numeric
)
language plpgsql
as $$
declare
  cur record;
  prev record;
begin
  -- Current period
  select
    sum(di.spend) as spend,
    sum(di.impressions) as impressions,
    sum(di.clicks) as clicks,
    sum(di.conversions) as conversions,
    sum(di.conversion_value) as conversion_value,
    sum(di.leads) as leads,
    sum(di.purchases) as purchases
  into cur
  from public.daily_insights di
  join public.ad_accounts aa on di.account_id = aa.id
  where aa.company_id = p_company_id
    and di.date >= p_current_start and di.date <= p_current_end
    and (p_platform is null or di.platform = p_platform);

  -- Previous period
  select
    sum(di.spend),
    sum(di.impressions),
    sum(di.clicks),
    sum(di.conversions),
    sum(di.conversion_value),
    sum(di.leads),
    sum(di.purchases)
  into prev
  from public.daily_insights di
  join public.ad_accounts aa on di.account_id = aa.id
  where aa.company_id = p_company_id
    and di.date >= p_previous_start and di.date <= p_previous_end
    and (p_platform is null or di.platform = p_platform);

  return query
  select 'spend' as metric, coalesce(cur.spend,0), coalesce(prev.spend,0),
    case when coalesce(prev.spend,0) > 0 then ((coalesce(cur.spend,0) - coalesce(prev.spend,0)) / coalesce(prev.spend,0) * 100) else null end
  union all
  select 'impressions', coalesce(cur.impressions,0)::numeric, coalesce(prev.impressions,0)::numeric,
    case when coalesce(prev.impressions,0) > 0 then ((coalesce(cur.impressions,0) - coalesce(prev.impressions,0))::numeric / coalesce(prev.impressions,0) * 100) else null end
  union all
  select 'clicks', coalesce(cur.clicks,0)::numeric, coalesce(prev.clicks,0)::numeric,
    case when coalesce(prev.clicks,0) > 0 then ((coalesce(cur.clicks,0) - coalesce(prev.clicks,0))::numeric / coalesce(prev.clicks,0) * 100) else null end
  union all
  select 'conversions', coalesce(cur.conversions,0), coalesce(prev.conversions,0),
    case when coalesce(prev.conversions,0) > 0 then ((coalesce(cur.conversions,0) - coalesce(prev.conversions,0)) / coalesce(prev.conversions,0) * 100) else null end
  union all
  select 'revenue', coalesce(cur.conversion_value,0), coalesce(prev.conversion_value,0),
    case when coalesce(prev.conversion_value,0) > 0 then ((coalesce(cur.conversion_value,0) - coalesce(prev.conversion_value,0)) / coalesce(prev.conversion_value,0) * 100) else null end
  union all
  select 'leads', coalesce(cur.leads,0)::numeric, coalesce(prev.leads,0)::numeric,
    case when coalesce(prev.leads,0) > 0 then ((coalesce(cur.leads,0) - coalesce(prev.leads,0))::numeric / coalesce(prev.leads,0) * 100) else null end
  union all
  select 'purchases', coalesce(cur.purchases,0)::numeric, coalesce(prev.purchases,0)::numeric,
    case when coalesce(prev.purchases,0) > 0 then ((coalesce(cur.purchases,0) - coalesce(prev.purchases,0))::numeric / coalesce(prev.purchases,0) * 100) else null end;
end;
$$;
