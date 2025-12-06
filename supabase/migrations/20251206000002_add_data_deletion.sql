-- Migration: Direito ao Esquecimento (Right to be Forgotten)
-- LGPD Art. 18, VI - Direito à eliminação dos dados pessoais
-- Criado em: 2024-12-06

-- Tabela para rastrear solicitações de exclusão de dados
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  deletion_details JSONB, -- Registra o que foi deletado
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user 
ON public.data_deletion_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status 
ON public.data_deletion_requests(status, requested_at DESC);

-- Enable RLS
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Política: Usuário pode ver apenas suas próprias solicitações
CREATE POLICY "Users can view their own deletion requests"
ON data_deletion_requests FOR SELECT
USING (auth.uid() = user_id);

-- Política: Usuário pode criar solicitação de exclusão
CREATE POLICY "Users can request data deletion"
ON data_deletion_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Apenas admins podem atualizar status
CREATE POLICY "Only admins can update deletion requests"
ON data_deletion_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Função para solicitar exclusão de dados
CREATE OR REPLACE FUNCTION request_data_deletion()
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se já existe solicitação pendente
  IF EXISTS (
    SELECT 1 FROM data_deletion_requests
    WHERE user_id = v_user_id 
    AND status IN ('pending', 'processing')
  ) THEN
    RAISE EXCEPTION 'Já existe uma solicitação de exclusão em andamento';
  END IF;

  -- Criar solicitação
  INSERT INTO data_deletion_requests (user_id)
  VALUES (v_user_id)
  RETURNING id INTO v_request_id;

  -- Registrar auditoria
  PERFORM log_admin_access(
    'data_deletion_requested',
    'data_deletion_requests',
    v_request_id,
    v_user_id,
    jsonb_build_object('request_id', v_request_id)
  );

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para processar exclusão de dados (apenas admin)
CREATE OR REPLACE FUNCTION process_data_deletion(
  p_request_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_deletion_summary JSONB;
  v_transactions_count INTEGER;
  v_accounts_count INTEGER;
  v_categories_count INTEGER;
  v_budgets_count INTEGER;
  v_goals_count INTEGER;
  v_investments_count INTEGER;
  v_recurring_count INTEGER;
BEGIN
  -- Verificar permissão de admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem processar exclusões';
  END IF;

  -- Obter user_id da solicitação
  SELECT user_id INTO v_user_id
  FROM data_deletion_requests
  WHERE id = p_request_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada ou já processada';
  END IF;

  -- Atualizar status para processando
  UPDATE data_deletion_requests
  SET status = 'processing', processed_by = auth.uid()
  WHERE id = p_request_id;

  -- Contar dados antes de deletar
  SELECT COUNT(*) INTO v_transactions_count FROM transactions WHERE user_id = v_user_id;
  SELECT COUNT(*) INTO v_accounts_count FROM accounts WHERE user_id = v_user_id;
  SELECT COUNT(*) INTO v_categories_count FROM categories WHERE user_id = v_user_id;
  SELECT COUNT(*) INTO v_budgets_count FROM budgets WHERE user_id = v_user_id;
  SELECT COUNT(*) INTO v_goals_count FROM goals WHERE user_id = v_user_id;
  SELECT COUNT(*) INTO v_investments_count FROM investments WHERE user_id = v_user_id;
  SELECT COUNT(*) INTO v_recurring_count FROM recurring_transactions WHERE user_id = v_user_id;

  -- DELETAR DADOS EM CASCATA
  -- Nota: A ordem importa devido às foreign keys

  -- 1. Deletar transações e dados relacionados
  DELETE FROM recurring_generation_log 
  WHERE recurring_id IN (
    SELECT id FROM recurring_transactions WHERE user_id = v_user_id
  );
  
  DELETE FROM recurring_transactions WHERE user_id = v_user_id;
  DELETE FROM transactions WHERE user_id = v_user_id;
  DELETE FROM investment_transactions WHERE user_id = v_user_id;
  DELETE FROM investments WHERE user_id = v_user_id;

  -- 2. Deletar configurações financeiras
  DELETE FROM budgets WHERE user_id = v_user_id;
  DELETE FROM goals WHERE user_id = v_user_id;
  DELETE FROM accounts WHERE user_id = v_user_id;
  DELETE FROM categories WHERE user_id = v_user_id;

  -- 3. Deletar perfis e configurações
  DELETE FROM financial_profile WHERE user_id = v_user_id;
  DELETE FROM telegram_integration WHERE user_id = v_user_id;
  DELETE FROM telegram_sessions WHERE user_id = v_user_id;
  DELETE FROM notification_preferences WHERE user_id = v_user_id;
  DELETE FROM licenses WHERE user_id = v_user_id;
  DELETE FROM ai_usage_logs WHERE user_id = v_user_id;

  -- 4. Remover de grupos familiares
  DELETE FROM family_members WHERE member_id = v_user_id;
  
  -- Se for dono de grupo, transferir ou deletar grupo (decisão de negócio)
  -- Por ora, apenas deleta se não houver outros membros
  DELETE FROM family_groups 
  WHERE owner_id = v_user_id 
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm 
    WHERE fm.group_id = family_groups.id 
    AND fm.member_id != v_user_id
  );

  -- 5. ANON IMIZAR profile (não deletar completamente para auditoria)
  UPDATE profiles SET
    nome = 'Usuário Deletado',
    telefone = NULL,
    telegram_chat_id = NULL,
    telegram_id = NULL,
    avatar_url = NULL,
    lgpd_consent_date = NULL,
    lgpd_consent_version = NULL,
    privacy_settings = NULL,
    current_group_id = NULL
  WHERE user_id = v_user_id;

  -- Criar resumo da deleção
  v_deletion_summary := jsonb_build_object(
    'user_id', v_user_id,
    'deleted_at', NOW(),
    'counts', jsonb_build_object(
      'transactions', v_transactions_count,
      'accounts', v_accounts_count,
      'categories', v_categories_count,
      'budgets', v_budgets_count,
      'goals', v_goals_count,
      'investments', v_investments_count,
      'recurring', v_recurring_count
    )
  );

  -- Atualizar solicitação como concluída
  UPDATE data_deletion_requests
  SET 
    status = 'completed',
    processed_at = NOW(),
    deletion_details = v_deletion_summary
  WHERE id = p_request_id;

  -- Registrar auditoria
  PERFORM log_admin_access(
    'data_deletion_completed',
    'all_user_data',
    p_request_id,
    v_user_id,
    v_deletion_summary
  );

  -- DELETAR CONTA DE AUTH (deve ser feito via Supabase Admin API no backend)
  -- auth.users não pode ser deletado via SQL diretamente

  RETURN v_deletion_summary;

EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, marcar como falha
  UPDATE data_deletion_requests
  SET 
    status = 'failed',
    notes = SQLERRM
  WHERE id = p_request_id;
  
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE public.data_deletion_requests IS 'Solicitações de exclusão de dados conforme LGPD Art. 18, VI';
COMMENT ON FUNCTION request_data_deletion IS 'Permite usuário solicitar exclusão de todos seus dados';
COMMENT ON FUNCTION process_data_deletion IS 'Processa exclusão de dados (apenas admin)';

-- Grants
GRANT EXECUTE ON FUNCTION request_data_deletion TO authenticated;
GRANT EXECUTE ON FUNCTION process_data_deletion TO authenticated; -- RLS controla acesso via role check
