-- Criar tabela financial_profile para quiz de saúde financeira
-- Migration: 20250115000004_create_financial_profile.sql

-- Criar tabela financial_profile
CREATE TABLE public.financial_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Respostas do quiz
  emergency_fund TEXT NOT NULL CHECK (emergency_fund IN ('none', 'less_than_1_month', '1_to_3_months', '3_to_6_months', 'more_than_6_months')),
  debt_situation TEXT NOT NULL CHECK (debt_situation IN ('no_debt', 'low_debt', 'moderate_debt', 'high_debt', 'overwhelming_debt')),
  savings_rate TEXT NOT NULL CHECK (savings_rate IN ('negative', '0_to_5_percent', '5_to_10_percent', '10_to_20_percent', 'more_than_20_percent')),
  investment_knowledge TEXT NOT NULL CHECK (investment_knowledge IN ('beginner', 'basic', 'intermediate', 'advanced', 'expert')),
  financial_goals TEXT NOT NULL CHECK (financial_goals IN ('survival', 'stability', 'growth', 'wealth_building', 'legacy')),
  budget_control TEXT NOT NULL CHECK (budget_control IN ('no_budget', 'informal', 'basic_tracking', 'detailed_budget', 'advanced_planning')),
  insurance_coverage TEXT NOT NULL CHECK (insurance_coverage IN ('none', 'basic', 'adequate', 'comprehensive', 'excellent')),
  retirement_planning TEXT NOT NULL CHECK (retirement_planning IN ('not_started', 'thinking_about_it', 'basic_plan', 'detailed_plan', 'expert_level')),
  
  -- Score calculado (0-100)
  financial_health_score INTEGER NOT NULL DEFAULT 0 CHECK (financial_health_score >= 0 AND financial_health_score <= 100),
  
  -- Recomendações personalizadas
  recommendations JSONB DEFAULT '[]',
  
  -- Metadados
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Garantir apenas um perfil por usuário
  UNIQUE(user_id)
);

-- Criar índices para otimizar consultas
CREATE INDEX idx_financial_profile_user_id ON public.financial_profile(user_id);
CREATE INDEX idx_financial_profile_score ON public.financial_profile(financial_health_score);

-- Habilitar RLS
ALTER TABLE public.financial_profile ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can view their own financial profile" 
ON public.financial_profile FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial profile" 
ON public.financial_profile FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial profile" 
ON public.financial_profile FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial profile" 
ON public.financial_profile FOR DELETE 
USING (auth.uid() = user_id);

