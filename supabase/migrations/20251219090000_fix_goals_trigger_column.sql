-- Fix: Change category_id to categoria_id in transaction trigger
-- Original error: record "new" has no field "category_id"

CREATE OR REPLACE FUNCTION public.update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.tipo = 'despesa' AND NEW.categoria_id IS NOT NULL) THEN
      UPDATE public.goals
      SET valor_atual = valor_atual + NEW.valor
      WHERE categoria_id = NEW.categoria_id
        AND status = 'ativa'
        AND NEW.data_transacao BETWEEN data_inicio AND data_fim;
    END IF;
  END IF;

  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    IF (OLD.tipo = 'despesa' AND OLD.categoria_id IS NOT NULL) THEN
      UPDATE public.goals
      SET valor_atual = valor_atual - OLD.valor
      WHERE categoria_id = OLD.categoria_id
        AND status = 'ativa'
        AND OLD.data_transacao BETWEEN data_inicio AND data_fim;
    END IF;
  END IF;

  -- Handle UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- Revert OLD
    IF (OLD.tipo = 'despesa' AND OLD.categoria_id IS NOT NULL) THEN
      UPDATE public.goals
      SET valor_atual = valor_atual - OLD.valor
      WHERE categoria_id = OLD.categoria_id
        AND status = 'ativa'
        AND OLD.data_transacao BETWEEN data_inicio AND data_fim;
    END IF;
    -- Apply NEW
    IF (NEW.tipo = 'despesa' AND NEW.categoria_id IS NOT NULL) THEN
      UPDATE public.goals
      SET valor_atual = valor_atual + NEW.valor
      WHERE categoria_id = NEW.categoria_id
        AND status = 'ativa'
        AND NEW.data_transacao BETWEEN data_inicio AND data_fim;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
