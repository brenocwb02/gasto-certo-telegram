
-- Corrigir a função admin_update_license com a ordem correta dos parâmetros no log_admin_access
CREATE OR REPLACE FUNCTION public.admin_update_license(
  p_user_id uuid, 
  p_plano text, 
  p_status text DEFAULT 'ativo'::text, 
  p_tipo text DEFAULT 'mensal'::text, 
  p_data_expiracao timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_license_id UUID;
  v_codigo TEXT;
BEGIN
  -- Verificar se usuário é admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Gerar código único
  v_codigo := 'ADM-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  -- Verificar se já existe licença ativa
  SELECT id INTO v_license_id
  FROM licenses
  WHERE user_id = p_user_id AND status = 'ativo'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_license_id IS NOT NULL THEN
    -- Atualizar licença existente
    UPDATE licenses
    SET 
      plano = p_plano,
      status = p_status,
      tipo = p_tipo,
      data_expiracao = p_data_expiracao,
      updated_at = NOW()
    WHERE id = v_license_id;
  ELSE
    -- Criar nova licença
    INSERT INTO licenses (user_id, codigo, plano, status, tipo, data_ativacao, data_expiracao)
    VALUES (p_user_id, v_codigo, p_plano, p_status, p_tipo, NOW(), p_data_expiracao)
    RETURNING id INTO v_license_id;
  END IF;

  -- Log da ação - CORRIGIDO: ordem correta dos parâmetros
  -- p_action, p_table_name, p_record_id, p_affected_user_id, p_query_details
  PERFORM log_admin_access(
    'license_update',           -- p_action (text)
    'licenses',                 -- p_table_name (text)
    v_license_id,               -- p_record_id (uuid)
    p_user_id,                  -- p_affected_user_id (uuid)
    jsonb_build_object('plano', p_plano, 'status', p_status, 'tipo', p_tipo)  -- p_query_details (jsonb)
  );

  RETURN json_build_object('success', true, 'license_id', v_license_id);
END;
$$;
