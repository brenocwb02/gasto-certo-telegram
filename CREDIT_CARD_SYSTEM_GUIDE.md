# 💳 Sistema de Cartão de Crédito - Como Funciona

**Data:** 06 de Dezembro de 2024  
**Versão Atual:** Sem pagamento automático de fatura

---

## 📊 Como Funciona Atualmente

### **1. Estrutura da Conta Cartão**

Quando você cria um cartão de crédito, o sistema armazena:

```typescript
{
  nome: "Cartão Nubank",
  tipo: "cartao",
  banco: "Nubank",
  saldo_inicial: 0,           // Fatura atual
  saldo_atual: -500,          // Atualizado a cada compra
  limite_credito: 5000,       // Limite total
  dia_fechamento: 5,          // Dia que fecha a fatura
  dia_vencimento: 15          // Dia do pagamento
}
```

---

### **2. Quando Você Gasta no Cartão**

**Exemplo:** `"gastei 100 no Carrefour com Nubank"`

**O que acontece:**

```javascript
// 1. Cria transação
{
  tipo: "despesa",
  valor: 100,
  descricao: "Carrefour",
  categoria: "Supermercado",
  conta: "Cartão Nubank",  // ID da conta cartão
  metodo: "crédito",
  data: "2024-12-06"
}

// 2. Atualiza saldo do cartão
saldo_atual = saldo_atual - 100
// Antes: -400
// Depois: -500
```

**Resultado:**
- ✅ Transação registrada
- ✅ Saldo do cartão diminui (fica mais negativo)
- ❌ **NÃO cria automaticamente** transação de pagamento

--- 

## ⚠️ **PROBLEMA ATUAL: Pagamento da Fatura**

### **Como É Hoje:**

Quando o vencimento chega (dia 15), o sistema **NÃO faz nada automaticamente**.

**Você precisa:**
1. Criar manualmente uma **transação de despesa** na conta corrente
2. Criar manualmente uma **transação de receita** no cartão
3. Ou fazer uma **transferência** entre contas

**Exemplo Manual (Incômodo!):**

```
Dia 15 chegou... fatura de R$ 500
Você precisa fazer:

1. Despesa na Conta Corrente:
   - Tipo: Despesa
   - Valor: -500
   - Descrição: "Pagamento fatura Nubank"
   - Conta: Conta Corrente
  
2. Receita no Cartão:
   - Tipo: Receita
   - Valor: +500
   - Descrição: "Pagamento fatura"
   - Conta: Cartão Nubank

OU

3. Transferência:
   - De: Conta Corrente
   - Para: Cartão Nubank
   - Valor: 500
```

---

## 💡 **SUGESTÕES DE MELHORIA**

### **Opção 1: Pagamento Automático de Fatura** ⭐ (RECOMENDADO)

**Como funcionaria:**

```typescript
// Tarefa agendada (cron job ou Edge Function)
// Roda todos os dias às 00:00

async function processCreditCardPayments() {
  const hoje = new Date();
  
  // Buscar cartões com vencimento hoje
  const cartoes = await supabase
    .from('accounts')
    .select('*')
    .eq('tipo', 'cartao')
    .eq('dia_vencimento', hoje.getDate());
  
  for (const cartao of cartoes) {
    if (cartao.saldo_atual < 0) {
      const valorFatura = Math.abs(cartao.saldo_atual);
      
      // Buscar conta corrente do usuário (conta padrão)
      const contaCorrente = await getDefaultAccount(cartao.user_id);
      
      if (contaCorrente) {
        // Criar transferência automática
        await createTransfer({
          from_account: contaCorrente.id,
          to_account: cartao.id,
          valor: valorFatura,
          descricao: `Pagamento fatura ${cartao.nome} automático`,
          data: hoje
        });
        
        // Enviar notificação no Telegram
        await sendTelegramMessage(
          cartao.telegram_chat_id,
          `💳 Fatura do ${cartao.nome} paga automaticamente!\n` +
          `Valor: R$ ${valorFatura.toFixed(2)}\n` +
          `Conta: ${contaCorrente.nome}`
        );
      }
    }
  }
}
```

**Prós:**
- ✅ Totalmente automático
- ✅ Evita esquecimento
- ✅ Saldo do cartão volta a zero
- ✅ Histórico organizado

**Contras:**
- ⚠️ Precisa ter saldo na conta corrente
- ⚠️ Pode causar cheque especial se não tiver saldo

---

### **Opção 2: Lembrete de Pagamento** (Intermediária)

**Como funcionaria:**

