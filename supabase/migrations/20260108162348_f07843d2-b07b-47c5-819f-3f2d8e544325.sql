-- Remover a função antiga que causa conflito de overload
DROP FUNCTION IF EXISTS get_admin_users(integer, integer, text);

-- Garantir que a nova função existe corretamente
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

  RETURN QUERY
  SELECT 
    p.user_id,
    p.nome,
    au.email::TEXT,
    p.created_at,
    (p.telegram_chat_id IS NOT NULL) AS telegram_connected,
    COALESCE(l.status, 'sem_licenca')::TEXT AS license_status,
    COALESCE(l.plano, 'gratuito')::TEXT AS license_plano,
    COALESCE(l.tipo, 'mensal')::TEXT AS license_tipo,
    l.data_expiracao AS license_expiracao
  FROM profiles p
  JOIN auth.users au ON p.user_id = au.id
  LEFT JOIN licenses l ON p.user_id = l.user_id
  WHERE 
    (p_search IS NULL OR p_search = '' OR 
     p.nome ILIKE '%' || p_search || '%' OR 
     au.email ILIKE '%' || p_search || '%')
    AND (p_plano IS NULL OR p_plano = '' OR 
         COALESCE(l.plano, 'gratuito') = p_plano)
    AND (p_status IS NULL OR p_status = '' OR 
         COALESCE(l.status, 'sem_licenca') = p_status)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;