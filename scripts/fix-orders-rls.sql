-- Fix RLS for orders table to allow authenticated managers/superadmins to read
-- Run this in Supabase SQL Editor

-- Enable RLS on orders if not already enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop any existing restrictive policies on orders (if they exist)
DROP POLICY IF EXISTS "orders_row_level_security_policy" ON public.orders;

-- Customers may only read their own orders. Admin APIs use service_role.
CREATE POLICY "authenticated_can_read_orders" ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Also allow service role (for API routes using supabaseAdmin)
CREATE POLICY "service_role_can_read_orders" ON public.orders
  FOR SELECT
  TO service_role
  USING (true);

-- Allow inserts for service role (checkout API)
CREATE POLICY "service_role_can_insert_orders" ON public.orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow updates for service role (webhooks, admin)
CREATE POLICY "service_role_can_update_orders" ON public.orders
  FOR UPDATE
  TO service_role
  USING (true);

-- Similarly for order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_row_level_security_policy" ON public.order_items;

CREATE POLICY "authenticated_can_read_order_items" ON public.order_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "service_role_can_read_order_items" ON public.order_items
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service_role_can_insert_order_items" ON public.order_items
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- And order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_can_read_status_history" ON public.order_status_history
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "service_role_can_read_status_history" ON public.order_status_history
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "service_role_can_insert_status_history" ON public.order_status_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);
