-- Migration: Cria funçao para importar template de categorias brasileiras
-- Criado em: 2024-12-06
-- Objetivo: Permitir que o usuário importe um kit completo de categorias e subcategorias opcionais

CREATE OR REPLACE FUNCTION import_default_categories(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- Variáveis para armazenar IDs das categorias pai
    v_alimentacao_id UUID;
    v_transporte_id UUID;
    v_moradia_id UUID;
    v_saude_id UUID;
    v_lazer_id UUID;
    v_educacao_id UUID;
    v_vestuario_id UUID;
    v_pets_id UUID;
    v_doacoes_id UUID;
BEGIN
    -- Verificar se o usuário já tem muitas categorias para evitar duplicação em massa
    -- (Opcional: removemos essa verificação para permitir re-importação ou complemento)
    
    -- =================================================================
    -- 1. ALIMENTAÇÃO (Vermelho)
    -- =================================================================
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (target_user_id, 'Alimentação', 'despesa', '🍽️', '#FF6B6B', NULL)
    RETURNING id INTO v_alimentacao_id;

    INSERT INTO categories (user_id, nome, tipo, icone, cor, parent_id, keywords) VALUES
    (target_user_id, 'Supermercado', 'despesa', '🛒', '#FF6B6B', v_alimentacao_id, ARRAY['mercado', 'supermercado', 'atacadão', 'compras do mês', 'feira']),
    (target_user_id, 'Padaria', 'despesa', '🥖', '#FF6B6B', v_alimentacao_id, ARRAY['padaria', 'pão', 'café da manhã', 'confeitaria']),
    (target_user_id, 'Restaurante', 'despesa', '🍴', '#FF6B6B', v_alimentacao_id, ARRAY['restaurante', 'almoço', 'jantar', 'refeição', 'buffet']),
    (target_user_id, 'Delivery', 'despesa', '🛵', '#FF6B6B', v_alimentacao_id, ARRAY['ifood', 'rappi', 'delivery', 'entrega', 'uber eats']),
    (target_user_id, 'Lanchonete', 'despesa', '🍔', '#FF6B6B', v_alimentacao_id, ARRAY['lanche', 'salgado', 'hamburguer', 'fast food', 'subway', 'mcdonalds']);

    -- =================================================================
    -- 2. TRANSPORTE (Azul Claro)
    -- =================================================================
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (target_user_id, 'Transporte', 'despesa', '🚗', '#4ECDC4', NULL)
    RETURNING id INTO v_transporte_id;

    INSERT INTO categories (user_id, nome, tipo, icone, cor, parent_id, keywords) VALUES
    (target_user_id, 'Combustível', 'despesa', '⛽', '#4ECDC4', v_transporte_id, ARRAY['gasolina', 'etanol', 'diesel', 'abastecer', 'posto']),
    (target_user_id, 'Transporte Público', 'despesa', '🚌', '#4ECDC4', v_transporte_id, ARRAY['ônibus', 'metrô', 'passagem', 'bilhete único', 'recarga']),
    (target_user_id, 'Táxi / Apps', 'despesa', '🚕', '#4ECDC4', v_transporte_id, ARRAY['uber', '99', 'taxi', 'cabify', 'corrida']),
    (target_user_id, 'Estacionamento', 'despesa', '🅿️', '#4ECDC4', v_transporte_id, ARRAY['estacionamento', 'zona azul', 'valet']),
    (target_user_id, 'Manutenção', 'despesa', '🔧', '#4ECDC4', v_transporte_id, ARRAY['mecânico', 'oficina', 'revisão', 'troca de óleo', 'pneu']);

    -- =================================================================
    -- 3. MORADIA (Roxo)
    -- =================================================================
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (target_user_id, 'Moradia', 'despesa', '🏠', '#9B59B6', NULL)
    RETURNING id INTO v_moradia_id;

    INSERT INTO categories (user_id, nome, tipo, icone, cor, parent_id, keywords) VALUES
    (target_user_id, 'Aluguel / Condomínio', 'despesa', '🔑', '#9B59B6', v_moradia_id, ARRAY['aluguel', 'condomínio', 'iptu', 'financiamento casa']),
    (target_user_id, 'Contas Básicas', 'despesa', '💡', '#9B59B6', v_moradia_id, ARRAY['luz', 'energia', 'agua', 'saneamento', 'gás', 'botijão']),
    (target_user_id, 'Internet / TV', 'despesa', '📡', '#9B59B6', v_moradia_id, ARRAY['internet', 'wifi', 'tv a cabo', 'plano celular']),
    (target_user_id, 'Manutenção Casa', 'despesa', '🔨', '#9B59B6', v_moradia_id, ARRAY['reforma', 'encanador', 'eletricista', 'material de construção']);

    -- =================================================================
    -- 4. SAÚDE (Vermelho Escuro)
    -- =================================================================
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (target_user_id, 'Saúde', 'despesa', '🏥', '#E74C3C', NULL)
    RETURNING id INTO v_saude_id;

    INSERT INTO categories (user_id, nome, tipo, icone, cor, parent_id, keywords) VALUES
    (target_user_id, 'Farmácia', 'despesa', '💊', '#E74C3C', v_saude_id, ARRAY['farmácia', 'remédio', 'medicamento', 'vitamina']),
    (target_user_id, 'Consultas', 'despesa', '👨‍⚕️', '#E74C3C', v_saude_id, ARRAY['médico', 'consulta', 'dentista', 'psicólogo', 'terapia']),
    (target_user_id, 'Exames', 'despesa', '🔬', '#E74C3C', v_saude_id, ARRAY['exame', 'laboratório', 'raio x', 'sangue']),
    (target_user_id, 'Plano de Saúde', 'despesa', '📋', '#E74C3C', v_saude_id, ARRAY['plano de saúde', 'convênio', 'unimed', 'amil']);

    -- =================================================================
    -- 5. LAZER (Laranja)
    -- =================================================================
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (target_user_id, 'Lazer', 'despesa', '🎉', '#F39C12', NULL)
    RETURNING id INTO v_lazer_id;

    INSERT INTO categories (user_id, nome, tipo, icone, cor, parent_id, keywords) VALUES
    (target_user_id, 'Streaming / Assinaturas', 'despesa', '📺', '#F39C12', v_lazer_id, ARRAY['netflix', 'spotify', 'prime video', 'youtube', 'hbo']),
    (target_user_id, 'Cinema / Eventos', 'despesa', '🎬', '#F39C12', v_lazer_id, ARRAY['cinema', 'ingresso', 'show', 'teatro', 'evento']),
    (target_user_id, 'Viagens', 'despesa', '✈️', '#F39C12', v_lazer_id, ARRAY['viagem', 'hotel', 'airbnb', 'passagem aérea', 'hospedagem']),
    (target_user_id, 'Bares / Festas', 'despesa', '🍻', '#F39C12', v_lazer_id, ARRAY['bar', 'cerveja', 'balada', 'happy hour', 'festa']);

    -- =================================================================
    -- 6. EDUCAÇÃO (Azul)
    -- =================================================================
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (target_user_id, 'Educação', 'despesa', '📚', '#3498DB', NULL)
    RETURNING id INTO v_educacao_id;

    INSERT INTO categories (user_id, nome, tipo, icone, cor, parent_id, keywords) VALUES
    (target_user_id, 'Cursos', 'despesa', '💻', '#3498DB', v_educacao_id, ARRAY['curso', 'workshop', 'udemy', 'alura']),
    (target_user_id, 'Livros', 'despesa', '📖', '#3498DB', v_educacao_id, ARRAY['livro', 'ebook', 'kindle', 'material escolar', 'papelaria']),
    (target_user_id, 'Mensalidade', 'despesa', '🎓', '#3498DB', v_educacao_id, ARRAY['mensalidade escolar', 'faculdade', 'matrícula', 'escola']);

    -- =================================================================
    -- 7. VESTUÁRIO (Rosa)
    -- =================================================================
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (target_user_id, 'Vestuário', 'despesa', '👕', '#E91E63', NULL)
    RETURNING id INTO v_vestuario_id;

    INSERT INTO categories (user_id, nome, tipo, icone, cor, parent_id, keywords) VALUES
    (target_user_id, 'Roupas / Calçados', 'despesa', '👗', '#E91E63', v_vestuario_id, ARRAY['roupa', 'camisa', 'calça', 'vestido', 'tênis', 'sapato', 'loja de roupa']),
    (target_user_id, 'Salão / Barbearia', 'despesa', '💇', '#E91E63', v_vestuario_id, ARRAY['corte de cabelo', 'manicure', 'pedicure', 'barbeiro', 'salão']),
    (target_user_id, 'Cosméticos', 'despesa', '💄', '#E91E63', v_vestuario_id, ARRAY['perfume', 'maquiagem', 'cosmético', 'shampoo', 'creme']);

    -- =================================================================
    -- 8. PETS (Verde)
    -- =================================================================
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (target_user_id, 'Pets', 'despesa', '🐾', '#8BC34A', NULL)
    RETURNING id INTO v_pets_id;

    INSERT INTO categories (user_id, nome, tipo, icone, cor, parent_id, keywords) VALUES
    (target_user_id, 'Veterinário / Serviços', 'despesa', '🏥', '#8BC34A', v_pets_id, ARRAY['veterinário', 'banho e tosa', 'vacina pet', 'hotelzinho pet']),
    (target_user_id, 'Ração / Itens', 'despesa', '🦴', '#8BC34A', v_pets_id, ARRAY['ração', 'petisco', 'areia de gato', 'brinquedo pet']);

    -- =================================================================
    -- 9. DOAÇÕES / DÍZIMOS (Azul Escuro / Roxo)
    -- =================================================================
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (target_user_id, 'Contribuições', 'despesa', '🤲', '#673AB7', NULL)
    RETURNING id INTO v_doacoes_id;

    INSERT INTO categories (user_id, nome, tipo, icone, cor, parent_id, keywords) VALUES
    (target_user_id, 'Dízimo / Ofertas', 'despesa', '🙏', '#673AB7', v_doacoes_id, ARRAY['dízimo', 'oferta', 'primícia', 'primícias', 'contribuição igreja']),
    (target_user_id, 'Caridade', 'despesa', '🎁', '#673AB7', v_doacoes_id, ARRAY['doação', 'ajuda social', 'ong', 'esmola', 'apoio social']);

    -- =================================================================
    -- RECEITAS (Verde Claro) - Sem subcategorias
    -- =================================================================
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords) VALUES
    (target_user_id, 'Salário', 'receita', '💼', '#2ECC71', ARRAY['salário', 'pagamento', 'adiantamento', '13o', 'holerite']),
    (target_user_id, 'Freelance / Extras', 'receita', '💻', '#2ECC71', ARRAY['freela', 'bico', 'serviço extra', 'venda']),
    (target_user_id, 'Investimentos', 'receita', '📈', '#2ECC71', ARRAY['rendimento', 'dividendo', 'juros', 'lucro']),
    (target_user_id, 'Outras Receitas', 'receita', '💰', '#2ECC71', ARRAY['presente', 'reembolso', 'prêmio', 'devolução']);

END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION import_default_categories TO authenticated;
GRANT EXECUTE ON FUNCTION import_default_categories TO service_role;
