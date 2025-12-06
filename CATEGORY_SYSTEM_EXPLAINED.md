# 📋 Sistema de Categorias - Como Funciona

**Status:** ✅ Personalização Total pelo Usuário  
**Data:** 06 de Dezembro de 2024

---

## 🎯 **Filosofia do Sistema:**

O **Gasto Certo** permite que cada usuário **crie suas próprias categorias e keywords** de acordo com sua realidade pessoal.

**NÃO há categorias pré-definidas no código.**

---

## 🏗️ **Estrutura de Dados:**

### **Tabela: `categories`**

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,  -- Cada usuário tem suas categorias
  nome TEXT NOT NULL,                   -- Ex: "Supermercado"
  tipo TEXT CHECK (tipo IN ('receita', 'despesa')),
  icone TEXT,                           -- Ex: "🛒"
  cor TEXT,                             -- Ex: "#FF6B6B"
  parent_id UUID REFERENCES categories, -- Para hierarquia (pai/filho)
  keywords TEXT[],                      -- Array de palavras-chave
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 👤 **Fluxo do Usuário:**

### **1. Cadastro Inicial:**
```
Novo usuário se cadastra
   ↓
Faz onboarding
   ↓
Vai para o app (Lovable)
   ↓
Acessa "Categorias"
   ↓
Tela vazia - sem categorias
```

### **2. Criando Primeira Categoria:**
```
Clica "Nova Categoria"
   ↓
Preenche:
  - Nome: "Alimentação"
  - Tipo: Despesa
  - Ícone: 🍽️
  - Cor: #FF6B6B
   ↓
Salva
```

### **3. Criando Subcategoria:**
```
Clica "Nova Categoria"
   ↓
Preenche:
  - Nome: "Supermercado"
  - Categoria Pai: Alimentação  ← Cria hierarquia
  - Keywords: mercado, muffato, gina
   ↓
Salva
```

### **4. Adicionando Keywords:**
```
Edita "Supermercado"
   ↓
Adiciona mais keywords:
  - mercado
  - muffato
  - carrefour (se usar)
  - condor (se for da região dele)
  - armazem da praia
   ↓
Salva
```

---

## 🤖 **Como o NLP Usa as Keywords:**

### **Exemplo 1: Usuário do Paraná**

**Categorias dele:**
```json
{
  "nome": "Supermercado",
  "parent": "Alimentação",
  "keywords": ["mercado", "muffato", "condor", "festval"]
}
```

**Mensagem:** `"gastei 50 no muffato"`

**IA Detecta:**
```
1. Busca "muffato" nas keywords
2. Encontra em "Supermercado"
3. Retorna: "Alimentação > Supermercado"
```

---

### **Exemplo 2: Usuário de São Paulo**

**Categorias dele:**
```json
{
  "nome": "Supermercado",
  "parent": "Alimentação",
  "keywords": ["mercado", "carrefour", "extra", "pão de açúcar"]
}
```

**Mensagem:** `"gastei 50 no carrefour"`

**IA Detecta:**
```
1. Busca "carrefour" nas keywords
2. Encontra em "Supermercado"
3. Retorna: "Alimentação > Supermercado"
```

**Note:** Cada um tem SEU conjunto de keywords baseado no que USA!

---

## 🌍 **Vantagens dessa Abordagem:**

### ✅ **Flexibilidade Total:**
- Usuário de Curitiba adiciona "Muffato"
- Usuário de SP adiciona "Carrefour"
- Usuário de Salvador adiciona "GBarbosa"
- Cada um personaliza conforme SUA realidade

### ✅ **Aprendizado Contínuo:**
- Usuário vê que bot não reconheceu "Condor"
- Vai em Categorias → Edita Supermercado
- Adiciona "condor" nas keywords
- Próxima vez funciona!

### ✅ **Zero Desperdício:**
- Não tem 400 keywords inúteis no banco
- Só tem o que o usuário realmente usa
- Performance melhor

### ✅ **Privacidade:**
- Categorias são pessoais
- Refletem os hábitos de cada um
- Ninguém mais vê suas categorias

---

## 📦 **Migration OPCIONAL Disponível:**

### **Arquivo:** `OPTIONAL_default_categories_brazil.sql.example`

