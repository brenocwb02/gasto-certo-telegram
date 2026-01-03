-- Fix plan limit function referencing non-existent column `date`
-- Ensure transaction counting uses `data_transacao`.

CREATE OR REPLACE FUNCTION public.check_plan_limits(p_user_id uuid, p_resource_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_status text;
  v_user_created_at timestamptz;
  v_is_trial boolean;
  v_count integer;
  v_limit integer;
  v_start_of_month date;
BEGIN
  SELECT plano, status
    INTO v_plan, v_status
  FROM public.licenses
  WHERE user_id = p_user_id
    AND status = 'ativo'
  LIMIT 1;

  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;

  -- Premium plans: no limits
  IF v_plan IN ('individual', 'family_owner', 'family_member', 'vitalicia') THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'premium');
  END IF;

  -- Trial users: no limits
  SELECT created_at INTO v_user_created_at
  FROM auth.users
  WHERE id = p_user_id;

  v_is_trial := (now() - v_user_created_at) < interval '14 days';
  IF v_is_trial THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'trial');
  END IF;

  v_start_of_month := date_trunc('month', now())::date;

  IF p_resource_type = 'transaction' THEN
    v_limit := 30;
    SELECT count(*)
      INTO v_count
    FROM public.transactions
    WHERE user_id = p_user_id
      AND data_transacao >= v_start_of_month;

    IF v_count >= v_limit THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'message', 'Limite mensal de 30 transações atingido no Plano Gratuito.'
      );
    END IF;

  ELSIF p_resource_type = 'account' THEN
    v_limit := 1;
    SELECT count(*) INTO v_count
    FROM public.accounts
    WHERE user_id = p_user_id
      AND ativo = true;

    IF v_count >= v_limit THEN
      RETURN jsonb_build_object('allowed', false, 'message', 'Limite de 1 conta atingido no Plano Gratuito.');
    END IF;

  ELSIF p_resource_type = 'category' THEN
    v_limit := 5;
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

-- Recreate trigger function to ensure it calls updated check_plan_limits
CREATE OR REPLACE FUNCTION public.trigger_check_transaction_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_check jsonb;
BEGIN
  v_check := public.check_plan_limits(NEW.user_id, 'transaction');
  IF (v_check->>'allowed')::boolean = false THEN
    RAISE EXCEPTION '%', v_check->>'message' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists (idempotent)
DROP TRIGGER IF EXISTS check_transaction_limit ON public.transactions;
CREATE TRIGGER check_transaction_limit
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_check_transaction_limit();
