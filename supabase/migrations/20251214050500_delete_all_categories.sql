-- Function to delete all categories for the authenticated user
-- Transactions and Goals will have their category_id set to NULL due to ON DELETE SET NULL constraint

CREATE OR REPLACE FUNCTION public.delete_all_categories()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.categories 
  WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_all_categories() TO authenticated;

COMMENT ON FUNCTION public.delete_all_categories IS 'Deletes all categories for the calling user. Safely handles transactions/goals by setting category to NULL.';
