CREATE OR REPLACE FUNCTION public.get_budgets_with_defaults(
    p_month DATE,
    p_group_id UUID DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    category_id UUID,
    amount NUMERIC,
    month DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    category_name TEXT,
    category_color TEXT,
    spent NUMERIC,
    is_default BOOLEAN,
    default_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(b.id, d.id) AS id,
        COALESCE(b.user_id, d.user_id) AS user_id,
        COALESCE(b.category_id, d.category_id) AS category_id,
        COALESCE(b.amount, d.amount) AS amount,
        p_month AS month,
        COALESCE(b.created_at, d.created_at) AS created_at,
        COALESCE(b.updated_at, d.updated_at) AS updated_at,
        c.nome AS category_name,
        c.cor AS category_color,
        COALESCE(
            (SELECT SUM(t.valor)
             FROM transactions t
             WHERE 
               -- Check if transaction category is the budget category OR a subcategory of it
               t.categoria_id IN (
                   SELECT cat.id 
                   FROM categories cat 
                   WHERE cat.id = COALESCE(b.category_id, d.category_id) 
                      OR cat.parent_id = COALESCE(b.category_id, d.category_id)
               )
               AND t.tipo = 'despesa'
               AND date_trunc('month', t.data_transacao) = date_trunc('month', p_month)
               AND (
                   (p_group_id IS NULL AND t.user_id = COALESCE(b.user_id, d.user_id) AND t.group_id IS NULL)
                   OR
                   (p_group_id IS NOT NULL AND t.group_id = p_group_id)
               )
            ), 0
        ) AS spent,
        (b.id IS NULL) AS is_default,
        d.amount AS default_amount
    FROM
        default_budgets d
    LEFT JOIN
        budgets b ON b.category_id = d.category_id
            AND date_trunc('month', b.month) = date_trunc('month', p_month)
            AND (
                (p_group_id IS NULL AND b.user_id = d.user_id AND b.group_id IS NULL)
                OR
                (p_group_id IS NOT NULL AND b.group_id = p_group_id)
            )
    JOIN
        categories c ON c.id = d.category_id
    WHERE
        (
            (p_group_id IS NULL AND d.user_id = auth.uid() AND d.group_id IS NULL)
            OR
            (p_group_id IS NOT NULL AND d.group_id = p_group_id)
        );
END;
$function$;
