alter table public.orders
  add column if not exists advertising_consent boolean not null default false,
  add column if not exists meta_fbp text,
  add column if not exists meta_fbc text,
  add column if not exists meta_event_source_url text,
  add column if not exists meta_purchase_event_id text,
  add column if not exists meta_purchase_sent_at timestamptz;

create unique index if not exists orders_meta_purchase_event_id_key
  on public.orders (meta_purchase_event_id)
  where meta_purchase_event_id is not null;
