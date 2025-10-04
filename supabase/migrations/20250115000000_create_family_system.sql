-- Sistema de Grupos Familiares - Zaq - Boas Contas
-- Criar tabelas para gerenciamento de grupos familiares

-- Tabela de grupos familiares
CREATE TABLE public.family_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de membros da família
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, member_id)
);

-- Tabela de convites familiares
CREATE TABLE public.family_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário é membro da família
CREATE OR REPLACE FUNCTION public.is_family_member(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members AS fm1
    JOIN public.family_members AS fm2 ON fm1.group_id = fm2.group_id
    WHERE fm1.member_id = auth.uid()
    AND fm2.member_id = target_user_id
    AND fm1.status = 'active'
    AND fm2.status = 'active'
  );
$function$;

-- Função para verificar se usuário é admin da família
CREATE OR REPLACE FUNCTION public.is_family_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members AS fm1
    JOIN public.family_members AS fm2 ON fm1.group_id = fm2.group_id
    WHERE fm1.member_id = auth.uid()
    AND fm2.member_id = target_user_id
    AND fm1.status = 'active'
    AND fm2.status = 'active'
    AND fm1.role IN ('owner', 'admin')
  );
$function$;

-- RLS Policies para family_groups
CREATE POLICY "Users can view their family groups"
ON public.family_groups
FOR SELECT
USING (
  auth.uid() = owner_id 
  OR EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE group_id = family_groups.id 
    AND member_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can create family groups"
ON public.family_groups
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and admins can update family groups"
ON public.family_groups
FOR UPDATE
USING (
  auth.uid() = owner_id 
  OR EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE group_id = family_groups.id 
    AND member_id = auth.uid() 
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
);

CREATE POLICY "Owners can delete family groups"
ON public.family_groups
FOR DELETE
USING (auth.uid() = owner_id);

-- RLS Policies para family_members
CREATE POLICY "Family members can view group members"
ON public.family_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.group_id = family_members.group_id
    AND fm.member_id = auth.uid()
    AND fm.status = 'active'
  )
);

CREATE POLICY "Owners and admins can manage family members"
ON public.family_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    JOIN public.family_groups fg ON fm.group_id = fg.id
    WHERE fm.group_id = family_members.group_id
    AND fm.member_id = auth.uid()
    AND fm.role IN ('owner', 'admin')
    AND fm.status = 'active'
  )
);

-- RLS Policies para family_invites
CREATE POLICY "Family members can view group invites"
ON public.family_invites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.group_id = family_invites.group_id
    AND fm.member_id = auth.uid()
    AND fm.status = 'active'
  )
);

CREATE POLICY "Owners and admins can manage family invites"
ON public.family_invites
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.group_id = family_invites.group_id
    AND fm.member_id = auth.uid()
    AND fm.role IN ('owner', 'admin')
    AND fm.status = 'active'
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_family_groups_updated_at
  BEFORE UPDATE ON public.family_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_invites_updated_at
  BEFORE UPDATE ON public.family_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_family_members_group_id ON public.family_members(group_id);
CREATE INDEX idx_family_members_member_id ON public.family_members(member_id);
CREATE INDEX idx_family_members_status ON public.family_members(status);
CREATE INDEX idx_family_invites_group_id ON public.family_invites(group_id);
CREATE INDEX idx_family_invites_email ON public.family_invites(email);
CREATE INDEX idx_family_invites_token ON public.family_invites(token);
CREATE INDEX idx_family_invites_status ON public.family_invites(status);

-- Função para aceitar convite familiar
CREATE OR REPLACE FUNCTION public.accept_family_invite(invite_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  invite_record RECORD;
  user_profile RECORD;
  result JSON;
BEGIN
  -- Buscar convite válido
  SELECT * INTO invite_record
  FROM public.family_invites
  WHERE token = invite_token
  AND status = 'pending'
  AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Convite inválido ou expirado');
  END IF;
  
  -- Buscar perfil do usuário
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Perfil do usuário não encontrado');
  END IF;
  
  -- Adicionar membro ao grupo
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
  
  -- Marcar convite como aceito
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

-- Função para criar grupo familiar
CREATE OR REPLACE FUNCTION public.create_family_group(group_name TEXT, group_description TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_group_id UUID;
  result JSON;
BEGIN
  -- Criar grupo
  INSERT INTO public.family_groups (name, description, owner_id)
  VALUES (group_name, group_description, auth.uid())
  RETURNING id INTO new_group_id;
  
  -- Adicionar criador como owner
  INSERT INTO public.family_members (group_id, member_id, role, status, joined_at)
  VALUES (new_group_id, auth.uid(), 'owner', 'active', NOW());
  
  RETURN json_build_object(
    'success', true,
    'message', 'Grupo familiar criado com sucesso!',
    'group_id', new_group_id
  );
END;
$function$;

-- Função para convidar membro
CREATE OR REPLACE FUNCTION public.invite_family_member(group_id UUID, email TEXT, role TEXT DEFAULT 'member')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  invite_token TEXT;
  result JSON;
BEGIN
  -- Verificar se usuário é admin do grupo
  IF NOT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE group_id = invite_family_member.group_id
    AND member_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Você não tem permissão para convidar membros');
  END IF;
  
  -- Gerar token único
  invite_token := 'FAM_' || UPPER(SUBSTR(gen_random_uuid()::TEXT, 1, 12));
  
  -- Criar convite
  INSERT INTO public.family_invites (group_id, email, role, invited_by, token, expires_at)
  VALUES (group_id, email, role, auth.uid(), invite_token, NOW() + INTERVAL '7 days');
  
  RETURN json_build_object(
    'success', true,
    'message', 'Convite enviado com sucesso!',
    'token', invite_token
  );
END;
$function$;
