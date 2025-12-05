# 🎯 Guia de Configuração do Stripe

Este guia explica como configurar o Stripe para processar pagamentos no Zaq (Gasto Certo).

## 📋 Pré-requisitos

1. Conta no Stripe (crie em https://stripe.com)
2. Conta no Supabase
3. Projeto configurado localmente

---

## 🔧 Passo 1: Criar Produtos no Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Vá em **Products** > **Add Product**
3. Crie 3 produtos (um para cada plano pago):

### Produto 1: Individual
- **Nome**: Gasto Certo - Individual
- **Descrição**: Controle financeiro individual sem limites
- **Preço**: R$ 14,90 / mês
- **Tipo**: Recurring (mensal)
- **Copie o Price ID**: `price_xxxxx...`

### Produto 2: Família
- **Nome**: Gasto Certo - Família
- **Descrição**: Controle financeiro para até 5 usuários
- **Preço**: R$ 24,90 / mês
- **Tipo**: Recurring (mensal)
- **Copie o Price ID**: `price_xxxxx...`

### Produto 3: Família Plus
- **Nome**: Gasto Certo - Família Plus
- **Descrição**: Controle financeiro para até 10 usuários
- **Preço**: R$ 39,90 / mês
- **Tipo**: Recurring (mensal)
- **Copie o Price ID**: `price_xxxxx...`

---

## 🔑 Passo 2: Configurar Chaves de API

1. Vá em **Developers** > **API keys**
2. Copie:
   - **Publishable key** (pk_test_... ou pk_live_...)
   - **Secret key** (sk_test_... ou sk_live_...)

3. Adicione ao arquivo `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_INDIVIDUAL=price_...
VITE_STRIPE_PRICE_FAMILIA=price_...
VITE_STRIPE_PRICE_FAMILIA_PLUS=price_...
```

4. Adicione ao Supabase (Settings > Edge Functions > Secrets):

```
STRIPE_SECRET_KEY=sk_test_...
```

---

## 🪝 Passo 3: Configurar Webhooks

1. Vá em **Developers** > **Webhooks**
2. Clique em **Add endpoint**
3. URL do webhook:
   ```
   https://[SEU_PROJECT_ID].supabase.co/functions/v1/stripe-webhook
   ```
4. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

5. Copie o **Signing secret** (whsec_...)
6. Adicione ao Supabase:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## 🚀 Passo 4: Deploy das Edge Functions

Execute os comandos:

```bash
# Login no Supabase
supabase login

# Link ao projeto
supabase link --project-ref [SEU_PROJECT_ID]

# Deploy da função de checkout
supabase functions deploy create-checkout-session

# Deploy da função de webhook
supabase functions deploy stripe-webhook
```

---

## 🗄️ Passo 5: Rodar Migrations

Execute a migration no Supabase SQL Editor:

```sql
-- Abra o arquivo: 
-- supabase/migrations/20251204000001_add_stripe_to_licenses.sql
-- Cole o conteúdo no SQL Editor e execute
```

---

## ✅ Passo 6: Testar

1. Acesse `/planos` no app
2. Selecione um plano pago
3. Complete o checkout (use cartão de teste: `4242 4242 4242 4242`)
4. Verifique se a licença foi ativada no banco

---

## 🧪 Cartões de Teste

Para o modo de teste do Stripe:

- **Sucesso**: `4242 4242 4242 4242`
- **Falha**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Qualquer data futura e CVC qualquer funcionam.

---

## 📊 Monitoramento

1. **Dashboard do Stripe**: Monitore transações, subscriptions e webhooks
2. **Logs do Supabase**: Veja logs das Edge Functions
3. **Tabela licenses**: Verifique status das licenças

---

## 🔄 Fluxo Completo

```
Usuário clica "Assinar"
    ↓
create-checkout-session cria sessão no Stripe
    ↓
Usuário redireciona para Stripe Checkout
    ↓
Usuário preenche dados do cartão
    ↓
Stripe processa pagamento
    ↓
Stripe envia webhook checkout.session.completed
    ↓
stripe-webhook atualiza tabela licenses
    ↓
Usuário é redirecionado de volta para /dashboard
    ↓
useLimits detecta plano pago e libera recursos
```

---

## 🆘 Troubleshooting

### Erro: "Missing Stripe keys"
- Verifique se adicionou as chaves no .env e no Supabase

### Webhook não está funcionando
- Verifique a URL do webhook no Dashboard do Stripe
- Teste com `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`

### Licença não atualiza após pagamento
- Verifique os logs da Edge Function `stripe-webhook`
- Confirme que o evento foi recebido no Dashboard do Stripe

---

## 📚 Documentação Útil

- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