```typescript
// Notificar 3 dias antes do vencimento
async function sendPaymentReminder() {
  const emTresDias = addDays(new Date(), 3);
  
  const cartoes = await supabase
    .from('accounts')
    .select('*')
    .eq('tipo', 'cartao')
    .eq('dia_vencimento', emTresDias.getDate())
    .lt('saldo_atual', 0); // Apenas se tiver fatura
  
  for (const cartao of cartoes) {
    const valorFatura = Math.abs(cartao.saldo_atual);
    
    await sendTelegramMessage(
      cartao.telegram_chat_id,
      `⏰ Lembrete: Fatura do ${cartao.nome}\n\n` +
      `💰 Valor: R$ ${valorFatura.toFixed(2)}\n` +
      `📅 Vencimento: ${cartao.dia_vencimento}\n\n` +
      `Use /pagar para processar automaticamente`
    );
  }
}
```

**Comando /pagar:**

```typescript
// No telegram-webhook
if (text === '/pagar') {
  const cartoes = await getCartoesPendentes(userId);
  
  // Mostrar botões inline
  await sendTelegramMessage(chatId, 
    "Escolha qual fatura pagar:",
    {
      reply_markup: {
        inline_keyboard: cartoes.map(c => [{
          text: `${c.nome} - R$ ${Math.abs(c.saldo_atual).toFixed(2)}`,
          callback_data: `pay_${c.id}`
        }])
      }
    }
  );
}

// Callback quando clicar no botão
if (callbackData.startsWith('pay_')) {
  const cartaoId = callbackData.split('_')[1];
  await processPayment(cartaoId, userId);
  await sendTelegramMessage(chatId, "✅ Fatura paga com sucesso!");
}
```

**Prós:**
- ✅ Usuário tem controle
- ✅ Notificação prévia
- ✅ Fácil de pagar (um clique)

**Contras:**
- ⚠️ Ainda é manual (precisa confirmar)

---

### **Opção 3: Parcelamento Automático** (Avançada)

Para compras parceladas, criar transações futuras automáticas.

**Como funcionaria:**

```typescript
// Ao registrar compra parcelada
"gastei 1200 em 6x no Nubank"

// Criar 6 transações futuras
for (let i = 1; i <= 6; i++) {
  const dataFutura = addMonths(new Date(), i);
  
  await supabase.from('transactions').insert({
    tipo: 'despesa',
    valor: 200, // 1200 / 6
    descricao: `Parcela ${i}/6 - Compra original`,
    conta_id: cartaoNubank.id,
    categoria_id: categoria.id,
    data: dataFutura,
    is_recurring: true,
    parent_transaction_id: transacaoOriginal.id
  });
}
```

**Prós:**
- ✅ Visão clara do futuro
- ✅ Orçamento considera parcelas
- ✅ Não esquece parcelas

**Contras:**
- ⚠️ Mais complexo
- ⚠️ Pode confundir se cancelar compra

---

## 🔧 **IMPLEMENTAÇÃO RECOMENDADA**

### **Abordagem Híbrida: Automático + Controle**

```typescript
// Tabela: credit_card_settings
{
  account_id: uuid,
  auto_payment: boolean,           // Pagar automaticamente?
  default_payment_account: uuid,   // De qual conta pagar?
  send_reminder: boolean,          // Enviar lembrete?
  reminder_days_before: number     // Quantos dias antes?
}
```

**Configuração por Usuário:**

```
/config_cartao
┌─────────────────────────────────┐
│ ⚙️ Configurar Cartão Nubank     │
├─────────────────────────────────┤
│ ✅ Pagamento Automático: SIM    │
│ 🏦 Conta: Conta Corrente BB     │
│ 🔔 Lembrete: 3 dias antes       │
│                                 │
│ [💾 Salvar]  [❌ Cancelar]      │
└─────────────────────────────────┘
```

---

## 📋 **Migration SQL para Implementar**

