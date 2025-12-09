# 🗺️ Roadmap Gasto Certo (Zaq) - Dezembro 2024

**Data de Criação:** 09/12/2024  
**Objetivo:** Levar o sistema de 8.02 para 9.0+ através de refatoração, testes e melhorias de marketing.

---

## 📊 Visão Geral

```
Semana 1-2 (09-22/12): 🔧 REFATORAÇÃO & ESTABILIZAÇÃO
Semana 3-4 (23/12-05/01): 💰 MONETIZAÇÃO & TESTES
Semana 5-6 (06-19/01): 🚀 ENGAJAMENTO & MARKETING
Semana 7-8 (20/01-02/02): 📈 CRESCIMENTO & OTIMIZAÇÃO
```

---

## 🔧 SPRINT 1: Refatoração & Estabilização
**Período:** 09/12 - 22/12/2024 (2 semanas)  
**Foco:** Código limpo, manutenível e testável

### Semana 1 (09-15/12)

#### 🔴 Dia 1-2: Refatorar telegram-webhook/index.ts

| Tarefa | Arquivo Destino | Linhas Est. |
|--------|-----------------|-------------|
| Extrair parser de transações | `parser/transaction-parser.ts` | ~300 |
| Extrair funções de label (quiz) | `utils/quiz-labels.ts` | ~100 |
| Extrair comandos financeiros | `commands/financial.ts` | ~400 |
| Extrair comandos de metas | `commands/goals.ts` | ~150 |
| Extrair comandos de contexto | `commands/context.ts` | ~200 |
| Extrair handler de mensagem | `handlers/message.ts` | ~500 |
| Extrair handler de callback | `handlers/callback.ts` | ~400 |
| Extrair handler de áudio | `handlers/audio.ts` | ~200 |
| Extrair serviço de transcrição | `services/transcription.ts` | ~150 |
| Refatorar index.ts (roteamento) | `index.ts` | ~100 |

**Estrutura Final:**
```
supabase/functions/telegram-webhook/
├── index.ts                 (< 100 linhas - roteamento)
├── _shared/
│   ├── types.ts            ✅ (já existe)
│   ├── formatters.ts       ✅ (já existe)
│   └── telegram-api.ts     ✅ (já existe)
├── parser/
│   ├── index.ts            (re-exports)
│   └── transaction-parser.ts
├── commands/
│   ├── index.ts            (re-exports)
│   ├── financial.ts        (/saldo, /resumo, /extrato)
│   ├── goals.ts            (/metas)
│   ├── context.ts          (/p, /g, /contexto)
│   └── admin.ts            (/start, /ajuda, /config)
├── handlers/
│   ├── index.ts            (re-exports)
│   ├── credit-card.ts      ✅ (já existe)
│   ├── message.ts          (texto natural)
│   ├── callback.ts         (botões inline)
│   └── audio.ts            (transcrição)
├── services/
│   └── transcription.ts
└── utils/
    └── quiz-labels.ts
```

**Critério de Sucesso:**
- [ ] `index.ts` < 100 linhas
- [ ] Cada módulo < 300 linhas
- [ ] Deploy funcionando
- [ ] Todos os comandos testados manualmente

#### 🔴 Dia 3-4: Implementar Rate Limiting

| Tarefa | Descrição |
|--------|-----------|
| Criar tabela rate_limits | Armazenar contagem por user_id |
| Middleware de rate limit | Verificar antes de processar |
| Configurar limites | 60 req/min por usuário |
| Mensagem de erro amigável | "Muitas mensagens, aguarde X segundos" |

**SQL Migration:**
```sql
CREATE TABLE rate_limits (
  user_id UUID PRIMARY KEY,
  request_count INT DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
```

#### 🟡 Dia 5: Configurar Vitest

| Tarefa | Descrição |
|--------|-----------|
| Instalar Vitest | `npm install -D vitest @testing-library/react` |
| Configurar vitest.config.ts | Setup básico |
| Criar 5 testes para hooks | useTransactions, useAccounts, etc. |
| Criar 5 testes para parser | transaction-parser.ts |

**Testes Prioritários:**
```typescript
// hooks/__tests__/useTransactions.test.ts
- fetchTransactions retorna lista
- addTransaction insere corretamente
- deleteTransaction remove item

// parser/__tests__/transaction-parser.test.ts
- extrairValor("gastei 50 no mercado") → 50
- identificarTipo("gastei") → "despesa"
- identificarTipo("recebi") → "receita"
```

### Semana 2 (16-22/12)

#### 🟡 Dia 6-7: Melhorar Onboarding

| Tarefa | Descrição |
|--------|-----------|
| Tornar etapas obrigatórias | Nome, 1ª conta, vincular Telegram |
| Deep link para Telegram | `t.me/ZaqBot?start=CODE` |
| QR Code na página | Gerar QR dinâmico com código |
| Animações de progresso | Stepper visual |

