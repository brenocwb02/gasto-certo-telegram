-- Migration: Adicionar campos de consentimento LGPD e configurações de privacidade
-- LGPD Art. 8º - Consentimento do titular
-- Criado em: 2024-12-06

-- Adicionar campos de consentimento e privacidade ao perfil do usuário
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS lgpd_consent_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lgpd_consent_version TEXT DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
    "data_portability_enabled": true,
    "marketing_emails_enabled": false,
    "analytics_enabled": true,
    "data_sharing_enabled": false
  }'::jsonb;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.lgpd_consent_date IS 'Data em que o usuário aceitou os termos da LGPD';
COMMENT ON COLUMN public.profiles.lgpd_consent_version IS 'Versão dos termos aceitos pelo usuário';
COMMENT ON COLUMN public.profiles.privacy_settings IS 'Configurações de privacidade personalizadas do usuário';

-- Índice para buscar usuários que não aceitaram termos
CREATE INDEX IF NOT EXISTS idx_profiles_lgpd_consent 
ON public.profiles(lgpd_consent_date) 
WHERE lgpd_consent_date IS NULL;
