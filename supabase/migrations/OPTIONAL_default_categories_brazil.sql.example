-- Migration: Estrutura Completa de Categorias Brasileiras com Keywords
-- Criado em: 2024-12-06
-- Objetivo: Criar categorias hierárquicas (pai → filho) com keywords para reconhecimento automático

-- Limpar categorias existentes (cuidado: apenas para setup inicial!)
-- DELETAR esta linha em produção se já houver categorias customizadas dos usuários
-- DELETE FROM categories WHERE user_id = 'system';

-- =============================================================================
-- CATEGORIAS DE DESPESAS
-- =============================================================================

-- ==================== ALIMENTAÇÃO ====================
DO $$
DECLARE
    alimentacao_id UUID := gen_random_uuid();
    supermercado_id UUID := gen_random_uuid();
    padaria_id UUID := gen_random_uuid();
    restaurante_id UUID := gen_random_uuid();
    delivery_id UUID := gen_random_uuid();
    lanchonete_id UUID := gen_random_uuid();
BEGIN
    -- Categoria Pai: Alimentação
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        alimentacao_id,
        'Alimentação',
        'despesa',
        '🍽️',
        '#FF6B6B',
        NULL,
        ARRAY['comida', 'alimentação', 'alimento', 'comer', 'food'],
        '00000000-0000-0000-0000-000000000000', -- Sistema
        NOW()
    );

    -- Subcategoria: Supermercado
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        supermercado_id,
        'Supermercado',
        'despesa',
        '🛒',
        '#FF6B6B',
        alimentacao_id,
        ARRAY[
            'mercado', 'supermercado', 'hipermercado', 
            'carrefour', 'extra', 'pão de açúcar', 'walmart', 'atacadão', 'big',
            'assaí', 'makro', 'sam''s', 'sams', 'bh',
            'condor', 'gbarbosa', 'prezunic', 'zona sul',
            'compras', 'feira', 'sacolão', 'hortifrutti', 'quitanda'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Padaria / Confeitaria
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        padaria_id,
        'Padaria',
        'despesa',
        '🥖',
        '#FF6B6B',
        alimentacao_id,
        ARRAY[
            'padaria', 'confeitaria', 'panificadora',
            'pão', 'paes', 'bolo', 'doce', 'salgado',
            'pastel', 'esfiha', 'croissant'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Restaurante / Almoço
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        restaurante_id,
        'Restaurante',
        'despesa',
        '🍴',
        '#FF6B6B',
        alimentacao_id,
        ARRAY[
            'restaurante', 'almoço', 'almoco', 'jantar', 'janta',
            'refeição', 'refeicao', 'prato', 'buffet',
            'rodízio', 'rodizio', 'churrascaria', 'pizzaria'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Delivery / iFood
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        delivery_id,
        'Delivery',
        'despesa',
        '🛵',
        '#FF6B6B',
        alimentacao_id,
        ARRAY[
            'ifood', 'rappi', '99food', 'ubereats', 'uber eats',
            'delivery', 'entrega', 'pedido', 'pedir comida',
            'james delivery', 'aiqfome'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Lanchonete / Fast Food
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        lanchonete_id,
        'Lanchonete',
        'despesa',
        '🍔',
        '#FF6B6B',
        alimentacao_id,
        ARRAY[
            'lanchonete', 'lanche', 'snack', 'fast food',
            'mcdonalds', 'mc donalds', 'bk', 'burger king',
            'subway', 'giraffas', 'habibs', 'bobs',
            'pizza', 'hamburger', 'hamburguer', 'batata frita'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );
END $$;

-- ==================== TRANSPORTE ====================
DO $$
DECLARE
    transporte_id UUID := gen_random_uuid();
    combustivel_id UUID := gen_random_uuid();
    transporte_publico_id UUID := gen_random_uuid();
    taxi_id UUID := gen_random_uuid();
    estacionamento_id UUID := gen_random_uuid();
    manutencao_id UUID := gen_random_uuid();
BEGIN
    -- Categoria Pai: Transporte
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        transporte_id,
        'Transporte',
        'despesa',
        '🚗',
        '#4ECDC4',
        NULL,
        ARRAY['transporte', 'mobilidade', 'locomoção', 'locomocao'],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Combustível
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        combustivel_id,
        'Combustível',
        'despesa',
        '⛽',
        '#4ECDC4',
        transporte_id,
        ARRAY[
            'gasolina', 'etanol', 'alcool', 'álcool', 'diesel', 'gnv',
            'combustível', 'combustivel', 'posto', 'abastecimento',
            'shell', 'ipiranga', 'br', 'petrobras', 'ale'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Transporte Público
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        transporte_publico_id,
        'Transporte Público',
        'despesa',
        '🚌',
        '#4ECDC4',
        transporte_id,
        ARRAY[
            'ônibus', 'onibus', 'metro', 'metrô', 'trem',
            'bilheteunico', 'bilhete único', 'brt', 'vlt',
            'passagem', 'vale transporte', 'vale-transporte'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Táxi / Uber
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        taxi_id,
        'Táxi / App',
        'despesa',
        '🚕',
        '#4ECDC4',
        transporte_id,
        ARRAY[
            'uber', '99', 'cabify', 'taxi', 'táxi',
            'corrida', 'corridas', 'ride'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Estacionamento
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        estacionamento_id,
        'Estacionamento',
        'despesa',
        '🅿️',
        '#4ECDC4',
        transporte_id,
        ARRAY[
            'estacionamento', 'parking', 'zona azul',
            'vaga', 'garagem', 'manobrista'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Manutenção Veícular
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        manutencao_id,
        'Manutenção',
        'despesa',
        '🔧',
        '#4ECDC4',
        transporte_id,
        ARRAY[
            'mecânico', 'mecanico', 'oficina', 'conserto',
            'revisão', 'revisao', 'troca de óleo', 'oleo',
            'pneu', 'lavagem', 'lava rápido', 'lava-jato',
            'ipva', 'licenciamento', 'seguro carro', 'vistoria'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );
END $$;

-- ==================== MORADIA ====================
DO $$
DECLARE
    moradia_id UUID := gen_random_uuid();
    aluguel_id UUID := gen_random_uuid();
    contas_casa_id UUID := gen_random_uuid();
    internet_id UUID := gen_random_uuid();
    manutencao_casa_id UUID := gen_random_uuid();
BEGIN
    -- Categoria Pai: Moradia
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        moradia_id,
        'Moradia',
        'despesa',
        '🏠',
        '#9B59B6',
        NULL,
        ARRAY['casa', 'moradia', 'residência', 'residencia', 'lar'],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Aluguel / Financiamento
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        aluguel_id,
        'Aluguel',
        'despesa',
        '🔑',
        '#9B59B6',
        moradia_id,
        ARRAY[
            'aluguel', 'financiamento', 'prestação', 'prestacao',
            'condomínio', 'condominio', 'iptu', 'itbi'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Contas da Casa (Água, Luz, Gás)
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        contas_casa_id,
        'Contas da Casa',
        'despesa',
        '💡',
        '#9B59B6',
        moradia_id,
        ARRAY[
            'luz', 'energia', 'eletricidade', 'cemig', 'light', 'copel', 'celpe',
            'água', 'agua', 'sabesp', 'cedae', 'saneago', 'caesb',
            'gás', 'gas', 'ultragaz', 'liquigás', 'liquigas', 'nacional gás', 'nacional gas'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Internet / TV / Telefone
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        internet_id,
        'Internet / TV',
        'despesa',
        '📡',
        '#9B59B6',
        moradia_id,
        ARRAY[
            'internet', 'wifi', 'banda larga',
            'vivo', 'oi', 'claro', 'tim', 'net', 'sky',
            'tv', 'televisão', 'televisao', 'cabo',
            'telefone', 'telefonia', 'celular', 'chip'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Manutenção da Casa
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        manutencao_casa_id,
        'Manutenção Casa',
        'despesa',
        '🔨',
        '#9B59B6',
        moradia_id,
        ARRAY[
            'manutenção', 'manutencao', 'reforma', 'conserto casa',
            'encanador', 'eletricista', 'pintor', 'pedreiro',
            'material de construção', 'material de construcao',
            'ferragem', 'tinta', 'cimento'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );
END $$;

-- ==================== SAÚDE ====================
DO $$
DECLARE
    saude_id UUID := gen_random_uuid();
    farmacia_id UUID := gen_random_uuid();
    consulta_id UUID := gen_random_uuid();
    exame_id UUID := gen_random_uuid();
    plano_saude_id UUID := gen_random_uuid();
BEGIN
    -- Categoria Pai: Saúde
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        saude_id,
        'Saúde',
        'despesa',
        '🏥',
        '#E74C3C',
        NULL,
        ARRAY['saúde', 'saude', 'médico', 'medico', 'hospital'],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Farmácia / Remédios
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        farmacia_id,
        'Farmácia',
        'despesa',
        '💊',
        '#E74C3C',
        saude_id,
        ARRAY[
            'farmácia', 'farmacia', 'drogaria',
            'remédio', 'remedio', 'medicamento', 'vitamina',
            'droga raia', 'drogasil', 'pacheco', 'pague menos',
            'são joão', 'sao joao', 'ultrafarma', 'onofre'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Consultas
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        consulta_id,
        'Consultas',
        'despesa',
        '👨‍⚕️',
        '#E74C3C',
        saude_id,
        ARRAY[
            'consulta', 'médico', 'medico', 'doutor', 'dra',
            'dentista', 'odontologia', 'ortodontia',
            'psicólogo', 'psicologo', 'terapia',
            'fisioterapeuta', 'fisioterapia'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Exames
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        exame_id,
        'Exames',
        'despesa',
        '🔬',
        '#E74C3C',
        saude_id,
        ARRAY[
            'exame', 'laboratório', 'laboratorio',
            'raio x', 'raio-x', 'tomografia', 'ressonância', 'ressonancia',
            'lavoisier', 'fleury', 'dasa', 'hermes pardini'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Plano de Saúde
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        plano_saude_id,
        'Plano de Saúde',
        'despesa',
        '🏥',
        '#E74C3C',
        saude_id,
        ARRAY[
            'plano de saúde', 'plano de saude', 'convênio', 'convenio',
            'unimed', 'amil', 'sulamerica', 'bradesco saúde', 'bradesco saude',
            'hapvida', 'notredame', 'alice', 'porto seguro'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );
END $$;

-- ==================== LAZER / ENTRETENIMENTO ====================
DO $$
DECLARE
    lazer_id UUID := gen_random_uuid();
    streaming_id UUID := gen_random_uuid();
    cinema_id UUID := gen_random_uuid();
    viagem_id UUID := gen_random_uuid();
    bares_id UUID := gen_random_uuid();
BEGIN
    -- Categoria Pai: Lazer
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        lazer_id,
        'Lazer',
        'despesa',
        '🎉',
        '#F39C12',
        NULL,
        ARRAY['lazer', 'entretenimento', 'diversão', 'diversao', 'festa'],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Streaming / Assinaturas
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        streaming_id,
        'Streaming',
        'despesa',
        '📺',
        '#F39C12',
        lazer_id,
        ARRAY[
            'netflix', 'spotify', 'amazon prime', 'disney+', 'disney plus',
            'hbo max', 'paramount+', 'paramount plus', 'globoplay',
            'youtube premium', 'apple tv', 'apple music', 'deezer',
            'streaming', 'assinatura', 'subscription'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Cinema / Teatro / Shows
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        cinema_id,
        'Cinema / Shows',
        'despesa',
        '🎬',
        '#F39C12',
        lazer_id,
        ARRAY[
            'cinema', 'filme', 'ingresso', 'cinemark', 'uci',
            'teatro', 'peça', 'peca', 'show', 'concerto',
            'evento', 'festival', 'ingresso.com', 'ticketmaster'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Viagens / Hospedagem
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        viagem_id,
        'Viagens',
        'despesa',
        '✈️',
        '#F39C12',
        lazer_id,
        ARRAY[
            'viagem', 'hotel', 'hospedagem', 'pousada', 'airbnb',
            'passagem', 'avião', 'aviao', 'voo', 'gol', 'latam', 'azul',
            'booking', 'decolar', '123milhas', 'maxmilhas'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Bares / Baladas
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        bares_id,
        'Bares / Baladas',
        'despesa',
        '🍻',
        '#F39C12',
        lazer_id,
        ARRAY[
            'bar', 'pub', 'boteco', 'cervejaria',
            'balada', 'festa', 'night', 'club',
            'bebida', 'drink', 'cerveja', 'chopp'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );
END $$;

-- ==================== EDUCAÇÃO ====================
DO $$
DECLARE
    educacao_id UUID := gen_random_uuid();
    curso_id UUID := gen_random_uuid();
    livro_id UUID := gen_random_uuid();
    escola_id UUID := gen_random_uuid();
BEGIN
    -- Categoria Pai: Educação
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        educacao_id,
        'Educação',
        'despesa',
        '📚',
        '#3498DB',
        NULL,
        ARRAY['educação', 'educacao', 'estudo', 'curso', 'escola'],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Cursos Online
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        curso_id,
        'Cursos',
        'despesa',
        '💻',
        '#3498DB',
        educacao_id,
        ARRAY[
            'curso', 'cursos', 'udemy', 'coursera', 'alura',
            'rocketseat', 'treinamento', 'workshop', 'bootcamp',
            'certificação', 'certificacao'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Livros / Material Didático
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        livro_id,
        'Livros',
        'despesa',
        '📖',
        '#3498DB',
        educacao_id,
        ARRAY[
            'livro', 'apostila', 'material didático', 'material didatico',
            'livraria', 'saraiva', 'amazon books', 'kindle',
            'caderno', 'caneta', 'lápis', 'lapis', 'material escolar'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Escola / Faculdade
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        escola_id,
        'Escola / Faculdade',
        'despesa',
        '🎓',
        '#3498DB',
        educacao_id,
        ARRAY[
            'mensalidade', 'escola', 'colégio', 'colegio',
            'faculdade', 'universidade', 'pós-graduação', 'pos-graduacao',
            'matrícula', 'matricula', 'uniforme'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );
END $$;

-- ==================== VESTUÁRIO / BELEZA ====================
DO $$
DECLARE
    vestuario_id UUID := gen_random_uuid();
    roupa_id UUID := gen_random_uuid();
    salao_id UUID := gen_random_uuid();
    cosmetico_id UUID := gen_random_uuid();
BEGIN
    -- Categoria Pai: Vestuário
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        vestuario_id,
        'Vestuário',
        'despesa',
        '👕',
        '#E91E63',
        NULL,
        ARRAY['roupa', 'vestuário', 'vestuario', 'moda'],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Roupas / Calçados
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        roupa_id,
        'Roupas',
        'despesa',
        '👗',
        '#E91E63',
        vestuario_id,
        ARRAY[
            'roupa', 'roupas', 'calça', 'calca', 'camisa', 'camiseta',
            'vestido', 'saia', 'blusa', 'jaqueta',
            'calçado', 'calcado', 'sapato', 'tênis', 'tenis', 'sandália', 'sandalia',
            'zara', 'renner', 'riachuelo', 'cea', 'marisa', 'c&a'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Salão / Barbearia
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        salao_id,
        'Salão / Barbearia',
        'despesa',
        '💇',
        '#E91E63',
        vestuario_id,
        ARRAY[
            'salão', 'salao', 'cabeleireiro', 'barbeiro', 'barbearia',
            'corte', 'cabelo', 'unhas', 'manicure', 'pedicure',
            'tintura', 'química', 'quimica', 'escova', 'maquiagem'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Cosméticos / Perfumaria
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        cosmetico_id,
        'Cosméticos',
        'despesa',
        '💄',
        '#E91E63',
        vestuario_id,
        ARRAY[
            'perfume', 'cosmético', 'cosmetico', 'maquiagem',
            'shampoo', 'condicionador', 'creme', 'hidratante',
            'o boticário', 'boticario', 'natura', 'avon', 'sephora',
            'protetor solar', 'desodorante'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );
END $$;

-- ==================== PETS ====================
DO $$
DECLARE
    pets_id UUID := gen_random_uuid();
    veterinario_id UUID := gen_random_uuid();
    racao_id UUID := gen_random_uuid();
BEGIN
    -- Categoria Pai: Pets
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        pets_id,
        'Pets',
        'despesa',
        '🐾',
        '#8BC34A',
        NULL,
        ARRAY['pet', 'animal', 'cachorro', 'gato', 'bicho'],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Veterinário / Pet Shop
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        veterinario_id,
        'Veterinário',
        'despesa',
        '🏥',
        '#8BC34A',
        pets_id,
        ARRAY[
            'veterinário', 'veterinario', 'vet', 'petshop', 'pet shop',
            'banho', 'tosa', 'vacina', 'consulta pet'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Subcategoria: Ração / Petisco
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        racao_id,
        'Ração / Petisco',
        'despesa',
        '🦴',
        '#8BC34A',
        pets_id,
        ARRAY[
            'ração', 'racao', 'petisco', 'snack pet',
            'areia gato', 'brinquedo pet', 'coleira'
        ],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );
END $$;

-- =============================================================================
-- CATEGORIAS DE RECEITAS
-- =============================================================================

DO $$
DECLARE
    salario_id UUID := gen_random_uuid();
    freelance_id UUID := gen_random_uuid();
    investimento_id UUID := gen_random_uuid();
    outros_id UUID := gen_random_uuid();
BEGIN
    -- Salário
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        salario_id,
        'Salário',
        'receita',
        '💼',
        '#2ECC71',
        NULL,
        ARRAY['salário', 'salario', 'pagamento', 'ordenado', 'remuneração', 'remuneracao'],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Freelance / Bico
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        freelance_id,
        'Freelance',
        'receita',
        '💻',
        '#2ECC71',
        NULL,
        ARRAY['freelance', 'freela', 'bico', 'trabalho extra', 'extra'],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Investimentos / Rendimentos
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        investimento_id,
        'Investimentos',
        'receita',
        '📈',
        '#2ECC71',
        NULL,
        ARRAY['investimento', 'rendimento', 'dividendo', 'juros', 'aplicação', 'aplicacao'],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );

    -- Outros
    INSERT INTO categories (id, nome, tipo, icone, cor, parent_id, keywords, user_id, created_at)
    VALUES (
        outros_id,
        'Outras Receitas',
        'receita',
        '💰',
        '#2ECC71',
        NULL,
        ARRAY['outros', 'outros rendimentos', 'presente', 'prêmio', 'premio', 'reembolso'],
        '00000000-0000-0000-0000-000000000000',
        NOW()
    );
END $$;

-- Atualizar timestamp
UPDATE categories SET updated_at = NOW() WHERE updated_at IS NULL;
