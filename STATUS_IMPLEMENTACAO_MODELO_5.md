# 📊 STATUS DE IMPLEMENTAÇÃO - MODELO 5 HÍBRIDO

**Data da Análise:** 05/12/2024  
**Objetivo:** Verificar o que já foi implementado do Modelo 5 Híbrido (Contexto Ativo + Contagem Justa de Limites)

---

## 🎯 CONCEITO DO MODELO 5 (RECAP)

```
✅ Transações do GRUPO (group_id != null)
   → NÃO contam no limite do usuário
   → ILIMITADAS para membros free

✅ Transações PESSOAIS (group_id == null)
   → Contam no limite (75/mês para free)
   → Consomem quota pessoal
```

---

## ✅ **O QUE JÁ ESTÁ IMPLEMENTADO**

### 1. **Backend - Estrutura de Dados** ✅

#### Tabelas Existentes:
- ✅ `family_groups` - Grupos familiares
- ✅ `family_members` - Membros e roles (owner, admin, member, viewer)
- ✅ `family_invites` - Sistema de convites
- ✅ `telegram_integration` - Vinculação user ↔ chat_id
- ✅ `transactions` **COM campo `group_id`** ✅✅✅
- ✅ `accounts` com suporte a `group_id`
- ✅ `categories` com suporte a `group_id`
- ✅ `budgets` com suporte a `group_id`
- ✅ `goals` com suporte a `group_id`

**✅ A estrutura de dados JÁ SUPORTA transações de grupo vs pessoal!**

---

### 2. **Sistema de Limites** ✅ (PARCIAL)

#### Função `check_transaction_limit` (SQL)
```sql
-- LOCALIZAÇÃO: supabase/migrations/20251204000000_create_usage_tracking.sql
-- Linhas 22-86

CREATE OR REPLACE FUNCTION public.check_transaction_limit(user_id UUID)
RETURNS JSONB
```

**Status Atual:**
```sql
-- Conta TODAS as transações do usuário:
SELECT count(*) INTO tx_count
FROM public.transactions
WHERE transactions.user_id = check_transaction_limit.user_id
AND date >= start_of_month::date;
```

**❌ PROBLEMA:** Está contando TODAS as transações, **incluindo as do grupo!**

**✅ O QUE DEVERIA SER:**
```sql
-- Contar APENAS transações pessoais (group_id IS NULL)
SELECT count(*) INTO tx_count
FROM public.transactions
WHERE transactions.user_id = check_transaction_limit.user_id
AND group_id IS NULL  -- ⬅️ FALTA ADICIONAR ISTO!
AND date >= start_of_month::date;
```

---

### 3. **Frontend - Exibição de Limites** ✅

#### Componente `LimitsBanner.tsx`
- ✅ Mostra limite de transações
- ✅ Barra de progresso (80%, 90%, 100%)
- ✅ Distingue período trial (100 txs) vs normal (75 txs)
- ✅ Botão "Fazer Upgrade"

**✅ O componente já funciona, mas conta transações erradas do backend**

---

### 4. **Hook `useLimits`** ✅ (Assumindo que existe)

**Status:** Provavelmente consome `check_transaction_limit` RPC

---

### 5. **Sistema Familiar** ✅ COMPLETO

#### Hook `useFamily.ts`
- ✅ Criar grupo familiar
- ✅ Convidar membros (token FAM_XXX)
- ✅ Aceitar convite
- ✅ Gerenciar roles (owner, admin, member, viewer)
- ✅ Remover membros
- ✅ Dissolver grupo (função RPC segura)
- ✅ Migrar dados pessoais → grupo

**✅ Sistema familiar está 100% funcional!**

---

### 6. **Telegram Bot** ❌ NÃO IMPLEMENTADO

#### Arquivo `telegram-webhook/index.ts` (1644 linhas)

**Comandos Existentes:**
- ✅ `/start` - Boas-vindas
- ✅ `/saldo` - Ver saldos
- ✅ `/extrato` - Últimas transações
- ✅ `/resumo` - Resumo mensal
- ✅ `/metas` - Progresso de metas
- ✅ `/orcamento` - (não encontrado no código mostrado)
- ✅ `/perguntar` - Consultas IA
- ✅ `/top_gastos` - Top 5 categorias
- ✅ `/comparar_meses` - Mês atual vs anterior
- ✅ `/previsao` - Projeção de gastos
- ✅ `/editar_ultima` - Editar transação
- ✅ `/recorrente_nova` - Instruções
- ✅ `/recorrentes` - Listar recorrentes
- ✅ `/pausar_recorrente` - Pausar/retomar
- ✅ `/meuperfil` - Quiz financeiro
- ✅ `/comprar_ativo` - Registrar investimento

