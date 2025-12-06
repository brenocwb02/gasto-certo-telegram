# 🔧 GUIA DE INTEGRAÇÃO - MODELO 5 HÍBRIDO NO TELEGRAM

Este guia mostra como integrar as funções de contexto no arquivo existente:
`supabase/functions/telegram-webhook/index.ts`

---

## 📝 PASSO 1: IMPORTAR FUNÇÕES AUXILIARES

**Localização:** Início do arquivo (após imports existentes)

```typescript
// Após as importações existentes (linha ~5)
// Copiar TODAS as funções do arquivo context-helpers.ts
```

Ou simplesmente copie todo o conteúdo de `context-helpers.ts` e cole após a linha 262 (após `getTranscriptFromAudio`).

---

## 📝 PASSO 2: ADICIONAR NOVOS COMANDOS

**Localização:** Dentro da função `handleCommand` (linha ~327)

**Adicionar após o case '/meuperfil':** (linha ~768)

```typescript
case '/contexto':
case '/ctx': {
  await handleContextCommand(supabase, userId, chatId);
  break;
}

case '/p': {
  await handlePersonalCommand(supabase, userId, chatId);
  break;
}

case '/g':
case '/grupo': {
  await handleGroupCommand(supabase, userId, chatId);
  break;
}

case '/config': {
  await handleConfigCommand(supabase, userId, chatId);
  break;
}
```

---

## 📝 PASSO 3: ATUALIZAR PROCESSAMENTO DE MENSAGENS (NLP)

**Localização:** Onde as transações são criadas via NLP

**Procure por:** `// Processar mensagem de texto com NLP` ou similar

**ANTES (buscar algo como):**
```typescript
// Inserir transação
const { error: insertError } = await supabase
  .from('transactions')
  .insert({
    user_id: userId,
    tipo: transactionData.tipo,
    valor: transactionData.valor,
    // ... outros campos
  });
```

**SUBSTITUIR POR:**
```typescript
// 1. Obter contexto do usuário
const userContext = await getUserTelegramContext(supabase, userId);

// 2. Detectar prefixos na mensagem (#p ou #g)
const { forcedContext, cleanMessage } = parseContextFromMessage(messageText);

// 3. Determinar contexto final (prefixo sobrescreve padrão)
const finalContext = forcedContext || userContext.defaultContext;

// 4. Resolver group_id baseado no contexto
const groupId = await resolveGroupIdFromContext(
  supabase,
  userId,
  finalContext,
  userContext.groupId
);

// 5. Processar mensagem limpa (sem prefixo)
const transactionData = await processNLPMessage(cleanMessage, supabase, userId);

// 6. Inserir transação com group_id correto
const { error: insertError } = await supabase
  .from('transactions')
  .insert({
    user_id: userId,
    group_id: groupId,  // ⬅️ ADICIONAR ESTE CAMPO!
    tipo: transactionData.tipo,
    valor: transactionData.valor,
    // ... outros campos
  });

// 7. Verificar limites (apenas para transações pessoais)
let usage, limit, percentage;
if (finalContext === 'personal') {
  const { data: limits } = await supabase.rpc('check_transaction_limit', { user_id: userId });
  usage = limits?.usage || 0;
  limit = limits?.limit || 75;
  percentage = Math.round((usage / limit) * 100);
  
  // Verificar se deve mostrar alerta
  const alert = shouldShowLimitAlert(
    usage,
    limit,
    userContext.alertAt80Percent,
    userContext.alertAt90Percent
  );
  
  if (alert.show) {
    await sendTelegramMessage(chatId, alert.message, { parse_mode: 'Markdown' });
  }
}

// 8. Enviar confirmação formatada
const confirmationMessage = formatTransactionConfirmation({
  tipo: transactionData.tipo,
  valor: transactionData.valor,
  descricao: transactionData.descricao,
  categoria: transactionData.categoria_nome || 'Sem categoria',
  context: finalContext,
  groupName: userContext.groupName,
  usage,
  limit,
  showUsage: userContext.showConfirmation
});

await sendTelegramMessage(chatId, confirmationMessage, { parse_mode: 'Markdown' });
```

---

## 📝 PASSO 4: HANDLER DE CALLBACK QUERIES

**Localização:** Procure por `callback_query` handler

**Adicionar após os callbacks existentes:**

```typescript
// Callbacks de contexto
if (callbackData === 'context_personal') {
  await setUserTelegramContext(supabase, userId, 'personal');
  await editTelegramMessage(chatId, messageId, 
    '✅ Contexto alterado para 👤 Pessoal\n\nSuas próximas transações serão pessoais (75/mês para free).'
  );
}

if (callbackData === 'context_group') {
  await setUserTelegramContext(supabase, userId, 'group');
  const context = await getUserTelegramContext(supabase, userId);
  await editTelegramMessage(chatId, messageId, 
    `✅ Contexto alterado para 🏠 ${context.groupName}\n\nSuas próximas transações serão compartilhadas (ILIMITADAS).`
  );
}

if (callbackData === 'context_cancel') {
  await editTelegramMessage(chatId, messageId, '❌ Operação cancelada.');
}

if (callbackData === 'context_no_group') {
  await editTelegramMessage(chatId, messageId,
    '⚠️ Você não está em nenhum grupo.\n\n' +
    'Para criar ou entrar em um grupo familiar, acesse:\n' +
    '🔗 https://app.boascontas.com/familia'
  );
}

if (callbackData === 'config_context') {
  await handleContextCommand(supabase, userId, chatId);
}

if (callbackData === 'config_close') {
  await editTelegramMessage(chatId, messageId, '⚙️ Configurações fechadas.');
}
```

