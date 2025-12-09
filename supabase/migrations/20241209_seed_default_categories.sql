-- ============================================================================
-- FUNÇÃO: seed_default_categories
-- Cria categorias padrão para novos usuários
-- Chamada automaticamente ao final do onboarding
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT := 0;
    v_cat_id UUID;
    v_result JSON;
BEGIN
    -- Verificar se usuário já tem categorias (evitar duplicatas)
    SELECT COUNT(*) INTO v_count 
    FROM categories 
    WHERE user_id = p_user_id AND group_id IS NULL;
    
    IF v_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Usuário já possui categorias cadastradas',
            'categories_count', v_count
        );
    END IF;

    -- ========================================================================
    -- DESPESAS
    -- ========================================================================

    -- 🍔 ALIMENTAÇÃO
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (p_user_id, 'Alimentação', 'despesa', '🍔', '#FF6B35', ARRAY['comida', 'comer', 'alimentação'])
    RETURNING id INTO v_cat_id;
    
    INSERT INTO categories (user_id, nome, tipo, parent_id, keywords) VALUES
        (p_user_id, 'Supermercado', 'despesa', v_cat_id, ARRAY['mercado', 'supermercado', 'feira', 'hortifruti', 'atacado', 'muffato', 'condor', 'carrefour', 'big', 'extra', 'pão de açúcar', 'assaí']),
        (p_user_id, 'Restaurante', 'despesa', v_cat_id, ARRAY['restaurante', 'almoço', 'almoco', 'jantar', 'rodízio', 'churrascaria', 'pizzaria']),
        (p_user_id, 'Delivery', 'despesa', v_cat_id, ARRAY['ifood', 'rappi', 'uber eats', 'delivery', 'entrega', '99food', 'aiqfome']),
        (p_user_id, 'Lanches', 'despesa', v_cat_id, ARRAY['lanche', 'café', 'cafe', 'padaria', 'confeitaria', 'salgado', 'açaí', 'sorvete']),
        (p_user_id, 'Bebidas', 'despesa', v_cat_id, ARRAY['bebida', 'cerveja', 'chopp', 'destilado', 'vinho', 'energético']);

    -- 🚗 TRANSPORTE
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (p_user_id, 'Transporte', 'despesa', '🚗', '#4ECDC4', ARRAY['transporte', 'locomoção'])
    RETURNING id INTO v_cat_id;
    
    INSERT INTO categories (user_id, nome, tipo, parent_id, keywords) VALUES
        (p_user_id, 'Combustível', 'despesa', v_cat_id, ARRAY['gasolina', 'etanol', 'álcool', 'alcool', 'diesel', 'posto', 'shell', 'ipiranga', 'petrobras']),
        (p_user_id, 'Aplicativo', 'despesa', v_cat_id, ARRAY['uber', '99', 'cabify', 'indriver', 'taxi', 'táxi', 'corrida']),
        (p_user_id, 'Transporte Público', 'despesa', v_cat_id, ARRAY['ônibus', 'onibus', 'metrô', 'metro', 'trem', 'passagem', 'bilhete']),
        (p_user_id, 'Estacionamento', 'despesa', v_cat_id, ARRAY['estacionamento', 'zona azul', 'valet', 'garagem']),
        (p_user_id, 'Manutenção Veículo', 'despesa', v_cat_id, ARRAY['mecânico', 'mecanico', 'oficina', 'troca de óleo', 'pneu', 'revisão', 'lavagem']);

    -- 🏠 CASA
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (p_user_id, 'Casa', 'despesa', '🏠', '#95E1D3', ARRAY['casa', 'moradia', 'residência'])
    RETURNING id INTO v_cat_id;
    
    INSERT INTO categories (user_id, nome, tipo, parent_id, keywords) VALUES
        (p_user_id, 'Moradia', 'despesa', v_cat_id, ARRAY['aluguel', 'condomínio', 'condominio', 'iptu', 'financiamento', 'prestação casa']),
        (p_user_id, 'Energia', 'despesa', v_cat_id, ARRAY['luz', 'energia', 'enel', 'copel', 'conta de luz', 'eletricidade']),
        (p_user_id, 'Água', 'despesa', v_cat_id, ARRAY['água', 'agua', 'sanepar', 'sabesp', 'conta de água']),
        (p_user_id, 'Gás', 'despesa', v_cat_id, ARRAY['gás', 'gas', 'botijão', 'ultragaz', 'supergasbras']),
        (p_user_id, 'Internet/Telefone', 'despesa', v_cat_id, ARRAY['internet', 'wifi', 'celular', 'telefone', 'vivo', 'claro', 'tim', 'oi']),
        (p_user_id, 'Manutenção', 'despesa', v_cat_id, ARRAY['conserto', 'reparo', 'encanador', 'eletricista', 'pintor']),
        (p_user_id, 'Empregada/Diarista', 'despesa', v_cat_id, ARRAY['diarista', 'faxineira', 'empregada', 'serviço doméstico']);

    -- 💊 SAÚDE
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (p_user_id, 'Saúde', 'despesa', '💊', '#FF6B6B', ARRAY['saúde', 'saude', 'medicina'])
    RETURNING id INTO v_cat_id;
    
    INSERT INTO categories (user_id, nome, tipo, parent_id, keywords) VALUES
        (p_user_id, 'Farmácia', 'despesa', v_cat_id, ARRAY['farmácia', 'farmacia', 'remédio', 'remedio', 'medicamento', 'drogaria', 'panvel', 'pacheco']),
        (p_user_id, 'Consultas', 'despesa', v_cat_id, ARRAY['médico', 'medico', 'consulta', 'dentista', 'psicólogo', 'psicologo', 'fisioterapia']),
        (p_user_id, 'Plano de Saúde', 'despesa', v_cat_id, ARRAY['unimed', 'hapvida', 'amil', 'bradesco saúde', 'plano saúde', 'plano saude']),
        (p_user_id, 'Academia', 'despesa', v_cat_id, ARRAY['academia', 'crossfit', 'natação', 'pilates', 'yoga', 'smart fit']),
        (p_user_id, 'Exames', 'despesa', v_cat_id, ARRAY['exame', 'laboratório', 'laboratorio', 'raio-x', 'ultrassom']);

    -- 🎮 LAZER
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (p_user_id, 'Lazer', 'despesa', '🎮', '#A66CFF', ARRAY['lazer', 'diversão', 'entretenimento'])
    RETURNING id INTO v_cat_id;
    
    INSERT INTO categories (user_id, nome, tipo, parent_id, keywords) VALUES
        (p_user_id, 'Streaming', 'despesa', v_cat_id, ARRAY['netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'deezer', 'youtube premium', 'globoplay']),
        (p_user_id, 'Entretenimento', 'despesa', v_cat_id, ARRAY['cinema', 'teatro', 'show', 'ingresso', 'parque', 'evento']),
        (p_user_id, 'Jogos', 'despesa', v_cat_id, ARRAY['jogo', 'game', 'steam', 'playstation', 'xbox', 'ps plus']),
        (p_user_id, 'Viagens', 'despesa', v_cat_id, ARRAY['viagem', 'hotel', 'pousada', 'airbnb', 'passagem aérea', 'voo']);

    -- 📚 EDUCAÇÃO
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (p_user_id, 'Educação', 'despesa', '📚', '#3D5A80', ARRAY['educação', 'educacao', 'estudo'])
    RETURNING id INTO v_cat_id;
    
    INSERT INTO categories (user_id, nome, tipo, parent_id, keywords) VALUES
        (p_user_id, 'Mensalidade', 'despesa', v_cat_id, ARRAY['faculdade', 'escola', 'colégio', 'colegio', 'universidade', 'mensalidade']),
        (p_user_id, 'Cursos', 'despesa', v_cat_id, ARRAY['curso', 'udemy', 'alura', 'rocketseat', 'inglês', 'ingles', 'música', 'musica']),
        (p_user_id, 'Livros', 'despesa', v_cat_id, ARRAY['livro', 'amazon kindle', 'livraria', 'apostila']),
        (p_user_id, 'Material Escolar', 'despesa', v_cat_id, ARRAY['material escolar', 'caderno', 'mochila', 'uniforme']);

    -- 👕 PESSOAL
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (p_user_id, 'Pessoal', 'despesa', '👕', '#E07A5F', ARRAY['pessoal', 'eu'])
    RETURNING id INTO v_cat_id;
    
    INSERT INTO categories (user_id, nome, tipo, parent_id, keywords) VALUES
        (p_user_id, 'Vestuário', 'despesa', v_cat_id, ARRAY['roupa', 'camisa', 'calça', 'calca', 'vestido', 'sapato', 'tênis', 'tenis', 'renner', 'riachuelo', 'c&a']),
        (p_user_id, 'Beleza', 'despesa', v_cat_id, ARRAY['salão', 'salao', 'cabelo', 'barbearia', 'manicure', 'estética', 'estetica', 'maquiagem']),
        (p_user_id, 'Produtos Pessoais', 'despesa', v_cat_id, ARRAY['shampoo', 'perfume', 'creme', 'boticário', 'boticario', 'natura']);

    -- 🐕 PETS
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (p_user_id, 'Pets', 'despesa', '🐕', '#81B29A', ARRAY['pet', 'animal', 'cachorro', 'gato'])
    RETURNING id INTO v_cat_id;
    
    INSERT INTO categories (user_id, nome, tipo, parent_id, keywords) VALUES
        (p_user_id, 'Ração', 'despesa', v_cat_id, ARRAY['ração', 'racao', 'petisco', 'comedouro']),
        (p_user_id, 'Veterinário', 'despesa', v_cat_id, ARRAY['veterinário', 'veterinario', 'vacina', 'consulta pet']),
        (p_user_id, 'Pet Shop', 'despesa', v_cat_id, ARRAY['pet shop', 'banho', 'tosa', 'coleira']);

    -- 💳 FINANCEIRO
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (p_user_id, 'Financeiro', 'despesa', '💳', '#F4A261', ARRAY['financeiro', 'banco'])
    RETURNING id INTO v_cat_id;
    
    INSERT INTO categories (user_id, nome, tipo, parent_id, keywords) VALUES
        (p_user_id, 'Taxas Bancárias', 'despesa', v_cat_id, ARRAY['tarifa', 'taxa banco', 'anuidade', 'ted', 'doc']),
        (p_user_id, 'Juros', 'despesa', v_cat_id, ARRAY['juros', 'multa', 'mora']),
        (p_user_id, 'Seguros', 'despesa', v_cat_id, ARRAY['seguro carro', 'seguro vida', 'seguro residencial']),
        (p_user_id, 'Impostos', 'despesa', v_cat_id, ARRAY['imposto', 'irpf', 'ipva', 'taxa']);

    -- 🎁 OUTROS
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (p_user_id, 'Outros', 'despesa', '🎁', '#6C757D', ARRAY['outros', 'outro', 'diversos'])
    RETURNING id INTO v_cat_id;
    
    INSERT INTO categories (user_id, nome, tipo, parent_id, keywords) VALUES
        (p_user_id, 'Presentes', 'despesa', v_cat_id, ARRAY['presente', 'aniversário', 'aniversario', 'lembrança', 'lembranca']),
        (p_user_id, 'Doações', 'despesa', v_cat_id, ARRAY['dízimo', 'dizimo', 'doação', 'doacao', 'oferta', 'igreja', 'caridade']),
        (p_user_id, 'Assinaturas', 'despesa', v_cat_id, ARRAY['assinatura', 'mensalidade', 'clube']);

    -- ========================================================================
    -- RECEITAS
    -- ========================================================================

    -- 💵 RENDA PRINCIPAL
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (p_user_id, 'Renda Principal', 'receita', '💵', '#2ECC71', ARRAY['renda', 'ganho', 'recebimento'])
    RETURNING id INTO v_cat_id;
    
    INSERT INTO categories (user_id, nome, tipo, parent_id, keywords) VALUES
        (p_user_id, 'Salário', 'receita', v_cat_id, ARRAY['salário', 'salario', 'pagamento', 'holerite', 'contracheque', 'vt', 'va', 'vr']),
        (p_user_id, 'Freelance', 'receita', v_cat_id, ARRAY['freelance', 'freela', 'job', 'bico', 'serviço']),
        (p_user_id, 'Empresa', 'receita', v_cat_id, ARRAY['pró-labore', 'pro-labore', 'lucro', 'dividendo', 'mei', 'empresa']);

    -- 📈 RENDA EXTRA
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (p_user_id, 'Renda Extra', 'receita', '📈', '#27AE60', ARRAY['extra', 'adicional'])
    RETURNING id INTO v_cat_id;
    
    INSERT INTO categories (user_id, nome, tipo, parent_id, keywords) VALUES
        (p_user_id, 'Investimentos', 'receita', v_cat_id, ARRAY['rendimento', 'dividendo', 'juros', 'fundo', 'tesouro', 'cdb']),
        (p_user_id, 'Vendas', 'receita', v_cat_id, ARRAY['venda', 'vendeu', 'olx', 'mercado livre', 'shopee']),
        (p_user_id, 'Aluguéis', 'receita', v_cat_id, ARRAY['aluguel recebido', 'inquilino', 'imóvel', 'imovel']),
        (p_user_id, 'Cashback', 'receita', v_cat_id, ARRAY['cashback', 'estorno', 'reembolso']);

    -- 🎁 OUTRAS RECEITAS
    INSERT INTO categories (user_id, nome, tipo, icone, cor, keywords)
    VALUES (p_user_id, 'Outras Receitas', 'receita', '🎁', '#1ABC9C', ARRAY['outras receitas', 'diversos'])
    RETURNING id INTO v_cat_id;
    
    INSERT INTO categories (user_id, nome, tipo, parent_id, keywords) VALUES
        (p_user_id, 'Presentes Recebidos', 'receita', v_cat_id, ARRAY['presente recebido', 'ganhei', 'presente']),
        (p_user_id, 'Restituições', 'receita', v_cat_id, ARRAY['restituição', 'restituicao', 'imposto', 'inss']);

    -- Contar quantas categorias foram criadas
    SELECT COUNT(*) INTO v_count 
    FROM categories 
    WHERE user_id = p_user_id AND group_id IS NULL;

    RETURN json_build_object(
        'success', true,
        'message', 'Categorias padrão criadas com sucesso!',
        'categories_count', v_count
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'message', SQLERRM,
        'categories_count', 0
    );
END;
$$;

-- Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION public.seed_default_categories(UUID) TO authenticated;

-- Comentário
COMMENT ON FUNCTION public.seed_default_categories IS 
'Cria categorias e subcategorias padrão para um novo usuário. 
Inclui ~50 categorias com keywords para o parser NLP do Telegram.
Chamada automaticamente ao final do onboarding ou manualmente pelo usuário.';
