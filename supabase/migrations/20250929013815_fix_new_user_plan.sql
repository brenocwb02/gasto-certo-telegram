-- Re-create the handle_new_user function to set the correct default plan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile as before
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  
  -- Create a default license with the 'gratuito' (free) plan explicitly
  INSERT INTO public.licenses (user_id, codigo, status, tipo, plano, data_ativacao)
  VALUES (NEW.id, 'GC-' || UPPER(SUBSTR(NEW.id::TEXT, 1, 8)), 'ativo', 'mensal', 'gratuito', now());
  
  -- Create default categories and accounts as before
  INSERT INTO public.categories (user_id, nome, tipo, cor, icone) VALUES
  (NEW.id, 'Alimentação', 'despesa', '#ef4444', 'utensils'),
  (NEW.id, 'Transporte', 'despesa', '#f97316', 'car'),
  (NEW.id, 'Moradia', 'despesa', '#8b5cf6', 'home'),
  (NEW.id, 'Lazer', 'despesa', '#06b6d4', 'gamepad-2'),
  (NEW.id, 'Saúde', 'despesa', '#10b981', 'heart'),
  (NEW.id, 'Salário', 'receita', '#22c55e', 'banknote'),
  (NEW.id, 'Freelance', 'receita', '#3b82f6', 'laptop'),
  (NEW.id, 'Investimentos', 'receita', '#f59e0b', 'trending-up');
  
  INSERT INTO public.accounts (user_id, nome, tipo, saldo_inicial, saldo_atual, cor) VALUES
  (NEW.id, 'Carteira', 'dinheiro', 0, 0, '#10b981'),
  (NEW.id, 'Conta Corrente', 'corrente', 0, 0, '#3b82f6');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
