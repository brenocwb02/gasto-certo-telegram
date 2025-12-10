-- Fix accounts RLS policies for family sharing
-- Drop old conflicting policy
DROP POLICY IF EXISTS "Users can manage their own accounts" ON public.accounts;

-- The family sharing policies should now be the only ones active:
-- - "Family members can view shared accounts" (SELECT)
-- - "Family members can manage shared accounts" (ALL)
