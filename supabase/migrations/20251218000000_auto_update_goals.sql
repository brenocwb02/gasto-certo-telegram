-- Function to update goal progress automatically based on transactions
CREATE OR REPLACE FUNCTION public.update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.tipo = 'despesa' AND NEW.category_id IS NOT NULL) THEN
      UPDATE public.goals
      SET valor_atual = valor_atual + NEW.valor
      WHERE categoria_id = NEW.category_id
        AND status = 'ativa'
        AND NEW.data_transacao BETWEEN data_inicio AND data_fim;
    END IF;
  END IF;

  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    IF (OLD.tipo = 'despesa' AND OLD.category_id IS NOT NULL) THEN
      UPDATE public.goals
      SET valor_atual = valor_atual - OLD.valor
      WHERE categoria_id = OLD.category_id
        AND status = 'ativa'
        AND OLD.data_transacao BETWEEN data_inicio AND data_fim;
    END IF;
  END IF;

  -- Handle UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- Revert OLD
    IF (OLD.tipo = 'despesa' AND OLD.category_id IS NOT NULL) THEN
      UPDATE public.goals
      SET valor_atual = valor_atual - OLD.valor
      WHERE categoria_id = OLD.category_id
        AND status = 'ativa'
        AND OLD.data_transacao BETWEEN data_inicio AND data_fim;
    END IF;
    -- Apply NEW
    IF (NEW.tipo = 'despesa' AND NEW.category_id IS NOT NULL) THEN
      UPDATE public.goals
      SET valor_atual = valor_atual + NEW.valor
      WHERE categoria_id = NEW.category_id
        AND status = 'ativa'
        AND NEW.data_transacao BETWEEN data_inicio AND data_fim;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_goal_progress ON public.transactions;
CREATE TRIGGER trigger_update_goal_progress
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.update_goal_progress();
