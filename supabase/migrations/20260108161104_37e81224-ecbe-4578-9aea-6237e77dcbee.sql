-- Atualizar função get_admin_users para aceitar filtros de plano e status
CREATE OR REPLACE FUNCTION get_admin_users(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_plano TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
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
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar esta função';
  END IF;

  -- Log de auditoria
  PERFORM log_admin_access('list_users', NULL, jsonb_build_object(
    'search', p_search,
    'plano', p_plano,
    'status', p_status,
    'limit', p_limit,
    'offset', p_offset
  ));

  RETURN QUERY
  SELECT 
    p.user_id,
    p.nome,
    COALESCE(au.email, 'N/A') AS email,
    p.created_at,
    (p.telegram_chat_id IS NOT NULL) AS telegram_connected,
    COALESCE(l.status, 'sem_licenca') AS license_status,
    COALESCE(l.plano, 'gratuito') AS license_plano,
    COALESCE(l.tipo, 'N/A') AS license_tipo,
    l.data_expiracao AS license_expiracao
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN licenses l ON l.user_id = p.user_id
  WHERE 
    -- Filtro de busca
    (p_search IS NULL OR p_search = '' OR 
     p.nome ILIKE '%' || p_search || '%' OR 
     au.email ILIKE '%' || p_search || '%')
    -- Filtro de plano
    AND (p_plano IS NULL OR p_plano = '' OR p_plano = 'todos' OR COALESCE(l.plano, 'gratuito') = p_plano)
    -- Filtro de status
    AND (p_status IS NULL OR p_status = '' OR p_status = 'todos' OR 
         (p_status = 'sem_licenca' AND l.status IS NULL) OR
         COALESCE(l.status, 'sem_licenca') = p_status)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Criar função para contar total de usuários (para paginação)
CREATE OR REPLACE FUNCTION count_admin_users(
  p_search TEXT DEFAULT NULL,
  p_plano TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count INTEGER;
BEGIN
  -- Verificar se usuário é admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar esta função';
  END IF;

  SELECT COUNT(*)::INTEGER INTO total_count
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN licenses l ON l.user_id = p.user_id
  WHERE 
    -- Filtro de busca
    (p_search IS NULL OR p_search = '' OR 
     p.nome ILIKE '%' || p_search || '%' OR 
     au.email ILIKE '%' || p_search || '%')
    -- Filtro de plano
    AND (p_plano IS NULL OR p_plano = '' OR p_plano = 'todos' OR COALESCE(l.plano, 'gratuito') = p_plano)
    -- Filtro de status
    AND (p_status IS NULL OR p_status = '' OR p_status = 'todos' OR 
         (p_status = 'sem_licenca' AND l.status IS NULL) OR
         COALESCE(l.status, 'sem_licenca') = p_status);

  RETURN total_count;
END;
$$;