# 🔐 Guia de Privacidade e Conformidade LGPD - Gasto Certo

**Data:** 06 de Dezembro de 2024  
**Objetivo:** Garantir conformidade com a LGPD e proteger dados sensíveis dos usuários  
**Status:** 🟡 Em Conformidade Parcial (Melhorias Necessárias)

---

## 📋 Sumário Executivo

### ❓ Sua Preocupação
> "No Supabase eu consigo ver as informações dos usuários, tipo os valores que cada um tem cadastrado..."

**Análise:** Você está acessando o dashboard do Supabase com **privilégios administrativos** (Service Role Key), que bypassa todas as proteções de Row Level Security (RLS). Isso é **normal para administradores**, mas existem camadas adicionais de proteção que podemos implementar.

### ✅ Status Atual de Segurança

| Proteção | Status | Detalhes |
|----------|--------|----------|
| **RLS (Row Level Security)** | ✅ ATIVO | Políticas implementadas em todas as tabelas |
| **Autenticação** | ✅ ATIVO | Supabase Auth com JWT |
| **HTTPS/SSL** | ✅ ATIVO | Comunicação criptografada |
| **Encryption at Rest** | ✅ ATIVO | Dados criptografados em disco (Supabase padrão) |
| **Criptografia de Campos** | ❌ NÃO IMPLEMENTADA | Dados visíveis no banco |
| **Pseudonimização** | ❌ NÃO IMPLEMENTADA | Dados identificáveis |
| **Auditoria de Acesso** | ⚠️ PARCIAL | Logs do Supabase, sem custom tracking |
| **Consentimento LGPD** | ❌ NÃO IMPLEMENTADA | Falta termo de aceite |

---

## 🇧🇷 Requisitos da LGPD

### Princípios Fundamentais (Art. 6º)

#### 1. **Finalidade**
- ✅ Você define a finalidade (controle financeiro pessoal)
- ⚠️ **AÇÃO NECESSÁRIA:** Documentar isso em Política de Privacidade

#### 2. **Adequação**
- ✅ Dados coletados são compatíveis com a finalidade
- ✅ Não coleta dados excessivos

#### 3. **Necessidade**
- ⚠️ **REVISAR:** Verificar se todos os campos são realmente necessários
- Exemplo: `telefone` em `profiles` - é essencial?

#### 4. **Livre Acesso**
- ❌ **IMPLEMENTAR:** Permitir que usuário exporte seus dados (portabilidade)
- ❌ **IMPLEMENTAR:** Painel de privacidade no app

#### 5. **Qualidade dos Dados**
- ✅ Dados mantidos atualizados pelo próprio usuário

#### 6. **Transparência**
- ❌ **IMPLEMENTAR:** Política de Privacidade clara
- ❌ **IMPLEMENTAR:** Termo de Consentimento

#### 7. **Segurança**
- ✅ RLS ativo
- ✅ HTTPS
- ⚠️ **MELHORAR:** Implementar criptografia adicional

#### 8. **Prevenção**
- ✅ Sanity checks nas Edge Functions
- ⚠️ **MELHORAR:** Rate limiting

#### 9. **Não Discriminação**
- ✅ N/A para este caso de uso

#### 10. **Responsabilização**
- ⚠️ **IMPLEMENTAR:** Logs de auditoria
- ⚠️ **IMPLEMENTAR:** Registro de tratamento de dados

---

## 🔒 Soluções de Criptografia e Privacidade

### Opção 1: Row Level Security (RLS) - ✅ JÁ IMPLEMENTADO

**O que é:**
Sistema nativo do PostgreSQL que garante que usuários só vejam seus próprios dados.

**Como funciona:**
```sql
-- Exemplo atual em transactions
CREATE POLICY "Users can only view their own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);
```

**Por que você ainda vê os dados:**
Você está usando a **Service Role Key** no dashboard, que tem **super poderes** e ignora RLS. Isso é **necessário** para administração, mas usuários comuns **NÃO** conseguem ver dados de outros.

**Verificação:**
- ✅ Todas as tabelas principais têm RLS ativo
- ✅ Políticas corretas implementadas
- ⚠️ Você como admin sempre verá tudo (normal)

