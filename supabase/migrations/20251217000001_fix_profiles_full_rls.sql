-- Enable RLS on profiles (just in case)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing overlapping policies if any (though likely none existed for this)
DROP POLICY IF EXISTS "Family members can view other members profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create comprehensive policy
CREATE POLICY "Family members can view other members profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id -- Users can always see their own profile
  OR EXISTS ( -- Or if they share a family group
    SELECT 1 FROM public.family_members fm1
    JOIN public.family_members fm2 ON fm1.group_id = fm2.group_id
    WHERE fm1.member_id = auth.uid()       -- Current user
    AND fm2.member_id = profiles.user_id   -- Target profile
    AND fm1.status = 'active'
    AND fm2.status = 'active'
  )
);
