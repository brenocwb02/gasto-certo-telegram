# 📘 BOAS CONTAS — Regras Oficiais de Planos, Papéis e Acesso

**Versão 1.1** — Documento de Produto  
**Última atualização:** 2024-12-13

---

## 1️⃣ Princípios do Produto

1. **Consciência financeira coletiva** → Todos veem o impacto total dos gastos.
2. **Privacidade pessoal respeitada** → Ninguém vê detalhes pessoais sem permissão.
3. **Simplicidade radical** → Telegram é o centro da experiência.
4. **Quem paga decide** → Papéis claros evitam conflitos.
5. **Sem plano gratuito perpétuo** → Trial serve para criar hábito, não para sustentar uso.

---

## 2️⃣ Tipos de Usuário (Papéis)

### 🔑 1. Responsável Financeiro (Owner)
*Existe apenas no Plano Família*

**Quem é:** Quem paga a assinatura.

**Pode:**
- Criar e editar o orçamento familiar
- Definir categorias e limites
- Convidar e remover membros
- Ver totais e relatórios familiares
- Definir regras do grupo

**Não pode:**
- Ver gastos pessoais privados dos membros

---

### 👤 2. Membro da Família
*Usuário convidado para um grupo familiar*

**Pode:**
- Registrar gastos próprios via Telegram
- Registrar gastos no grupo familiar
- Ver totais consolidados do grupo
- Ver percentuais de orçamento
- Receber alertas automáticos

**Não pode:**
- Alterar orçamento
- Convidar outros membros
- Ver gastos pessoais privados de outros membros

---

### 🧍 3. Usuário Individual
*Usuário que não participa de grupo*

**Pode:**
- Gerenciar suas finanças pessoais
- Usar todas as funções Premium individuais

---

## 3️⃣ Plano Trial (Degustação)

### ⏳ Plano Trial — 14 dias

*Ativado automaticamente no primeiro uso.*

> **Diferencial:** "Não são só 7 dias tradicionais. Você tem 2 semanas completas para criar o hábito."

**Funcionalidades:**
- ✅ Registro ilimitado de gastos e receitas
- ✅ Uso completo via Telegram (texto e áudio)
- ✅ Criação de contas e cartões
- ✅ Uso da IA para perguntas e resumos
- ✅ Acesso total ao sistema

**Regras:**
- 1 usuário
- ❌ Não permite criação de grupo familiar
- Duração: 14 dias corridos

**Após expiração:**
- ❌ Bloqueio de novos lançamentos
- ✅ Acesso em modo leitura
- CTA claro para assinatura

---

## 4️⃣ Plano Individual (Premium)

### 👤 Plano Individual — R$ 14,90/mês

*Para quem controla apenas o próprio dinheiro.*

**O que oferece:**
- 1 usuário
- Lançamentos ilimitados via Telegram
- IA financeira ilimitada
- Múltiplos cartões e contas
- Orçamento mensal pessoal
- Resumo semanal automático
- Histórico completo

**Limitações:**
- ❌ Não permite grupos familiares
- ❌ Não permite compartilhamento
- Uso exclusivamente pessoal

---

## 5️⃣ Plano Família (Premium Global)

### 👨‍👩‍👧‍👦 Plano Família — R$ 24,90/mês

*O coração do produto.*

**👥 Até 4 membros (1 titular + 3 convidados)**

### 🎯 Propósito
Criar consciência financeira coletiva para evitar conflitos e melhorar decisões familiares.

### 🔐 Papéis no Plano Família

| Papel | Quantidade | Descrição |
|-------|------------|-----------|
| Responsável Financeiro | 1 pessoa | Quem paga, administra tudo |
| Membros da Família | Até 3 | Participam ativamente |

### 💬 Lançamentos
- Todos lançam gastos via Telegram
- Gastos podem ser:
  - **Familiares** (entram no orçamento comum)
  - **Pessoais** (privados)

### 📊 Visibilidade
**Todos veem:**
- Total gasto por categoria
- Percentual do orçamento usado
- Comparação mensal

**Ninguém vê:**
- Detalhes pessoais de outros membros

### 🔔 Alertas Inteligentes
- 80% do orçamento atingido
- Mês mais apertado que o anterior
- Gastos fora do padrão

### 📅 Resumo Semanal
Mensagem automática no Telegram com:
- Totais por categoria
- Total geral
- Status do orçamento

### 🚫 Regras Anti-Abuso (Anti-Amigos)
Antes de entrar no grupo, o usuário recebe:

> "No Boas Contas Família, todos os membros veem o total dos gastos familiares para gerar consciência financeira coletiva."

*Isso desestimula divisão entre amigos.*

---

## 6️⃣ Regras Técnicas de Acesso (Fonte da Verdade)

### Status do Usuário
```typescript
type UserStatus = 
  | 'TRIAL'                    // Nos primeiros 14 dias
  | 'PREMIUM_INDIVIDUAL'       // Pagante Individual
  | 'PREMIUM_FAMILY_OWNER'     // Dono do plano Família
  | 'PREMIUM_FAMILY_MEMBER'    // Membro convidado
  | 'EXPIRED';                 // Trial expirado, sem assinatura
```

### Regra de Liberação
```
Se usuário é Premium → acesso total
Se usuário está no Trial → acesso total temporário (14 dias)
Se expirado → bloqueio de escrita, modo leitura
```

---

## 7️⃣ Estratégia Anti-Canibalização

| Plano | Clareza |
|-------|---------|
| Trial | Cria hábito, não sustenta |
| Individual | Simples, pessoal |
| Família | Valor coletivo, retenção |

> 📌 Quem precisa compartilhar vai naturalmente para Família.

---

## 8️⃣ Mensagem-Chave do Produto (Copy)

> "Boas Contas não é sobre controlar pessoas. É sobre tornar a realidade financeira visível para todos."

---

## 9️⃣ Matriz Comparativa

| Recurso | Trial | Individual | Família |
|---------|-------|------------|---------|
| **Preço** | R$ 0 | R$ 14,90/mês | R$ 24,90/mês |
| **Duração** | 14 dias | Ilimitado | Ilimitado |
| **Usuários** | 1 | 1 | Até 4 |
| **Transações** | ∞ (14 dias) | ∞ | ∞ |
| **IA/Áudio** | ∞ (14 dias) | ∞ | ∞ |
| **Grupo Familiar** | ❌ | ❌ | ✅ |
| **Orç. Compartilhado** | ❌ | ❌ | ✅ |

---

## ✅ Diferenciais Competitivos

1. **Interface via Telegram** — Sem instalar app novo
2. **IA que entende português** — "Gastei 50 no mercado"
3. **Trial generoso** — 14 dias, não 7
4. **Família real** — Feito para casais/famílias, não para amigos
5. **Preço justo** — R$ 6,23/pessoa no plano Família
