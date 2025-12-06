# 📱 MODELO 5 HÍBRIDO - UX DO TELEGRAM

**Data:** Dezembro 2024  
**Status:** 🟡 Proposto (Não implementado)  
**Conversa:** Family Plan Business Models (eac7766b-828c-411f-8b98-3a81c7874490)

---

## 🎯 PROBLEMA QUE RESOLVE

### Contexto do Desafio
No sistema atual, há um conflito entre:
1. **Plano Familiar** - Permite até 10 pessoas compartilharem dados
2. **Plano Gratuito** - Limite de 75 transações/mês por usuário
3. **Telegram** - Interface única que precisa lidar com contextos pessoais E familiares

**Dilema:**
> Maria é membro FREE em uma família premium. Se ela registrar transações pelo Telegram, onde elas vão? Se forem para o grupo, ela usa benefícios premium sem pagar. Se forem pessoais, ela consome seu limite rapidamente com gastos familiares.

---

## 🔑 SOLUÇÃO: CONTEXTO ATIVO

### Conceito Chave
O usuário **escolhe um contexto** (Pessoal ou Grupo) e o bot **mantém esse contexto** até mudar explicitamente.

### Regra de Contagem de Limites
```
✅ Transações do GRUPO (group_id != null) → NÃO contam no limite pessoal
✅ Transações PESSOAIS (group_id = null) → Contam no limite (75/mês para free)
```

**Vantagens:**
- ✅ **Flexível** - Maria escolhe o contexto conforme a situação
- ✅ **Claro** - Sempre sabe onde vai cada transação
- ✅ **Justo** - Paga pelo que USA pessoalmente
- ✅ **Útil** - Grupo ilimitado para despesas familiares

---

## 💬 FLUXO PRÁTICO NO TELEGRAM

### 1️⃣ PRIMEIRA VEZ - Configuração Inicial

```
Usuário → Bot
────────────────────────────────────────
Maria: /start MAR-456-DEF

Bot:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Olá Maria!

Você está vinculada a:
👤 Conta pessoal
🏠 Família Silva (membro)

📌 Contexto atual: Família Silva
   (Suas transações vão para o grupo)

💡 Para trocar o contexto, use:
   /contexto ou /ctx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 2️⃣ ENVIANDO TRANSAÇÃO - Comportamento Padrão

```
Maria (está no contexto "Família Silva"):
────────────────────────────────────────
Gastei 100 reais no mercado

Bot:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Despesa registrada!

💰 Valor: R$ 100,00
📁 Categoria: Alimentação
🏠 Família Silva

Outras pessoas do grupo verão esta transação.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 3️⃣ TROCAR CONTEXTO - Comando Simples

```
Maria:
────────────────────────────────────────
/contexto

Bot:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Escolha o contexto:
   Onde suas próximas transações serão registradas?

[👤 Pessoal]  [🏠 Família Silva]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Maria clica: [👤 Pessoal]

Bot:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Contexto alterado!

📌 Suas transações agora vão para:
   👤 Pessoal

⚠️ Lembre-se: Plano Gratuito
   Limite: 45/75 transações este mês

Para voltar ao grupo: /grupo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 4️⃣ AGORA NO CONTEXTO PESSOAL

```
Maria (contexto "Pessoal"):
────────────────────────────────────────
Comprei um presente de 50 reais

Bot:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Despesa registrada!

💰 Valor: R$ 50,00
📁 Categoria: Presentes
👤 Pessoal (só você vê)

📊 Uso: 46/75 transações (61%)
⚠️ 29 transações restantes este mês
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎨 ALTERNATIVAS DE UX

### ALTERNATIVA 2: Atalhos Rápidos (Prefixos)

Sem trocar contexto - Uso de prefixos:

```
Maria (contexto padrão: Família):
────────────────────────────────────────

Para GRUPO (padrão):
> Gastei 100 no mercado
→ Vai para Família Silva ✅

Para PESSOAL (com prefixo):
> #pessoal Comprei presente de 50
→ Vai para Pessoal ✅

Para GRUPO (explícito):
> #grupo Conta de luz 200
→ Vai para Família Silva ✅

Resposta do Bot:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Despesa registrada!

💰 Valor: R$ 50,00
📁 Categoria: Presentes
👤 Pessoal (só você vê)

💡 Dica: Use #grupo para enviar ao grupo
   ou /contexto para mudar o padrão.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### ALTERNATIVA 3: Inline Keyboard (Mais UX)

Bot pergunta a cada transação:

```
Maria:
────────────────────────────────────────
Gastei 100 no mercado

