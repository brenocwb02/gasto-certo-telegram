-- Remove colunas antigas de bot individual por usuário
-- Agora usamos um único bot centralizado (@BoasContasBot)
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS telegram_bot_token;

-- Manter telegram_chat_id pois é necessário para identificar o chat do usuário
-- Mas remover a tabela telegram_integration antiga se existir
DROP TABLE IF EXISTS public.telegram_integration CASCADE;

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.telegram_chat_id IS 'ID do chat do Telegram vinculado ao usuário para uso com @BoasContasBot';