-- ==========================================
-- MIGRATION: ADICIONAR VISIBILIDADE FAMILIAR
-- Data: 13/12/2024
-- ==========================================

-- 1. ADICIONAR COLUNA VISIBILITY NA TABELA ACCOUNTS
-- Permite diferenciar contas pessoais e familiares
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'family';

-- Remove constraint antiga se existir (para evitar erro ao rodar novamente)
ALTER TABLE public.accounts
DROP CONSTRAINT IF EXISTS accounts_visibility_check;

-- Adiciona verificação de valores válidos
ALTER TABLE public.accounts
ADD CONSTRAINT accounts_visibility_check 
CHECK (visibility IN ('personal', 'family'));

-- Atualiza contas existentes para serem 'family' (comportamento atual)
UPDATE public.accounts 
SET visibility = 'family' 
WHERE visibility IS NULL;

COMMENT ON COLUMN public.accounts.visibility IS 'personal or family';


-- 2. CRIAR RPC PARA LIMITAR CONTAS PESSOAIS
-- Impede abuso do plano familiar por grupos de amigos
CREATE OR REPLACE FUNCTION check_personal_account_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_count INT;
  v_group_id UUID;
BEGIN
  -- Verificar se usuário está em grupo ativo e pegar role
  SELECT group_id, role INTO v_group_id, v_role
  FROM family_members
  WHERE member_id = p_user_id AND status = 'active'
  LIMIT 1;
  
  -- Se não está em grupo, limite não se aplica aqui
  IF v_group_id IS NULL THEN RETURN TRUE; END IF;
  
  -- Owner não tem limite
  IF v_role = 'owner' THEN RETURN TRUE; END IF;
  
  -- Contar contas pessoais ativas
  SELECT COUNT(*) INTO v_count
  FROM accounts
  WHERE user_id = p_user_id AND visibility = 'personal' AND ativo = true;
  
  -- Limite de 2 para membros
  IF v_count >= 2 THEN RETURN FALSE; END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
