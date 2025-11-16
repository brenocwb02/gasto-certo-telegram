-- Remover constraint única que impede múltiplos grupos por usuário
ALTER TABLE family_groups DROP CONSTRAINT IF EXISTS family_groups_owner_id_key;

-- Criar índice para performance (sem unique)
CREATE INDEX IF NOT EXISTS idx_family_groups_owner_id ON family_groups(owner_id);