-- Drop potentially ambiguous functions
DROP FUNCTION IF EXISTS public.get_budgets_with_spent(date);
DROP FUNCTION IF EXISTS public.get_budgets_with_spent(date, uuid);

-- Recreate the correct function with group support
CREATE OR REPLACE FUNCTION public.get_budgets_with_spent(
  p_month date,
  p_group_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  category_id uuid, 
  amount numeric, 
  month date, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  category_name text, 
  category_color text, 
  spent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
    return query
    select
        b.id,
        b.user_id,
        b.category_id,
        b.amount,
        b.month,
        b.created_at,
        b.updated_at,
        c.nome as category_name,
        c.cor as category_color,
        coalesce(sum(t.valor), 0) as spent
    from
        public.budgets b
    join
        public.categories c on b.category_id = c.id
    left join
        public.transactions t on t.categoria_id = b.category_id
        and t.tipo = 'despesa'
        and date_trunc('month', t.data_transacao) = date_trunc('month', b.month)
        -- Join transactions logic:
        and (
            (p_group_id IS NULL AND t.user_id = b.user_id AND t.group_id IS NULL) -- Personal transactions
            OR
            (p_group_id IS NOT NULL AND t.group_id = p_group_id) -- Group transactions
        )
    where
        date_trunc('month', b.month) = date_trunc('month', p_month)
        and (
            (p_group_id IS NULL AND b.user_id = auth.uid() AND b.group_id IS NULL) -- Personal budgets
            OR
            (p_group_id IS NOT NULL AND b.group_id = p_group_id) -- Group budgets
        )
    group by
        b.id, c.id;
end;
$function$;