---

### Opção 2: Criptografia de Campos (Field-Level Encryption)

#### 🟢 **Recomendação: Supabase Vault (Preferível)**

O Supabase oferece o **Vault** para armazenar dados sensíveis criptografados.

**Vantagens:**
- ✅ Criptografia gerenciada pelo Supabase
- ✅ Chaves rotacionadas automaticamente
- ✅ Conformidade com LGPD/GDPR

**Desvantagens:**
- ⚠️ Não pode fazer queries SQL diretas (WHERE, SUM, etc.)
- ⚠️ Necessário descriptografar no cliente

**Implementação:**

```sql
-- 1. Criar secret no Vault
INSERT INTO vault.secrets (name, secret)
VALUES ('user_salary', 'R$ 5.000,00'::bytea);

-- 2. Usar ID encriptado na tabela principal
CREATE TABLE sensitive_data (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  salary_vault_id UUID REFERENCES vault.secrets(id)
);
```

**Quando usar:**
- Dados que **NÃO** precisam de queries complexas
- Exemplos: documentos PII, senhas bancárias, chaves API

---

#### 🟡 **Alternativa: Criptografia Client-Side**

Criptografar dados **antes** de enviar ao Supabase.

**Implementação:**

```typescript
// No frontend (React)
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY!;

// Criptografar antes de salvar
const encryptValue = (value: number) => {
  return CryptoJS.AES.encrypt(value.toString(), ENCRYPTION_KEY).toString();
};

// Descriptografar ao ler
const decryptValue = (encrypted: string) => {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return parseFloat(bytes.toString(CryptoJS.enc.Utf8));
};

// Uso
const transaction = {
  valor: encryptValue(150.50),
  descricao: "Almoço" // Não criptografado para busca
};
```

**Prós:**
- ✅ Você (admin) NÃO verá os valores no dashboard
- ✅ Fácil de implementar

**Contras:**
- ❌ Não pode fazer `SUM(valor)` no SQL
- ❌ Chave no código (risco se vazar)
- ❌ Todo processamento no cliente (lento)

---

### Opção 3: Pseudonimização

Substituir dados identificáveis por códigos.

**Exemplo:**

```sql
-- Em vez de armazenar nome real
INSERT INTO profiles (nome, email)
VALUES ('João Silva', 'joao@email.com');

-- Armazenar código
INSERT INTO profiles (user_code, email_hash)
VALUES ('USR_8f3a2b', hash('joao@email.com'));
```

**Benefício LGPD:**
- Se houver vazamento, dados não são diretamente identificáveis

**Nossa situação:**
- ⚠️ Já temos `user_id` (UUID) que é pseudo-anônimo
- ✅ Melhorar: hash de emails sensíveis

---

## 🛠️ Melhorias Práticas Recomendadas

### 1. ✅ Manter RLS (Já está ótimo!)

Não precisa fazer nada. O RLS garante que:
- Usuário A **NÃO** vê transações do Usuário B
- Apenas você (admin) vê tudo via Service Role

---

### 2. 🔐 Implementar Auditoria de Acesso Admin

**Por que:** LGPD exige rastreabilidade de quem acessa dados sensíveis.

**Criar migration:**

