-- Adicionar coluna group_id à tabela budgets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'group_id') THEN
        ALTER TABLE public.budgets ADD COLUMN group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE;
        CREATE INDEX idx_budgets_group_id ON public.budgets(group_id);
    END IF;
END $$;

-- Atualizar constraint de unicidade para incluir group_id (ou tratar NULL como único para user_id)
-- A constraint original é: UNIQUE (user_id, category_id, month)
-- Precisamos permitir que o mesmo usuário tenha orçamento para mesma categoria em grupos diferentes
-- E manter a unicidade para orçamentos pessoais (group_id IS NULL)

ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS unique_user_category_month;

-- Criar índice único parcial para orçamentos pessoais
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_personal_unique 
ON public.budgets (user_id, category_id, month) 
WHERE group_id IS NULL;

-- Criar índice único para orçamentos de grupo
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_group_unique 
ON public.budgets (group_id, category_id, month) 
WHERE group_id IS NOT NULL;

-- Atualizar RLS Policies

-- Remover policies antigas para recriar
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can create their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

-- Nova Policy de SELECT (Ver)
CREATE POLICY "Users can view own or group budgets"
ON public.budgets FOR SELECT
USING (
  (auth.uid() = user_id AND group_id IS NULL) OR -- Pessoal
  (group_id IS NOT NULL AND EXISTS ( -- Grupo
    SELECT 1 FROM public.family_members
    WHERE group_id = budgets.group_id
    AND member_id = auth.uid()
  ))
);

-- Nova Policy de INSERT (Criar)
CREATE POLICY "Users can create own or group budgets"
ON public.budgets FOR INSERT
WITH CHECK (
  (auth.uid() = user_id AND group_id IS NULL) OR -- Pessoal
  (group_id IS NOT NULL AND EXISTS ( -- Grupo
    SELECT 1 FROM public.family_members
    WHERE group_id = budgets.group_id
    AND member_id = auth.uid()
    AND role IN ('owner', 'admin', 'member') -- Viewers não criam
  ))
);

-- Nova Policy de UPDATE (Atualizar)
CREATE POLICY "Users can update own or group budgets"
ON public.budgets FOR UPDATE
USING (
  (auth.uid() = user_id AND group_id IS NULL) OR -- Pessoal
  (group_id IS NOT NULL AND EXISTS ( -- Grupo
    SELECT 1 FROM public.family_members
    WHERE group_id = budgets.group_id
    AND member_id = auth.uid()
    AND role IN ('owner', 'admin', 'member')
  ))
);

-- Nova Policy de DELETE (Deletar)
CREATE POLICY "Users can delete own or group budgets"
ON public.budgets FOR DELETE
USING (
  (auth.uid() = user_id AND group_id IS NULL) OR -- Pessoal
  (group_id IS NOT NULL AND EXISTS ( -- Grupo
    SELECT 1 FROM public.family_members
    WHERE group_id = budgets.group_id
    AND member_id = auth.uid()
    AND role IN ('owner', 'admin', 'member')
  ))
);

-- Atualizar função RPC get_budgets_with_spent
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
