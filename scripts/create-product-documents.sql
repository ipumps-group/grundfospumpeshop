-- ============================================================
-- product_documents table + storage bucket setup
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Create the table
create table if not exists product_documents (
  id          bigserial primary key,
  sku         text not null,
  product_id  bigint references products(id) on delete cascade,
  label       text not null,
  storage_path text not null unique,
  public_url  text not null,
  created_at  timestamptz default now()
);

create index if not exists idx_product_documents_sku        on product_documents(sku);
create index if not exists idx_product_documents_product_id on product_documents(product_id);

-- 2. Row Level Security — anyone can read, only service role can write
alter table product_documents enable row level security;

create policy "Public read"
  on product_documents for select
  using (true);

-- 3. Create the storage bucket (public)
insert into storage.buckets (id, name, public)
values ('product-documents', 'product-documents', true)
on conflict (id) do update set public = true;

-- Allow public read from the bucket
create policy "Public read storage"
  on storage.objects for select
  using (bucket_id = 'product-documents');

-- Allow authenticated admins to upload and delete
create policy "Authenticated upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-documents');

create policy "Authenticated delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-documents');
