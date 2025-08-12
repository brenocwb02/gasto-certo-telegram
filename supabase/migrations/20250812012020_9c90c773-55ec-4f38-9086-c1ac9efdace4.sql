-- Adicionar campos para cartão de crédito na tabela accounts
ALTER TABLE public.accounts 
ADD COLUMN dia_fechamento INTEGER,
ADD COLUMN dia_vencimento INTEGER,
ADD COLUMN limite_credito NUMERIC DEFAULT 0;

-- Atualizar enum de tipos para incluir cartão de crédito
-- Como não podemos alterar enum diretamente, vamos permitir valores adicionais
-- Primeiro vamos verificar se já existem cartões
UPDATE public.accounts SET tipo = 'cartao_credito' WHERE tipo = 'cartao_credito';

-- Criar tabela para configurações do bot do Telegram para cada usuário
CREATE TABLE public.telegram_bot_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bot_token TEXT NOT NULL,
  bot_username TEXT,
  webhook_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_bot_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for telegram_bot_configs
CREATE POLICY "Users can manage their own bot configs" 
ON public.telegram_bot_configs 
FOR ALL 
USING (auth.uid() = user_id);

-- Add trigger for timestamps
CREATE TRIGGER update_telegram_bot_configs_updated_at
BEFORE UPDATE ON public.telegram_bot_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campo parent_id já existe na tabela categories para subcategorias
-- Vamos garantir que esteja correto
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_tipo ON public.categories(user_id, tipo);
CREATE INDEX IF NOT EXISTS idx_accounts_user_tipo ON public.accounts(user_id, tipo);
CREATE INDEX IF NOT EXISTS idx_transactions_data_categoria ON public.transactions(data_transacao, categoria_id);

-- Função para calcular data de vencimento do cartão
CREATE OR REPLACE FUNCTION public.calcular_vencimento_cartao(
  data_transacao DATE,
  dia_fechamento INTEGER,
  dia_vencimento INTEGER
) RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
  data_fechamento DATE;
  data_vencimento DATE;
BEGIN
  -- Calcular data de fechamento da fatura
  data_fechamento := DATE_TRUNC('month', data_transacao) + INTERVAL '1 month' - INTERVAL '1 day';
  data_fechamento := data_fechamento - INTERVAL '1 day' * (EXTRACT(DAY FROM data_fechamento) - dia_fechamento);
  
  -- Se a transação foi depois do fechamento, vai para o próximo mês
  IF data_transacao > data_fechamento THEN
    data_fechamento := data_fechamento + INTERVAL '1 month';
  END IF;
  
  -- Calcular data de vencimento (dias após o fechamento)
  data_vencimento := data_fechamento + INTERVAL '1 day' * dia_vencimento;
  
  RETURN data_vencimento;
END;
$$;

-- Adicionar campo para data de vencimento nas transações
ALTER TABLE public.transactions 
ADD COLUMN data_vencimento DATE;