```sql
-- Migration: 20251206000000_create_admin_audit_log.sql

CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'view', 'export', 'delete', etc.
  table_name TEXT,
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Apenas admins veem
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs"
ON admin_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Função para registrar acesso
CREATE OR REPLACE FUNCTION log_admin_access(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    table_name,
    record_id
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Uso:**

```sql
-- Antes de fazer SELECT sensível no dashboard
SELECT log_admin_access('view_transactions', 'transactions');
SELECT * FROM transactions WHERE user_id = 'xyz';
```

---

### 3. 📝 Criar Termo de Consentimento LGPD

**Criar arquivo:** `src/components/LGPDConsent.tsx`

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export function LGPDConsent() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (user) {
      checkConsent();
    }
  }, [user]);

  const checkConsent = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('lgpd_consent_date')
      .eq('user_id', user!.id)
      .single();

    if (!data?.lgpd_consent_date) {
      setOpen(true);
    }
  };

  const handleAccept = async () => {
    await supabase
      .from('profiles')
      .update({
        lgpd_consent_date: new Date().toISOString(),
        lgpd_consent_version: '1.0'
      })
      .eq('user_id', user!.id);

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📋 Termos de Privacidade e Consentimento LGPD</DialogTitle>
          <DialogDescription>
            Por favor, leia e aceite os termos abaixo para continuar usando o Gasto Certo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <section>
            <h3 className="font-semibold">1. Dados Coletados</h3>
            <p>Coletamos e armazenamos:</p>
            <ul className="list-disc pl-6">
              <li>Informações de cadastro (nome, email)</li>
              <li>Dados financeiros (transações, contas, categorias)</li>
              <li>Informações de uso do aplicativo</li>
              <li>Dados de integração com Telegram (opcional)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold">2. Finalidade</h3>
            <p>
              Seus dados são utilizados exclusivamente para fornecer o serviço de 
              controle financeiro pessoal. Não compartilhamos ou vendemos seus dados 
              a terceiros.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">3. Seus Direitos (LGPD)</h3>
            <ul className="list-disc pl-6">
              <li>✅ Acessar seus dados a qualquer momento</li>
              <li>✅ Corrigir dados incompletos ou desatualizados</li>
              <li>✅ Solicitar exclusão de seus dados (direito ao esquecimento)</li>
              <li>✅ Exportar seus dados (portabilidade)</li>
              <li>✅ Revogar consentimento a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold">4. Segurança</h3>
            <p>
              Implementamos medidas técnicas e organizacionais para proteger seus 
              dados, incluindo criptografia, controle de acesso e auditoria.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">5. Contato DPO</h3>
            <p>
              Para exercer seus direitos ou tirar dúvidas: 
              <strong> privacidade@gastocerto.com.br</strong>
            </p>
          </section>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="consent" 
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked as boolean)}
          />
          <label htmlFor="consent" className="text-sm">
            Li e aceito os Termos de Privacidade e autorizo o tratamento dos meus dados 
            conforme a LGPD
          </label>
        </div>

        <DialogFooter>
          <Button onClick={handleAccept} disabled={!accepted}>
            Aceitar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Adicionar campo na tabela:**

```sql
-- Migration: 20251206000001_add_lgpd_consent.sql

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lgpd_consent_date TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lgpd_consent_version TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "data_portability": true,
  "marketing_emails": false,
  "analytics": true
}'::jsonb;
```

---

### 4. 🗑️ Direito ao Esquecimento

**Criar função para deletar todos os dados:**

```sql
-- Migration: 20251206000002_add_data_deletion.sql

CREATE OR REPLACE FUNCTION delete_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Log da operação
  INSERT INTO admin_audit_log (
    admin_user_id,
    action,
    table_name,
    record_id
  ) VALUES (
    p_user_id,
    'data_deletion_request',
    'all_tables',
    p_user_id
  );

  -- Deletar dados em cascata
  DELETE FROM transactions WHERE user_id = p_user_id;
  DELETE FROM recurring_transactions WHERE user_id = p_user_id;
  DELETE FROM accounts WHERE user_id = p_user_id;
  DELETE FROM categories WHERE user_id = p_user_id;
  DELETE FROM budgets WHERE user_id = p_user_id;
  DELETE FROM goals WHERE user_id = p_user_id;
  DELETE FROM investments WHERE user_id = p_user_id;
  DELETE FROM investment_transactions WHERE user_id = p_user_id;
  DELETE FROM financial_profile WHERE user_id = p_user_id;
  DELETE FROM telegram_integration WHERE user_id = p_user_id;
  DELETE FROM licenses WHERE user_id = p_user_id;
  
  -- Anonimizar profile (manter registro para auditoria)
  UPDATE profiles SET
    nome = 'Usuário Deletado',
    email = NULL,
    telefone = NULL,
    telegram_chat_id = NULL,
    telegram_id = NULL,
    avatar_url = NULL
  WHERE user_id = p_user_id;
  
  -- Deletar conta de autenticação
  -- (Feito via Supabase Admin API, não SQL)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Adicionar botão no Settings:**