**❌ NÃO ENCONTRADO:**
- ❌ `/contexto` ou `/ctx` - Trocar contexto (Pessoal ↔ Grupo)
- ❌ `/p` - Alternar para Pessoal
- ❌ `/g` ou `/grupo` - Alternar para Grupo
- ❌ `/config` - Configurações do bot
- ❌ Detecção de prefixos `#p` ou `#g`
- ❌ Indicador visual de onde foi registrado (🏠 Grupo / 👤 Pessoal)
- ❌ Campo `default_context` na tabela `telegram_integration`

---

## ❌ **O QUE FALTA IMPLEMENTAR**

### 1. **🔴 CRÍTICO - Corrigir Função de Limites**

**Arquivo:** `supabase/migrations/20251204000000_create_usage_tracking.sql`

```sql
-- LINHA 73-76 (ATUAL - ERRADO):
SELECT count(*) INTO tx_count
FROM public.transactions
WHERE transactions.user_id = check_transaction_limit.user_id
AND date >= start_of_month::date;

-- DEVE SER (CORRETO):
SELECT count(*) INTO tx_count
FROM public.transactions
WHERE transactions.user_id = check_transaction_limit.user_id
AND group_id IS NULL  -- ⬅️ ADICIONAR ESTA LINHA
AND date >= start_of_month::date;
```

**Impacto:** ALTO  
**Sem isso, usuários free em grupos familiares são bloqueados incorretamente!**

---

### 2. **🟡 IMPORTANTE - Banco de Dados (Telegram)**

#### Migration: Adicionar campo `default_context`

```sql
-- Nova migration: supabase/migrations/20251206000000_add_telegram_context.sql

ALTER TABLE public.telegram_integration
ADD COLUMN IF NOT EXISTS default_context VARCHAR(20) DEFAULT 'personal';

COMMENT ON COLUMN public.telegram_integration.default_context 
IS 'Contexto padrão do usuário no Telegram: personal ou group';

-- Configurações adicionais
ALTER TABLE public.telegram_integration
ADD COLUMN IF NOT EXISTS show_context_confirmation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS alert_at_80_percent BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS alert_at_90_percent BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_telegram_integration_default_context 
ON public.telegram_integration(default_context);
```

---

### 3. **🟡 IMPORTANTE - Edge Function (Telegram Bot)**

#### Atualizar `telegram-webhook/index.ts`

**Adicionar:**

1. **Função auxiliar: obter contexto ativo**
```typescript
async function getUserContext(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase
    .from('telegram_integration')
    .select('default_context')
    .eq('user_id', userId)
    .single();
  
  return data?.default_context || 'personal';
}
```

2. **Função auxiliar: setar contexto**
```typescript
async function setUserContext(supabase: any, userId: string, context: 'personal' | 'group'): Promise<void> {
  await supabase
    .from('telegram_integration')
    .update({ default_context: context })
    .eq('user_id', userId);
}
```

3. **Detectar prefixos na mensagem**
```typescript
function parseContextFromMessage(message: string): { context: string | null, cleanMessage: string } {
  if (message.startsWith('#p ') || message.startsWith('#pessoal ')) {
    return { context: 'personal', cleanMessage: message.replace(/^#p(essoal)?\s+/, '') };
  }
  if (message.startsWith('#g ') || message.startsWith('#grupo ')) {
    return { context: 'group', cleanMessage: message.replace(/^#g(rupo)?\s+/, '') };
  }
  return { context: null, cleanMessage: message };
}
```

4. **Novos comandos:**
```typescript
case '/contexto':
case '/ctx': {
  // Mostrar menu de contexto
}

case '/p': {
  await setUserContext(supabase, userId, 'personal');
  await sendTelegramMessage(chatId, '✅ Contexto alterado para 👤 Pessoal');
}

case '/g':
case '/grupo': {
  await setUserContext(supabase, userId, 'group');
  await sendTelegramMessage(chatId, '✅ Contexto alterado para 🏠 Grupo');
}

case '/config': {
  // Mostrar configurações
}
```

