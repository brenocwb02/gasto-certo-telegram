# 🚀 Instruções de Deploy e Configuração Final

Este documento guia você nos passos finais para ativar o sistema de Planos e Pagamentos (Stripe).

## 1. Banco de Dados (Migrations)

Como o projeto configurado no `.env` (`dnpwlpxugkzomqczijwy`) não está acessível diretamente via ferramentas automáticas, você precisa aplicar as migrations manualmente ou via CLI.

### Opção A: Via Supabase Dashboard (Recomendado se não tiver CLI configurado)
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/dnpwlpxugkzomqczijwy).
2. Vá em **SQL Editor**.
3. Crie uma nova query e cole o conteúdo de `supabase/migrations/20251204000000_create_usage_tracking.sql`. Execute.
4. Crie outra query e cole o conteúdo de `supabase/migrations/20251204000001_add_stripe_to_licenses.sql`. Execute.

### Opção B: Via Supabase CLI
Se você tiver o CLI configurado e logado:
```bash
npx supabase db push
```

---

## 2. Configuração do Stripe

Você precisa obter as chaves do Stripe e configurá-las no Supabase.

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/test/apikeys).
2. Copie a **Secret Key** (`sk_test_...`).
3. Copie a **Publishable Key** (`pk_test_...`).
4. Configure os Webhooks no Stripe:
   - URL: `https://dnpwlpxugkzomqczijwy.supabase.co/functions/v1/stripe-webhook`
   - Eventos para ouvir:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
5. Copie o **Webhook Secret** (`whsec_...`).

### Definir Variáveis de Ambiente (Secrets)
No Supabase Dashboard > Project Settings > Edge Functions > Secrets, adicione:

- `STRIPE_SECRET_KEY`: (Sua chave secreta `sk_test_...`)
- `STRIPE_WEBHOOK_SECRET`: (Seu segredo do webhook `whsec_...`)
- `SUPABASE_URL`: (Sua URL do projeto, ex: `https://dnpwlpxugkzomqczijwy.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY`: (Sua chave `service_role` encontrada em API Settings)

No arquivo `.env` local (para o frontend), adicione os IDs dos preços dos produtos criados no Stripe:

```env
VITE_STRIPE_PRICE_INDIVIDUAL=price_xxxxxxxxx
VITE_STRIPE_PRICE_FAMILIA=price_xxxxxxxxx
VITE_STRIPE_PRICE_FAMILIA_PLUS=price_xxxxxxxxx
```

---

## 3. Deploy das Edge Functions

Para que o checkout e os webhooks funcionem, você precisa fazer o deploy das funções.

```bash
npx supabase functions deploy create-checkout-session --no-verify-jwt
npx supabase functions deploy stripe-webhook --no-verify-jwt
```
*Nota: O flag `--no-verify-jwt` é importante para o webhook, pois o Stripe não envia JWT do Supabase.*

---

## 4. Testando

1. Inicie o servidor local: `npm run dev`
2. Acesse `/planos`.
3. Clique em "Assinar Agora" em um plano.
4. Você deve ser redirecionado para o Stripe.
5. Após pagar (use cartões de teste do Stripe), você voltará para `/checkout/success`.
6. O webhook deve processar e liberar o acesso em alguns segundos.
