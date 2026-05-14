-- Add 'failed' to valid order statuses
-- First check if constraint exists
DO $$ 
BEGIN
  -- Try to drop the constraint if it exists
  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

-- Add the constraint with all valid statuses including 'failed'
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'));