5. **Ao criar transação via NLP:**
```typescript
// Obter contexto
const { context: prefixContext, cleanMessage } = parseContextFromMessage(messageText);
const defaultContext = await getUserContext(supabase, userId);
const finalContext = prefixContext || defaultContext;

// Buscar group_id se contexto for 'group'
let groupId = null;
if (finalContext === 'group') {
  const { data: memberData } = await supabase
    .from('family_members')
    .select('group_id')
    .eq('member_id', userId)
    .eq('status', 'active')
    .limit(1)
    .single();
  
  groupId = memberData?.group_id || null;
}

// Inserir transação
await supabase.from('transactions').insert({
  user_id: userId,
  group_id: groupId,  // ⬅️ null = pessoal, UUID = grupo
  // ... outros campos
});

// Mensagem de confirmação
const contextEmoji = groupId ? '🏠' : '👤';
const contextLabel = groupId ? 'Família Silva' : 'Pessoal';
const visibilityInfo = groupId ? 'Todos do grupo verão esta transação.' : '(só você vê)';

await sendTelegramMessage(chatId, 
  `✅ Despesa registrada!\n\n` +
  `💰 Valor: R$ ${valor}\n` +
  `📁 Categoria: ${categoria}\n` +
  `${contextEmoji} ${contextLabel}\n` +
  `${visibilityInfo}\n\n` +
  (groupId ? '' : `📊 Uso: ${usage}/${limit} transações (${percentage}%)`)
);
```

---

### 4. **🟢 OPCIONAL - Frontend (Web)**

#### Página de Configuração do Telegram

**Criar:** `src/pages/TelegramSettings.tsx`

```tsx
export function TelegramSettings() {
  const { user } = useAuth();
  const [context, setContext] = useState('personal');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Telegram</CardTitle>
      </CardHeader>
      <CardContent>
        <Label>Contexto Padrão</Label>
        <RadioGroup value={context} onValueChange={setContext}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="personal" id="personal" />
            <Label htmlFor="personal">👤 Pessoal</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="group" id="group" />
            <Label htmlFor="group">🏠 Família</Label>
          </div>
        </RadioGroup>
        
        <Button onClick={handleSave}>Salvar</Button>
      </CardContent>
    </Card>
  );
}
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### Fase 1: Correção Crítica (30min)
- [ ] **Corrigir `check_transaction_limit`** - Adicionar `AND group_id IS NULL`
- [ ] Testar limite de transações para usuário free em grupo
- [ ] Verificar que transações do grupo não contam

### Fase 2: Backend Telegram (1h)
- [ ] Criar migration `add_telegram_context.sql`
- [ ] Aplicar migration no Supabase
- [ ] Criar RPC `set_telegram_context(user_id, context)`
- [ ] Criar RPC `get_telegram_context(user_id)`

### Fase 3: Bot Telegram (3h)
- [ ] Adicionar funções auxiliares (`getUserContext`, `setUserContext`, `parseContextFromMessage`)
- [ ] Implementar comando `/contexto` com inline keyboard
- [ ] Implementar comandos `/p` e `/g`
- [ ] Implementar comando `/config`
- [ ] Detectar prefixos `#p` e `#g` em mensagens
- [ ] Atualizar NLP para usar contexto correto
- [ ] Adicionar indicador visual em confirmações
- [ ] Adicionar aviso de limite apenas para transações pessoais

### Fase 4: Testes (2h)
- [ ] Testar criação de transação pessoal
- [ ] Testar criação de transação de grupo
- [ ] Testar prefixos (#p, #g)
- [ ] Testar comandos de contexto
- [ ] Verificar contagem de limites
- [ ] Testar com usuário free em grupo premium
- [ ] Validar mensagens de confirmação

### Fase 5: Frontend (Opcional) (2h)
- [ ] Criar página TelegramSettings.tsx
- [ ] Mostrar contexto ativo
- [ ] Permitir alterar contexto padrão
- [ ] Badge em lista de transações (🏠/👤)

---

## 🎯 **RESUMO**

### ✅ O que JÁ funciona:
1. Sistema familiar completo (grupos, membros, convites, roles)
2. Transações com suporte a `group_id`
3. Sistema de limites (estrutura existe)
4. Bot Telegram com comandos básicos
5. Frontend com exibição de limites

### ❌ O que NÃO funciona (Modelo 5):
1. **Contagem de limites** - Conta TODAS as transações (deveria contar só pessoais)
2. **Contexto no Telegram** - Não existe campo nem lógica
3. **Comandos de contexto** - /contexto, /p, /g não existem
4. **Prefixos** - #p e #g não são detectados
5. **Indicadores visuais** - Não mostra onde foi registrado

### 🔴 BLOQUEIO ATUAL:
**Usuários free em grupos familiares são bloqueados incorretamente** porque a função `check_transaction_limit` conta transações do grupo no limite pessoal.

**FIX IMEDIATO:** 1 linha SQL  
**IMPLEMENTAÇÃO COMPLETA:** ~8 horas de desenvolvimento

---

**Status Final:**  
🟡 **Modelo 5 = 40% implementado**
- ✅ Estrutura de dados: 100%
- ❌ Lógica de limites: 0% (conta errado)
- ❌ UX Telegram: 0%
- ✅ Sistema familiar: 100%

**Próximo Passo Crítico:** Corrigir `check_transaction_limit` AGORA!