Bot:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 R$ 100,00 - Mercado
📁 Alimentação

📌 Onde registrar?

[👤 Pessoal]  [🏠 Família Silva]

⚙️ [Sempre Grupo] [Sempre Pessoal]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📊 COMPARAÇÃO DAS ABORDAGENS

| Método | Praticidade | Velocidade | Clareza |
|--------|-------------|------------|---------|
| **Contexto fixo + /comando** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Prefixos (#pessoal)** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Pergunta sempre** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 💡 RECOMENDAÇÃO: HÍBRIDO INTELIGENTE

### Combinação das Melhores Práticas

1. **Contexto Padrão**: Definido pelo usuário
   - `/config` → Maria define "Família" como padrão

2. **Indicador Visual**: Sempre mostra contexto atual
   - Bot responde: "Registrado em 🏠 Família Silva"

3. **Atalhos Rápidos**: Prefixos opcionais
   - `#p` = Pessoal
   - `#g` = Grupo

4. **Comando Rápido**: `/p` ou `/g` alterna contexto

---

## 📱 EXEMPLO REAL DE USO

### Dia a dia da Maria:

```
┌────────────────────────────────────────┐
│ 08:00 - Maria acorda                   │
├────────────────────────────────────────┤
│ Maria: /g (alterna para Grupo)         │
│ Bot: ✅ Contexto: 🏠 Família Silva     │
├────────────────────────────────────────┤
│ Maria: Padaria 20 reais                │
│ Bot: ✅ Registrado 🏠 Família Silva    │
│      Despesa familiar                  │
├────────────────────────────────────────┤
│ 12:00 - Almoço pessoal                 │
├────────────────────────────────────────┤
│ Maria: #p Almoço 35 reais              │
│ Bot: ✅ Registrado 👤 Pessoal          │
│      Despesa só sua (44/75)            │
├────────────────────────────────────────┤
│ 18:00 - Conta de luz                   │
├────────────────────────────────────────┤
│ Maria: Luz 180 reais                   │
│ Bot: ✅ Registrado 🏠 Família Silva    │
│      (contexto padrão)                 │
└────────────────────────────────────────┘
```

---

## ⚙️ CONFIGURAÇÕES SUGERIDAS

### Comando `/config`

```
Bot:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ Configurações

📌 Contexto Padrão:
   - 👤 Pessoal
   ● 🏠 Família Silva

💬 Modo de Confirmação:
   ● Sempre mostrar onde foi registrado
   - Perguntar a cada transação
   - Não perguntar (silencioso)

🔔 Avisos de Limite:
   ● Avisar em 80% (60/75)
   ● Avisar em 90% (68/75)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 IMPLEMENTAÇÃO BACKEND

### Estrutura de Dados

```sql
-- Adicionar à tabela telegram_integration
ALTER TABLE telegram_integration
ADD COLUMN default_context VARCHAR(20) DEFAULT 'personal';
-- Valores: 'personal' ou 'group'

ADD COLUMN show_context_confirmation BOOLEAN DEFAULT true;
ADD COLUMN alert_at_80_percent BOOLEAN DEFAULT true;
ADD COLUMN alert_at_90_percent BOOLEAN DEFAULT true;
```

### Lógica do Bot (Pseudocódigo)

```javascript
// Quando bot recebe mensagem da Maria:

1. Busca contexto ativo:
   SELECT default_context 
   FROM telegram_integration 
   WHERE telegram_chat_id = 'maria_chat_id'
   → Resultado: 'group' ou 'personal'

2. Verifica prefixo na mensagem:
   Se mensagem começa com #p → força pessoal
   Se mensagem começa com #g → força grupo
   Se sem prefixo → usa default_context

3. Cria transação:
   INSERT INTO transactions (
     user_id: 'maria',
     group_id: context === 'group' ? 'familia-silva' : null,
     ...
   )

4. Verifica limites:
   SE group_id = null:
     → Conta no limite pessoal (75/mês)
     → Incrementa usage_tracking
   SE group_id != null:
     → Não conta no limite pessoal
     → Não incrementa usage_tracking
```

---

## 📊 RESUMO DO MODELO 5

### Como funciona para Maria (membro gratuito):

| Tipo | Onde vai | Conta no limite? | Quem vê? |
|------|----------|------------------|----------|
| **Transação do Grupo** | Família Silva | ❌ Não | 👨👩👦 Todos |
| **Transação Pessoal** | Só dela | ✅ Sim (75/mês) | 👤 Só ela |

---

## 🚀 NOVOS COMANDOS TELEGRAM

### Comandos de Contexto

```
/contexto ou /ctx
→ Abre menu para escolher contexto padrão

/p
→ Alterna para contexto Pessoal

/g ou /grupo
→ Alterna para contexto Grupo

/config
→ Configurações avançadas do bot
```

### Exemplos com Prefixos

```
#p Gastei 50 no cinema
→ Registra em Pessoal (mesmo se contexto for Grupo)

#g Mercado 200 reais
→ Registra em Grupo (mesmo se contexto for Pessoal)
```

---

## 🎨 MENSAGENS FORMATADAS

### Confirmação com Contexto

```
✅ Despesa registrada!

💰 Valor: R$ 100,00
📁 Categoria: Alimentação
🏠 Contexto: Família Silva
👥 Visível para: Todos do grupo

────────
💡 Use /p para mudar para Pessoal
```

### Aviso de Limite (80%)

```
⚠️ ATENÇÃO: Limite de Transações

📊 Você usou 60 de 75 transações este mês (80%)
📅 Restam 15 transações até 01/Jan

💡 Dica: Transações do grupo não contam no seu limite!
   Use /g para alternar para o grupo familiar.

💎 Ou faça upgrade para Individual (ilimitado)
   → /planos
```

### Bloqueio de Limite (100%)

```
🚫 LIMITE ATINGIDO

Você atingiu o limite de 75 transações pessoais este mês.

✅ Opções disponíveis:
1️⃣ Aguardar até 01/Jan (resetado automaticamente)
2️⃣ Usar contexto de Grupo (/g) - ILIMITADO
3️⃣ Fazer upgrade para Individual

💎 Ver planos: /planos
🏠 Usar grupo: /g
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Backend (Supabase)
- [ ] Migration: Adicionar colunas à `telegram_integration`
- [ ] RPC: `set_telegram_context(user_id, context)`
- [ ] RPC: `get_telegram_settings(user_id)`
- [ ] Trigger: Atualizar `usage_tracking` apenas para transações pessoais

### Edge Functions
- [ ] Atualizar `telegram-webhook` com lógica de contexto
- [ ] Detectar prefixos (#p, #g)
- [ ] Implementar comando `/contexto`
- [ ] Implementar comando `/p` e `/g`
- [ ] Implementar comando `/config`
- [ ] Sempre mostrar indicador de contexto

### Frontend (Opcional)
- [ ] Página de configuração do Telegram
- [ ] Mostrar contexto ativo atual
- [ ] Histórico de transações com badge (Pessoal/Grupo)

### Testes
- [ ] Testar prefixos (#p, #g)
- [ ] Testar comandos de contexto
- [ ] Verificar contagem de limites
- [ ] Testar com multiple grupos
- [ ] Validar RLS policies

---

## 🎯 BENEFÍCIOS DO MODELO 5

### Para Usuários Free
✅ Participam de múltiplos grupos sem consumir limite  
✅ Ainda têm 75 transações pessoais/mês  
✅ Clareza total sobre onde vai cada transação  
✅ Flexibilidade para escolher contexto

### Para Usuários Premium (Grupo Owner)
✅ Todos do grupo podem contribuir sem limite  
✅ Incentiva colaboração familiar  
✅ Reduz atrito no onboarding de membros

### Para o Negócio
✅ Modelo justo e sustentável  
✅ Incentiva upgrade (usuários free querem mais transações pessoais)  
✅ Viral (membros free trazem outros membros)  
✅ Reduz abuso do sistema

---

## ❓ PERGUNTAS FREQUENTES

**P: E se um usuário FREE participar de 3 grupos?**  
R: Ele pode registrar transações em qualquer grupo, NENHUMA conta no limite pessoal. Limite de 75 é só para transações individuais (group_id = null).

**P: Um membro FREE pode criar seu próprio grupo?**  
R: Não. Apenas planos Família/Família Plus podem criar grupos. Mas ele pode SER CONVIDADO para grupos existentes.

**P: O que acontece se o Owner do grupo cancelar o plano?**  
R: O grupo é dissolvido ou suspenso. Membros mantêm suas transações pessoais, mas perdem acesso às transações do grupo.

**P: Posso ter transações automáticas alternando contexto?**  
R: Não recomendado. O contexto é manual para evitar confusão. Mas pode usar prefixos em regras recorrentes.

---

## 🎉 STATUS DE IMPLEMENTAÇÃO

- ❌ **Não implementado** (Dezembro 2024)
- 📝 Modelo documentado e aprovado
- ⏳ Aguardando priorização no roadmap

---

**Última atualização:** 05/12/2024  
**Próximos passos:** Aprovação final → Implementação → Testes → Release
