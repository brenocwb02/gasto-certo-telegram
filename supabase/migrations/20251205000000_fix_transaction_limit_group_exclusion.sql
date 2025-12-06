-- Migration: Fix check_transaction_limit to exclude group transactions
-- Date: 2025-12-05
-- Issue: Users in family groups were being blocked incorrectly because group transactions 
--        were counting towards their personal limit (75/month for free users)
-- 
-- FIX: Only count transactions where group_id IS NULL (personal transactions)
--
-- MODELO 5 HÍBRIDO:
-- ✅ Transações do GRUPO (group_id != null) → NÃO contam no limite pessoal
-- ✅ Transações PESSOAIS (group_id = null) → Contam no limite (75/mês para free)

CREATE OR REPLACE FUNCTION public.check_transaction_limit(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_plan TEXT;
    tx_count INTEGER;
    limit_count INTEGER;
    user_created_at TIMESTAMP WITH TIME ZONE;
    is_trial_period BOOLEAN;
    start_of_month TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user's plan
    SELECT plano INTO current_plan
    FROM public.licenses
    WHERE licenses.user_id = check_transaction_limit.user_id AND status = 'ativo';

    -- Default to free if no license found
    IF current_plan IS NULL THEN
        current_plan := 'gratuito';
    END IF;

    -- If not free, unlimited (or high limit)
    IF current_plan != 'gratuito' THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'limit', -1,
            'usage', 0,
            'plan', current_plan
        );
    END IF;

    -- Get user creation date for trial logic
    SELECT created_at INTO user_created_at
    FROM auth.users
    WHERE id = check_transaction_limit.user_id;

    -- Check if in first 30 days
    is_trial_period := (now() - user_created_at) < interval '30 days';

    -- Set limit based on trial status
    IF is_trial_period THEN
        limit_count := 100;
    ELSE
        limit_count := 75;
    END IF;

    -- Count transactions for current month
    start_of_month := date_trunc('month', now());
    
    -- ✅ FIX CRÍTICO: Apenas contar transações PESSOAIS (group_id IS NULL)
    -- Transações do grupo familiar NÃO contam no limite pessoal!
    SELECT count(*) INTO tx_count
    FROM public.transactions
    WHERE transactions.user_id = check_transaction_limit.user_id
    AND group_id IS NULL  -- ⬅️ CORREÇÃO CRÍTICA AQUI!
    AND date >= start_of_month::date;

    RETURN jsonb_build_object(
        'allowed', tx_count < limit_count,
        'limit', limit_count,
        'usage', tx_count,
        'plan', current_plan,
        'is_trial', is_trial_period
    );
END;
$$;

-- Adicionar comentário explicativo
COMMENT ON FUNCTION public.check_transaction_limit(UUID) IS 
'Verifica o limite de transações para usuários free. 
IMPORTANTE: Apenas transações PESSOAIS (group_id IS NULL) contam no limite.
Transações de grupo familiar são ILIMITADAS (Modelo 5 Híbrido).';