**O que é:**
- Template com 30+ categorias brasileiras
- 400+ keywords pré-definidas
- Cobre 99% dos gastos comuns

**Quando usar:**
- Se quiser implementar "Importar Template" no futuro
- Para demonstrações/testes
- Para usuários que preferem conveniência

**Como usar:**
1. Renomear para `.sql`
2. Modificar `user_id` para um usuário real
3. Executar no SQL Editor

**Por que NÃO usar por padrão:**
- Vai contra a filosofia de personalização
- Usuários herdariam keywords que não usam
- Menos flexível

---

## 🔧 **Implementação Atual:**

### **Frontend (Lovable):**
```tsx
// src/pages/Categories.tsx
// Interface para criar/editar categorias

<Form>
  <Input name="nome" placeholder="Ex: Supermercado" />
  <Select name="parent_id">
    <option>Alimentação</option>
  </Select>
  
  <TagsInput 
    name="keywords"
    placeholder="Adicione palavras-chave: mercado, carrefour..."
  />
  
  <Button>Salvar Categoria</Button>
</Form>
```

### **Backend (NLP):**
```typescript
// supabase/functions/nlp-transaction/index.ts

// Busca categorias do USUÁRIO (não globais)
const { data: categories } = await supabase
  .from('categories')
  .select('id, nome, keywords, parent:categories!parent_id(nome)')
  .eq('user_id', userId);  // ← Filtro por usuário!

// Envia para IA
const categoriesList = categories
  .map(c => {
    if (c.parent) {
      return `${c.parent.nome} > ${c.nome}  (keywords: ${c.keywords.join(', ')})`;
    }
    return `${c.nome} (keywords: ${c.keywords.join(', ')})`;
  })
  .join(', ');
```

---

## 📊 **Exemplo Completo:**

### **Usuário: João (Curitiba)**

```sql
-- Categorias de João
INSERT INTO categories VALUES
  ('id-1', 'joão-id', 'Alimentação', NULL, ['comida', 'alimento']),
  ('id-2', 'joão-id', 'Supermercado', 'id-1', ['mercado', 'muffato', 'condor']),
  ('id-3', 'joão-id', 'Restaurante', 'id-1', ['almoço', 'madero', 'outback']);
```

**Mensagem:** `"gastei 80 no muffato"`

**IA recebe:**
```
Categorias disponíveis:
- Alimentação (keywords: comida, alimento)
- Alimentação > Supermercado (keywords: mercado, muffato, condor)
- Alimentação > Restaurante (keywords: almoço, madero, outback)
```

**IA retorna:**
```json
{
  "categoria": "Alimentação > Supermercado",
  "valor": 80,
  "conta": ...
}
```

---

## 🎓 **Educação do Usuário:**

### **Primeira Vez:**
```
Bot: "Não reconheci 'Condor'. Quer criar uma categoria?"

[✏️ Criar Categoria] [🔍 Ver Existentes]
```

### **Aprendizado:**
```
Bot detecta padrão:
  - Usuário sempre edita "Mercado" para "Supermercado"
  
Sugestão:
  "Notei que você compra no Condor frequentemente.
   Quer adicionar 'condor' às keywords de Supermercado?"
  
[✅ Sim, adicionar] [Não, obrigado]
```

---

## 🚀 **Próximos Passos (Futuro):**

1. **Sugestões Inteligentes:**
   - Bot aprende com edições do usuário
   - Sugere keywords automaticamente

2. **Compartilhamento (Opcional):**
   - Usuário pode exportar suas categorias
   - Outros podem importar se quiserem

3. **Template Brasileiro:**
   - Botão "Importar Categorias Padrão"
   - Usuário ESCOLHE se quer ou não

4. **Machine Learning:**
   - Aprender categorização sem keywords
   - Sugerir categoria baseado em histórico

---

## ✅ **Status Atual:**

- ✅ Usuário cria categorias manualmente
- ✅ Usuário adiciona keywords conforme usa
- ✅ NLP busca apenas categorias do usuário
- ✅ Sistema 100% personalizável
- ✅ Migration de categorias padrão = OPCIONAL
- ✅ Respeita a realidade de cada usuário

---

**Sistema funcionando como planejado! 🎉**
