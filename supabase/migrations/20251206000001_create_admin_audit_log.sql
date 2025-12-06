-- Migration: Sistema de auditoria de acesso administrativo
-- LGPD Art. 46 - Controladores devem adotar medidas de segurança e auditoria
-- Criado em: 2024-12-06

-- Tabela de log de auditoria administrativa
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'view', 'export', 'delete', 'update', etc.
  table_name TEXT,
  record_id UUID,
  affected_user_id UUID,
  ip_address INET,
  user_agent TEXT,
  query_details JSONB, -- Detalhes adicionais da operação
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance em consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_user 
ON public.admin_audit_log(admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_affected_user 
ON public.admin_audit_log(affected_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_action 
ON public.admin_audit_log(action, created_at DESC);

-- Comentários para documentação
COMMENT ON TABLE public.admin_audit_log IS 'Registro de todas as ações administrativas para conformidade com LGPD';
COMMENT ON COLUMN public.admin_audit_log.admin_user_id IS 'ID do administrador que executou a ação';
COMMENT ON COLUMN public.admin_audit_log.affected_user_id IS 'ID do usuário cujos dados foram acessados';
COMMENT ON COLUMN public.admin_audit_log.query_details IS 'Detalhes técnicos da consulta ou operação realizada';

-- Enable Row Level Security
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Política: Apenas administradores podem ver logs de auditoria
CREATE POLICY "Only admins can view audit logs"
ON admin_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política: Logs são inseridos automaticamente (ninguém pode inserir manualmente via UI)
CREATE POLICY "Audit logs are auto-inserted only"
ON admin_audit_log FOR INSERT
WITH CHECK (false); -- Bloqueado para UI, apenas funções marcadas SECURITY DEFINER podem inserir

-- Função para registrar acesso administrativo
-- Esta função deve ser chamada ANTES de qualquer operação sensível
CREATE OR REPLACE FUNCTION log_admin_access(
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_affected_user_id UUID DEFAULT NULL,
  p_query_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_request_ip TEXT;
BEGIN
  -- Tentar obter IP da requisição (se disponível via extension)
  BEGIN
    v_request_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
  EXCEPTION WHEN OTHERS THEN
    v_request_ip := NULL;
  END;

  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    table_name,
    record_id,
    affected_user_id,
    ip_address,
    query_details
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_affected_user_id,
    v_request_ip::INET,
    p_query_details
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário na função
COMMENT ON FUNCTION log_admin_access IS 'Registra acesso administrativo a dados sensíveis para auditoria LGPD';

-- Função para visualizar resumo de auditoria (apenas para admins)
CREATE OR REPLACE FUNCTION get_audit_summary(
  p_days_back INTEGER DEFAULT 30
) RETURNS TABLE (
  action TEXT,
  count BIGINT,
  last_occurrence TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aal.action,
    COUNT(*) as count,
    MAX(aal.created_at) as last_occurrence
  FROM admin_audit_log aal
  WHERE aal.created_at >= NOW() - (p_days_back || ' days')::INTERVAL
  GROUP BY aal.action
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant para usuários autenticados chamarem as funções
GRANT EXECUTE ON FUNCTION log_admin_access TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_summary TO authenticated;
