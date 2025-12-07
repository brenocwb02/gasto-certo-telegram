# Correção de Categorias e Subcategorias

Rode o script SQL abaixo no **Supabase SQL Editor** para corrigir a hierarquia das suas categorias (Alimentação sumida e Restaurante desvinculado).

```sql
DO $$
DECLARE
    v_user_id UUID;
    v_alimentacao_id UUID;
    v_restaurante_exists BOOLEAN;
BEGIN
    -- 1. Obter ID do usuário (substitua pelo seu email se necessário)
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'breno.albuquerque@gmail.com';

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Usuário não encontrado.';
        RETURN;
    END IF;

    RAISE NOTICE 'Processando usuário ID: %', v_user_id;

    -- 2. Verificar/Restaurar Categoria "Alimentação"
    SELECT id INTO v_alimentacao_id FROM categories 
    WHERE nome = 'Alimentação' AND user_id = v_user_id LIMIT 1;

    IF v_alimentacao_id IS NULL THEN
        RAISE NOTICE 'Categoria Alimentação não encontrada. Criando...';
        INSERT INTO categories (user_id, nome, tipo, cor, icone)
        VALUES (v_user_id, 'Alimentação', 'despesa', '#FF5733', 'utensils')
        RETURNING id INTO v_alimentacao_id;
    ELSE
        -- Garante que Alimentação seja Raiz (parent_id NULL)
        -- Isso conserta o caso dela ter virado "filha" acidentalmente e sumido da lista principal
        UPDATE categories SET parent_id = NULL WHERE id = v_alimentacao_id;
        RAISE NOTICE 'Categoria Alimentação (ID: %) definida como Raiz.', v_alimentacao_id;
    END IF;

    -- 3. Verificar/Corrigir Subcategoria "Restaurante"
    -- Verifica se já existe uma categoria chamada Restaurante
    SELECT EXISTS (SELECT 1 FROM categories WHERE nome = 'Restaurante' AND user_id = v_user_id) INTO v_restaurante_exists;

    IF v_restaurante_exists THEN
        -- Se existe, vincula ela à Alimentação
        UPDATE categories 
        SET parent_id = v_alimentacao_id, tipo = 'despesa'
        WHERE nome = 'Restaurante' AND user_id = v_user_id;
        RAISE NOTICE 'Categoria Restaurante vinculada como filha de Alimentação.';
    ELSE
        -- Se não existe, cria como filha
        INSERT INTO categories (user_id, nome, tipo, cor, icone, parent_id)
        VALUES (v_user_id, 'Restaurante', 'despesa', '#FF5733', 'utensils', v_alimentacao_id);
        RAISE NOTICE 'Subcategoria Restaurante criada.';
    END IF;
    
    -- 4. BÔNUS: Adicionar "Supermercado" se não existir
    IF NOT EXISTS (SELECT 1 FROM categories WHERE nome = 'Supermercado' AND user_id = v_user_id) THEN
         INSERT INTO categories (user_id, nome, tipo, cor, icone, parent_id)
         VALUES (v_user_id, 'Supermercado', 'despesa', '#2ECC71', 'shopping-cart', v_alimentacao_id);
         RAISE NOTICE 'Subcategoria Supermercado criada.';
    ELSE
         UPDATE categories 
         SET parent_id = v_alimentacao_id 
         WHERE nome = 'Supermercado' AND user_id = v_user_id;
         RAISE NOTICE 'Subcategoria Supermercado vinculada a Alimentação.';
    END IF;

END $$;
```
