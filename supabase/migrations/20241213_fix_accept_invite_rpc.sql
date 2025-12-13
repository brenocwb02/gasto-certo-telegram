-- =====================================================
-- FIX: Permitir que o Bot do Telegram (Service Role) aceite convites
-- Adiciona parâmetro opcional p_user_id para quando auth.uid() não estiver disponível
-- =====================================================

CREATE OR REPLACE FUNCTION public.accept_family_invite(invite_token TEXT, p_user_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  invite_record RECORD;
  existing_member RECORD;
BEGIN
  -- Determinar qual usuário está aceitando
  -- Se p_user_id for passado (Bot), usa ele. Se não (Web), usa o usuário logado via auth.uid()
  target_user_id := COALESCE(p_user_id, auth.uid());

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não identificado. Faça login ou forneça o ID do usuário.';
  END IF;

  -- 1. Buscar convite válido
  SELECT * INTO invite_record
  FROM public.family_invites
  WHERE token = invite_token
  AND status = 'pending'
  AND expires_at > NOW();

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou expirado.';
  END IF;

  -- 2. Verificar se já é membro
  SELECT * INTO existing_member
  FROM public.family_members
  WHERE group_id = invite_record.group_id
  AND member_id = target_user_id;

  IF existing_member IS NOT NULL THEN
    RAISE EXCEPTION 'Você já é membro deste grupo (ID: %).', invite_record.group_id;
  END IF;

  -- 3. Adicionar membro
  INSERT INTO public.family_members (group_id, member_id, role, status)
  VALUES (invite_record.group_id, target_user_id, invite_record.role, 'active');

  -- 4. Atualizar status do convite
  UPDATE public.family_invites
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = invite_record.id;

  RETURN json_build_object(
    'success', true,
    'group_id', invite_record.group_id,
    'message', 'Convite aceito com sucesso!'
  );
END;
$$;
