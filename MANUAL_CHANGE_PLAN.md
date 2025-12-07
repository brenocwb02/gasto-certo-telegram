# Como Mudar o Plano do Usuário Manualmente

Para alterar o plano do usuário `breno.albuquerque@gmail.com` para o plano Família, execute os seguintes comandos no **SQL Editor** do Supabase:

## 1. Identificar o ID do Usuário e Colunas Disponíveis
Primeiro, vamos ver como a tabela `profiles` está estruturada e pegar o ID do Breno.

```sql
SELECT p.*, u.email 
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'breno.albuquerque@gmail.com';
```

## 2. Atualizar o Plano (Opção A: Tabela Profiles)
Se a tabela `profiles` tiver uma coluna chamada `plan`, `tier` ou `subscription_type`, use o comando abaixo (ajuste o nome da coluna conforme o resultado do passo 1):

```sql
UPDATE profiles
SET plan = 'family' -- Ajuste 'plan' para o nome correto da coluna
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'breno.albuquerque@gmail.com');
```

## 2. Atualizar o Plano (Opção B: Tabela Subscriptions)
Se houver uma tabela separada de assinaturas, use:

```sql
UPDATE subscriptions
SET status = 'active', plan_id = 'family_plan_id' -- Verifique os IDs reais
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'breno.albuquerque@gmail.com');
```

## 3. Confirmação
Após rodar o update, verifique novamente:

```sql
SELECT p.*, u.email 
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'breno.albuquerque@gmail.com';
```

---
**Observação:** O sistema de IA agora foi corrigido para **sempre** retornar a categoria com hierarquia (Pai > Filho), o que resolverá o problema visual no Telegram.
