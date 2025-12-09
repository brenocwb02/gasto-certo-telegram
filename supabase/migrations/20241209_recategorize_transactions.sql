-- ============================================================================
-- SCRIPT: Recategorizar transações antigas automaticamente
-- Baseado nas keywords das novas categorias
-- ============================================================================

-- Substitua SEU_USER_ID pelo ID do usuário

-- 1. MERCADO/SUPERMERCADO -> Alimentação > Supermercado
UPDATE transactions t
SET categoria_id = (
  SELECT c.id FROM categories c 
  WHERE c.nome = 'Supermercado' 
  AND c.user_id = t.user_id 
  AND c.parent_id IS NOT NULL
  LIMIT 1
)
WHERE (
  t.descricao ILIKE '%mercado%' 
  OR t.descricao ILIKE '%muffato%'
  OR t.descricao ILIKE '%condor%'
  OR t.descricao ILIKE '%carrefour%'
  OR t.descricao ILIKE '%assai%'
  OR t.descricao ILIKE '%feira%'
)
AND t.user_id = '766ad0da-d230-407f-894e-3829e13e86ea'
AND (t.categoria_id IS NULL);

-- 2. RESTAURANTE -> Alimentação > Restaurante
UPDATE transactions t
SET categoria_id = (
  SELECT c.id FROM categories c 
  WHERE c.nome = 'Restaurante' 
  AND c.user_id = t.user_id 
  AND c.parent_id IS NOT NULL
  LIMIT 1
)
WHERE (
  t.descricao ILIKE '%restaurante%' 
  OR t.descricao ILIKE '%almoço%'
  OR t.descricao ILIKE '%almoco%'
  OR t.descricao ILIKE '%jantar%'
  OR t.descricao ILIKE '%pizzaria%'
  OR t.descricao ILIKE '%churrascaria%'
)
AND t.user_id = '766ad0da-d230-407f-894e-3829e13e86ea'
AND (t.categoria_id IS NULL);

-- 3. POSTO/GASOLINA -> Transporte > Combustível
UPDATE transactions t
SET categoria_id = (
  SELECT c.id FROM categories c 
  WHERE c.nome = 'Combustível' 
  AND c.user_id = t.user_id 
  AND c.parent_id IS NOT NULL
  LIMIT 1
)
WHERE (
  t.descricao ILIKE '%posto%' 
  OR t.descricao ILIKE '%gasolina%'
  OR t.descricao ILIKE '%combustível%'
  OR t.descricao ILIKE '%combustivel%'
  OR t.descricao ILIKE '%etanol%'
  OR t.descricao ILIKE '%shell%'
  OR t.descricao ILIKE '%ipiranga%'
)
AND t.user_id = '766ad0da-d230-407f-894e-3829e13e86ea'
AND (t.categoria_id IS NULL);

-- 4. UBER/99/TAXI -> Transporte > Aplicativo
UPDATE transactions t
SET categoria_id = (
  SELECT c.id FROM categories c 
  WHERE c.nome = 'Aplicativo' 
  AND c.user_id = t.user_id 
  AND c.parent_id IS NOT NULL
  LIMIT 1
)
WHERE (
  t.descricao ILIKE '%uber%' 
  OR t.descricao ILIKE '%99%'
  OR t.descricao ILIKE '%taxi%'
  OR t.descricao ILIKE '%táxi%'
  OR t.descricao ILIKE '%cabify%'
  OR t.descricao ILIKE '%indriver%'
)
AND t.user_id = '766ad0da-d230-407f-894e-3829e13e86ea'
AND (t.categoria_id IS NULL);

-- 5. FARMACIA/REMEDIO -> Saúde > Farmácia
UPDATE transactions t
SET categoria_id = (
  SELECT c.id FROM categories c 
  WHERE c.nome = 'Farmácia' 
  AND c.user_id = t.user_id 
  AND c.parent_id IS NOT NULL
  LIMIT 1
)
WHERE (
  t.descricao ILIKE '%farmácia%' 
  OR t.descricao ILIKE '%farmacia%'
  OR t.descricao ILIKE '%remédio%'
  OR t.descricao ILIKE '%remedio%'
  OR t.descricao ILIKE '%drogaria%'
  OR t.descricao ILIKE '%panvel%'
)
AND t.user_id = '766ad0da-d230-407f-894e-3829e13e86ea'
AND (t.categoria_id IS NULL);

