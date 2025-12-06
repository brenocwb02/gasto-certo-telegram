-- Verificar dados da tabela telegram_integration
SELECT * FROM telegram_integration;

-- Verificar dados da tabela profiles com telegram_chat_id
SELECT user_id, nome, telegram_chat_id 
FROM profiles 
WHERE telegram_chat_id IS NOT NULL;
