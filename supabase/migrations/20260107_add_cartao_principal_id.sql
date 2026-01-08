-- Migration: add_cartao_principal_id
-- Description: Add cartao_principal_id column to link additional cards to principal cards

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS cartao_principal_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN accounts.cartao_principal_id IS 'ID do cartão principal (titular). Se NULL, este é o cartão principal. Se preenchido, é um cartão adicional vinculado ao principal.';
