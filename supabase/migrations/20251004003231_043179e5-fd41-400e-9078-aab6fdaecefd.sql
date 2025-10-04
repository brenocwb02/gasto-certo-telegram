-- Criar enum para tipos de ativos
CREATE TYPE public.asset_type AS ENUM ('acao', 'fii', 'etf', 'renda_fixa', 'cripto');

-- Tabela de carteira de investimentos
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ticker TEXT NOT NULL,
  asset_type public.asset_type NOT NULL,
  quantity NUMERIC DEFAULT 0,
  average_price NUMERIC DEFAULT 0,
  current_price NUMERIC DEFAULT 0,
  last_price_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- Tabela de histórico de operações
CREATE TABLE public.investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
  ticker TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('compra', 'venda', 'provento')),
  quantity NUMERIC,
  price NUMERIC,
  total_value NUMERIC NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar campos de dívida na tabela accounts
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS debt_type TEXT CHECK (debt_type IN ('emprestimo', 'financiamento', 'cartao')),
ADD COLUMN IF NOT EXISTS monthly_payment NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_installments INTEGER,
ADD COLUMN IF NOT EXISTS remaining_installments INTEGER;

-- Enable RLS
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para investments
CREATE POLICY "Family members can manage shared investments"
ON public.investments
FOR ALL
USING (auth.uid() = user_id OR is_family_member(user_id));

-- RLS Policies para investment_transactions
CREATE POLICY "Family members can manage shared investment transactions"
ON public.investment_transactions
FOR ALL
USING (auth.uid() = user_id OR is_family_member(user_id));

-- Trigger para atualizar updated_at em investments
CREATE TRIGGER update_investments_updated_at
BEFORE UPDATE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar preço médio após compra/venda
CREATE OR REPLACE FUNCTION public.update_investment_position()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_quantity NUMERIC;
  current_avg_price NUMERIC;
  new_quantity NUMERIC;
  new_avg_price NUMERIC;
BEGIN
  -- Busca posição atual
  SELECT quantity, average_price INTO current_quantity, current_avg_price
  FROM public.investments
  WHERE user_id = NEW.user_id AND ticker = NEW.ticker;
  
  -- Se não existe, cria
  IF NOT FOUND THEN
    IF NEW.transaction_type = 'compra' THEN
      INSERT INTO public.investments (user_id, ticker, asset_type, quantity, average_price)
      VALUES (NEW.user_id, NEW.ticker, 'acao', NEW.quantity, NEW.price);
    END IF;
    RETURN NEW;
  END IF;
  
  -- Atualiza posição baseado no tipo de transação
  IF NEW.transaction_type = 'compra' THEN
    new_quantity := current_quantity + NEW.quantity;
    new_avg_price := ((current_quantity * current_avg_price) + (NEW.quantity * NEW.price)) / new_quantity;
    
    UPDATE public.investments
    SET quantity = new_quantity,
        average_price = new_avg_price,
        updated_at = NOW()
    WHERE user_id = NEW.user_id AND ticker = NEW.ticker;
    
  ELSIF NEW.transaction_type = 'venda' THEN
    new_quantity := current_quantity - NEW.quantity;
    
    UPDATE public.investments
    SET quantity = GREATEST(0, new_quantity),
        updated_at = NOW()
    WHERE user_id = NEW.user_id AND ticker = NEW.ticker;
    
  ELSIF NEW.transaction_type = 'provento' THEN
    -- Proventos também criam uma transação de receita
    INSERT INTO public.transactions (
      user_id,
      descricao,
      tipo,
      valor,
      data_transacao,
      observacoes,
      origem
    ) VALUES (
      NEW.user_id,
      'Provento ' || NEW.ticker,
      'receita',
      NEW.total_value,
      NEW.transaction_date,
      NEW.notes,
      'investimentos'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar posição após transação
CREATE TRIGGER trigger_update_investment_position
AFTER INSERT ON public.investment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_investment_position();