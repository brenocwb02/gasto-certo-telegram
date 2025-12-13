-- Adicionar coluna para vincular cartões adicionais ao principal
ALTER TABLE accounts 
ADD COLUMN parent_account_id UUID REFERENCES accounts(id);

-- Opcional: Criar índex para melhorar performance nas buscas
CREATE INDEX idx_accounts_parent ON accounts(parent_account_id);

-- Comentário para documentação do Schema
COMMENT ON COLUMN accounts.parent_account_id IS 'ID da conta pai. Usado para cartões adicionais vinculados a um titular.';
