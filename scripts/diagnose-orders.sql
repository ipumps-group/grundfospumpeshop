-- Orders Diagnostic Script
-- Run this in Supabase SQL Editor

-- 1. Check RLS status on orders table
SELECT 
  'orders' as table_name,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'orders';

-- 2. Check RLS policies on orders table
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'orders';

-- 3. Check orders exist
SELECT 
  id, 
  order_number, 
  status, 
  total, 
  email, 
  customer_name, 
  created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 20;

-- 4. Check order_items
SELECT o.id, o.order_number, o.status, count(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.order_number, o.status
ORDER BY o.created_at DESC
LIMIT 20;