-- Adicionar coluna onboarding_completed à tabela profiles
-- Migration: 20250115000003_add_onboarding_completed_to_profiles.sql

-- Adicionar coluna onboarding_completed
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Indica se o usuário completou o processo de onboarding guiado';

-- Criar índice para otimizar consultas por onboarding_completed
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON public.profiles(onboarding_completed) 
WHERE onboarding_completed = false;
