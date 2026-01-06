
-- Função para obter estatísticas administrativas completas
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  total_users INTEGER;
  active_licenses INTEGER;
  free_users INTEGER;
  premium_users INTEGER;
  familia_users INTEGER;
  mrr NUMERIC;
  new_users_30d INTEGER;
  new_users_7d INTEGER;
BEGIN
  -- Verificar se usuário é admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  -- Total de usuários
  SELECT COUNT(*) INTO total_users FROM profiles;
  
  -- Licenças ativas
  SELECT COUNT(*) INTO active_licenses 
  FROM licenses WHERE status = 'ativo';
  
  -- Usuários por plano
  SELECT COUNT(*) INTO premium_users 
  FROM licenses WHERE status = 'ativo' AND plano = 'premium';
  
  SELECT COUNT(*) INTO familia_users 
  FROM licenses WHERE status = 'ativo' AND plano IN ('familia', 'familia_plus');
  
  -- Usuários gratuitos (sem licença ativa ou plano gratuito)
  SELECT COUNT(*) INTO free_users
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM licenses l 
    WHERE l.user_id = p.user_id 
    AND l.status = 'ativo' 
    AND l.plano != 'gratuito'
  );
  
  -- MRR estimado (R$29.90 por premium, R$49.90 por família)
  mrr := (premium_users * 29.90) + (familia_users * 49.90);
  
  -- Novos usuários últimos 30 dias
  SELECT COUNT(*) INTO new_users_30d 
  FROM profiles 
  WHERE created_at >= NOW() - INTERVAL '30 days';
  
  -- Novos usuários últimos 7 dias
  SELECT COUNT(*) INTO new_users_7d 
  FROM profiles 
  WHERE created_at >= NOW() - INTERVAL '7 days';

  result := json_build_object(
    'total_users', total_users,
    'active_licenses', active_licenses,
    'free_users', free_users,
    'premium_users', premium_users,
    'familia_users', familia_users,
    'mrr', mrr,
    'new_users_30d', new_users_30d,
    'new_users_7d', new_users_7d,
    'conversion_rate', CASE WHEN total_users > 0 
      THEN ROUND(((premium_users + familia_users)::NUMERIC / total_users) * 100, 2) 
      ELSE 0 END
  );

  RETURN result;
END;
$$;

-- Função para listar usuários com detalhes de licença (para admin)
CREATE OR REPLACE FUNCTION get_admin_users(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE(
  user_id UUID,
  nome TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  telegram_connected BOOLEAN,
  license_status TEXT,
  license_plano TEXT,
  license_tipo TEXT,
  license_expiracao TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se usuário é admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    p.nome,
    COALESCE(au.email, 'N/A') as email,
    p.created_at,
    (p.telegram_chat_id IS NOT NULL) as telegram_connected,
    COALESCE(l.status, 'sem_licenca') as license_status,
    COALESCE(l.plano, 'gratuito') as license_plano,
    COALESCE(l.tipo, 'N/A') as license_tipo,
    l.data_expiracao as license_expiracao
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN LATERAL (
    SELECT * FROM licenses 
    WHERE licenses.user_id = p.user_id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) l ON true
  WHERE (p_search IS NULL OR p.nome ILIKE '%' || p_search || '%' OR au.email ILIKE '%' || p_search || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Função para atualizar licença de usuário (admin only)
CREATE OR REPLACE FUNCTION admin_update_license(
  p_user_id UUID,
  p_plano TEXT,
  p_status TEXT DEFAULT 'ativo',
  p_tipo TEXT DEFAULT 'mensal',
  p_data_expiracao TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Log da ação
  PERFORM log_admin_access(
    'license_update',
    p_user_id,
    jsonb_build_object('plano', p_plano, 'status', p_status, 'tipo', p_tipo),
    v_license_id::TEXT,
    'licenses'
  );

  RETURN json_build_object('success', true, 'license_id', v_license_id);
END;
$$;
