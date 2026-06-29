-- ============================================================================
-- Search Terms, Keywords & Auction Insights — Schema Extension
-- Run this in Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================================

-- 22. SEARCH TERMS
create table if not exists public.search_terms (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.ad_accounts(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  query_text text not null,
  match_type text,
  impressions bigint default 0,
  clicks bigint default 0,
  ctr numeric(10,6) default 0,
  cpc numeric(12,6) default 0,
  spend numeric(12,4) default 0,
  conversions numeric(12,4) default 0,
  conversion_value numeric(14,4) default 0,
  cost_per_conversion numeric(12,6) default 0,
  roas numeric(10,4) default 0,
  date_range_start date not null,
  date_range_end date not null,
  raw_data jsonb default '{}',
  created_at timestamptz not null default now(),
  unique(account_id, query_text, date_range_start, date_range_end)
);

create index idx_search_terms_account on public.search_terms(account_id);
create index idx_search_terms_query on public.search_terms(query_text);
create index idx_search_terms_spend on public.search_terms(spend desc);

-- 23. KEYWORDS
create table if not exists public.keywords (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.ad_accounts(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  keyword_text text not null,
  match_type text,
  status text,
  cpc_bid_micros bigint default 0,
  quality_score int,
  impressions bigint default 0,
  clicks bigint default 0,
  ctr numeric(10,6) default 0,
  cpc numeric(12,6) default 0,
  spend numeric(12,4) default 0,
  conversions numeric(12,4) default 0,
  conversion_value numeric(14,4) default 0,
  impression_share numeric(8,2) default 0,
  date_range_start date not null,
  date_range_end date not null,
  raw_data jsonb default '{}',
  created_at timestamptz not null default now(),
  unique(account_id, keyword_text, match_type, date_range_start, date_range_end)
);

create index idx_keywords_account on public.keywords(account_id);
create index idx_keywords_text on public.keywords(keyword_text);
create index idx_keywords_quality on public.keywords(quality_score);

-- 24. AUCTION INSIGHTS
create table if not exists public.auction_insights (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.ad_accounts(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  competitor_domain text not null,
  impression_share numeric(8,2) default 0,
  avg_position numeric(8,2) default 0,
  overlap_rate numeric(8,2) default 0,
  position_above_rate numeric(8,2) default 0,
  top_of_page_rate numeric(8,2) default 0,
  outranking_share numeric(8,2) default 0,
  date_range_start date not null,
  date_range_end date not null,
  raw_data jsonb default '{}',
  created_at timestamptz not null default now(),
  unique(account_id, campaign_id, competitor_domain, date_range_start, date_range_end)
);

create index idx_auction_campaign on public.auction_insights(campaign_id);
create index idx_auction_domain on public.auction_insights(competitor_domain);

-- 25. BUDGET ALERTS
create table if not exists public.budget_alerts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.ad_accounts(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  alert_type text not null check (alert_type in ('overspend','underspend','budget_capped','budget_exhausted','roas_drop','cpa_spike')),
  severity text not null check (severity in ('low','medium','high','critical')),
  message text not null,
  current_value numeric(14,4),
  threshold_value numeric(14,4),
  is_active boolean default true,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_budget_alerts_active on public.budget_alerts(is_active);
create index idx_budget_alerts_campaign on public.budget_alerts(campaign_id);

-- Add budget pacing columns to campaigns table
alter table public.campaigns add column if not exists monthly_budget numeric(12,2);
alter table public.campaigns add column if not exists pacing_percent numeric(5,2);
alter table public.campaigns add column if not exists budget_exhaustion_date date;

-- RLS policies for new tables
alter table public.search_terms enable row level security;
alter table public.keywords enable row level security;
alter table public.auction_insights enable row level security;
alter table public.budget_alerts enable row level security;

create policy "Service role has full access"
  on public.search_terms for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.keywords for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.auction_insights for all to service_role using (true) with check (true);

create policy "Service role has full access"
  on public.budget_alerts for all to service_role using (true) with check (true);

create policy "Users can read search_terms"
  on public.search_terms for select to authenticated
  using (account_id in (select id from public.ad_accounts where company_id in (select company_id from public.profiles where id = auth.uid())));

create policy "Users can read keywords"
  on public.keywords for select to authenticated
  using (account_id in (select id from public.ad_accounts where company_id in (select company_id from public.profiles where id = auth.uid())));

create policy "Users can read auction_insights"
  on public.auction_insights for select to authenticated
  using (account_id in (select id from public.ad_accounts where company_id in (select company_id from public.profiles where id = auth.uid())));

create policy "Users can read budget_alerts"
  on public.budget_alerts for select to authenticated
  using (account_id in (select id from public.ad_accounts where company_id in (select company_id from public.profiles where id = auth.uid())));
