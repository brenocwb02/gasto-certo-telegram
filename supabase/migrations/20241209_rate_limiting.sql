-- =====================================================
-- Migration: Rate Limiting System
-- Description: Protege o sistema contra abuso limitando
--              requisições a 60/min por usuário do Telegram
-- Created: 09/12/2024
-- =====================================================

-- 1. Criar tabela rate_limits
CREATE TABLE IF NOT EXISTS rate_limits (
  telegram_id BIGINT PRIMARY KEY,
  request_count INT DEFAULT 0 CHECK (request_count >= 0),
  window_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_updated ON rate_limits(updated_at);

-- 3. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_rate_limits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limits_timestamp();

-- 4. Função de auto-cleanup (registros antigos >2 min)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE window_start < NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql;

-- 5. Função RPC principal: check_rate_limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_telegram_id BIGINT,
  p_limit INT DEFAULT 60,
  p_window_seconds INT DEFAULT 60
)
RETURNS TABLE(
  allowed BOOLEAN, 
  remaining INT, 
  reset_at TIMESTAMPTZ,
  current_count INT
) AS $$
DECLARE
  v_count INT;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
BEGIN
  -- Calcular fim da janela
  v_window_end := NOW();
  
  -- Buscar registro existente
  SELECT request_count, window_start 
  INTO v_count, v_window_start
  FROM rate_limits
  WHERE telegram_id = p_telegram_id;

  -- Caso 1: Registro não existe (primeiro acesso)
  IF NOT FOUND THEN
    INSERT INTO rate_limits (telegram_id, request_count, window_start)
    VALUES (p_telegram_id, 1, NOW());
    
    RETURN QUERY SELECT 
      TRUE::BOOLEAN,                                              -- allowed
      (p_limit - 1)::INT,                                         -- remaining
      NOW() + (p_window_seconds || ' seconds')::INTERVAL,         -- reset_at
      1::INT;                                                     -- current_count
    RETURN;
  END IF;

  -- Caso 2: Janela expirou (resetar contador)
  IF v_window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN
    UPDATE rate_limits
    SET 
      request_count = 1, 
      window_start = NOW()
    WHERE telegram_id = p_telegram_id;
    
    RETURN QUERY SELECT 
      TRUE::BOOLEAN,
      (p_limit - 1)::INT,
      NOW() + (p_window_seconds || ' seconds')::INTERVAL,
      1::INT;
    RETURN;
  END IF;

  -- Caso 3: Dentro do limite (incrementar)
  IF v_count < p_limit THEN
    UPDATE rate_limits
    SET request_count = request_count + 1
    WHERE telegram_id = p_telegram_id;
    
    RETURN QUERY SELECT 
      TRUE::BOOLEAN,
      (p_limit - v_count - 1)::INT,
      v_window_start + (p_window_seconds || ' seconds')::INTERVAL,
      (v_count + 1)::INT;
    RETURN;
  END IF;

  -- Caso 4: Excedeu o limite (bloquear)
  RETURN QUERY SELECT 
    FALSE::BOOLEAN,
    0::INT,
    v_window_start + (p_window_seconds || ' seconds')::INTERVAL,
    v_count::INT;
END;
$$ LANGUAGE plpgsql;

-- 6. Comentários de documentação
COMMENT ON TABLE rate_limits IS 'Armazena contadores de requisições por telegram_id para rate limiting';
COMMENT ON COLUMN rate_limits.telegram_id IS 'ID único do usuário no Telegram';
COMMENT ON COLUMN rate_limits.request_count IS 'Número de requisições na janela atual';
COMMENT ON COLUMN rate_limits.window_start IS 'Timestamp de início da janela de rate limiting';
COMMENT ON FUNCTION check_rate_limit IS 'Verifica e atualiza rate limit para um telegram_id. Retorna allowed, remaining, reset_at e current_count';
COMMENT ON FUNCTION cleanup_old_rate_limits IS 'Remove registros de rate_limits com janelas mais antigas que 2 minutos';

-- 7. Dados iniciais para teste (opcional - comentado)
-- INSERT INTO rate_limits (telegram_id, request_count, window_start) 
-- VALUES (123456789, 0, NOW());

-- =====================================================
-- Testes Rápidos (executar via SQL Editor)
-- =====================================================
-- 
-- -- Teste 1: Primeira requisição (deve permitir)
-- SELECT * FROM check_rate_limit(999999999, 60, 60);
-- -- Esperado: allowed=true, remaining=59, current_count=1
--
-- -- Teste 2: Simular 60 requisições
-- DO $$
-- BEGIN
--   FOR i IN 1..60 LOOP
--     PERFORM check_rate_limit(888888888, 60, 60);
--   END LOOP;
-- END $$;
-- SELECT * FROM check_rate_limit(888888888, 60, 60);
-- -- Esperado: allowed=false, remaining=0, current_count=60
--
-- -- Teste 3: Verificar cleanup
-- SELECT cleanup_old_rate_limits();
-- SELECT COUNT(*) FROM rate_limits;
--
-- =====================================================
