-- Check RLS on settings table and grant read access

-- Enable RLS if not already
ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows read access to everyone
DROP POLICY IF EXISTS "Allow read access to settings" ON public.settings;
CREATE POLICY "Allow read access to settings" ON public.settings FOR SELECT USING (true);

-- Also ensure anon key can read
GRANT SELECT ON public.settings TO anon;
GRANT SELECT ON public.settings TO authenticated;
GRANT SELECT ON public.settings TO service_role;