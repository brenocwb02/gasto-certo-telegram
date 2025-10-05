-- Fix infinite recursion in family_members RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Family members can view group members" ON public.family_members;
DROP POLICY IF EXISTS "Members can view their family" ON public.family_members;
DROP POLICY IF EXISTS "Owners can manage group members" ON public.family_members;
DROP POLICY IF EXISTS "Users can manage family members" ON public.family_members;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.is_family_group_owner(group_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_groups
    WHERE id = group_uuid
    AND owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_family_group_admin(group_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE group_id = group_uuid
    AND member_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_in_family_group(group_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE group_id = group_uuid
    AND member_id = auth.uid()
  );
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Members can view their family"
ON public.family_members
FOR SELECT
USING (
  auth.uid() = member_id 
  OR public.is_family_group_owner(group_id)
);

CREATE POLICY "Admins can manage members"
ON public.family_members
FOR ALL
USING (
  public.is_family_group_admin(group_id)
);

CREATE POLICY "Users can view group members"
ON public.family_members
FOR SELECT
USING (
  public.is_in_family_group(group_id)
);

-- Fix RLS policies for other tables using the same pattern
DROP POLICY IF EXISTS "Family members can manage shared accounts" ON public.accounts;
DROP POLICY IF EXISTS "Family members can view shared accounts" ON public.accounts;

CREATE POLICY "Users and family can view shared accounts"
ON public.accounts
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (group_id IS NOT NULL AND public.is_in_family_group(group_id))
);

CREATE POLICY "Users and family admins can manage shared accounts"
ON public.accounts
FOR ALL
USING (
  auth.uid() = user_id 
  OR (group_id IS NOT NULL AND public.is_family_group_admin(group_id))
);

DROP POLICY IF EXISTS "Family members can manage shared budgets" ON public.budgets;

CREATE POLICY "Users and family can manage budgets"
ON public.budgets
FOR ALL
USING (
  auth.uid() = user_id 
  OR public.is_family_member(user_id)
);

DROP POLICY IF EXISTS "Family members can manage shared categories" ON public.categories;
DROP POLICY IF EXISTS "Family members can view shared categories" ON public.categories;

CREATE POLICY "Users and family can view shared categories"
ON public.categories
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (group_id IS NOT NULL AND public.is_in_family_group(group_id))
);

CREATE POLICY "Users and family admins can manage shared categories"
ON public.categories
FOR ALL
USING (
  auth.uid() = user_id 
  OR (group_id IS NOT NULL AND public.is_family_group_admin(group_id))
);

DROP POLICY IF EXISTS "Family members can manage shared transactions" ON public.transactions;
DROP POLICY IF EXISTS "Family members can view shared transactions" ON public.transactions;

CREATE POLICY "Users and family can view shared transactions"
ON public.transactions
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (group_id IS NOT NULL AND public.is_in_family_group(group_id))
);

CREATE POLICY "Users and family admins can manage shared transactions"
ON public.transactions
FOR ALL
USING (
  auth.uid() = user_id 
  OR (group_id IS NOT NULL AND public.is_family_group_admin(group_id))
);

-- Add missing status column to family_members if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'family_members' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.family_members 
    ADD COLUMN status text NOT NULL DEFAULT 'active' 
    CHECK (status IN ('pending', 'active', 'suspended'));
    
    ALTER TABLE public.family_members
    ADD COLUMN invited_by uuid REFERENCES auth.users(id),
    ADD COLUMN invited_at timestamp with time zone,
    ADD COLUMN joined_at timestamp with time zone;
  END IF;
END $$;

-- Fix update_investment_position function to set search_path
CREATE OR REPLACE FUNCTION public.update_investment_position()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_quantity NUMERIC;
  current_avg_price NUMERIC;
  new_quantity NUMERIC;
  new_avg_price NUMERIC;
BEGIN
  -- Busca posição atual
  SELECT quantity, average_price INTO current_quantity, current_avg_price
  FROM public.investments
  WHERE user_id = NEW.user_id AND ticker = NEW.ticker;
  
  -- Se não existe, cria
  IF NOT FOUND THEN
    IF NEW.transaction_type = 'compra' THEN
      INSERT INTO public.investments (user_id, ticker, asset_type, quantity, average_price)
      VALUES (NEW.user_id, NEW.ticker, 'acao', NEW.quantity, NEW.price);
    END IF;
    RETURN NEW;
  END IF;
  
  -- Atualiza posição baseado no tipo de transação
  IF NEW.transaction_type = 'compra' THEN
    new_quantity := current_quantity + NEW.quantity;
    new_avg_price := ((current_quantity * current_avg_price) + (NEW.quantity * NEW.price)) / new_quantity;
    
    UPDATE public.investments
    SET quantity = new_quantity,
        average_price = new_avg_price,
        updated_at = NOW()
    WHERE user_id = NEW.user_id AND ticker = NEW.ticker;
    
  ELSIF NEW.transaction_type = 'venda' THEN
    new_quantity := current_quantity - NEW.quantity;
    
    UPDATE public.investments
    SET quantity = GREATEST(0, new_quantity),
        updated_at = NOW()
    WHERE user_id = NEW.user_id AND ticker = NEW.ticker;
    
  ELSIF NEW.transaction_type = 'provento' THEN
    -- Proventos também criam uma transação de receita
    INSERT INTO public.transactions (
      user_id,
      descricao,
      tipo,
      valor,
      data_transacao,
      observacoes,
      origem
    ) VALUES (
      NEW.user_id,
      'Provento ' || NEW.ticker,
      'receita',
      NEW.total_value,
      NEW.transaction_date,
      NEW.notes,
      'investimentos'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;