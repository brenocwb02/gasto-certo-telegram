-- Migration: Add dissolve_family_group function
-- Description: Allows a group owner to delete the group while preserving data (converting to personal).

CREATE OR REPLACE FUNCTION public.dissolve_family_group(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_owner BOOLEAN;
  v_count_transactions INTEGER;
  v_count_budgets INTEGER;
  v_count_accounts INTEGER;
  v_count_categories INTEGER;
BEGIN
  -- 1. Verificar se o usuário é o DONO do grupo
  SELECT EXISTS (
    SELECT 1 FROM public.family_groups
    WHERE id = p_group_id AND owner_id = v_user_id
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Apenas o proprietário pode dissolver o grupo.';
  END IF;

  -- 2. Desvincular TRANSAÇÕES (tornar pessoais do dono)
  -- Nota: Isso move TODAS as transações do grupo para o dono.
  -- Se houver transações de outros membros, elas também virarão do dono (pois o grupo deixará de existir).
  -- Idealmente, cada um levaria as suas, mas o modelo atual vincula ao grupo.
  -- Assumindo que o dono herda a responsabilidade pelos dados do grupo.
  UPDATE public.transactions 
  SET group_id = NULL 
  WHERE group_id = p_group_id;
  GET DIAGNOSTICS v_count_transactions = ROW_COUNT;

  -- 3. Desvincular ORÇAMENTOS
  UPDATE public.budgets 
  SET group_id = NULL 
  WHERE group_id = p_group_id;
  GET DIAGNOSTICS v_count_budgets = ROW_COUNT;

  -- 4. Desvincular CONTAS
  UPDATE public.accounts 
  SET group_id = NULL 
  WHERE group_id = p_group_id;
  GET DIAGNOSTICS v_count_accounts = ROW_COUNT;

  -- 5. Desvincular CATEGORIAS
  UPDATE public.categories 
  SET group_id = NULL 
  WHERE group_id = p_group_id;
  GET DIAGNOSTICS v_count_categories = ROW_COUNT;

  -- 6. Remover MEMBROS (incluindo o dono)
  DELETE FROM public.family_members WHERE group_id = p_group_id;

  -- 7. Remover CONVITES
  DELETE FROM public.family_invites WHERE group_id = p_group_id;

  -- 8. Remover o GRUPO
  DELETE FROM public.family_groups WHERE id = p_group_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Grupo dissolvido com sucesso! Seus dados foram preservados.',
    'stats', json_build_object(
      'transactions', v_count_transactions,
      'budgets', v_count_budgets,
      'accounts', v_count_accounts,
      'categories', v_count_categories
    )
  );
END;
$$;
