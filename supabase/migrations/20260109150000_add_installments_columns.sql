-- Add columns for structured installment tracking
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS parcela_atual INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS parcela_id UUID DEFAULT NULL;

COMMENT ON COLUMN public.transactions.parcela_atual IS 'Number of the current installment (e.g. 1)';
COMMENT ON COLUMN public.transactions.total_parcelas IS 'Total number of installments (e.g. 10)';
COMMENT ON COLUMN public.transactions.parcela_id IS 'UUID shared by all installments of the same purchase';
