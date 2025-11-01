-- ================================================================
-- MIGRAÇÃO DE SEGURANÇA CRÍTICA
-- Correção de vulnerabilidades SQL e implementação de sistema de roles
-- ================================================================

-- =============================================================
-- PARTE 1: CRIAR SISTEMA DE ROLES (Prioridade Máxima)
-- =============================================================

-- 1.1 Criar ENUM para roles de aplicação
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 1.2 Criar tabela de roles de usuários
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- 1.3 Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 1.4 Criar função SECURITY DEFINER para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 1.5 Criar políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 1.6 Criar role padrão para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- =============================================================
-- PARTE 2: CORRIGIR TODAS AS FUNÇÕES SEM SEARCH_PATH
-- =============================================================

-- 2.1 calcular_vencimento_cartao
CREATE OR REPLACE FUNCTION public.calcular_vencimento_cartao(
  data_transacao DATE,
  dia_fechamento INTEGER,
  dia_vencimento INTEGER
)
RETURNS DATE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  data_fechamento DATE;
  data_vencimento DATE;
BEGIN
  data_fechamento := DATE_TRUNC('month', data_transacao) + INTERVAL '1 month' - INTERVAL '1 day';
  data_fechamento := data_fechamento - INTERVAL '1 day' * (EXTRACT(DAY FROM data_fechamento) - dia_fechamento);
  
  IF data_transacao > data_fechamento THEN
    data_fechamento := data_fechamento + INTERVAL '1 month';
  END IF;
  
  data_vencimento := data_fechamento + INTERVAL '1 day' * dia_vencimento;
  
  RETURN data_vencimento;
END;
$function$;

-- 2.2 get_budgets_with_spent
CREATE OR REPLACE FUNCTION public.get_budgets_with_spent(p_month DATE)
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
  spent NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.user_id,
    b.category_id,
    b.amount,
    b.month,
    b.created_at,
    b.updated_at,
    c.nome as category_name,
    c.cor as category_color,
    COALESCE(SUM(t.valor), 0) as spent
  FROM public.budgets b
  JOIN public.categories c ON b.category_id = c.id
  LEFT JOIN public.transactions t 
    ON t.categoria_id = b.category_id
    AND t.user_id = b.user_id
    AND t.tipo = 'despesa'
    AND DATE_TRUNC('month', t.data_transacao) = DATE_TRUNC('month', b.month)
  WHERE b.user_id = auth.uid()
    AND DATE_TRUNC('month', b.month) = DATE_TRUNC('month', p_month)
  GROUP BY b.id, c.id;
END;
$function$;

