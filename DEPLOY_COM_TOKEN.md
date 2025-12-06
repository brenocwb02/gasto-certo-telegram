# 🔑 DEPLOY COM ACCESS TOKEN - PASSO A PASSO

## 📋 **PASSO 1: GERAR TOKEN**

1. **Abra este link:** https://supabase.com/dashboard/account/tokens

2. **Clique em:** "Generate new token"

3. **Dê um nome:** "CLI Deploy Token"

4. **Copie o token** que aparecer (algo como: `sbp_abc123...`)

---

## 💻 **PASSO 2: CONFIGURAR NO POWERSHELL**

### **Opção A: Temporário (apenas esta sessão)**
```powershell
$env:SUPABASE_ACCESS_TOKEN="cole-seu-token-aqui"
npx supabase functions deploy telegram-webhook
```

### **Opção B: Permanente (todas as sessões)**
```powershell
setx SUPABASE_ACCESS_TOKEN "cole-seu-token-aqui"
```
Depois **feche e abra** o PowerShell novamente, e rode:
```powershell
npx supabase functions deploy telegram-webhook
```

---

## 📊 **EXEMPLO COMPLETO:**

```powershell
# 1. Definir token (substitua pelo seu token real)
$env:SUPABASE_ACCESS_TOKEN="sbp_1234567890abcdef..."

# 2. Fazer deploy
npx supabase functions deploy telegram-webhook
```

---

## ✅ **CHECKLIST:**

- [ ] Gerar token em: https://supabase.com/dashboard/account/tokens
- [ ] Copiar o token
- [ ] Executar: `$env:SUPABASE_ACCESS_TOKEN="seu-token"`
- [ ] Executar: `npx supabase functions deploy telegram-webhook`

---

**Vou te ajudar! Me avise quando tiver gerado o token!** 🚀
