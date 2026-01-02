-- Criar tabela de orçamentos padrão por categoria
CREATE TABLE public.default_budgets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Cada categoria só pode ter um orçamento padrão por usuário/grupo
    CONSTRAINT unique_default_budget_user_category UNIQUE (user_id, category_id, group_id)
);

-- Habilitar RLS
ALTER TABLE public.default_budgets ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own or group default budgets" 
ON public.default_budgets FOR SELECT 
USING (
    ((auth.uid() = user_id) AND (group_id IS NULL)) 
    OR 
    ((group_id IS NOT NULL) AND (EXISTS (
        SELECT 1 FROM family_members 
        WHERE family_members.group_id = default_budgets.group_id 
        AND family_members.member_id = auth.uid()
    )))
);

CREATE POLICY "Users can create own or group default budgets" 
ON public.default_budgets FOR INSERT 
WITH CHECK (
    ((auth.uid() = user_id) AND (group_id IS NULL)) 
    OR 
    ((group_id IS NOT NULL) AND (EXISTS (
        SELECT 1 FROM family_members 
        WHERE family_members.group_id = default_budgets.group_id 
        AND family_members.member_id = auth.uid() 
        AND family_members.role = ANY (ARRAY['owner', 'admin', 'member'])
    )))
);

CREATE POLICY "Users can update own or group default budgets" 
ON public.default_budgets FOR UPDATE 
USING (
    ((auth.uid() = user_id) AND (group_id IS NULL)) 
    OR 
    ((group_id IS NOT NULL) AND (EXISTS (
        SELECT 1 FROM family_members 
        WHERE family_members.group_id = default_budgets.group_id 
        AND family_members.member_id = auth.uid() 
        AND family_members.role = ANY (ARRAY['owner', 'admin', 'member'])
    )))
);

CREATE POLICY "Users can delete own or group default budgets" 
ON public.default_budgets FOR DELETE 
USING (
    ((auth.uid() = user_id) AND (group_id IS NULL)) 
    OR 
    ((group_id IS NOT NULL) AND (EXISTS (
        SELECT 1 FROM family_members 
        WHERE family_members.group_id = default_budgets.group_id 
        AND family_members.member_id = auth.uid() 
        AND family_members.role = ANY (ARRAY['owner', 'admin', 'member'])
    )))
);

-- Trigger para updated_at
CREATE TRIGGER update_default_budgets_updated_at
    BEFORE UPDATE ON public.default_budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Nova RPC que combina orçamentos padrão com overrides mensais
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
             WHERE t.categoria_id = COALESCE(b.category_id, d.category_id)
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