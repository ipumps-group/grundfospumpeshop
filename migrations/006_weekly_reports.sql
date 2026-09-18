-- ============================================================================
-- Weekly marketing reports — Run this in Supabase SQL Editor
-- One report per week (re-generating the same week upserts/replaces it).
-- The snapshot JSONB keeps the full structured data pull so week-over-week
-- trends survive beyond GSC's 16-month window.
-- ============================================================================

create table if not exists public.weekly_reports (
  id            bigint generated always as identity primary key,
  week_start    date not null,
  week_end      date not null,
  created_at    timestamptz not null default now(),
  snapshot      jsonb not null,
  insights      jsonb not null default '[]'::jsonb,
  narrative     text not null default '',
  changes       jsonb not null default '[]'::jsonb,
  email_sent_at timestamptz,
  email_error   text not null default ''
);

create unique index if not exists weekly_reports_week_idx
  on public.weekly_reports (week_start, week_end);

-- Report e-mail recipients are stored in the existing settings table:
--   key = 'report_email_recipients' (comma-separated), fallback info@pumbapood.ee
