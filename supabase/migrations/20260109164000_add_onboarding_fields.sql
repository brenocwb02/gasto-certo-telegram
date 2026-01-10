-- Migration: Add onboarding fields to profiles
-- Stores user's financial objective and onboarding state

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS objetivo_financeiro TEXT,
ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT NULL;

COMMENT ON COLUMN profiles.objetivo_financeiro IS 'User financial goal: economizar, controlar, quitar_dividas, realizar_sonho';
COMMENT ON COLUMN profiles.onboarding_step IS 'Current onboarding step: awaiting_name, awaiting_goal, completed';
