-- Run in Supabase SQL Editor to create email_logs table

CREATE TABLE IF NOT EXISTS public.email_logs (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  recipient TEXT,
  status TEXT NOT NULL,
  error TEXT,
  resend_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_order_id ON public.email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);

-- GRANTS — required since 2026-10-30: new tables in public get NO default
-- Data API privileges. email_logs is written/read only server-side (service role).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.email_logs_id_seq TO service_role;