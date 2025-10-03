-- Fix infinite recursion in family_members RLS policies
-- The issue is that is_family_member() function tries to read from family_members table,
-- which triggers RLS policies that call is_family_member() again, causing infinite recursion.
-- Solution: Mark the function as SECURITY DEFINER so it bypasses RLS.

CREATE OR REPLACE FUNCTION public.is_family_member(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members AS fm1
    JOIN public.family_members AS fm2 ON fm1.group_id = fm2.group_id
    WHERE fm1.member_id = auth.uid()
    AND fm2.member_id = target_user_id
  );
$function$;