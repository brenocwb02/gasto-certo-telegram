-- =====================================================
-- Função para migrar dados pessoais para grupo familiar
-- =====================================================

-- Função para contar dados pessoais do usuário
CREATE OR REPLACE FUNCTION public.count_personal_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  transaction_count INTEGER;
  budget_count INTEGER;
  account_count INTEGER;
  category_count INTEGER;
BEGIN
  -- Contar transações pessoais
  SELECT COUNT(*) INTO transaction_count
  FROM public.transactions
  WHERE user_id = auth.uid() AND group_id IS NULL;

  -- Contar orçamentos pessoais
  SELECT COUNT(*) INTO budget_count
  FROM public.budgets
  WHERE user_id = auth.uid() AND group_id IS NULL;

  -- Contar contas pessoais
  SELECT COUNT(*) INTO account_count
  FROM public.accounts
  WHERE user_id = auth.uid() AND group_id IS NULL;

  -- Contar categorias pessoais
  SELECT COUNT(*) INTO category_count
  FROM public.categories
  WHERE user_id = auth.uid() AND group_id IS NULL;

  RETURN json_build_object(
    'transactions', transaction_count,
    'budgets', budget_count,
    'accounts', account_count,
    'categories', category_count,
    'total', transaction_count + budget_count + account_count + category_count
  );
END;
$$;

-- Função para migrar dados pessoais para um grupo
CREATE OR REPLACE FUNCTION public.migrate_personal_data_to_group(
  p_group_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  transactions_migrated INTEGER;
  budgets_migrated INTEGER;
  accounts_migrated INTEGER;
  categories_migrated INTEGER;
BEGIN
  -- Verificar se o usuário é membro do grupo
  IF NOT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE group_id = p_group_id
    AND member_id = auth.uid()
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Você não é membro deste grupo.';
  END IF;

  -- Migrar transações
  UPDATE public.transactions
  SET group_id = p_group_id
  WHERE user_id = auth.uid() AND group_id IS NULL;
  GET DIAGNOSTICS transactions_migrated = ROW_COUNT;

  -- Migrar orçamentos
  UPDATE public.budgets
  SET group_id = p_group_id
  WHERE user_id = auth.uid() AND group_id IS NULL;
  GET DIAGNOSTICS budgets_migrated = ROW_COUNT;

  -- Migrar contas
  UPDATE public.accounts
  SET group_id = p_group_id
  WHERE user_id = auth.uid() AND group_id IS NULL;
  GET DIAGNOSTICS accounts_migrated = ROW_COUNT;

  -- Migrar categorias
  UPDATE public.categories
  SET group_id = p_group_id
  WHERE user_id = auth.uid() AND group_id IS NULL;
  GET DIAGNOSTICS categories_migrated = ROW_COUNT;

  RETURN json_build_object(
    'success', true,
    'transactions_migrated', transactions_migrated,
    'budgets_migrated', budgets_migrated,
    'accounts_migrated', accounts_migrated,
    'categories_migrated', categories_migrated,
    'total_migrated', transactions_migrated + budgets_migrated + accounts_migrated + categories_migrated
  );
END;
$$;