```typescript
const handleDeleteAccount = async () => {
  if (confirm('⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL. Todos os seus dados serão permanentemente deletados. Deseja continuar?')) {
    await supabase.rpc('delete_user_data', { p_user_id: user!.id });
    await supabase.auth.signOut();
    // Redirecionar para página de confirmação
  }
};
```

---

### 5. 📊 Exportação de Dados (Portabilidade)

```typescript
// src/utils/dataExport.ts

export async function exportUserData(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId);

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId);

  const exportData = {
    exported_at: new Date().toISO String(),
    user: profile,
    transactions,
    accounts,
    // ... outras tabelas
  };

  // Download como JSON
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gasto-certo-data-${Date.now()}.json`;
  a.click();
}
```

---

## 📋 Checklist de Conformidade LGPD

### Obrigatório (Art. 5º, 6º, 7º)
- [ ] **Política de Privacidade** publicada
- [ ] **Termo de Consentimento** implementado
- [ ] **Base Legal** documentada (Art. 7º, I - Consentimento)
- [ ] **DPO** designado (pode ser você ou terceirizado)
- [ ] **Registro de Tratamento** mantido
- [ ] **Direito de Acesso** - usuário pode ver seus dados ✅
- [ ] **Direito de Correção** - usuário pode editar ✅
- [ ] **Direito de Exclusão** - implementar função
- [ ] **Portabilidade** - implementar exportação
- [ ] **Revogação de Consentimento** - implementar
- [ ] **Segurança Técnica** - RLS ✅, HTTPS ✅

### Recomendado
- [ ] **Privacy by Design** - considerar privacidade desde o início ✅
- [ ] **Privacy by Default** - configurações padrão seguras ✅
- [ ] **Data Minimization** - coletar apenas o necessário ⚠️
- [ ] **Auditoria Regular** - revisar políticas anualmente
- [ ] **Treinamento de Equipe** - se houver mais desenvolvedores
- [ ] **Incidente Response Plan** - plano de resposta a vazamentos

---

## 💡 Recomendação Final

### Para Conformidade LGPD Completa:

**Prioridade Alta (P0):**
1. ✅ Manter RLS ativo (JÁ ESTÁ)
2. 📝 Criar Política de Privacidade
3. 📝 Implementar Termo de Consentimento
4. 🗑️ Implementar Direito ao Esquecimento
5. 📊 Implementar Portabilidade de Dados

**Prioridade Média (P1):**
6. 🔐 Auditoria de acesso admin
7. 📧 Definir DPO e canal de contato
8. 📋 Documentar Registro de Tratamento

**Prioridade Baixa (P2):**
9. 🔐 Criptografia de campos ultra-sensíveis (Vault)
10. 📊 Dashboard de privacidade para usuário
11. 🤖 Testes automatizados de RLS

---

### Sobre "Não Ver Dados no Dashboard"

**Entenda:**
- ✅ Você **precisa** ver os dados como admin para suporte
- ✅ Usuários **NÃO** conseguem ver dados de outros (RLS)
- ⚠️ Se ainda assim quiser ocultar valores:
  - Opção 1: Criptografia Client-Side + descriptografar apenas no frontend
  - Opção 2: Usar Supabase Vault para dados mais sensíveis
  - Opção 3: Adicionar "modo mascarado" no dashboard admin

**LGPD permite:**
- Admin ver dados para fins de suporte e manutenção
- Desde que haja: auditoria, consentimento do usuário, e segurança adequada

---

## 📞 Contato para Implementação

**Próximos Passos:**
1. Revisar este documento
2. Decidir quais funcionalidades implementar
3. Criar migrations SQL necessárias
4. Atualizar frontend com componentes de privacidade
5. Publicar Política de Privacidade

**Dúvidas?**
- Posso ajudar a implementar qualquer item acima
- Posso gerar os códigos SQL e React necessários
- Posso revisar conformidade após implementação

---

**Documento gerado em:** 06/12/2024 01:47 BRT  
**Versão:** 1.0  
**Classificação:** CONFIDENCIAL

