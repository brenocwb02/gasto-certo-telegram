# 🚀 DEPLOY MANUAL DA EDGE FUNCTION - TELEGRAM WEBHOOK

Como o Supabase CLI está com problemas de autenticação, vamos fazer o deploy **manualmente** via Dashboard!

---

## 📝 **PASSO A PASSO - DEPLOY MANUAL**

### **Passo 1: Acessar o Supabase Dashboard**

1. Abra: https://supabase.com/dashboard/project/dnpwlpxugkzomqczijwy
2. Vá em **Edge Functions** (menu lateral)
3. Clique em **Create a new function** ou edite a função existente `telegram-webhook`

---

### **Passo 2: Copiar o Código da Function**

**Arquivo:** `c:\Users\Casa\Documents\BoasContasAntiGravity\gasto-certo-telegram\supabase\functions\telegram-webhook\index.ts`

1. Abra o arquivo `index.ts` no VS Code
2. Selecione TODO o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)

---

### **Passo 3: Colar no Dashboard**

1. No Dashboard do Supabase, na página da Edge Function
2. Cole o código inteiro no editor
3. Clique em **Deploy**

---

## 🔧 **ALTERNATIVA: Usar Access Token Manual**

Se preferir usar o CLI, você pode configurar um token manualmente:

### **1. Gerar Access Token:**

1. Acesse: https://supabase.com/dashboard/account/tokens
2. Clique em **Generate new token**
3. Dê um nome (ex: "CLI Token")
4. Copie o token gerado

### **2. Configurar no Terminal:**

```bash
# Windows PowerShell
$env:SUPABASE_ACCESS_TOKEN="seu-token-aqui"
npx supabase functions deploy telegram-webhook

# Ou definir permanentemente
setx SUPABASE_ACCESS_TOKEN "seu-token-aqui"
```

Depois execute novamente:
```bash
npx supabase functions deploy telegram-webhook
```

---

## 📊 **QUAL OPÇÃO ESCOLHER?**

### **✅ Deploy Manual (Dashboard)** - RECOMENDADO
- ✅ Mais simples
- ✅ Não precisa de CLI
- ✅ Funciona sempre
- ⏱️ 2-3 minutos

### **⚙️ CLI com Token**
- ⏱️ 5 minutos (gerar token + configurar)
- Útil se você faz deploys frequentes

---

## 🎯 **PRÓXIMA AÇÃO**

**Vou abrir o arquivo para você copiar!**

Escolha:
- **A)** Abrir Supabase Dashboard para deploy manual
- **B)** Gerar Access Token e usar CLI

---

**Qual você prefere?** 🤔
