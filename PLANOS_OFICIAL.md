# 📋 PLANOS BOAS CONTAS - VERSÃO FINAL

**Data:** 07/12/2024
**Status:** Aprovado e Implementado

---

## 🆓 GRATUITO

### Primeiros 7 dias (Trial Completo)
| Recurso | Acesso |
|---------|--------|
| Transações | ✅ **Ilimitadas** |
| Telegram | ✅ Texto + Áudio |
| IA | ✅ **Ilimitada** |
| Contas | ✅ Ilimitadas |
| Categorias | ✅ Ilimitadas |
| Dashboard | ✅ Completo |

### Após 7 dias
| Recurso | Limite |
|---------|--------|
| Transações | 30/mês |
| Telegram | Texto apenas |
| IA | **2 usos/mês** |
| Contas | 1 |
| Categorias | 5 |
| Dashboard | Básico |

**CTA:** `Começar Grátis`

---

## 👤 PESSOAL

| Cobrança | Preço | Economia |
|----------|-------|----------|
| **Mensal** | R$ 14,90/mês | - |
| **Anual** | R$ 143/ano | **R$ 35,80** (2 meses grátis) |

*Anual = R$ 11,92/mês*

### Recursos Incluídos
- ✅ Transações **ilimitadas**
- ✅ Texto + **Áudio** + **IA ilimitada**
- ✅ Contas ilimitadas
- ✅ Categorias ilimitadas
- ✅ Dashboard completo
- ✅ Relatórios avançados
- ✅ Exportação (CSV/PDF)
- ✅ Transações recorrentes
- ✅ Metas financeiras
- ✅ Orçamento por categoria
- ✅ Suporte prioritário

**CTA:** `Assinar Pessoal`

---

## 👨‍👩‍👧 FAMÍLIA ⭐ Mais Popular

| Cobrança | Preço | Economia |
|----------|-------|----------|
| **Mensal** | R$ 24,90/mês | - |
| **Anual** | R$ 239/ano | **R$ 59,80** (2 meses grátis) |

*Anual = R$ 19,92/mês*

### Recursos Incluídos
- ✅ **Tudo do Pessoal**, mais:
- ✅ Até **6 membros** na família
- ✅ Grupo familiar no Telegram
- ✅ Orçamento compartilhado
- ✅ Visão de gastos por membro
- ✅ Permissões (quem vê o quê)
- ✅ Dashboard consolidado
- ✅ Notificações por membro
- ✅ Metas compartilhadas

**Tagline:** *"Finanças em família, de forma leve"*

**CTA:** `Assinar Família`

---

## 💳 CONFIGURAÇÃO STRIPE

### Produtos a criar no Stripe Dashboard:

| Produto | Price ID Mensal | Price ID Anual |
|---------|-----------------|----------------|
| Pessoal | `price_pessoal_monthly` | `price_pessoal_yearly` |
| Família | `price_familia_monthly` | `price_familia_yearly` |

### Variáveis de Ambiente (.env)
```env
VITE_STRIPE_PRICE_PESSOAL_MONTHLY=price_xxxxx
VITE_STRIPE_PRICE_PESSOAL_YEARLY=price_xxxxx
VITE_STRIPE_PRICE_FAMILIA_MONTHLY=price_xxxxx
VITE_STRIPE_PRICE_FAMILIA_YEARLY=price_xxxxx
```

---

## 📊 RESUMO ESTRATÉGICO

| Aspecto | Decisão |
|---------|---------|
| **Planos** | 3 (Gratuito, Pessoal, Família) |
| **Trial** | 7 dias com acesso completo |
| **Limite Free** | 30 transações/mês |
| **IA no Free** | 2 usos/mês |
| **Áudio no Free** | ❌ (apenas no trial) |
| **Desconto Anual** | 20% (~2 meses grátis) |
| **Membros Família** | Até 6 pessoas |
| **4º Plano (Plus)** | ❌ Removido |

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Página de planos atualizada (`Planos.tsx`)
- [x] Hook de limites atualizado (`useLimits.ts`)
- [x] Trial de 7 dias implementado
- [x] Limite de 30 tx após trial
- [x] IA 2x/mês no free
- [x] Toggle Mensal/Anual
- [x] Badge "2 meses grátis"
- [x] Renomeado Individual → Pessoal
- [ ] Criar produtos no Stripe
- [ ] Configurar variáveis de ambiente
- [ ] Testar fluxo de checkout

---

*Documentação gerada em 07/12/2024*
