-- =====================================================
-- IMPORTANTE: Esta migração corrige vulnerabilidades de segurança
-- adicionando SET search_path = public às funções do sistema familiar
-- E adiciona suporte ao parâmetro description
-- =====================================================

-- Garantir que a coluna description existe na tabela family_groups
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_groups' AND column_name = 'description') THEN
        ALTER TABLE public.family_groups ADD COLUMN description TEXT;
    END IF;
END $$;

-- Remover funções existentes antes de recriar com novos parâmetros
DROP FUNCTION IF EXISTS public.invite_family_member(uuid, text, text);
DROP FUNCTION IF EXISTS public.create_family_group(text, text);
DROP FUNCTION IF EXISTS public.accept_family_invite(text);

-- Fix create_family_group (com suporte a descrição)
CREATE OR REPLACE FUNCTION public.create_family_group(
  group_name TEXT, 
  group_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_group_id UUID;
  new_member_id UUID;
BEGIN
  -- Criar grupo
  INSERT INTO public.family_groups (name, description, owner_id)
  VALUES (group_name, group_description, auth.uid())
  RETURNING id INTO new_group_id;

  -- Adicionar criador como admin/owner
  INSERT INTO public.family_members (group_id, member_id, role, status)
  VALUES (new_group_id, auth.uid(), 'owner', 'active')
  RETURNING id INTO new_member_id;

  RETURN json_build_object(
    'id', new_group_id,
    'name', group_name,
    'message', 'Grupo familiar criado com sucesso!'
  );
END;
$$;

-- Fix invite_family_member
CREATE OR REPLACE FUNCTION public.invite_family_member(p_group_id UUID, p_name TEXT, p_role TEXT DEFAULT 'member')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_invite_id UUID;
  invite_token TEXT;
BEGIN
  -- Verificar permissões (apenas admin/owner)
  IF NOT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE group_id = p_group_id
    AND member_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem convidar membros.';
  END IF;

  -- Gerar token único
  invite_token := encode(gen_random_bytes(16), 'hex');

  -- Criar convite
  INSERT INTO public.family_invites (group_id, invited_by, name, role, token, expires_at)
  VALUES (p_group_id, auth.uid(), p_name, p_role, invite_token, NOW() + INTERVAL '7 days')
  RETURNING id INTO new_invite_id;

  RETURN json_build_object(
    'id', new_invite_id,
    'token', invite_token,
    'message', 'Convite criado com sucesso!'
  );
END;
$$;

-- Fix accept_family_invite
CREATE OR REPLACE FUNCTION public.accept_family_invite(invite_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  existing_member RECORD;
BEGIN
  -- Buscar convite válido
  SELECT * INTO invite_record
  FROM public.family_invites
  WHERE token = invite_token
  AND status = 'pending'
  AND expires_at > NOW();

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou expirado.';
  END IF;

  -- Verificar se já é membro
  SELECT * INTO existing_member
  FROM public.family_members
  WHERE group_id = invite_record.group_id
  AND member_id = auth.uid();

  IF existing_member IS NOT NULL THEN
    RAISE EXCEPTION 'Você já é membro deste grupo.';
  END IF;

  -- Adicionar membro
  INSERT INTO public.family_members (group_id, member_id, role, status)
  VALUES (invite_record.group_id, auth.uid(), invite_record.role, 'active');

  -- Atualizar status do convite
  UPDATE public.family_invites
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = invite_record.id;

  RETURN json_build_object(
    'group_id', invite_record.group_id,
    'message', 'Convite aceito com sucesso!'
  );
END;
$$;