-- 6. IFOOD/DELIVERY -> Alimentação > Delivery
UPDATE transactions t
SET categoria_id = (
  SELECT c.id FROM categories c 
  WHERE c.nome = 'Delivery' 
  AND c.user_id = t.user_id 
  AND c.parent_id IS NOT NULL
  LIMIT 1
)
WHERE (
  t.descricao ILIKE '%ifood%' 
  OR t.descricao ILIKE '%rappi%'
  OR t.descricao ILIKE '%delivery%'
  OR t.descricao ILIKE '%uber eats%'
)
AND t.user_id = '766ad0da-d230-407f-894e-3829e13e86ea'
AND (t.categoria_id IS NULL);

-- 7. LUZ/ENERGIA -> Casa > Energia
UPDATE transactions t
SET categoria_id = (
  SELECT c.id FROM categories c 
  WHERE c.nome = 'Energia' 
  AND c.user_id = t.user_id 
  AND c.parent_id IS NOT NULL
  LIMIT 1
)
WHERE (
  t.descricao ILIKE '%luz%' 
  OR t.descricao ILIKE '%energia%'
  OR t.descricao ILIKE '%enel%'
  OR t.descricao ILIKE '%copel%'
)
AND t.user_id = '766ad0da-d230-407f-894e-3829e13e86ea'
AND (t.categoria_id IS NULL);

-- 8. NETFLIX/SPOTIFY/STREAMING -> Lazer > Streaming
UPDATE transactions t
SET categoria_id = (
  SELECT c.id FROM categories c 
  WHERE c.nome = 'Streaming' 
  AND c.user_id = t.user_id 
  AND c.parent_id IS NOT NULL
  LIMIT 1
)
WHERE (
  t.descricao ILIKE '%netflix%' 
  OR t.descricao ILIKE '%spotify%'
  OR t.descricao ILIKE '%disney%'
  OR t.descricao ILIKE '%hbo%'
  OR t.descricao ILIKE '%prime%'
  OR t.descricao ILIKE '%globoplay%'
)
AND t.user_id = '766ad0da-d230-407f-894e-3829e13e86ea'
AND (t.categoria_id IS NULL);

-- 9. ALUGUEL/CONDOMINIO -> Casa > Moradia
UPDATE transactions t
SET categoria_id = (
  SELECT c.id FROM categories c 
  WHERE c.nome = 'Moradia' 
  AND c.user_id = t.user_id 
  AND c.parent_id IS NOT NULL
  LIMIT 1
)
WHERE (
  t.descricao ILIKE '%aluguel%' 
  OR t.descricao ILIKE '%condomínio%'
  OR t.descricao ILIKE '%condominio%'
  OR t.descricao ILIKE '%iptu%'
)
AND t.user_id = '766ad0da-d230-407f-894e-3829e13e86ea'
AND (t.categoria_id IS NULL);

-- 10. SALÁRIO/PAGAMENTO -> Renda Principal > Salário
UPDATE transactions t
SET categoria_id = (
  SELECT c.id FROM categories c 
  WHERE c.nome = 'Salário' 
  AND c.user_id = t.user_id 
  AND c.parent_id IS NOT NULL
  LIMIT 1
)
WHERE (
  t.descricao ILIKE '%salário%' 
  OR t.descricao ILIKE '%salario%'
  OR t.descricao ILIKE '%pagamento%'
  OR t.descricao ILIKE '%holerite%'
)
AND t.user_id = '766ad0da-d230-407f-894e-3829e13e86ea'
AND (t.categoria_id IS NULL);

-- VERIFICAR resultado
SELECT 
  CASE WHEN categoria_id IS NULL THEN 'Sem categoria' ELSE 'Com categoria' END as status,
  COUNT(*) as quantidade
FROM transactions
WHERE user_id = '766ad0da-d230-407f-894e-3829e13e86ea'
GROUP BY CASE WHEN categoria_id IS NULL THEN 'Sem categoria' ELSE 'Com categoria' END;
