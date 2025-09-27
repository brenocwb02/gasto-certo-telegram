-- Fix the get_budgets_with_spent function with correct column names
CREATE OR REPLACE FUNCTION public.get_budgets_with_spent(p_month date)
 RETURNS TABLE(id uuid, user_id uuid, category_id uuid, amount numeric, month date, created_at timestamp with time zone, updated_at timestamp with time zone, category_name text, category_color text, spent numeric)
 LANGUAGE plpgsql
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
        and t.user_id = b.user_id
        and t.tipo = 'despesa'
        and date_trunc('month', t.data_transacao) = date_trunc('month', b.month)
    where
        b.user_id = auth.uid()
        and date_trunc('month', b.month) = date_trunc('month', p_month)
    group by
        b.id, c.id;
end;
$function$