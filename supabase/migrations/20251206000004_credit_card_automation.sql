-- Migration: Sistema Híbrido de Pagamento Automático de Faturas de Cartão
-- Criado em: 2024-12-06
-- Objetivo: Permitir configuração individual por cartão (automático ou lembrete)

-- =============================================================================
-- TABELA DE CONFIGURAÇÕES DE CARTÃO
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.credit_card_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Configurações de Pagamento
  auto_payment BOOLEAN DEFAULT false,
  default_payment_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- Configurações de Notificação
  send_reminder BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 3 CHECK (reminder_days_before BETWEEN 1 AND 15),
  
  -- Configurações Avançadas (futuro)
  allow_partial_payment BOOLEAN DEFAULT false,
  min_balance_warning DECIMAL(10,2) DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir uma configuração por cartão
  UNIQUE(account_id)
);

-- Comentários
COMMENT ON TABLE public.credit_card_settings IS 'Configurações de automação de pagamento de faturas de cartão de crédito';
COMMENT ON COLUMN public.credit_card_settings.auto_payment IS 'Se true, o sistema paga a fatura automaticamente no vencimento';
COMMENT ON COLUMN public.credit_card_settings.default_payment_account_id IS 'Conta corrente/poupança de onde será debitado o pagamento';
COMMENT ON COLUMN public.credit_card_settings.send_reminder IS 'Se true, envia lembrete X dias antes do vencimento';
COMMENT ON COLUMN public.credit_card_settings.reminder_days_before IS 'Quantos dias antes do vencimento enviar lembrete';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_credit_card_settings_account 
ON public.credit_card_settings(account_id);

CREATE INDEX IF NOT EXISTS idx_credit_card_settings_user 
ON public.credit_card_settings(user_id);

-- Enable Row Level Security
ALTER TABLE public.credit_card_settings ENABLE ROW LEVEL SECURITY;

-- Política: Usuário só gerencia suas configurações
CREATE POLICY "Users can manage their credit card settings"
ON credit_card_settings
FOR ALL
USING (auth.uid() = user_id);

-- =============================================================================
-- FUNÇÕES AUXILIARES
-- =============================================================================