-- 2.3 auto_learn_category
CREATE OR REPLACE FUNCTION public.auto_learn_category(
  p_category_id UUID,
  p_new_keyword TEXT,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  p_new_keyword := TRIM(LOWER(p_new_keyword));

  IF p_new_keyword = '' THEN
    RETURN;
  END IF;

  UPDATE public.categories
  SET keywords = ARRAY(
    SELECT DISTINCT UNNEST(
      ARRAY_APPEND(COALESCE(keywords, ARRAY[]::TEXT[]), p_new_keyword)
    )
  )
  WHERE id = p_category_id
    AND user_id = p_user_id
    AND NOT (COALESCE(keywords, ARRAY[]::TEXT[]) @> ARRAY[p_new_keyword]);
END;
$function$;

-- 2.4 generate_activation_code
CREATE OR REPLACE FUNCTION public.generate_activation_code(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN 'GC-' || UPPER(SUBSTR(user_uuid::TEXT, 1, 8));
END;
$function$;

-- 2.5 get_user_license_plan
CREATE OR REPLACE FUNCTION public.get_user_license_plan(target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN (
    SELECT plano 
    FROM public.licenses 
    WHERE user_id = target_user_id 
      AND status = 'ativo' 
    ORDER BY created_at DESC 
    LIMIT 1
  );
END;
$function$;

-- 2.6 create_installments
CREATE OR REPLACE FUNCTION public.create_installments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  i INTEGER;
  next_date DATE;
BEGIN
  IF NEW.tipo <> 'despesa' OR COALESCE(NEW.installment_total, 1) <= 1 THEN
    RETURN NEW;
  END IF;

  FOR i IN 2..NEW.installment_total LOOP
    next_date := NEW.data_transacao + (i - 1) * INTERVAL '1 month';

    INSERT INTO public.transactions (
      user_id,
      descricao,
      categoria_id,
      tipo,
      valor,
      conta_origem_id,
      data_transacao,
      observacoes,
      origem,
      parent_transaction_id,
      installment_number,
      installment_total,
      group_id
    ) VALUES (
      NEW.user_id,
      NEW.descricao || ' (' || i || '/' || NEW.installment_total || ')',
      NEW.categoria_id,
      NEW.tipo,
      NEW.valor,
      NEW.conta_origem_id,
      next_date,
      NEW.observacoes,
      NEW.origem,
      NEW.id,
      i,
      NEW.installment_total,
      NEW.group_id
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

-- 2.7 get_user_group_id
CREATE OR REPLACE FUNCTION public.get_user_group_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT group_id FROM public.family_members
  WHERE member_id = auth.uid()
  LIMIT 1;
$function$;

-- 2.8 get_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(
  total_balance NUMERIC,
  monthly_income NUMERIC,
  monthly_expenses NUMERIC,
  monthly_savings NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  auth_user_id UUID := auth.uid();
  first_day_of_month DATE := DATE_TRUNC('month', CURRENT_DATE);
  last_day_of_month DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day');
BEGIN
  RETURN QUERY
  WITH monthly_transactions AS (
    SELECT
      SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as income,
      SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as expenses
    FROM public.transactions
    WHERE user_id = auth_user_id
      AND data_transacao >= first_day_of_month
      AND data_transacao <= last_day_of_month
  ),
  total_balance_calc AS (
    SELECT SUM(saldo_atual) as balance
    FROM public.accounts
    WHERE user_id = auth_user_id AND ativo = true
  )
  SELECT
    COALESCE(tb.balance, 0) as total_balance,
    COALESCE(mt.income, 0) as monthly_income,
    COALESCE(mt.expenses, 0) as monthly_expenses,
    COALESCE(mt.income, 0) - COALESCE(mt.expenses, 0) as monthly_savings
  FROM monthly_transactions mt, total_balance_calc tb;
END;
$function$;

-- 2.9 create_family_group
CREATE OR REPLACE FUNCTION public.create_family_group(
  group_name TEXT,
  group_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_group_id UUID;
  result JSON;
BEGIN
  INSERT INTO public.family_groups (name, description, owner_id)
  VALUES (group_name, group_description, auth.uid())
  RETURNING id INTO new_group_id;
  
  INSERT INTO public.family_members (group_id, member_id, role, status, joined_at)
  VALUES (new_group_id, auth.uid(), 'owner', 'active', NOW());
  
  RETURN json_build_object(
    'success', true,
    'message', 'Grupo familiar criado com sucesso!',
    'group_id', new_group_id
  );
END;
$function$;

-- 2.10 invite_family_member
CREATE OR REPLACE FUNCTION public.invite_family_member(
  group_id UUID,
  email TEXT,
  role TEXT DEFAULT 'member'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  invite_token TEXT;
  result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE group_id = invite_family_member.group_id
      AND member_id = auth.uid()
      AND role IN ('owner', 'admin')
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Você não tem permissão para convidar membros');
  END IF;
  
  invite_token := 'FAM_' || UPPER(SUBSTR(gen_random_uuid()::TEXT, 1, 12));
  
  INSERT INTO public.family_invites (group_id, email, role, invited_by, token, expires_at)
  VALUES (group_id, email, role, auth.uid(), invite_token, NOW() + INTERVAL '7 days');
  
  RETURN json_build_object(
    'success', true,
    'message', 'Convite enviado com sucesso!',
    'token', invite_token
  );
END;
$function$;

-- 2.11 accept_family_invite
CREATE OR REPLACE FUNCTION public.accept_family_invite(invite_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  invite_record RECORD;
  user_profile RECORD;
  result JSON;
BEGIN
  SELECT * INTO invite_record
  FROM public.family_invites
  WHERE token = invite_token
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Convite inválido ou expirado');
  END IF;
  
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Perfil do usuário não encontrado');
  END IF;
  
  INSERT INTO public.family_members (group_id, member_id, role, status, invited_by, joined_at)
  VALUES (
    invite_record.group_id,
    auth.uid(),
    invite_record.role,
    'active',
    invite_record.invited_by,
    NOW()
  )
  ON CONFLICT (group_id, member_id) DO UPDATE SET
    status = 'active',
    role = invite_record.role,
    joined_at = NOW();
  
  UPDATE public.family_invites
  SET status = 'accepted', updated_at = NOW()
  WHERE id = invite_record.id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Convite aceito com sucesso!',
    'group_id', invite_record.group_id
  );
END;
$function$;

-- 2.12 create_recurring_transaction
CREATE OR REPLACE FUNCTION public.create_recurring_transaction(
  p_title TEXT,
  p_description TEXT,
  p_amount NUMERIC,
  p_type TEXT,
  p_frequency TEXT,
  p_start_date DATE,
  p_end_date DATE DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_group_id UUID DEFAULT NULL,
  p_day_of_month INTEGER DEFAULT NULL,
  p_day_of_week INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_recurring_id UUID;
  next_due_date DATE;
  result JSON;
BEGIN
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'message', 'Valor deve ser maior que zero');
  END IF;
  
  IF p_type NOT IN ('receita', 'despesa') THEN
    RETURN json_build_object('success', false, 'message', 'Tipo deve ser receita ou despesa');
  END IF;
  
  IF p_frequency NOT IN ('diaria', 'semanal', 'mensal', 'trimestral', 'semestral', 'anual') THEN
    RETURN json_build_object('success', false, 'message', 'Frequência inválida');
  END IF;
  
  CASE p_frequency
    WHEN 'diaria' THEN next_due_date := p_start_date + INTERVAL '1 day';
    WHEN 'semanal' THEN next_due_date := p_start_date + INTERVAL '1 week';
    WHEN 'mensal' THEN next_due_date := p_start_date + INTERVAL '1 month';
    WHEN 'trimestral' THEN next_due_date := p_start_date + INTERVAL '3 months';
    WHEN 'semestral' THEN next_due_date := p_start_date + INTERVAL '6 months';
    WHEN 'anual' THEN next_due_date := p_start_date + INTERVAL '1 year';
    ELSE next_due_date := p_start_date + INTERVAL '1 month';
  END CASE;
  
  INSERT INTO public.recurring_transactions (
    user_id, group_id, title, description, amount, type,
    frequency, day_of_month, day_of_week, start_date,
    end_date, category_id, account_id, next_due_date
  )
  VALUES (
    auth.uid(), p_group_id, p_title, p_description, p_amount, p_type,
    p_frequency, p_day_of_month, p_day_of_week, p_start_date,
    p_end_date, p_category_id, p_account_id, next_due_date
  )
  RETURNING id INTO new_recurring_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Transação recorrente criada com sucesso',
    'recurring_id', new_recurring_id,
    'next_due_date', next_due_date
  );
END;
$function$;

-- 2.13 handle_new_family_group
CREATE OR REPLACE FUNCTION public.handle_new_family_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.family_members (group_id, member_id, role, can_manage_members)
  VALUES (NEW.id, NEW.owner_id, 'owner', TRUE);
  
  RETURN NEW;
END;
$function$;

-- 2.14 update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 2.15 update_account_balance (função grande - mantém lógica existente)
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.tipo = 'receita' AND NEW.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual + NEW.valor 
      WHERE id = NEW.conta_origem_id;
    ELSIF NEW.tipo = 'despesa' AND NEW.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual - NEW.valor 
      WHERE id = NEW.conta_origem_id;
    ELSIF NEW.tipo = 'transferencia' THEN
      IF NEW.conta_origem_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual - NEW.valor 
        WHERE id = NEW.conta_origem_id;
      END IF;
      IF NEW.conta_destino_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual + NEW.valor 
        WHERE id = NEW.conta_destino_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.tipo = 'receita' AND OLD.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual - OLD.valor 
      WHERE id = OLD.conta_origem_id;
    ELSIF OLD.tipo = 'despesa' AND OLD.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual + OLD.valor 
      WHERE id = OLD.conta_origem_id;
    ELSIF OLD.tipo = 'transferencia' THEN
      IF OLD.conta_origem_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual + OLD.valor 
        WHERE id = OLD.conta_origem_id;
      END IF;
      IF OLD.conta_destino_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual - OLD.valor 
        WHERE id = OLD.conta_destino_id;
      END IF;
    END IF;
    
    IF NEW.tipo = 'receita' AND NEW.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual + NEW.valor 
      WHERE id = NEW.conta_origem_id;
    ELSIF NEW.tipo = 'despesa' AND NEW.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual - NEW.valor 
      WHERE id = NEW.conta_origem_id;
    ELSIF NEW.tipo = 'transferencia' THEN
      IF NEW.conta_origem_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual - NEW.valor 
        WHERE id = NEW.conta_origem_id;
      END IF;
      IF NEW.conta_destino_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual + NEW.valor 
        WHERE id = NEW.conta_destino_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    IF OLD.tipo = 'receita' AND OLD.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual - OLD.valor 
      WHERE id = OLD.conta_origem_id;
    ELSIF OLD.tipo = 'despesa' AND OLD.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual + OLD.valor 
      WHERE id = OLD.conta_origem_id;
    ELSIF OLD.tipo = 'transferencia' THEN
      IF OLD.conta_origem_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual + OLD.valor 
        WHERE id = OLD.conta_origem_id;
      END IF;
      IF OLD.conta_destino_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual - OLD.valor 
        WHERE id = OLD.conta_destino_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- 2.16 handle_new_user_family_setup
CREATE OR REPLACE FUNCTION public.handle_new_user_family_setup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  
  INSERT INTO public.licenses (user_id, codigo, status, tipo, data_ativacao)
  VALUES (NEW.id, public.generate_activation_code(NEW.id), 'ativo', 'vitalicia', NOW());
  
  INSERT INTO public.categories (user_id, nome, tipo, cor, icone) VALUES
  (NEW.id, 'Alimentação', 'despesa', '#ef4444', 'utensils'),
  (NEW.id, 'Transporte', 'despesa', '#f97316', 'car'),
  (NEW.id, 'Moradia', 'despesa', '#8b5cf6', 'home'),
  (NEW.id, 'Lazer', 'despesa', '#06b6d4', 'gamepad-2'),
  (NEW.id, 'Saúde', 'despesa', '#10b981', 'heart'),
  (NEW.id, 'Salário', 'receita', '#22c55e', 'banknote'),
  (NEW.id, 'Freelance', 'receita', '#3b82f6', 'laptop'),
  (NEW.id, 'Investimentos', 'receita', '#f59e0b', 'trending-up');
  
  INSERT INTO public.accounts (user_id, nome, tipo, saldo_inicial, saldo_atual, cor) VALUES
  (NEW.id, 'Carteira', 'dinheiro', 0, 0, '#10b981'),
  (NEW.id, 'Conta Corrente', 'corrente', 0, 0, '#3b82f6');
  
  INSERT INTO public.family_groups (owner_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email) || ' Family');
  
  RETURN NEW;
END;
$function$;

-- 2.17 handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  
  INSERT INTO public.licenses (user_id, codigo, status, tipo, plano, data_ativacao)
  VALUES (NEW.id, 'GC-' || UPPER(SUBSTR(NEW.id::TEXT, 1, 8)), 'ativo', 'mensal', 'gratuito', NOW());
  
  INSERT INTO public.categories (user_id, nome, tipo, cor, icone) VALUES
  (NEW.id, 'Alimentação', 'despesa', '#ef4444', 'utensils'),
  (NEW.id, 'Transporte', 'despesa', '#f97316', 'car'),
  (NEW.id, 'Moradia', 'despesa', '#8b5cf6', 'home'),
  (NEW.id, 'Lazer', 'despesa', '#06b6d4', 'gamepad-2'),
  (NEW.id, 'Saúde', 'despesa', '#10b981', 'heart'),
  (NEW.id, 'Salário', 'receita', '#22c55e', 'banknote'),
  (NEW.id, 'Freelance', 'receita', '#3b82f6', 'laptop'),
  (NEW.id, 'Investimentos', 'receita', '#f59e0b', 'trending-up');
  
  INSERT INTO public.accounts (user_id, nome, tipo, saldo_inicial, saldo_atual, cor) VALUES
  (NEW.id, 'Carteira', 'dinheiro', 0, 0, '#10b981'),
  (NEW.id, 'Conta Corrente', 'corrente', 0, 0, '#3b82f6');
  
  RETURN NEW;
END;
$function$;

-- 2.18 create_onboarding_column_if_not_exists
CREATE OR REPLACE FUNCTION public.create_onboarding_column_if_not_exists()
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
      AND table_schema = 'public'
      AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;
    
    COMMENT ON COLUMN public.profiles.onboarding_completed 
    IS 'Indica se o usuário completou o processo de onboarding guiado';
    
    CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
    ON public.profiles(onboarding_completed) 
    WHERE onboarding_completed = false;
    
    RAISE NOTICE 'Coluna onboarding_completed criada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna onboarding_completed já existe!';
  END IF;
END;
$function$;

-- =============================================================
-- PARTE 3: RESTRINGIR RLS POLICIES DE DADOS SENSÍVEIS
-- =============================================================

-- 3.1 Revisar policy da tabela profiles
-- Remover a policy que usa "auth.uid() = id" (vulnerável)
DROP POLICY IF EXISTS "Select own profile" ON public.profiles;

-- Manter apenas a policy segura com user_id
-- Já existe: "Users can manage their own profile data" usando user_id

-- 3.2 Adicionar comentários de segurança
COMMENT ON TABLE public.profiles IS 
'Tabela de perfis de usuários. ATENÇÃO: Contém dados sensíveis (telefone, stripe_customer_id). RLS obrigatório.';

COMMENT ON TABLE public.transactions IS 
'Tabela de transações financeiras. ATENÇÃO: Dados financeiros sensíveis. Acesso restrito por grupo familiar.';

-- =============================================================
-- PARTE 4: ADICIONAR CAMPO CURRENT_GROUP_ID NO PROFILE
-- =============================================================

-- 4.1 Adicionar coluna para grupo ativo
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS current_group_id UUID REFERENCES public.family_groups(id) ON DELETE SET NULL;

-- 4.2 Adicionar índice
CREATE INDEX IF NOT EXISTS idx_profiles_current_group 
ON public.profiles(current_group_id) 
WHERE current_group_id IS NOT NULL;

COMMENT ON COLUMN public.profiles.current_group_id IS 
'ID do grupo familiar atualmente selecionado pelo usuário';

-- =============================================================
-- CONCLUÍDO
-- =============================================================

-- Verificar todas as funções corrigidas
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  CASE 
    WHEN p.proconfig IS NOT NULL AND 'search_path=public' = ANY(p.proconfig) 
    THEN '✅ PROTEGIDO'
    ELSE '❌ VULNERÁVEL'
  END AS security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;