-- Função para calcular score de saúde financeira
CREATE OR REPLACE FUNCTION public.calculate_financial_health_score(
  p_emergency_fund TEXT,
  p_debt_situation TEXT,
  p_savings_rate TEXT,
  p_investment_knowledge TEXT,
  p_financial_goals TEXT,
  p_budget_control TEXT,
  p_insurance_coverage TEXT,
  p_retirement_planning TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Fundo de emergência (0-20 pontos)
  CASE p_emergency_fund
    WHEN 'none' THEN score := score + 0;
    WHEN 'less_than_1_month' THEN score := score + 5;
    WHEN '1_to_3_months' THEN score := score + 10;
    WHEN '3_to_6_months' THEN score := score + 15;
    WHEN 'more_than_6_months' THEN score := score + 20;
  END CASE;
  
  -- Situação de dívidas (0-20 pontos)
  CASE p_debt_situation
    WHEN 'overwhelming_debt' THEN score := score + 0;
    WHEN 'high_debt' THEN score := score + 5;
    WHEN 'moderate_debt' THEN score := score + 10;
    WHEN 'low_debt' THEN score := score + 15;
    WHEN 'no_debt' THEN score := score + 20;
  END CASE;
  
  -- Taxa de poupança (0-15 pontos)
  CASE p_savings_rate
    WHEN 'negative' THEN score := score + 0;
    WHEN '0_to_5_percent' THEN score := score + 3;
    WHEN '5_to_10_percent' THEN score := score + 6;
    WHEN '10_to_20_percent' THEN score := score + 10;
    WHEN 'more_than_20_percent' THEN score := score + 15;
  END CASE;
  
  -- Conhecimento de investimentos (0-15 pontos)
  CASE p_investment_knowledge
    WHEN 'beginner' THEN score := score + 0;
    WHEN 'basic' THEN score := score + 3;
    WHEN 'intermediate' THEN score := score + 6;
    WHEN 'advanced' THEN score := score + 10;
    WHEN 'expert' THEN score := score + 15;
  END CASE;
  
  -- Objetivos financeiros (0-10 pontos)
  CASE p_financial_goals
    WHEN 'survival' THEN score := score + 0;
    WHEN 'stability' THEN score := score + 2;
    WHEN 'growth' THEN score := score + 4;
    WHEN 'wealth_building' THEN score := score + 7;
    WHEN 'legacy' THEN score := score + 10;
  END CASE;
  
  -- Controle de orçamento (0-10 pontos)
  CASE p_budget_control
    WHEN 'no_budget' THEN score := score + 0;
    WHEN 'informal' THEN score := score + 2;
    WHEN 'basic_tracking' THEN score := score + 4;
    WHEN 'detailed_budget' THEN score := score + 7;
    WHEN 'advanced_planning' THEN score := score + 10;
  END CASE;
  
  -- Cobertura de seguros (0-5 pontos)
  CASE p_insurance_coverage
    WHEN 'none' THEN score := score + 0;
    WHEN 'basic' THEN score := score + 1;
    WHEN 'adequate' THEN score := score + 2;
    WHEN 'comprehensive' THEN score := score + 4;
    WHEN 'excellent' THEN score := score + 5;
  END CASE;
  
  -- Planejamento de aposentadoria (0-5 pontos)
  CASE p_retirement_planning
    WHEN 'not_started' THEN score := score + 0;
    WHEN 'thinking_about_it' THEN score := score + 1;
    WHEN 'basic_plan' THEN score := score + 2;
    WHEN 'detailed_plan' THEN score := score + 4;
    WHEN 'expert_level' THEN score := score + 5;
  END CASE;
  
  RETURN score;
END;
$$;

-- Função para gerar recomendações baseadas no score
CREATE OR REPLACE FUNCTION public.generate_financial_recommendations(
  p_score INTEGER,
  p_emergency_fund TEXT,
  p_debt_situation TEXT,
  p_savings_rate TEXT,
  p_investment_knowledge TEXT,
  p_financial_goals TEXT,
  p_budget_control TEXT,
  p_insurance_coverage TEXT,
  p_retirement_planning TEXT
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  recommendations JSONB := '[]';
BEGIN
  -- Recomendações baseadas no score geral
  IF p_score < 30 THEN
    recommendations := recommendations || '["Priorize criar um fundo de emergência", "Foque em eliminar dívidas de alto juro", "Comece com um orçamento básico"]';
  ELSIF p_score < 50 THEN
    recommendations := recommendations || '["Melhore sua taxa de poupança", "Considere investimentos básicos", "Revise seu planejamento de seguros"]';
  ELSIF p_score < 70 THEN
    recommendations := recommendations || '["Diversifique seus investimentos", "Otimize seu planejamento de aposentadoria", "Considere estratégias avançadas"]';
  ELSE
    recommendations := recommendations || '["Mantenha sua disciplina financeira", "Considere estratégias de wealth building", "Pense em legado e filantropia"]';
  END IF;
  
  -- Recomendações específicas baseadas nas respostas
  IF p_emergency_fund IN ('none', 'less_than_1_month') THEN
    recommendations := recommendations || '["Construa um fundo de emergência de 3-6 meses de gastos"]';
  END IF;
  
  IF p_debt_situation IN ('high_debt', 'overwhelming_debt') THEN
    recommendations := recommendations || '["Priorize o pagamento de dívidas com juros altos"]';
  END IF;
  
  IF p_savings_rate IN ('negative', '0_to_5_percent') THEN
    recommendations := recommendations || '["Aumente sua taxa de poupança gradualmente"]';
  END IF;
  
  IF p_investment_knowledge IN ('beginner', 'basic') THEN
    recommendations := recommendations || '["Educação financeira: aprenda sobre investimentos básicos"]';
  END IF;
  
  IF p_budget_control IN ('no_budget', 'informal') THEN
    recommendations := recommendations || '["Implemente um sistema de controle de gastos"]';
  END IF;
  
  IF p_insurance_coverage IN ('none', 'basic') THEN
    recommendations := recommendations || '["Revise sua cobertura de seguros essenciais"]';
  END IF;
  
  IF p_retirement_planning IN ('not_started', 'thinking_about_it') THEN
    recommendations := recommendations || '["Comece a planejar sua aposentadoria"]';
  END IF;
  
  RETURN recommendations;
END;
$$;

-- Trigger para calcular score e recomendações automaticamente
CREATE OR REPLACE FUNCTION public.update_financial_profile_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calcular score
  NEW.financial_health_score := public.calculate_financial_health_score(
    NEW.emergency_fund,
    NEW.debt_situation,
    NEW.savings_rate,
    NEW.investment_knowledge,
    NEW.financial_goals,
    NEW.budget_control,
    NEW.insurance_coverage,
    NEW.retirement_planning
  );
  
  -- Gerar recomendações
  NEW.recommendations := public.generate_financial_recommendations(
    NEW.financial_health_score,
    NEW.emergency_fund,
    NEW.debt_situation,
    NEW.savings_rate,
    NEW.investment_knowledge,
    NEW.financial_goals,
    NEW.budget_control,
    NEW.insurance_coverage,
    NEW.retirement_planning
  );
  
  -- Atualizar timestamp
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_financial_profile_score
  BEFORE INSERT OR UPDATE ON public.financial_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_financial_profile_score();

-- Comentários para documentação
COMMENT ON TABLE public.financial_profile IS 'Perfil financeiro do usuário baseado em quiz de saúde financeira';
COMMENT ON COLUMN public.financial_profile.financial_health_score IS 'Score de saúde financeira de 0-100 calculado automaticamente';
COMMENT ON COLUMN public.financial_profile.recommendations IS 'Recomendações personalizadas baseadas nas respostas do quiz';
