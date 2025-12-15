-- Migration: Enforce SaaS Plan Limits (Trial & Free)
-- Date: 2025-12-15

-- 1. Create centralized function to check limits
CREATE OR REPLACE FUNCTION public.check_plan_limits(
    p_user_id UUID, 
    p_resource_type TEXT -- 'transaction', 'account', 'category'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan TEXT;
    v_status TEXT;
    v_user_created_at TIMESTAMP WITH TIME ZONE;
    v_is_trial BOOLEAN;
    v_count INTEGER;
    v_limit INTEGER;
    v_start_of_month TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user subscription status
    SELECT plano, status INTO v_plan, v_status
    FROM public.licenses
    WHERE user_id = p_user_id AND status = 'ativo'
    LIMIT 1;

    -- Default to free if no active license
    IF v_plan IS NULL THEN
        v_plan := 'free';
    END IF;

    -- CHECK 1: Premium Individual or Family (Owner/Member) -> UNLIMITED
    -- Note: Family limits are handled by a separate anti-abuse function
    IF v_plan IN ('individual', 'family_owner', 'family_member', 'vitalicia') THEN
        RETURN jsonb_build_object('allowed', true, 'reason', 'premium');
    END IF;

    -- CHECK 2: Trial Period (14 Days) -> UNLIMITED
    SELECT created_at INTO v_user_created_at
    FROM auth.users
    WHERE id = p_user_id;

    v_is_trial := (now() - v_user_created_at) < interval '14 days';

    IF v_is_trial THEN
        RETURN jsonb_build_object('allowed', true, 'reason', 'trial');
    END IF;

    -- CHECK 3: Free Plan (Hard Limits)
    v_start_of_month := date_trunc('month', now());

    IF p_resource_type = 'transaction' THEN
        v_limit := 30; -- Max 30 transactions per month
        
        SELECT count(*) INTO v_count
        FROM public.transactions
        WHERE user_id = p_user_id
        AND date >= v_start_of_month::date;

        IF v_count >= v_limit THEN
            RETURN jsonb_build_object('allowed', false, 'message', 'Limite mensal de 30 transações atingido no Plano Gratuito.');
        END IF;

    ELSIF p_resource_type = 'account' THEN
        v_limit := 1; -- Max 1 account
        
        SELECT count(*) INTO v_count
        FROM public.accounts
        WHERE user_id = p_user_id AND ativo = true;

        IF v_count >= v_limit THEN
            RETURN jsonb_build_object('allowed', false, 'message', 'Limite de 1 conta atingido no Plano Gratuito.');
        END IF;

    ELSIF p_resource_type = 'category' THEN
        v_limit := 5; -- Max 5 categories
        
        SELECT count(*) INTO v_count
        FROM public.categories
        WHERE user_id = p_user_id;

        IF v_count >= v_limit THEN
            RETURN jsonb_build_object('allowed', false, 'message', 'Limite de 5 categorias atingido no Plano Gratuito.');
        END IF;
    END IF;

    RETURN jsonb_build_object('allowed', true, 'reason', 'within_limit');
END;
$$;

-- 2. Create Trigger Function for Transactions
CREATE OR REPLACE FUNCTION public.trigger_check_transaction_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_check JSONB;
BEGIN
    -- Check limit before insert
    v_check := public.check_plan_limits(NEW.user_id, 'transaction');
    
    IF (v_check->>'allowed')::boolean = false THEN
        RAISE EXCEPTION '%', v_check->>'message' USING ERRCODE = 'P0001'; -- Custom Error Code
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger Function for Accounts
CREATE OR REPLACE FUNCTION public.trigger_check_account_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_check JSONB;
BEGIN
    -- Check limit before insert
    v_check := public.check_plan_limits(NEW.user_id, 'account');
    
    IF (v_check->>'allowed')::boolean = false THEN
        RAISE EXCEPTION '%', v_check->>'message' USING ERRCODE = 'P0001';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Trigger Function for Categories
CREATE OR REPLACE FUNCTION public.trigger_check_category_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_check JSONB;
BEGIN
    -- Check limit before insert
    v_check := public.check_plan_limits(NEW.user_id, 'category');
    
    IF (v_check->>'allowed')::boolean = false THEN
        RAISE EXCEPTION '%', v_check->>'message' USING ERRCODE = 'P0001';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Triggers
DROP TRIGGER IF EXISTS check_limit_before_insert ON public.transactions;
CREATE TRIGGER check_limit_before_insert
    BEFORE INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_check_transaction_limit();

DROP TRIGGER IF EXISTS check_limit_before_insert ON public.accounts;
CREATE TRIGGER check_limit_before_insert
    BEFORE INSERT ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_check_account_limit();

DROP TRIGGER IF EXISTS check_limit_before_insert ON public.categories;
CREATE TRIGGER check_limit_before_insert
    BEFORE INSERT ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_check_category_limit();
