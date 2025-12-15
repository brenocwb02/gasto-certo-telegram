-- Migration to update handle_new_user function
-- Removes automatic category creation to allow frontend Wizard to handle it

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  
  -- Create default license for new user
  INSERT INTO public.licenses (user_id, codigo, status, tipo, data_ativacao)
  VALUES (NEW.id, 'TRIAL-' || substr(NEW.id::text, 1, 8), 'ativo', 'vitalicia', now());
  
  -- Create default accounts (Carteira and Conta Corrente remain useful placeholders)
  INSERT INTO public.accounts (user_id, nome, tipo, saldo_inicial, saldo_atual, cor) VALUES
  (NEW.id, 'Carteira', 'dinheiro', 0, 0, '#10b981'),
  (NEW.id, 'Conta Corrente', 'corrente', 0, 0, '#3b82f6');
  
  -- NOTE: Categories creation removed from here. 
  -- Users will be prompted by the Welcome Wizard on the frontend.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