#### 🟡 Dia 8-9: Error Tracking

| Tarefa | Descrição |
|--------|-----------|
| Criar conta Sentry | sentry.io |
| Instalar SDK | `npm install @sentry/react` |
| Configurar DSN | .env + Edge Functions |
| Criar alertas | Erros críticos → Email/Slack |

#### 🟢 Dia 10: Code Review & Deploy

| Tarefa | Descrição |
|--------|-----------|
| Revisar todas as mudanças | PR review |
| Testar em staging | Verificar comandos Telegram |
| Deploy produção | Supabase + Vercel |
| Atualizar documentação | README, CHANGELOG |

**Entregáveis Sprint 1:**
- [ ] telegram-webhook modularizado (~15 arquivos vs 1)
- [ ] Rate limiting funcionando
- [ ] 10 testes automatizados
- [ ] Sentry configurado
- [ ] Onboarding melhorado

---

## 💰 SPRINT 2: Monetização & Testes
**Período:** 23/12 - 05/01/2025 (2 semanas)  
**Foco:** Fluxo de pagamento robusto e trial

### Semana 3 (23-29/12)

#### 🔴 Dia 1-2: Testar Stripe End-to-End

| Cenário | Teste |
|---------|-------|
| Checkout Pessoal Mensal | User free → checkout → webhook → license ativa |
| Checkout Família Anual | User free → checkout → webhook → license família |
| Upgrade de Plano | User pessoal → portal → upgrade família |
| Downgrade | User família → portal → downgrade pessoal |
| Cancelamento | User ativo → portal → cancelar → license expira |
| Reativação | User cancelado → checkout → license reativa |

#### 🟡 Dia 3-4: Implementar Trial de 7 Dias

| Tarefa | Descrição |
|--------|-----------|
| Modificar signup | Criar license com trial=true, ends_at=+7 dias |
| Banner de trial | "X dias restantes de trial" |
| Email D5 | "Seu trial expira em 2 dias" |
| Lógica de expiração | Trial → Gratuito automaticamente |

**SQL:**
```sql
ALTER TABLE licenses ADD COLUMN is_trial BOOLEAN DEFAULT false;
ALTER TABLE licenses ADD COLUMN trial_ends_at TIMESTAMPTZ;
```

#### 🟢 Dia 5: Página de Checkout Otimizada

| Melhoria | Descrição |
|----------|-----------|
| Trust signals | Badges "Pagamento Seguro" |
| Depoimentos | 3 cards com foto e texto |
| FAQ colapsável | 5 perguntas frequentes |
| Garantia | "7 dias ou seu dinheiro de volta" |

### Semana 4 (30/12-05/01)

#### 🟡 Dia 6-7: Notificações de Orçamento

| Notificação | Trigger |
|-------------|---------|
| 80% do orçamento | Budget usado ≥ 80% |
| 100% do orçamento | Budget usado = 100% |
| Novo mês | 1º dia do mês, reset de orçamentos |

**Edge Function:** `schedule-notifications/index.ts`

#### 🟢 Dia 8-10: Polish & Férias Mode

| Tarefa | Descrição |
|--------|-----------|
| Testar tudo em produção | Smoke tests |
| Documentar APIs | Swagger/OpenAPI |
| Preparar para pausa | Férias de fim de ano |

**Entregáveis Sprint 2:**
- [ ] Stripe testado em 6 cenários
- [ ] Trial de 7 dias funcionando
- [ ] Notificações de orçamento
- [ ] Checkout otimizado

---

## 🚀 SPRINT 3: Engajamento & Marketing
**Período:** 06/01 - 19/01/2025 (2 semanas)  
**Foco:** Reter usuários e atrair novos

### Semana 5 (06-12/01)

#### 🔴 Dia 1-2: Resumo Diário Matinal

| Feature | Descrição |
|---------|-----------|
| Cron job 7h | Disparar para todos users ativos |
| Conteúdo | Saldo, gastos ontem, orçamentos, alertas |
| Personalização | Settings: ativar/desativar, horário |

**Exemplo de Mensagem:**
```
☀️ Bom dia! Seu resumo de hoje:

💰 Saldo: R$ 2.345,00
📉 Ontem você gastou: R$ 87,50
📊 Mercado: 65% do orçamento usado
⚠️ Lazer: você excedeu o limite!

Tenha um ótimo dia! 🙏
```

#### 🟡 Dia 3-4: Vídeo de Demonstração

| Tarefa | Descrição |
|--------|-----------|
| Roteiro | 60s mostrando: registro, Telegram, dashboard |
| Gravação | Screen recording + narração |
| Edição | Legendas, música, logo |
| Embed | Hero da landing page |

#### 🟢 Dia 5: SEO & Analytics

