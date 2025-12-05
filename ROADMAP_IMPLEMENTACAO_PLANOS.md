# 🗺️ ROADMAP: Implementação de Planos e Reestruturação da Home

Este documento detalha o plano de execução para implementar a nova estratégia de preços (Free, Individual, Família, Família Plus) e reestruturar a Landing Page.

## 📅 Visão Geral das Fases

1.  **Fase 1: Backend & Banco de Dados** (Fundação)
2.  **Fase 2: Frontend - Landing Page** (Marketing)
3.  **Fase 3: Frontend - Lógica de Limites** (Produto)
4.  **Fase 4: Integração Telegram** (Bot)
5.  **Fase 5: Pagamentos & Assinaturas** (Stripe)

---

## 🛠️ Fase 1: Backend & Banco de Dados

**Objetivo:** Preparar o Supabase para suportar os novos planos e limites.

### 1.1. Atualizar Tabela de Licenças
- [ ] Adicionar coluna `plan_type` (enum: 'free', 'individual', 'family', 'family_plus')
- [ ] Adicionar coluna `trial_ends_at` (para os 30 dias de "degustação" do Free)
- [ ] Criar tabela `usage_tracking` para contar transações e NLP por mês.

```sql
CREATE TABLE usage_tracking (
  user_id UUID REFERENCES auth.users,
  month DATE, -- '2024-12-01'
  transaction_count INT DEFAULT 0,
  nlp_count INT DEFAULT 0,
  PRIMARY KEY (user_id, month)
);
```

### 1.2. Implementar Lógica de Limites (RPC/Edge Functions)
- [ ] Criar função `check_limits(user_id, feature_type)` que retorna `{ allowed: boolean, remaining: number, limit: number }`.
    - **Lógica Free:**
        - Se `created_at` < 30 dias: Limite 100 txs.
        - Se `created_at` > 30 dias: Limite 75 txs.
        - NLP: 20 créditos/mês.
        - Contas: 2.
- [ ] Criar triggers para incrementar contadores em `usage_tracking` ao inserir transações.

### 1.3. Migração de Dados
- [ ] Atualizar usuários existentes para o plano 'free' (com trial resetado ou mantido, a decidir).

---

## 🎨 Fase 2: Frontend - Landing Page

**Objetivo:** Refazer a Home para refletir a nova proposta de valor e preços.

### 2.1. Hero Section (A Primeira Impressão)
- [ ] **Headline:** "Simplifique o Controle Financeiro da sua Família"
- [ ] **Subheadline:** "Registre gastos pelo Telegram em 5 segundos. Sem planilhas, sem complicação."
- [ ] **CTA Principal:** Botão gigante "Começar Grátis" (sem "Falar com Especialista").
- [ ] **Prova Social:** Adicionar "Usado por +500 famílias" logo abaixo do CTA.

### 2.2. Seção "Diferenciais" (Telegram & Família)
- [ ] Criar destaque visual para o **Bot do Telegram** (GIF ou vídeo curto mostrando o fluxo "Mensagem -> Transação").
- [ ] Destacar a **Gestão Familiar** (Papai, Mamãe e Filhos no mesmo app).

### 2.3. Nova Tabela de Preços (Pricing)
- [ ] Implementar os 4 cards:
    - **Gratuito** (R$ 0)
    - **Individual** (R$ 14,90)
    - **Família** (R$ 24,90) ⭐ DESTAQUE "Mais Popular"
    - **Família Plus** (R$ 39,90)
- [ ] Listar features corretamente conforme a documentação.

### 2.4. Remoção de Ruído
- [ ] Mover "Valores Cristãos" para o rodapé ou página "Sobre".
- [ ] Simplificar menu de navegação.

---

## 📱 Fase 3: Frontend - Lógica de Limites

**Objetivo:** Comunicar os limites ao usuário dentro do app e incentivar o upgrade.

### 3.1. Hook `useLimits`
- [ ] Criar hook que consome a função `check_limits` do backend.
- [ ] Retornar status de uso (ex: 80% usado, 100% usado).

### 3.2. Componentes de UI
- [ ] **Banner de Progresso:** Mostrar "Você usou 60/75 transações" no dashboard (visível apenas para Free).
- [ ] **Modal de Bloqueio:** "Você atingiu o limite mensal. Faça upgrade para continuar." (aparece ao tentar criar a 76ª transação).
- [ ] **Botão de Upgrade:** Em destaque no sidebar/header.

### 3.3. Bloqueios Específicos
- [ ] Impedir criação de 3ª conta no plano Free.
- [ ] Impedir criação de 11ª categoria no plano Free.
- [ ] Bloquear acesso à página "Query Engine" (IA) no Free.

---

## 🤖 Fase 4: Integração Telegram

**Objetivo:** Garantir que o bot respeite os limites e venda o Premium.

### 4.1. Verificação de Limites no Bot
- [ ] Antes de processar mensagem (texto/áudio), verificar saldo de NLP.
- [ ] Antes de inserir transação, verificar saldo de transações.

### 4.2. Mensagens de Feedback
- [ ] **Aviso de 80%:** "⚠️ Atenção: Restam 15 transações este mês."
- [ ] **Bloqueio NLP:** "🚫 Limite de IA atingido. Use comandos manuais ou faça upgrade."
- [ ] **Bloqueio Transação:** "🚫 Limite de transações atingido. Aguarde dia 01 ou vire Premium."

### 4.3. Upsell no Telegram
- [ ] Adicionar botão "💎 Virar Premium" nas mensagens de bloqueio.

---

## 💳 Fase 5: Pagamentos & Assinaturas

**Objetivo:** Automatizar a cobrança e liberação de acesso.

### 5.1. Configuração Stripe
- [ ] Criar produtos no Stripe (Individual, Família, Plus).
- [ ] Configurar webhooks para ouvir eventos (`checkout.session.completed`, `customer.subscription.updated`).

### 5.2. Integração Backend
- [ ] Criar Edge Function `create-checkout-session`.
- [ ] Criar Edge Function `stripe-webhook` para atualizar a tabela `licenses` automaticamente.

### 5.3. Portal do Cliente
- [ ] Implementar botão "Gerenciar Assinatura" (leva ao portal do Stripe para cancelamento/troca de cartão).

---

## 🚀 Ordem de Execução Sugerida

1.  **Fase 2 (Landing Page)** - *Quick Win*: Já atrai usuários com a promessa certa.
2.  **Fase 1 (Backend)** - *Foundation*: Prepara o terreno.
3.  **Fase 3 (App Limits)** - *Monetization*: Começa a converter usuários web.
4.  **Fase 4 (Telegram)** - *Consistency*: Fecha o ciclo no bot.
5.  **Fase 5 (Stripe)** - *Automation*: Automatiza o recebimento (até lá, pode fazer manual/Pix se precisar).
