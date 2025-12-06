-- Migration: Create telegram_integration table with context fields
-- Date: 2025-12-05
-- Purpose: Consolidate telegram integration setup + Modelo 5 Híbrido context
--
-- This migration:
-- 1. Creates telegram_integration table (if not exists)
-- 2. Adds context fields for Modelo 5 Híbrido
-- 3. Creates RPC functions for context management

-- ============================================================================
-- STEP 1: CREATE TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.telegram_integration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id BIGINT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.telegram_integration ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists and recreate
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage their own telegram integration" ON public.telegram_integration;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Users can manage their own telegram integration"
ON public.telegram_integration
FOR ALL
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_telegram_integration_user_id ON public.telegram_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_integration_chat_id ON public.telegram_integration(telegram_chat_id);

-- Add telegram_chat_id to profiles for backward compatibility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'telegram_chat_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN telegram_chat_id BIGINT UNIQUE;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: ADD CONTEXT FIELDS (Modelo 5 Híbrido)
-- ============================================================================

-- Add context fields
DO $$
BEGIN
  -- default_context
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'telegram_integration' AND column_name = 'default_context'
  ) THEN
    ALTER TABLE public.telegram_integration 
    ADD COLUMN default_context VARCHAR(20) DEFAULT 'personal' 
    CHECK (default_context IN ('personal', 'group'));
  END IF;

  -- show_context_confirmation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'telegram_integration' AND column_name = 'show_context_confirmation'
  ) THEN
    ALTER TABLE public.telegram_integration 
    ADD COLUMN show_context_confirmation BOOLEAN DEFAULT true;
  END IF;

  -- alert_at_80_percent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'telegram_integration' AND column_name = 'alert_at_80_percent'
  ) THEN
    ALTER TABLE public.telegram_integration 
    ADD COLUMN alert_at_80_percent BOOLEAN DEFAULT true;
  END IF;

  -- alert_at_90_percent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'telegram_integration' AND column_name = 'alert_at_90_percent'
  ) THEN
    ALTER TABLE public.telegram_integration 
    ADD COLUMN alert_at_90_percent BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Comments
COMMENT ON TABLE public.telegram_integration IS 
'Armazena a vinculação entre usuários e seus chats do Telegram, incluindo configurações de contexto.';

COMMENT ON COLUMN public.telegram_integration.default_context IS 
'Contexto padrão do usuário no Telegram: personal (transações pessoais) ou group (transações do grupo familiar). 
Modelo 5 Híbrido: transações do grupo NÃO contam no limite pessoal.';

COMMENT ON COLUMN public.telegram_integration.show_context_confirmation IS 
'Se true, bot sempre mostra onde a transação foi registrada (🏠 Grupo / 👤 Pessoal).';

COMMENT ON COLUMN public.telegram_integration.alert_at_80_percent IS 
'Se true, bot avisa quando usuário atingir 80% do limite de transações pessoais.';

COMMENT ON COLUMN public.telegram_integration.alert_at_90_percent IS 
'Se true, bot avisa quando usuário atingir 90% do limite de transações pessoais.';

-- Create índice for context
CREATE INDEX IF NOT EXISTS idx_telegram_integration_default_context 
ON public.telegram_integration(default_context);

-- ============================================================================
-- STEP 3: RPC FUNCTIONS
-- ============================================================================

-- Function: Get user's telegram context
CREATE OR REPLACE FUNCTION public.get_telegram_context(p_user_id UUID)
RETURNS TABLE (
  default_context VARCHAR(20),
  show_context_confirmation BOOLEAN,
  alert_at_80_percent BOOLEAN,
  alert_at_90_percent BOOLEAN,
  current_group_id UUID,
  current_group_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ti.default_context,
    ti.show_context_confirmation,
    ti.alert_at_80_percent,
    ti.alert_at_90_percent,
    fm.group_id,
    fg.name
  FROM telegram_integration ti
  LEFT JOIN family_members fm ON fm.member_id = p_user_id AND fm.status = 'active'
  LEFT JOIN family_groups fg ON fg.id = fm.group_id
  WHERE ti.user_id = p_user_id
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_telegram_context(UUID) IS 
'Retorna configurações de contexto do Telegram e informações do grupo familiar do usuário.';

-- Function: Set user's telegram context
CREATE OR REPLACE FUNCTION public.set_telegram_context(
  p_user_id UUID,
  p_context VARCHAR(20)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar contexto
  IF p_context NOT IN ('personal', 'group') THEN
    RAISE EXCEPTION 'Contexto inválido. Use: personal ou group';
  END IF;

  -- Atualizar contexto
  UPDATE telegram_integration
  SET default_context = p_context,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.set_telegram_context(UUID, VARCHAR) IS 
'Define o contexto padrão do usuário no Telegram (personal ou group).';

-- Function: Update telegram settings
CREATE OR REPLACE FUNCTION public.update_telegram_settings(
  p_user_id UUID,
  p_show_context_confirmation BOOLEAN DEFAULT NULL,
  p_alert_at_80_percent BOOLEAN DEFAULT NULL,
  p_alert_at_90_percent BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE telegram_integration
  SET 
    show_context_confirmation = COALESCE(p_show_context_confirmation, show_context_confirmation),
    alert_at_80_percent = COALESCE(p_alert_at_80_percent, alert_at_80_percent),
    alert_at_90_percent = COALESCE(p_alert_at_90_percent, alert_at_90_percent),
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.update_telegram_settings IS 
'Atualiza configurações de notificações e confirmações do Telegram.';

-- ============================================================================
-- STEP 4: TRIGGER FOR DEFAULTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_telegram_integration_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set default values if NULL
  NEW.default_context := COALESCE(NEW.default_context, 'personal');
  NEW.show_context_confirmation := COALESCE(NEW.show_context_confirmation, true);
  NEW.alert_at_80_percent := COALESCE(NEW.alert_at_80_percent, true);
  NEW.alert_at_90_percent := COALESCE(NEW.alert_at_90_percent, true);
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_telegram_integration_defaults_trigger ON public.telegram_integration;
CREATE TRIGGER ensure_telegram_integration_defaults_trigger
  BEFORE INSERT OR UPDATE ON public.telegram_integration
  FOR EACH ROW
  EXECUTE FUNCTION ensure_telegram_integration_defaults();

-- ============================================================================
-- STEP 5: UPDATE EXISTING RECORDS
-- ============================================================================

UPDATE public.telegram_integration
SET 
  default_context = COALESCE(default_context, 'personal'),
  show_context_confirmation = COALESCE(show_context_confirmation, true),
  alert_at_80_percent = COALESCE(alert_at_80_percent, true),
  alert_at_90_percent = COALESCE(alert_at_90_percent, true),
  updated_at = now()
WHERE default_context IS NULL 
   OR show_context_confirmation IS NULL 
   OR alert_at_80_percent IS NULL 
   OR alert_at_90_percent IS NULL;
