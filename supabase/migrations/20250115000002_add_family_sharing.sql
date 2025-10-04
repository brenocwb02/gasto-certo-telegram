-- Adicionar campos group_id para compartilhamento familiar
-- Sistema de Grupos Familiares - Zaq - Boas Contas

-- Adicionar group_id na tabela transactions
ALTER TABLE public.transactions 
ADD COLUMN group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE;

-- Adicionar group_id na tabela accounts
ALTER TABLE public.accounts 
ADD COLUMN group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE;

-- Adicionar group_id na tabela categories
ALTER TABLE public.categories 
ADD COLUMN group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE;

-- Adicionar group_id na tabela goals
ALTER TABLE public.goals 
ADD COLUMN group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE;

-- Adicionar group_id na tabela investments
ALTER TABLE public.investments 
ADD COLUMN group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE;

-- Adicionar group_id na tabela investment_transactions
ALTER TABLE public.investment_transactions 
ADD COLUMN group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE;

-- Índices para performance
CREATE INDEX idx_transactions_group_id ON public.transactions(group_id);
CREATE INDEX idx_accounts_group_id ON public.accounts(group_id);
CREATE INDEX idx_categories_group_id ON public.categories(group_id);
CREATE INDEX idx_goals_group_id ON public.goals(group_id);
CREATE INDEX idx_investments_group_id ON public.investments(group_id);
CREATE INDEX idx_investment_transactions_group_id ON public.investment_transactions(group_id);

-- RLS Policies para transactions
CREATE POLICY "Family members can view shared transactions"
ON public.transactions
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.group_id = transactions.group_id
      AND fm.member_id = auth.uid()
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "Family members can manage shared transactions"
ON public.transactions
FOR ALL
USING (
  auth.uid() = user_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.group_id = transactions.group_id
      AND fm.member_id = auth.uid()
      AND fm.status = 'active'
      AND fm.role IN ('owner', 'admin', 'member')
    )
  )
);

-- RLS Policies para accounts
CREATE POLICY "Family members can view shared accounts"
ON public.accounts
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.group_id = accounts.group_id
      AND fm.member_id = auth.uid()
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "Family members can manage shared accounts"
ON public.accounts
FOR ALL
USING (
  auth.uid() = user_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.group_id = accounts.group_id
      AND fm.member_id = auth.uid()
      AND fm.status = 'active'
      AND fm.role IN ('owner', 'admin', 'member')
    )
  )
);

-- RLS Policies para categories
CREATE POLICY "Family members can view shared categories"
ON public.categories
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.group_id = categories.group_id
      AND fm.member_id = auth.uid()
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "Family members can manage shared categories"
ON public.categories
FOR ALL
USING (
  auth.uid() = user_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.group_id = categories.group_id
      AND fm.member_id = auth.uid()
      AND fm.status = 'active'
      AND fm.role IN ('owner', 'admin', 'member')
    )
  )
);

-- RLS Policies para goals
CREATE POLICY "Family members can view shared goals"
ON public.goals
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.group_id = goals.group_id
      AND fm.member_id = auth.uid()
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "Family members can manage shared goals"
ON public.goals
FOR ALL
USING (
  auth.uid() = user_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.group_id = goals.group_id
      AND fm.member_id = auth.uid()
      AND fm.status = 'active'
      AND fm.role IN ('owner', 'admin', 'member')
    )
  )
);

-- RLS Policies para investments
CREATE POLICY "Family members can view shared investments"
ON public.investments
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.group_id = investments.group_id
      AND fm.member_id = auth.uid()
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "Family members can manage shared investments"
ON public.investments
FOR ALL
USING (
  auth.uid() = user_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.group_id = investments.group_id
      AND fm.member_id = auth.uid()
      AND fm.status = 'active'
      AND fm.role IN ('owner', 'admin', 'member')
    )
  )
);

-- RLS Policies para investment_transactions
CREATE POLICY "Family members can view shared investment transactions"
ON public.investment_transactions
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.group_id = investment_transactions.group_id
      AND fm.member_id = auth.uid()
      AND fm.status = 'active'
    )
  )
);

CREATE POLICY "Family members can manage shared investment transactions"
ON public.investment_transactions
FOR ALL
USING (
  auth.uid() = user_id 
  OR (
    group_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.group_id = investment_transactions.group_id
      AND fm.member_id = auth.uid()
      AND fm.status = 'active'
      AND fm.role IN ('owner', 'admin', 'member')
    )
  )
);

-- Função para verificar se usuário pode compartilhar dados
CREATE OR REPLACE FUNCTION public.can_share_data(target_group_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE group_id = target_group_id
    AND member_id = auth.uid()
    AND status = 'active'
    AND role IN ('owner', 'admin', 'member')
  );
$function$;

-- Função para obter grupos familiares do usuário
CREATE OR REPLACE FUNCTION public.get_user_family_groups()
RETURNS TABLE(
  group_id UUID,
  group_name TEXT,
  user_role TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    fg.id as group_id,
    fg.name as group_name,
    fm.role as user_role
  FROM public.family_groups fg
  JOIN public.family_members fm ON fg.id = fm.group_id
  WHERE fm.member_id = auth.uid()
  AND fm.status = 'active';
$function$;