---

## 📝 PASSO 5: ATUALIZAR COMANDO /start

**Localização:** case '/start' (linha ~332)

**Adicionar na lista de comandos:**

```typescript
case '/start': {
  const message = `🎉 *Bem-vindo ao Zaq - Boas Contas!*

🎯 Comandos disponíveis:

💰 *Finanças*
• Registre gastos naturalmente (ex: "Almoço 25 reais")
• /saldo - Ver saldo das contas
• /extrato - Últimas transações
• /resumo - Resumo do mês

🔄 *Contexto (Novo!)*  // ⬅️ ADICIONAR ESTA SEÇÃO
• /contexto - Escolher onde registrar (Pessoal/Grupo)
• /p - Alternar para Pessoal
• /g - Alternar para Grupo
• #p ou #g - Usar prefixo em mensagens

📊 *Análises Inteligentes*
• /perguntar [pergunta] - Pergunte sobre seus gastos
• /top_gastos - Top 5 categorias do mês
• /comparar_meses - Compare mês atual vs anterior
• /previsao - Previsão de gastos

✏️ *Edição*
• /editar_ultima - Editar última transação

🎯 *Metas e Orçamento*
• /metas - Ver progresso das metas
• /orcamento - Status do orçamento

⚙️ *Configurações*
• /config - Configurações do bot

💡 /ajuda - Ver este menu`;
  
  await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
  break;
}
```

---

## 📝 PASSO 6: ATUALIZAR COMANDO /ajuda

**Localização:** Adicionar novo case ou atualizar existente

```typescript
case '/ajuda':
case '/help': {
  const message = `📚 *Ajuda - Gasto Certo*

*REGISTRAR TRANSAÇÕES:*

1️⃣ Mensagem Natural:
   "Gastei 50 no mercado"
   "Recebi 1000 de salário"

2️⃣ Com Áudio:
   🎤 Grave um áudio dizendo o gasto

3️⃣ Com Prefixo (Novo!):
   "#p Almoço 25 reais" → Pessoal
   "#g Mercado 200 reais" → Grupo

*CONTEXTO:*
• /contexto - Escolher padrão (Pessoal/Grupo)
• /p - Ir para Pessoal
• /g - Ir para Grupo

📌 *Diferença:*
👤 Pessoal = Só você vê (75/mês free)
🏠 Grupo = Todos veem (ILIMITADO)

*CONSULTAS:*
• /saldo - Ver saldos
• /extrato - Últimas transações
• /resumo - Resumo do mês
• /metas - Progresso de metas

*CONFIGURAÇÕES:*
• /config - Preferências do bot

💡 Dica: Transações do grupo são ilimitadas!`;

  await sendTelegramMessage(chatId, message, { parse_mode: 'Markdown' });
  break;
}
```

---

## 🧪 TESTES RECOMENDADOS

Após implementar, teste:

1. **Contexto Padrão:**
   ```
   /contexto → Escolher "Pessoal"
   "Almoço 25 reais" → Deve ir para Pessoal
   ```

2. **Trocar Contexto:**
   ```
   /g → Alternar para Grupo
   "Mercado 200" → Deve ir para Grupo
   ```

3. **Prefixos:**
   ```
   Contexto: Grupo
   "#p Cinema 40" → Deve ir para Pessoal (sobrescreve)
   ```

4. **Indicadores Visuais:**
   - Verificar se mostra 🏠 ou 👤
   - Verificar se mostra uso apenas para pessoal
   - Verificar alertas de limite

5. **Limites:**
   - Criar 80 transações do grupo → Não deve bloquear
   - Criar 76 transações pessoais → Deve bloquear

---

## 📊 RESUMO DAS MUDANÇAS

| Arquivo | Ação |
|---------|------|
| `20251205000001_add_telegram_context_fields.sql` | Aplicar migration |
| `telegram-webhook/index.ts` | Adicionar código dos passos 1-6 |

**Total de linhas adicionadas:** ~300 linhas

**Tempo estimado:** 30-45 minutos

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Aplicar migration `20251205000001_add_telegram_context_fields.sql`
- [ ] Copiar funções auxiliares para `index.ts`
- [ ] Adicionar novos comandos (/contexto, /p, /g, /config)
- [ ] Atualizar processamento de NLP com contexto
- [ ] Adicionar callbacks de contexto
- [ ] Atualizar /start e /ajuda
- [ ] Deploy da Edge Function
- [ ] Testar todos os fluxos

---

**Pronto! Com isso, o Modelo 5 Híbrido estará 100% implementado!** 🎉
