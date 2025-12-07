-- Migration: Popular credit_card_settings para cartões existentes
-- Objetivo: Garantir que cartões criados antes da automação tenham suas configurações criadas

INSERT INTO credit_card_settings (account_id, user_id)
SELECT id, user_id
FROM accounts
WHERE tipo = 'cartao'
AND NOT EXISTS (
    SELECT 1 FROM credit_card_settings WHERE account_id = accounts.id
);

-- Verificar quantos foram inseridos (apenas log)
DO $$
DECLARE
    count_inserted INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_inserted
    FROM credit_card_settings
    WHERE created_at > NOW() - INTERVAL '1 minute';
    
    RAISE NOTICE 'Inseridos % registros de configuração para cartões existentes.', count_inserted;
END $$;