-- Função para obter faturas pendentes de um usuário
CREATE OR REPLACE FUNCTION get_pending_invoices(p_user_id UUID)
RETURNS TABLE (
  account_id UUID,
  account_name TEXT,
  invoice_amount DECIMAL,
  due_date INTEGER,
  days_until_due INTEGER,
  has_auto_payment BOOLEAN,
  payment_account_name TEXT,
  has_sufficient_balance BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS account_id,
    a.nome AS account_name,
    ABS(a.saldo_atual) AS invoice_amount,
    a.dia_vencimento AS due_date,
    (a.dia_vencimento - EXTRACT(DAY FROM CURRENT_DATE)::INTEGER) AS days_until_due,
    COALESCE(ccs.auto_payment, false) AS has_auto_payment,
    pa.nome AS payment_account_name,
    CASE 
      WHEN ccs.default_payment_account_id IS NOT NULL 
      THEN pa.saldo_atual >= ABS(a.saldo_atual)
      ELSE false
    END AS has_sufficient_balance
  FROM accounts a
  LEFT JOIN credit_card_settings ccs ON ccs.account_id = a.id
  LEFT JOIN accounts pa ON pa.id = ccs.default_payment_account_id
  WHERE 
    a.user_id = p_user_id
    AND a.tipo = 'cartao'
    AND a.saldo_atual < 0 -- Tem fatura a pagar
    AND a.dia_vencimento IS NOT NULL
  ORDER BY days_until_due ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_pending_invoices IS 'Retorna todas as faturas de cartão pendentes de pagamento de um usuário';

-- Função para processar pagamento de fatura
CREATE OR REPLACE FUNCTION process_invoice_payment(
  p_card_account_id UUID,
  p_payment_account_id UUID,
  p_amount DECIMAL DEFAULT NULL -- NULL = pagar fatura total
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_card_balance DECIMAL;
  v_payment_balance DECIMAL;
  v_invoice_amount DECIMAL;
  v_amount_to_pay DECIMAL;
  v_transfer_id UUID;
  v_card_name TEXT;
  v_payment_name TEXT;
BEGIN
  -- Validar que as contas existem e pertencem ao mesmo usuário
  SELECT a1.user_id, a1.saldo_atual, a1.nome,
         a2.saldo_atual, a2.nome
  INTO v_user_id, v_card_balance, v_card_name,
       v_payment_balance, v_payment_name
  FROM accounts a1
  JOIN accounts a2 ON a2.id = p_payment_account_id AND a2.user_id = a1.user_id
  WHERE a1.id = p_card_account_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Contas inválidas ou não pertencem ao mesmo usuário';
  END IF;
  
  -- Verificar se é do usuário autenticado
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  -- Calcular valor da fatura
  v_invoice_amount := ABS(v_card_balance);
  
  -- Determinar valor a pagar
  IF p_amount IS NULL THEN
    v_amount_to_pay := v_invoice_amount; -- Pagar fatura completa
  ELSE
    v_amount_to_pay := LEAST(p_amount, v_invoice_amount); -- Pagar parcial
  END IF;
  
  -- Verificar saldo suficiente
  IF v_payment_balance < v_amount_to_pay THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Saldo insuficiente',
      'required', v_amount_to_pay,
      'available', v_payment_balance,
      'missing', v_amount_to_pay - v_payment_balance
    );
  END IF;
  
  -- Criar transação de DÉBITO na conta de pagamento
  INSERT INTO transactions (
    tipo,
    valor,
    descricao,
    account_id,
    user_id,
    data,
    origem
  ) VALUES (
    'despesa',
    v_amount_to_pay,
    'Pagamento fatura ' || v_card_name,
    p_payment_account_id,
    v_user_id,
    CURRENT_DATE,
    'auto_payment'
  ) RETURNING id INTO v_transfer_id;
  
  -- Criar transação de CRÉDITO no cartão
  INSERT INTO transactions (
    tipo,
    valor,
    descricao,
    account_id,
    user_id,
    data,
    origem
  ) VALUES (
    'receita',
    v_amount_to_pay,
    'Recebimento pagamento fatura',
    p_card_account_id,
    v_user_id,
    CURRENT_DATE,
    'auto_payment'
  );
  
  -- Atualizar saldo da conta de pagamento
  UPDATE accounts
  SET saldo_atual = saldo_atual - v_amount_to_pay,
      updated_at = NOW()
  WHERE id = p_payment_account_id;
  
  -- Atualizar saldo do cartão (aumenta, pois está negativo)
  UPDATE accounts
  SET saldo_atual = saldo_atual + v_amount_to_pay,
      updated_at = NOW()
  WHERE id = p_card_account_id;
  
  -- Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'amount_paid', v_amount_to_pay,
    'remaining_invoice', v_invoice_amount - v_amount_to_pay,
    'new_payment_balance', v_payment_balance - v_amount_to_pay,
    'new_card_balance', v_card_balance + v_amount_to_pay,
    'card_name', v_card_name,
    'payment_account_name', v_payment_name
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Erro ao processar pagamento: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_invoice_payment IS 'Processa pagamento de fatura de cartão com validações e atualização de saldos';

-- Função para criar configuração padrão ao criar cartão
CREATE OR REPLACE FUNCTION create_default_credit_card_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas para contas tipo 'cartao'
  IF NEW.tipo = 'cartao' THEN
    -- Buscar a primeira conta corrente ou poupança do usuário como padrão
    INSERT INTO credit_card_settings (
      account_id,
      user_id,
      auto_payment,
      default_payment_account_id,
      send_reminder,
      reminder_days_before
    )
    SELECT 
      NEW.id,
      NEW.user_id,
      false, -- Padrão: manual
      (SELECT id FROM accounts 
       WHERE user_id = NEW.user_id 
       AND tipo IN ('corrente', 'poupanca') 
       AND ativo = true
       ORDER BY is_primary DESC NULLS LAST, created_at ASC
       LIMIT 1),
      true, -- Enviar lembrete
      3     -- 3 dias antes
    ON CONFLICT (account_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar configuração automática
DROP TRIGGER IF EXISTS auto_create_credit_card_settings ON accounts;
CREATE TRIGGER auto_create_credit_card_settings
  AFTER INSERT ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION create_default_credit_card_settings();

COMMENT ON TRIGGER auto_create_credit_card_settings ON accounts IS 'Cria configuração padrão automaticamente ao criar um cartão de crédito';

-- =============================================================================
-- CRIAR CONFIGURAÇÕES PARA CARTÕES EXISTENTES
-- =============================================================================

-- Para cartões que já existem no sistema
INSERT INTO credit_card_settings (account_id, user_id, auto_payment, send_reminder, reminder_days_before, default_payment_account_id)
SELECT 
  a.id,
  a.user_id,
  false,
  true,
  3,
  (SELECT id FROM accounts 
   WHERE user_id = a.user_id 
   AND tipo IN ('corrente', 'poupanca') 
   AND ativo = true
   ORDER BY is_primary DESC NULLS LAST, created_at ASC
   LIMIT 1)
FROM accounts a
WHERE a.tipo = 'cartao'
  AND NOT EXISTS (
    SELECT 1 FROM credit_card_settings ccs
    WHERE ccs.account_id = a.id
  );

-- Grant permissões
GRANT EXECUTE ON FUNCTION get_pending_invoices TO authenticated;
GRANT EXECUTE ON FUNCTION process_invoice_payment TO authenticated;