```sql
-- Migration: Sistema de Pagamento Automático de Faturas
-- Criado em: 2024-12-06

-- Tabela de configurações de cartão
CREATE TABLE IF NOT EXISTS public.credit_card_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Configurações de pagamento
  auto_payment BOOLEAN DEFAULT false,
  default_payment_account_id UUID REFERENCES accounts(id),
  
  -- Configurações de notificação
  send_reminder BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 3,
  
  -- Parcelamento
  allow_installments BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id)
);

-- Enable RLS
ALTER TABLE public.credit_card_settings ENABLE ROW LEVEL SECURITY;

-- Política: Usuário só vê suas configurações
CREATE POLICY "Users can manage their credit card settings"
ON credit_card_settings
FOR ALL
USING (auth.uid() = user_id);

-- Função para processar pagamento de fatura
CREATE OR REPLACE FUNCTION process_credit_card_payment(
  p_card_account_id UUID,
  p_payment_account_id UUID,
  p_valor DECIMAL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_transfer_id UUID;
BEGIN
  -- Obter user_id
  SELECT user_id INTO v_user_id
  FROM accounts
  WHERE id = p_card_account_id;
  
  -- Criar transferência (deduz da conta corrente)
  INSERT INTO transactions (
    tipo,
    valor,
    descricao,
    account_id,
    user_id,
    created_at
  ) VALUES (
    'despesa',
    p_valor,
    'Pagamento fatura cartão',
    p_payment_account_id,
    v_user_id,
    NOW()
  ) RETURNING id INTO v_transfer_id;
  
  -- Criar receita no cartão (zera a fatura)
  INSERT INTO transactions (
    tipo,
    valor,
    descricao,
    account_id,
    user_id,
    transfer_id,
    created_at
  ) VALUES (
    'receita',
    p_valor,
    'Recebimento pagamento fatura',
    p_card_account_id,
    v_user_id,
    v_transfer_id,
    NOW()
  );
  
  -- Atualizar saldos
  UPDATE accounts
  SET saldo_atual = saldo_atual - p_valor
  WHERE id = p_payment_account_id;
  
  UPDATE accounts
  SET saldo_atual = saldo_atual + p_valor
  WHERE id = p_card_account_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'valor', p_valor
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Edge Function para rodar diariamente (Cron Job)
-- Arquivo: supabase/functions/process-credit-cards/index.ts
```

---

## 🎯 **Fluxo Completo Proposto**

### **Dia 1-4: Compras**
```
Usuário: "gastei 100 no mercado com Nubank"
Sistema: Registra transação + Atualiza saldo
Cartão: saldo_atual = -100
```

### **Dia 5: Fechamento da Fatura**
```
Sistema (automático):
- Calcula fatura total: R$ 500
- Envia notificação:
  "💳 Fatura fechada: R$ 500
   📅 Vencimento: 15/12
   ⚙️ Pagamento automático: ATIVADO"
```

### **Dia 12: Lembrete (3 dias antes)**
```
Sistema (automático):
- Verifica se tem saldo na conta corrente
- Se SIM: "✅ Tudo pronto para pagar"
- Se NÃO: "⚠️ Saldo insuficiente! Adicione R$ 200"
```

### **Dia 15: Vencimento**
```
Sistema (automático):
SE auto_payment = true:
  - Cria transferência Conta Corrente → Cartão
  - Atualiza saldos
  - Envia confirmação: "✅ Fatura paga!"
  
SE auto_payment = false:
  - Envia lembrete: "⏰ Vencimento hoje!"
  - Botão: [💳 Pagar Agora]
```

---

## 📊 **Comparação com Concorrentes**

| App | Pagamento Auto | Parcelamento | Notificações |
|-----|----------------|--------------|--------------|
| **Gasto Certo (Atual)** | ❌ | ❌ | ❌ |
| **Gasto Certo (Proposta)** | ✅ | ✅ | ✅ |
| Mobills | ✅ | ✅ | ✅ |
| GuiaBolso | ✅ | ⚠️ Parcial | ✅ |
| Organizze | ❌ | ✅ | ✅ |

---

## 🚀 **Próximos Passos**

1. **Decidir abordagem:**
   - Automático total
   - Lembrete + Manual via comando
   - Híbrido (configurável)

2. **Criar migration** da tabela `credit_card_settings`

3. **Implementar Edge Function** de processamento

4. **Adicionar comandos Telegram:**
   - `/pagar` - Pagar fatura
   - `/config_cartao` - Configurar automação
   - `/faturas` - Ver faturas pendentes

5. **Criar UI no Frontend** para configuração

---

## ❓ FAQ

**P: E se eu não tiver saldo na conta corrente?**
R: O sistema notifica e não processa. Você escolhe o que fazer.

**P: Posso escolher qual conta usar para pagar?**
R: Sim! Na configuração você define a conta padrão.

**P: E compras parceladas?**
R: Sistema pode criar transações futuras automaticamente.

**P: Posso desativar o automático?**
R: Sim! Basta desmarcar na configuração.

---

**Quer implementar? Me diga qual abordagem prefere e crio o código completo! 🚀**
