-- Atualizar tabela de licenças para suportar tipos específicos
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS plano TEXT NOT NULL DEFAULT 'gratuito';

-- Atualizar licenças existentes para serem premium (já que eram vitalícias)
UPDATE public.licenses SET plano = 'premium' WHERE tipo = 'vitalicia';

-- Criar função para gerar códigos únicos de ativação
CREATE OR REPLACE FUNCTION public.generate_activation_code(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN 'GC-' || UPPER(SUBSTR(user_uuid::TEXT, 1, 8));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar códigos existentes
UPDATE public.licenses SET codigo = public.generate_activation_code(user_id) WHERE codigo LIKE 'TRIAL-%';

-- Adicionar RLS policy para verificação de plano
CREATE OR REPLACE FUNCTION public.get_user_license_plan(target_user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT plano 
    FROM public.licenses 
    WHERE user_id = target_user_id 
    AND status = 'ativo' 
    ORDER BY created_at DESC 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;