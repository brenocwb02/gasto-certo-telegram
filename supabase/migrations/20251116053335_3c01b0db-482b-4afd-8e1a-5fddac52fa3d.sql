-- Remover constraint única que impede usuário de estar em múltiplos grupos
ALTER TABLE family_members DROP CONSTRAINT IF EXISTS family_members_member_id_key;

-- Garantir que existe constraint única composta para evitar duplicatas no mesmo grupo
ALTER TABLE family_members DROP CONSTRAINT IF EXISTS family_members_group_id_member_id_key;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'family_members_group_id_member_id_unique'
  ) THEN
    ALTER TABLE family_members ADD CONSTRAINT family_members_group_id_member_id_unique UNIQUE (group_id, member_id);
  END IF;
END $$;