| Tarefa | Descrição |
|--------|-----------|
| Google Analytics 4 | Configurar e adicionar ao projeto |
| Google Search Console | Verificar domínio |
| sitemap.xml | Gerar automaticamente |
| robots.txt | Configurar |
| Schema.org FAQ | Rich snippets |

### Semana 6 (13-19/01)

#### 🟡 Dia 6-7: Blog/Conteúdo

| Post | Título Sugerido |
|------|-----------------|
| 1 | "Como controlar gastos pelo Telegram em 5 passos" |
| 2 | "Orçamento familiar: guia completo para casais" |
| 3 | "5 apps de finanças comparados (e por que escolhi o Zaq)" |

#### 🟢 Dia 8-10: Social Proof

| Tarefa | Descrição |
|--------|-----------|
| Coletar depoimentos | Email para 10 usuários ativos |
| Criar cards | Foto + nome + texto |
| Contador real | "X famílias usando" (query real) |

**Entregáveis Sprint 3:**
- [ ] Resumo diário matinal
- [ ] Vídeo de 60s na landing
- [ ] GA4 + Search Console
- [ ] 3 posts no blog
- [ ] Depoimentos reais

---

## 📈 SPRINT 4: Crescimento & Otimização
**Período:** 20/01 - 02/02/2025 (2 semanas)  
**Foco:** Escalar e otimizar conversão

### Semana 7 (20-26/01)

#### 🟡 Dia 1-3: Programa de Afiliados (Básico)

| Feature | Descrição |
|---------|-----------|
| Código de indicação | Cada user tem um código único |
| Benefício | Indicado: 1 mês grátis; Indicador: 1 mês grátis |
| Tracking | Tabela referrals |
| Dashboard | "Você indicou X pessoas" |

#### 🟢 Dia 4-5: Deep Links

| Link | Ação |
|------|------|
| `zaq.app/r/CODIGO` | Registro com código de indicação |
| `t.me/ZaqBot?start=LINK_CODE` | Vinculação automática |
| QR Code dinâmico | Gerar na página de settings |

### Semana 8 (27/01-02/02)

#### 🟢 Dia 6-7: Performance & Otimização

| Tarefa | Descrição |
|--------|-----------|
| Lighthouse audit | Score > 90 |
| Bundle analysis | Reduzir JS |
| Lazy loading | Rotas e componentes pesados |
| Image optimization | WebP, lazy load |

#### 🟢 Dia 8-10: Métricas & Dashboard Admin

| Métrica | Query |
|---------|-------|
| Cadastros/dia | COUNT users grouped by date |
| Conversão free→pago | Ratio licenses premium / total |
| Churn mensal | Cancelamentos / Total ativos |
| MRR | SUM(price) WHERE active |

**Entregáveis Sprint 4:**
- [ ] Programa de afiliados
- [ ] Deep links funcionando
- [ ] Lighthouse > 90
- [ ] Dashboard de métricas

---

## 📊 Resumo de Entregas

| Sprint | Período | Foco | Score Esperado |
|--------|---------|------|----------------|
| 1 | 09-22/12 | Refatoração | 8.02 → **8.5** |
| 2 | 23/12-05/01 | Monetização | 8.5 → **8.7** |
| 3 | 06-19/01 | Engajamento | 8.7 → **9.0** |
| 4 | 20/01-02/02 | Crescimento | 9.0 → **9.2** |

---

## ✅ Checklist Geral

### Sprint 1 - Refatoração
- [ ] telegram-webhook modularizado
- [ ] Rate limiting implementado
- [ ] 10 testes automatizados
- [ ] Sentry configurado
- [ ] Onboarding melhorado

### Sprint 2 - Monetização
- [ ] Stripe e2e testado (6 cenários)
- [ ] Trial de 7 dias
- [ ] Notificações de orçamento
- [ ] Checkout otimizado

### Sprint 3 - Engajamento
- [ ] Resumo diário matinal
- [ ] Vídeo demonstração
- [ ] GA4 + SEO
- [ ] 3 posts blog
- [ ] Depoimentos reais

### Sprint 4 - Crescimento
- [ ] Programa de afiliados
- [ ] Deep links
- [ ] Lighthouse > 90
- [ ] Dashboard métricas

---

## 🎯 Próximo Passo Imediato

**AGORA:** Iniciar refatoração do `telegram-webhook/index.ts`

```
Passo 1: Criar estrutura de diretórios
Passo 2: Extrair parser de transações
Passo 3: Extrair comandos financeiros
Passo 4: Extrair handlers
Passo 5: Refatorar index.ts final
Passo 6: Testar cada comando
Passo 7: Deploy
```

---

*Roadmap criado em 09/12/2024*  
*Próxima revisão: 22/12/2024 (fim Sprint 1)*
