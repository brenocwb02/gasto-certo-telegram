-- Migration: Populate telegram_integration from existing profiles data
-- Date: 2025-12-05
-- Purpose: Migrar dados existentes de profiles.telegram_chat_id para telegram_integration

-- Inserir dados existentes na tabela telegram_integration
INSERT INTO telegram_integration (user_id, telegram_chat_id, created_at, updated_at, default_context, show_context_confirmation, alert_at_80_percent, alert_at_90_percent)
SELECT 
  user_id,
  telegram_chat_id,
  now() as created_at,
  now() as updated_at,
  'personal' as default_context,
  true as show_context_confirmation,
  true as alert_at_80_percent,
  true as alert_at_90_percent
FROM profiles
WHERE telegram_chat_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Verificar quantos registros foram inseridos
SELECT COUNT(*) as total_migrated FROM telegram_integration;
