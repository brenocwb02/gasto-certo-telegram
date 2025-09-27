-- Função para gerar transações parceladas (usada no trigger)
CREATE OR REPLACE FUNCTION public.create_installments()
RETURNS TRIGGER AS $$
DECLARE
    i INTEGER;
    next_date DATE;
    transaction_month DATE;
BEGIN
    -- Só executa se for uma despesa e o total de parcelas for maior que 1
    IF NEW.tipo <> 'despesa' OR COALESCE(NEW.installment_total, 1) <= 1 THEN
        RETURN NEW;
    END IF;

    -- Cria o loop para inserir as parcelas futuras
    FOR i IN 2..NEW.installment_total LOOP
        -- Calcula o mês da próxima parcela
        -- Adiciona 'i - 1' meses à data da transação original (que é a data de referência para a primeira parcela)
        next_date := NEW.data_transacao + (i - 1) * INTERVAL '1 month';

        -- Insere a transação futura
        INSERT INTO public.transactions (
            user_id,
            descricao,
            categoria_id,
            tipo,
            valor,
            conta_origem_id,
            data_transacao, -- Data que a transação ocorrerá
            observacoes,
            origem,
            parent_transaction_id, -- Liga à transação original
            installment_number,    -- Número da parcela atual
            installment_total
        ) VALUES (
            NEW.user_id,
            NEW.descricao || ' (' || i || '/' || NEW.installment_total || ')', -- Ex: Almoço (2/3)
            NEW.categoria_id,
            NEW.tipo,
            NEW.valor,
            NEW.conta_origem_id,
            next_date,
            NEW.observacoes,
            NEW.origem,
            NEW.id, -- A transação recém-criada é a transação pai
            i,
            NEW.installment_total
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cria o trigger que chama a função após a inserção de uma transação
CREATE OR REPLACE TRIGGER trigger_create_installments
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.create_installments();
