-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telegram_id TEXT UNIQUE,
  telefone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create licenses table for user licensing
CREATE TABLE public.licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'revogado', 'expirado')),
  tipo TEXT NOT NULL DEFAULT 'vitalicia' CHECK (tipo IN ('vitalicia', 'mensal', 'anual')),
  data_ativacao TIMESTAMP WITH TIME ZONE,
  data_expiracao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#6366f1',
  icone TEXT DEFAULT 'shopping-bag',
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, nome)
);

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('corrente', 'poupanca', 'cartao', 'investimento', 'dinheiro')),
  banco TEXT,
  saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
  saldo_atual DECIMAL(10,2) NOT NULL DEFAULT 0,
  cor TEXT DEFAULT '#10b981',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, nome)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'transferencia')),
  valor DECIMAL(10,2) NOT NULL,
  conta_origem_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  conta_destino_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  data_transacao DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  tags TEXT[],
  anexos JSONB DEFAULT '[]',
  origem TEXT DEFAULT 'web' CHECK (origem IN ('web', 'telegram', 'api')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  valor_meta DECIMAL(10,2) NOT NULL,
  valor_atual DECIMAL(10,2) NOT NULL DEFAULT 0,
  tipo_periodo TEXT NOT NULL CHECK (tipo_periodo IN ('mensal', 'anual', 'personalizado')),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'concluida', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create telegram_sessions table for bot integration
CREATE TABLE public.telegram_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id TEXT NOT NULL UNIQUE,
  chat_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  ultimo_comando TEXT,
  contexto JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for licenses
CREATE POLICY "Users can view their own licenses" ON public.licenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own licenses" ON public.licenses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for categories
CREATE POLICY "Users can manage their own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for accounts
CREATE POLICY "Users can manage their own accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can manage their own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for goals
CREATE POLICY "Users can manage their own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for telegram_sessions
CREATE POLICY "Users can manage their own telegram sessions" ON public.telegram_sessions FOR ALL USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_telegram_sessions_updated_at BEFORE UPDATE ON public.telegram_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  
  -- Create default license for new user
  INSERT INTO public.licenses (user_id, codigo, status, tipo, data_ativacao)
  VALUES (NEW.id, 'TRIAL-' || substr(NEW.id::text, 1, 8), 'ativo', 'vitalicia', now());
  
  -- Create default categories
  INSERT INTO public.categories (user_id, nome, tipo, cor, icone) VALUES
  (NEW.id, 'Alimentação', 'despesa', '#ef4444', 'utensils'),
  (NEW.id, 'Transporte', 'despesa', '#f97316', 'car'),
  (NEW.id, 'Moradia', 'despesa', '#8b5cf6', 'home'),
  (NEW.id, 'Lazer', 'despesa', '#06b6d4', 'gamepad-2'),
  (NEW.id, 'Saúde', 'despesa', '#10b981', 'heart'),
  (NEW.id, 'Salário', 'receita', '#22c55e', 'banknote'),
  (NEW.id, 'Freelance', 'receita', '#3b82f6', 'laptop'),
  (NEW.id, 'Investimentos', 'receita', '#f59e0b', 'trending-up');
  
  -- Create default accounts
  INSERT INTO public.accounts (user_id, nome, tipo, saldo_inicial, saldo_atual, cor) VALUES
  (NEW.id, 'Carteira', 'dinheiro', 0, 0, '#10b981'),
  (NEW.id, 'Conta Corrente', 'corrente', 0, 0, '#3b82f6');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update account balances
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.tipo = 'receita' AND NEW.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual + NEW.valor 
      WHERE id = NEW.conta_origem_id;
    ELSIF NEW.tipo = 'despesa' AND NEW.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual - NEW.valor 
      WHERE id = NEW.conta_origem_id;
    ELSIF NEW.tipo = 'transferencia' THEN
      IF NEW.conta_origem_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual - NEW.valor 
        WHERE id = NEW.conta_origem_id;
      END IF;
      IF NEW.conta_destino_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual + NEW.valor 
        WHERE id = NEW.conta_destino_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Reverse old transaction
    IF OLD.tipo = 'receita' AND OLD.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual - OLD.valor 
      WHERE id = OLD.conta_origem_id;
    ELSIF OLD.tipo = 'despesa' AND OLD.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual + OLD.valor 
      WHERE id = OLD.conta_origem_id;
    ELSIF OLD.tipo = 'transferencia' THEN
      IF OLD.conta_origem_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual + OLD.valor 
        WHERE id = OLD.conta_origem_id;
      END IF;
      IF OLD.conta_destino_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual - OLD.valor 
        WHERE id = OLD.conta_destino_id;
      END IF;
    END IF;
    
    -- Apply new transaction
    IF NEW.tipo = 'receita' AND NEW.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual + NEW.valor 
      WHERE id = NEW.conta_origem_id;
    ELSIF NEW.tipo = 'despesa' AND NEW.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual - NEW.valor 
      WHERE id = NEW.conta_origem_id;
    ELSIF NEW.tipo = 'transferencia' THEN
      IF NEW.conta_origem_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual - NEW.valor 
        WHERE id = NEW.conta_origem_id;
      END IF;
      IF NEW.conta_destino_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual + NEW.valor 
        WHERE id = NEW.conta_destino_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.tipo = 'receita' AND OLD.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual - OLD.valor 
      WHERE id = OLD.conta_origem_id;
    ELSIF OLD.tipo = 'despesa' AND OLD.conta_origem_id IS NOT NULL THEN
      UPDATE public.accounts 
      SET saldo_atual = saldo_atual + OLD.valor 
      WHERE id = OLD.conta_origem_id;
    ELSIF OLD.tipo = 'transferencia' THEN
      IF OLD.conta_origem_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual + OLD.valor 
        WHERE id = OLD.conta_origem_id;
      END IF;
      IF OLD.conta_destino_id IS NOT NULL THEN
        UPDATE public.accounts 
        SET saldo_atual = saldo_atual - OLD.valor 
        WHERE id = OLD.conta_destino_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic balance updates
CREATE TRIGGER update_account_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, data_transacao DESC);
CREATE INDEX idx_transactions_categoria ON public.transactions(categoria_id);
CREATE INDEX idx_transactions_conta_origem ON public.transactions(conta_origem_id);
CREATE INDEX idx_transactions_tipo ON public.transactions(tipo);
CREATE INDEX idx_accounts_user ON public.accounts(user_id);
CREATE INDEX idx_categories_user ON public.categories(user_id);
CREATE INDEX idx_goals_user ON public.goals(user_id);
CREATE INDEX idx_licenses_codigo ON public.licenses(codigo);
CREATE INDEX idx_telegram_sessions_telegram_id ON public.telegram_sessions(telegram_id);