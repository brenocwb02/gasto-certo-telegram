# 📋 Sistema de Categorias - Como Funciona

**Status:** ✅ Híbrido: Personalização Total + Template Opcional  
**Data:** 06 de Dezembro de 2024

---

## 🎯 **Filosofia do Sistema:**

O **Gasto Certo** oferece o melhor dos dois mundos:
1. **Iniciantes:** Podem importar um template completo em 1 clique.
2. **Avançados:** Podem criar tudo do zero.
3. **Flexibilidade:** Tudo é 100% editável após a importação.

---

## 🏗️ **Estrutura de Dados:**

### **Tabela: `categories`**
- Cada usuário tem suas próprias cópias das categorias.
- Keywords são armazenadas em um array `TEXT[]`.
- Hierarquia via `parent_id`.

---

## 👤 **Fluxo do Usuário:**

### **1. Onboarding (Primeiro Acesso):**
O usuário vê duas opções:

```
┌─────────────────────────────────────┐
│ 📋 Usar Categorias Sugeridas        │
│ [Recomendado]                       │
│ Importa 40+ categorias prontas      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✏️ Criar Minhas Categorias          │
│ Começar com tela em branco          │
└─────────────────────────────────────┘
```

### **2. Se "Usar Sugeridas" (Template):**
- Executa a função `import_default_categories(user_id)`
- Cria instantaneamente:
  - 9 Categorias Principais (Alimentação, Transporte, Dízimos, etc.)
  - 32 Subcategorias (Supermercado, Uber, Farmácia, etc.)
  - Keywords básicas já configuradas nas SUB-categorias

### **3. Personalização:**
O usuário pode:
- Adicionar keywords específicas (ex: "Muffato" em Supermercado)
- Deletar categorias que não usa (ex: Pets)
- Renomear qualquer item

---

## 🤖 **Como o NLP Usa as Keywords:**

### **Regra de Ouro:**
Keywords ficam **APENAS nas subcategorias** (ou categorias sem filhos).
Isso evita conflitos e melhora a precisão.

### **Exemplo:**

**Estrutura:**
```
Alimentação (SEM keywords)
├── Supermercado (keywords: mercado, atacadão)
└── Restaurante (keywords: almoço, jantar)
```

**Mensagem:** `"gastei 50 no mercado"`
1. IA busca "mercado"
2. Encontra em "Supermercado"
3. Pai é "Alimentação"
4. Retorno: **"Alimentação > Supermercado"**

---

## 📦 **Detalhes Técnicos:**

### **Função RPC:** `import_default_categories`

Esta função SQL:
1. Recebe o `user_id`
2. Insere todas as categorias padrão
3. Configura hierarquia e cores
4. Define keywords iniciais

### **Categorias Incluídas:**

1. **Alimentação** (Supermercado, Padaria, Restaurante, Delivery, Lanche)
2. **Transporte** (Combustível, Público, Apps, Estacionamento, Manutenção)
3. **Moradia** (Aluguel, Contas, Internet, Manutenção)
4. **Saúde** (Farmácia, Consultas, Exames, Plano)
5. **Lazer** (Streaming, Cinema, Viagens, Bares)
6. **Educação** (Cursos, Livros, Escola)
7. **Vestuário** (Roupas, Salão, Cosméticos)
8. **Pets** (Vet, Ração)
9. **Contribuições** (Dízimo/Ofertas, Caridade)

---

## ✅ **Vantagens:**

1. **Time to Value:** Usuário começa a usar em 5 segundos.
2. **Organização:** Estrutura "clean" (keywords só nas pontas).
3. **Inclusão:** Categoria específica para Dízimos/Ofertas.
4. **Flexibilidade:** O template é apenas um ponto de partida.

---

**Sistema pronto para atender todos os perfis de usuário! 🎉**
