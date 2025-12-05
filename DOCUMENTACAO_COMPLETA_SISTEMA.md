# 📚 DOCUMENTAÇÃO COMPLETA - GASTO CERTO (ZAQ)

## 📋 Índice
1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Funcionalidades Detalhadas](#funcionalidades-detalhadas)
4. [Integração Telegram](#integração-telegram)
5. [Sistema de Licenciamento](#sistema-de-licenciamento)
6. [Gestão Familiar](#gestão-familiar)
7. [Estratégia Premium](#estratégia-premium)
8. [Roadmap de Desenvolvimento](#roadmap-de-desenvolvimento)

---

## 🎯 Visão Geral do Sistema

### **Nome:** Gasto Certo (Zaq - Assistente Financeiro)
### **Proposta de Valor:**
Sistema completo de gestão financeira pessoal e familiar com integração Telegram, inteligência artificial para processamento de linguagem natural e análises financeiras avançadas.

### **Diferencial Competitivo:**
- ✅ Integração **total** com Telegram (registro por voz/texto)
- ✅ **IA Gemini 2.5** para NLP e análises inteligentes
- ✅ **Gestão familiar colaborativa** com roles e permissões
- ✅ **Quiz de saúde financeira** com score personalizado
- ✅ **Transações recorrentes** automáticas
- ✅ **Multi-plataforma** (Web + Telegram)

---

## 🏗️ Arquitetura Técnica

### **Stack Tecnológico**

#### **Frontend (Web)**
```
- React 18 + TypeScript
- Vite (Build tool)
- React Router (Navegação)
- Tailwind CSS + shadcn/ui (Design System)
- Recharts (Gráficos)
- React Hook Form + Zod (Validação)
- Tanstack Query (Cache/Estado)
```

#### **Backend**
```
- Supabase (BaaS)
  ├── PostgreSQL (Banco de dados)
  ├── Row Level Security (RLS)
  ├── Edge Functions (Deno)
  ├── Realtime Subscriptions
  └── Authentication (JWT)
```

#### **Integrações Externas**
```
- Telegram Bot API (Mensageria)
- Google AI (Gemini 2.5 Flash) - NLP e transcrição de áudio
- Stripe (Pagamentos) - Em desenvolvimento
```

### **Modelo de Dados**

#### **Tabelas Principais**

```sql
-- Usuários e Autenticação
├── auth.users (Supabase Auth)
├── profiles (Perfil do usuário)
├── licenses (Licenças e planos)
└── financial_profile (Quiz de saúde financeira)

-- Gestão Familiar
├── family_groups (Grupos familiares)
├── family_members (Membros e roles)
└── family_invites (Convites pendentes)

-- Financeiro Core
├── accounts (Contas bancárias/carteiras)
├── categories (Categorias de receita/despesa)
├── transactions (Transações financeiras)
├── budgets (Orçamentos mensais por categoria)
├── goals (Metas financeiras)
└── recurring_transactions (Contas recorrentes)

-- Telegram
├── telegram_integration (Vinculação chat_id ↔ user)
└── telegram_sessions (Sessões e contexto de conversação)
```

#### **Relacionamentos Principais**

```
User (profiles)
  ├── 1:N → Accounts
  ├── 1:N → Categories  
  ├── 1:N → Transactions
  ├── 1:N → Goals
  ├── 1:N → Budgets
  ├── 1:1 → Financial_Profile
  ├── 1:1 → Telegram_Integration
  └── N:M → Family_Groups (via family_members)

Family_Group
  ├── 1:N → Family_Members (roles: owner, admin, member, viewer)
  ├── 1:N → Family_Invites
  ├── 1:N → Accounts (compartilhadas)
  ├── 1:N → Categories (compartilhadas)
  ├── 1:N → Transactions (compartilhadas)
  ├── 1:N → Budgets (compartilhados)
  └── 1:N → Goals (compartilhadas)
```

---

## 🚀 Funcionalidades Detalhadas

### **1. GESTÃO DE TRANSAÇÕES** 💰

#### **1.1. Criação de Transações**

**Canais de Entrada:**
- ✅ **Web:** Formulário completo com validação
- ✅ **Telegram (Texto):** "Gastei 50 reais no mercado"
- ✅ **Telegram (Voz):** Áudio → Transcrição IA → NLP → Registro automático

**Tipos de Transação:**
1. **Receita** 💚
   - Fonte de dinheiro (salário, freelance, venda, etc.)
   - Aumenta saldo da conta
   
2. **Despesa** 💸
   - Gasto de dinheiro (compras, contas, lazer, etc.)
   - Diminui saldo da conta
   
3. **Transferência** 🔄
   - Movimentação entre contas próprias
   - Não afeta saldo total

**Campos:**
```typescript
interface Transaction {
  id: UUID;
  user_id: UUID;                    // Dono da transação
  group_id?: UUID;                  // Grupo familiar (se aplicável)
  tipo: 'receita' | 'despesa' | 'transferencia';
  valor: number;
  descricao: string;
  categoria_id: UUID;
  conta_origem_id: UUID;            // Conta principal
  conta_destino_id?: UUID;          // Para transferências
  data_transacao: Date;
  data_vencimento?: Date;           // Para contas a pagar
  observacoes?: string;
  anexos?: string[];                // URLs de comprovantes
  tags?: string[];                  // Tags personalizadas
  origem: 'web' | 'telegram' | 'api';
  installment_number?: number;      // Parcela atual (ex: 1/12)
  installment_total?: number;       // Total de parcelas
  parent_transaction_id?: UUID;     // ID da transação pai (parcelamento)
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Funcionalidades Avançadas:**
- ✅ **Parcelamento:** Criação automática de N transações futuras
- ✅ **Importação CSV:** Upload de extratos bancários
- ✅ **Duplicação:** Copiar transação existente
- ✅ **Edição em lote:** Atualizar múltiplas transações
- ✅ **Filtros complexos:** Por período, categoria, conta, valor, tags
- ✅ **Busca full-text:** Por descrição/observações

#### **1.2. NLP com IA (Telegram)**

**Como funciona:**
```
1. Usuário envia: "Almoço de 25 reais no iFood"
2. Edge Function 'nlp-transaction' recebe mensagem
3. Busca contas e categorias do usuário no banco
4. Monta prompt para Gemini AI:
   - Texto do usuário
   - Lista de contas disponíveis
   - Lista de categorias disponíveis
5. Gemini retorna JSON estruturado:
   {
     "tipo": "despesa",
     "valor": 25.00,
     "descricao": "Almoço iFood",
     "conta": "Cartão Nubank",
     "categoria": "Alimentação"
   }
6. Mapeia nomes → IDs do banco
7. Insere transação
8. Retorna confirmação ao usuário
```

**Suporta:**
- ✅ Linguagem natural ("gastei", "paguei", "comprei")
- ✅ Valores em diferentes formatos (50, 50.00, R$ 50, cinquenta)
- ✅ Inferência de categoria (mercado → Alimentação)
- ✅ Inferência de conta se não especificada

---

### **2. GESTÃO DE CONTAS** 🏦

#### **2.1. Tipos de Conta**

```typescript
type AccountType = 
  | 'conta_corrente'    // Banco tradicional
  | 'poupanca'          // Poupança
  | 'cartao_credito'    // Cartão de crédito
  | 'investimento'      // Corretora/CDB/Tesouro
  | 'dinheiro'          // Carteira física
  | 'outros';           // Outras categorias

interface Account {
  id: UUID;
  user_id: UUID;
  group_id?: UUID;           // Conta compartilhada familiar
  nome: string;              // Ex: "Nubank", "Caixa Econômica"
  tipo: AccountType;
  saldo_atual: number;       // Atualizado automaticamente
  saldo_inicial: number;     // Saldo quando criada
  limite?: number;           // Limite do cartão de crédito
  cor?: string;              // Cor para gráficos (#RRGGBB)
  icon?: string;             // Ícone customizado
  ativo: boolean;            // Soft delete
  banco?: string;            // Nome da instituição
  agencia?: string;
  conta?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Funcionalidades:**
- ✅ **Saldo automático:** Atualiza a cada transação (trigger SQL)
- ✅ **Múltiplas contas:** Ilimitadas por usuário
- ✅ **Contas compartilhadas:** Visíveis para todo o grupo familiar
- ✅ **Conciliação bancária:** Comparar saldo real vs registrado
- ✅ **Histórico de saldo:** Visualizar evolução no tempo

---

### **3. GESTÃO DE CATEGORIAS** 📂

#### **3.1. Sistema de Categorização**

```typescript
interface Category {
  id: UUID;
  user_id: UUID;
  group_id?: UUID;
  nome: string;              // Ex: "Alimentação", "Transporte"
  tipo: 'receita' | 'despesa';
  cor: string;               // Cor visual (#RRGGBB)
  icon?: string;             // Emoji ou ícone
  parent_id?: UUID;          // Subcategorias (hierarquia)
  created_at: Timestamp;
}
```

**Categorias Sugeridas (Pré-populadas):**

**Despesas:**
- 🍔 Alimentação
- 🚗 Transporte
- 🏠 Moradia
- ⚡ Utilidades (água, luz, internet)
- 💊 Saúde
- 🎓 Educação
- 🎉 Lazer
- 👕 Vestuário
- 🎁 Presentes

**Receitas:**
- 💼 Salário
- 💰 Freelance
- 📈 Investimentos
- 🎁 Presentes Recebidos

**Funcionalidades:**
- ✅ Categorias personalizadas
- ✅ Subcategorias (ex: Alimentação → Restaurante, Mercado, Delivery)
- ✅ Cores customizáveis para gráficos
- ✅ Categorias compartilhadas no grupo familiar

---

### **4. ORÇAMENTO MENSAL** 📊

#### **4.1. Planejamento Orçamentário**

```typescript
interface Budget {
  id: UUID;
  user_id: UUID;
  group_id?: UUID;
  category_id: UUID;         // Categoria que está sendo orçada
  month: string;             // YYYY-MM
  amount: number;            // Valor planejado
  spent?: number;            // Calculado: total gasto (via view/RPC)
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Como funciona:**
1. Usuário define limite mensal por categoria
   - Ex: "Alimentação: R$ 800/mês"
2. Sistema calcula gastos em tempo real
3. Exibe progresso visual (barra de progresso)
4. Alerta quando atingir 80%, 100%, 120%

**Funcionalidades:**
- ✅ **Orçamento por categoria**
- ✅ **Comparação mensal:** Mês atual vs anterior
- ✅ **Alertas automáticos:** Telegram + Web
- ✅ **Visualização gráfica:** Cards com progresso
- ✅ **Orçamento zero-based:** Alocar todo o salário
- ✅ **Orçamento familiar:** Todos contribuem para o mesmo limite

---

### **5. METAS FINANCEIRAS** 🎯

#### **5.1. Definição de Objetivos**

```typescript
interface Goal {
  id: UUID;
  user_id: UUID;
  group_id?: UUID;           // Meta familiar
  titulo: string;            // Ex: "Viagem para Paris"
  descricao?: string;
  valor_meta: number;        // Objetivo (R$ 10.000)
  valor_atual: number;       // Progresso (R$ 3.500)
  data_inicio: Date;
  data_fim: Date;            // Prazo
  categoria_id?: UUID;       // Categoria relacionada
  status: 'ativa' | 'concluida' | 'cancelada';
  tipo: 'economia' | 'divida' | 'investimento';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Tipos de Meta:**
1. **Economia** 💰
   - Juntar dinheiro para algo (viagem, carro, casa)
   - Aporte manual do usuário
   
2. **Dívida** 💳
   - Pagar empréstimo/cartão
   - Decrementa a cada pagamento
   
3. **Investimento** 📈
   - Atingir patrimônio X
   - Considera rentabilidade

**Funcionalidades:**
- ✅ **Progresso visual:** Barra animada
- ✅ **Cálculo automático:** Quanto guardar por mês
- ✅ **Lembretes:** Notificações de progresso
- ✅ **Metas compartilhadas:** Família economiza junto
- ✅ **Histórico de aportes**

---

### **6. TRANSAÇÕES RECORRENTES** 🔄

#### **6.1. Automação de Contas Fixas**

```typescript
interface RecurringTransaction {
  id: UUID;
  user_id: UUID;
  group_id?: UUID;
  title: string;             // Ex: "Aluguel"
  type: 'receita' | 'despesa';
  amount: number;
  category_id: UUID;
  account_id: UUID;
  frequency: 'diaria' | 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';
  day_of_month?: number;     // Para mensal: dia 1-31
  day_of_week?: number;      // Para semanal: 0-6 (domingo-sábado)
  start_date: Date;
  end_date?: Date;           // Opcional (recorrência infinita)
  next_due_date: Date;       // Próxima execução
  is_active: boolean;
  auto_create: boolean;      // Criar transação automaticamente?
  notify_before_days?: number; // Notificar X dias antes
  created_at: Timestamp;
}
```

**Funcionalidades:**
- ✅ **Criação automática:** Transação gerada todo mês (Edge Function agendada)
- ✅ **Notificações:** Lembrete antes do vencimento
- ✅ **Pausar/Retomar:** Temporariamente desabilitar
- ✅ **Histórico:** Ver todas as ocorrências
- ✅ **Edição em massa:** Atualizar valor de todas as futuras

**Comandos Telegram:**
```
/recorrentes           → Lista todas ativas
/recorrente_nova       → Instruções para criar
/pausar_recorrente     → Pausar/reativar
```

---

### **7. RELATÓRIOS E ANÁLISES** 📈

#### **7.1. Dashboard Principal**

**Cards de Resumo:**
- 💰 **Saldo Total:** Soma de todas as contas
- 💚 **Receitas do Mês**
- 💸 **Despesas do Mês**
- 📊 **Economia:** Receitas - Despesas
- 🎯 **Progresso de Metas**

**Gráficos:**
1. **Evolução Financeira** (Linha)
   - Receitas vs Despesas nos últimos 6 meses
   
2. **Despesas por Categoria** (Pizza/Donut)
   - Distribuição percentual
   
3. **Fluxo de Caixa** (Barra)
   - Entradas e saídas por mês

#### **7.2. Página de Relatórios**

**Filtros:**
- Período (semana, mês, trimestre, ano, customizado)
- Categoria
- Conta
- Tipo (receita/despesa)
- Tags

**Visualizações:**
- ✅ Tendência mensal
- ✅ Comparativo de períodos
- ✅ Top 5 categorias de gasto
- ✅ Evolução de patrimônio líquido
- ✅ Taxa de economia (saving rate)

#### **7.3. Query Engine com IA** 🤖

**Telegram: `/perguntar [pergunta]`**

Usuário pode fazer perguntas em linguagem natural:
```
/perguntar quanto gastei com iFood em setembro?
/perguntar minhas receitas de freelance
/perguntar quantas vezes gastei mais de 100 reais?
```

**Como funciona:**
1. Edge Function `query-engine` recebe pergunta
2. Usa Gemini AI para interpretar
3. Converte em SQL query
4. Executa no banco (com RLS - seguro!)
5. Formata resposta em linguagem natural
6. Retorna ao usuário

---

### **8. PATRIMÔNIO LÍQUIDO (NET WORTH)** 💎

```typescript
interface NetWorthCalculation {
  ativos: {
    contas_correntes: number;
    poupanca: number;
    investimentos: number;
    imoveis?: number;
    veiculos?: number;
    outros?: number;
  };
  passivos: {
    cartoes_credito: number;
    emprestimos?: number;
    financiamentos?: number;
  };
  patrimonio_liquido: number; // ativos - passivos
  data_calculo: Date;
}
```

**Edge Function:** `calculate-net-worth`
- Calcula automaticamente
- Gera histórico mensal
- Gráfico de evolução

---

### **9. QUIZ DE SAÚDE FINANCEIRA** 🏥

#### **9.1. Avaliação Personalizada**

```typescript
interface FinancialProfile {
  user_id: UUID;
  emergency_fund: 'none' | 'less_than_1_month' | '1_to_3_months' | '3_to_6_months' | 'more_than_6_months';
  debt_situation: 'no_debt' | 'low_debt' | 'moderate_debt' | 'high_debt' | 'overwhelming_debt';
  savings_rate: 'negative' | '0_to_5_percent' | '5_to_10_percent' | '10_to_20_percent' | 'more_than_20_percent';
  investment_knowledge: 'beginner' | 'basic' | 'intermediate' | 'advanced' | 'expert';
  financial_goals: 'survival' | 'stability' | 'growth' | 'wealth_building' | 'legacy';
  budget_control: 'no_budget' | 'informal' | 'basic_tracking' | 'detailed_budget' | 'advanced_planning';
  insurance_coverage: 'none' | 'basic' | 'adequate' | 'comprehensive' | 'excellent';
  retirement_planning: 'not_started' | 'thinking_about_it' | 'basic_plan' | 'detailed_plan' | 'expert_level';
  financial_health_score: number;    // 0-100
  recommendations: string[];          // Recomendações da IA
  completed_at: Timestamp;
}
```

**Score 0-100:**
- 80-100: 🟢 Excelente
- 60-79: 🔵 Bom
- 40-59: 🟡 Regular
- 20-39: 🟠 Precisa Melhorar
- 0-19: 🔴 Crítico

**Recomendações IA:**
Com base nas respostas, Gemini gera sugestões personalizadas:
- "Crie fundo de emergência de 6 meses"
- "Reduza dívidas de cartão de crédito"
- "Comece a investir 10% da renda"

**Visualização:**
- Web: Página completa com gráficos
- Telegram: `/meuperfil` - Resumo formatado

---

## 📱 Integração Telegram

### **10. BOT DO TELEGRAM** 🤖

#### **10.1. Comandos Disponíveis**

**BÁSICOS:**
```
/start              → Boas-vindas e vinculação
/ajuda              → Lista de comandos
/tutorial           → Link para tutorial completo
```

**FINANCEIROS:**
```
/saldo              → Saldo de todas as contas
/extrato            → Últimas 10 transações
/resumo             → Resumo do mês (receitas/despesas)
/metas              → Progresso das metas ativas
/orcamento          → Status dos orçamentos
```

**ANÁLISES INTELIGENTES:**
```
/perguntar [texto]     → Query em linguagem natural
/top_gastos            → Top 5 categorias do mês
/comparar_meses        → Mês atual vs anterior
/previsao              → Projeção de gastos do mês
```

**EDIÇÃO:**
```
/editar_ultima         → Editar última transação
                         (abre menu inline com opções)
```

**RECORRENTES:**
```
/recorrentes           → Lista contas recorrentes ativas
/recorrente_nova       → Instruções para criar
/pausar_recorrente     → Pausar/reativar (menu inline)
```

**PERFIL:**
```
/meuperfil             → Ver score de saúde financeira
```

#### **10.2. Mensagens Naturais (NLP)**

**Despesas:**
```
"Gastei 50 no mercado"
"Almoço de 25 reais"
"Paguei R$ 150 de internet"
```

**Receitas:**
```
"Recebi 3000 de salário"
"Vendi um produto por 500"
```

**Transferências:**
```
"Transferi 200 da conta para carteira"
```

#### **10.3. Áudio (Voz → Texto → NLP)**

1. Usuário grava áudio no Telegram
2. Bot recebe arquivo de áudio (OGG/Opus)
3. Edge Function baixa áudio
4. Gemini AI transcreve para texto
5. Texto vai para NLP (mesmo fluxo acima)
6. Transação criada automaticamente

**Exemplo:**
```
🎤 "Oi Zaq, gastei vinte e cinco reais no almoço hoje"
→ Transcrição: "gastei 25 reais no almoço"
→ NLP extrai: despesa R$ 25, categoria: Alimentação
→ ✅ Transação registrada!
```

#### **10.4. Notificações Automáticas**

**Edge Function:** `telegram-notifications`
**Agendada:** Via Supabase Cron ou pg_cron

**Tipos:**
1. **Alerta de Gastos** (`spending_alert`)
   - Quando gastos do mês > R$ 2.000 (configurável)
   
2. **Lembrete de Metas** (`goal_reminder`)
   - Meta < 50% completa e faltam < 7 dias
   
3. **Resumo Mensal** (`monthly_summary`)
   - Todo dia 1º do mês às 9h
   - Receitas, despesas, saldo, top categoria

**Exemplo de Mensagem:**
```
📊 Resumo Mensal - Novembro 2024

💚 Receitas: R$ 5.000,00
❌ Despesas: R$ 3.800,00
💰 Saldo: R$ 1.200,00

🏆 Maior gasto: Alimentação (R$ 950,00)

🎉 Parabéns! Mês positivo!
```

---

## 🔐 Sistema de Licenciamento

### **11. PLANOS E LICENÇAS**

#### **11.1. Estrutura de Licenças**

```typescript
interface License {
  id: UUID;
  codigo: string;            // Código único (ex: LIC_XXXX)
  user_id: UUID;
  tipo: 'gratuito' | 'mensal' | 'anual' | 'vitalicio';
  status: 'ativo' | 'expirado' | 'cancelado' | 'suspenso';
  data_inicio: Date;
  data_expiracao?: Date;     // null para vitalício
  auto_renovacao: boolean;
  payment_method_id?: string; // Stripe
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

#### **11.2. Planos (Nova Estrutura)**

| Plano | Preço | Usuários | Features Principais |
|-------|-------|----------|---------------------|
| **Gratuito** | R$ 0 | 1 | 75 txs/mês (100 nos 1ºs 30 dias), 2 contas, Telegram ✅ |
| **Individual** | R$ 14,90/mês | 1 | Ilimitado, IA Avançada, Exportação |
| **Família** | R$ 24,90/mês | 5 | **Mais Popular** ⭐ Gestão Familiar, Roles |
| **Família Plus** | R$ 39,90/mês | 10 | Suporte VIP, Consultoria, API |

**Comparativo de Limites:**

| Feature | Gratuito | Individual | Família | Família Plus |
|---------|----------|------------|---------|--------------|
| **Transações** | 100 (1º mês) → 75/mês | Ilimitadas | Ilimitadas | Ilimitadas |
| **Contas** | 2 | Ilimitadas | Ilimitadas | Ilimitadas |
| **Categorias** | 10 | Ilimitadas | Ilimitadas | Ilimitadas |
| **Metas** | 1 | Ilimitadas | Ilimitadas | Ilimitadas |
| **Orçamentos** | 3 | Ilimitados | Ilimitados | Ilimitados |
| **Telegram** | ✅ (Texto + Áudio) | ✅ | ✅ | ✅ |
| **IA (NLP)** | 20 créditos/mês | Ilimitado | Ilimitado | Ilimitado |
| **Query Engine** | ❌ | ✅ | ✅ | ✅ |
| **Gestão Familiar** | ❌ | ❌ | ✅ (5 membros) | ✅ (10 membros) |
| **Suporte** | Email | Email Prioritário | Email Prioritário | WhatsApp VIP |

---

## 👨‍👩‍👧‍👦 Gestão Familiar

### **12. SISTEMA DE GRUPOS FAMILIARES**

#### **12.1. Arquitetura**

**Conceito:** 1 Conta = 1 Grupo Máximo (simplificado)

```
Usuário Breno (Owner)
  └── Grupo: "Família Silva"
       ├── Breno (Owner)
       ├── Maria (Admin)
       ├── João (Member)
       └── Ana (Viewer)
```

#### **12.2. Roles e Permissões**

| Permissão | Owner | Admin | Member | Viewer |
|-----------|-------|-------|--------|--------|
| **Ver transações** | ✅ | ✅ | ✅ | ✅ |
| **Criar transações** | ✅ | ✅ | ✅ | ❌ |
| **Editar transações** | ✅ Todas | ✅ Todas | ✅ Próprias | ❌ |
| **Deletar transações** | ✅ Todas | ✅ Todas | ✅ Próprias | ❌ |
| **Criar categorias/contas** | ✅ | ✅ | ✅ | ❌ |
| **Gerenciar orçamentos** | ✅ | ✅ | ✅ | ❌ |
| **Ver relatórios** | ✅ | ✅ | ✅ | ✅ |
| **Convidar membros** | ✅ | ✅ | ❌ | ❌ |
| **Remover membros** | ✅ | ✅ | ❌ | ❌ |
| **Alterar roles** | ✅ | ✅ Exceto Owner | ❌ | ❌ |
| **Dissolver grupo** | ✅ | ❌ | ❌ | ❌ |
| **Deletar grupo** | ✅ | ❌ | ❌ | ❌ |

#### **12.3. Fluxo de Convite**

```
1. Owner/Admin gera convite:
   - Escolhe nome do convidado
   - Define role (member, admin, viewer)
   - Sistema gera token: FAM_XXXXXXXXXXXX
   - Válido por 30 dias

2. Compartilhamento:
   - Código copiado
   - Enviado via WhatsApp, Telegram, etc.

3. Aceitação:
   - Convidado acessa /familia no app
   - Clica "Aceitar Convite"
   - Cola o código
   - OU: Telegram /start com link direto

4. Resultado:
   - Convite aceito
   - Usuário vira membro do grupo
   - Ganha acesso aos dados compartilhados
```

#### **12.4. Dados Compartilhados vs Pessoais**

**COMPARTILHADOS (group_id != null):**
- ✅ Contas (ex: "Conta Conjunta")
- ✅ Categorias (ex: "Supermercado Casa")
- ✅ Transações (todos veem e podem adicionar)
- ✅ Orçamentos (limite familiar)
- ✅ Metas (ex: "Viagem em família")

**PESSOAIS (group_id = null):**
- ✅ Contas individuais
- ✅ Categorias personalizadas
- ✅ Transações privadas
- ✅ Orçamentos individuais
- ✅ Metas pessoais

**Usuário vê:**
```sql
SELECT * FROM transactions 
WHERE user_id = current_user_id 
   OR group_id IN (
     SELECT group_id FROM family_members 
     WHERE member_id = current_user_id 
     AND status = 'active'
   );
```

#### **12.5. Migração de Dados**

**Função RPC:** `migrate_personal_data_to_group`

Quando usuário cria primeiro grupo, pode:
1. Manter dados pessoais separados
2. **Migrar tudo para o grupo** (recomendado)

**O que acontece:**
```sql
UPDATE transactions SET group_id = 'novo_grupo_id' 
WHERE user_id = 'user_id' AND group_id IS NULL;

UPDATE accounts SET group_id = 'novo_grupo_id' 
WHERE user_id = 'user_id' AND group_id IS NULL;

-- Idem para categories, budgets, goals
```

#### **12.6. Dissolução de Grupo**

**Função RPC:** `dissolve_family_group` (Owner only)

**Opção 1: Dissolver e Manter Dados**
```
- Remove grupo da tabela family_groups
- Remove membros
- Dados voltam a ser pessoais do Owner:
  UPDATE transactions SET group_id = NULL, user_id = owner_id
  UPDATE accounts SET group_id = NULL, user_id = owner_id
- Outros membros perdem acesso
```

**Opção 2: Deletar Grupo (PERIGOSO!)**
```
- Deleta TUDO em cascata:
  - Grupo
  - Membros
  - Transações
  - Contas
  - Categorias
  - Orçamentos
  - Metas
- IRRECUPERÁVEL!
```

---

## 💎 Estratégia Premium (Gestão Familiar)

### **13. MODELO DE NEGÓCIO OTIMIZADO**

#### **13.1. Proposta de Valor Premium**

**Pain Points dos Clientes:**
1. ❌ Planilhas compartilhadas confusas (Google Sheets)
2. ❌ Aplicativos que não permitem múltiplos usuários
3. ❌ Falta de controle sobre quem vê o quê
4. ❌ Difícil rastrear "quem gastou o quê"
5. ❌ Cônjuges/famílias sem visão unificada

**Solução do Gasto Certo:**
1. ✅ Gestão familiar em um só lugar
2. ✅ Roles e permissões granulares
3. ✅ Transparência financeira controlada
4. ✅ Telegram integrado (toda família pode usar)
5. ✅ Relatórios consolidados automáticos

#### **13.2. Personas Premium**

**Persona 1: Família Tradicional**
```
- Casal com 2 filhos
- Renda combinada: R$ 8.000-15.000
- Querem ensinar filhos sobre dinheiro
- Uso: Controle de mesada + gastos da casa

Setup ideal:
├── Pai (Owner)
├── Mãe (Admin) 
├── Filho 16 anos (Member - mesada controlada)
└── Filho 12 anos (Viewer - só acompanha)
```

**Persona 2: Casal Jovem**
```
- Casados/Morando juntos
- Renda combinada: R$ 6.000-12.000
- Contas separadas + conta conjunta
- Uso: Divisão justa de despesas

Setup ideal:
├── Usuário A (Owner)
└── Usuário B (Admin)

Contas:
├── Conta Conjunta (compartilhada)
├── Conta Pessoal A (privada)
└── Conta Pessoal B (privada)
```

**Persona 3: Empreendedor + Família**
```
- Dono de negócio
- Separa finanças pessoais e empresariais
- Família precisa acessar parte dos dados
- Uso: Transparência sem expor tudo

Setup ideal:
├── Empresário (Owner)
├── Cônjuge (Member - acesso doméstico)
└── Contador (Viewer - só visualiza)

Categorias:
├── Pessoais (compartilhadas)
└── Empresariais (privadas)
```

#### **13.3. Planos Revisitados (DEFINITIVO)**

| Plano | Preço | Membros | Contas | Transações | IA |
|-------|-------|---------|--------|------------|-----|
| **Free** | R$ 0 | 1 | 2 | **75/mês*** | 20 NLP/mês |
| **Individual** | R$ 14,90/mês | 1 | ∞ | ∞ | ∞ |
| **Família** | R$ 24,90/mês | 5 | ∞ | ∞ | ∞ |
| **Família Plus** | R$ 39,90/mês | 10 | ∞ | ∞ | ∞ + Suporte |

***Nota sobre Free:** Nos primeiros 30 dias, o limite é de **100 transações** para permitir teste completo. Após 30 dias, ajusta para **75 transações/mês**.

**Features Exclusivas Família:**
- ✅ Gestão de múltiplos usuários
- ✅ Roles e permissões
- ✅ Contas compartilhadas
- ✅ Orçamento familiar consolidado
- ✅ Relatórios por membro
- ✅ Notificações em grupo (Telegram)
- ✅ Controle de mesada para filhos
- ✅ Exportação de dados (PDF/Excel)

#### **13.4. Upsell Journey**

**Etapa 1: Free User (Teste)**
```
→ Primeiros 30 dias: 100 transações (uso livre)
→ Cria hábito e dependência
→ Dia 31: Limite cai para 75 transações
→ Trigger: "Você atingiu seu limite mensal. Faça upgrade!"
```

**Etapa 2: Individual User**
```
→ Casa/casa com cônjuge
→ Frustração: "queria que minha esposa usasse também"
→ Banner: "Convide sua família! Upgrade para Família"
→ Mostra: "Por apenas +R$ 10, até 5 pessoas podem usar"
```

**Etapa 3: Família User (Power User)**
```
→ Família grande (3+ filhos) ou negócio
→ Precisa de mais slots
→ Oferta: "Família Plus - 10 membros + suporte prioritário"
```

#### **13.5. Features Exclusivas por Plano**

**FREE:**
- Tudo pessoal (sem compartilhamento)
- Limites: 2 contas, 10 categorias, 75 txs/mês (100 no 1º mês)
- Telegram básico (20 NLP/mês)

**INDIVIDUAL (R$ 14,90):**
- Tudo ilimitado
- IA ilimitada
- Sem família
- Relatórios avançados
- Exportação

**FAMÍLIA (R$ 24,90):** ⭐ **MAIS VENDIDO**
- Tudo do Individual +
- **5 membros**
- Roles e permissões
- Contas compartilhadas
- Orçamento familiar
- Metas em grupo
- Notificações coletivas

**FAMÍLIA PLUS (R$ 39,90):**
- Tudo do Família +
- **10 membros**
- Suporte prioritário (WhatsApp/Telegram)
- Onboarding personalizado
- Consultoria financeira mensal (30min)

---

## 📋 Roadmap de Desenvolvimento

### **14. FEATURES PLANEJADAS**

#### **Q1 2025 - Foundation**

**Prioridade CRÍTICA:**
1. ✅ Sistema de licenciamento funcionando
2. ✅ Integração Stripe para pagamentos
3. ✅ Upgrade/Downgrade de planos
4. ✅ Cancelamento e reembolso
5. ✅ Dashboard admin (métricas de negócio)

**Melhorias Telegram:**
6. Comandos adicionais:
   - `/orcamento [categoria]` - Status de categoria específica
   - `/patrimonio` - Ver net worth
   - `/relatorio_semanal` - Resumo da semana
7. Botões inline para ações rápidas
8. Menu de comandos do Telegram (autocomplete)
9. Configuração de notificações (on/off por tipo)

**Gestão Familiar:**
10. Relatório "Quem gastou o quê" (breakdown por membro)
11. Controle de mesada (limite por filho)
12. Aprovação de gastos (filhos pedem, pais aprovam)

#### **Q2 2025 - Growth**

**Engagement:**
13. Gamification:
    - Badges de conquistas ("1º mês no azul!", "100 transações")
    - Streaks (dias consecutivos registrando)
    - Desafios familiares ("Economizar 20% este mês")
14. Onboarding melhorado (tour interativo)
15. Templates de orçamento (perfis prontos)

**Automação:**
16. Open Finance / Integração bancária (PluggyFi, Belvo)
17. Importação automática de extratos
18. Categorização automática com ML
19. Detecção de duplicatas

**Análises:**
20. Previsão de despesas com ML
21. Alertas inteligentes de anomalias
22. Comparação com usuários similares (anônimo)
23. Insights IA personalizados semanais

#### **Q3 2025 - Expansion**

**Mobile:**
24. PWA instalável (push notifications)
25. App React Native (iOS + Android)
26. Widget de saldo na home

**Integrações:**
27. WhatsApp Bot (além do Telegram)
28. Google Sheets (exportação automática)
29. Zapier / Make.com
30. API pública (webhooks)

**Educação Financeira:**
31. Biblioteca de conteúdo (artigos, vídeos)
32. Cursos de finanças pessoais
33. Simuladores (aposentadoria, financiamento)
34. Newsletter semanal personalizada

#### **Q4 2025 - Enterprise**

**B2B:**
35. White-label para empresas
36. Gestão de benefícios corporativos
37. Dashboard para RH/Financeiro
38. Integração folha de pagamento

**Premium Features:**
39. Assessoria financeira humana (videochamada)
40. Consultoria de investimentos
41. Marketplace (seguros, investimentos, cartões)
42. Cashback / Programa de pontos

---

## 🎯 Métricas de Sucesso

### **15. KPIs DO PRODUTO**

**Aquisição:**
- CAC (Custo de Aquisição)
- Taxa de conversão Free → Paid
- Origem de tráfego (orgânico, pago, indicação)

**Ativação:**
- % usuários que completam onboarding
- Tempo até 1ª transação registrada
- % que vinculam Telegram em 7 dias

**Engagement:**
- DAU/MAU (Daily/Monthly Active Users)
- Transações criadas/usuário/mês
- Tempo médio na plataforma
- Uso Telegram vs Web (%)

**Retenção:**
- Churn rate mensal
- Lifetime Value (LTV)
- Taxa de renovação (anual)

**Receita:**
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- LTV/CAC ratio (ideal: >3)

**Família:**
- % usuários premium com grupo ativo
- Média de membros por grupo
- Taxa de aceitação de convites
- Transações por membro no grupo

---

## 📞 Suporte e Documentação

### **16. RECURSOS DE AJUDA**

**Para Usuários:**
- 📚 Central de Ajuda (FAQ)
- 🎥 Vídeo tutoriais (YouTube)
- 💬 Chat Telegram (comunidade)
- 📧 Email: suporte@boascontas.com
- 🎓 Onboarding interativo (primeiro acesso)

**Para Desenvolvedores:**
- 📖 Documentação da API
- 🔧 Sandbox para testes
- 🐛 GitHub Issues
- 💻 Discord (comunidade dev)

---

## 🔒 Segurança e Privacidade

### **17. PROTEÇÕES IMPLEMENTADAS**

**Autenticação:**
- ✅ Supabase Auth (JWT)
- ✅ 2FA (opcional)
- ✅ OAuth (Google, Apple - futuro)

**Autorização:**
- ✅ Row Level Security (RLS) em TODAS as tabelas
- ✅ Policies baseadas em user_id e group_id
- ✅ Validação de roles no backend

**Dados Sensíveis:**
- ✅ Criptografia em trânsito (HTTPS/TLS)
- ✅ Criptografia em repouso (PostgreSQL nativo)
- ✅ Tokens de convite expiram em 30 dias
- ✅ Sessions Telegram por chat_id único

**LGPD/GDPR:**
- ✅ Consentimento explícito (termos de uso)
- ✅ Direito ao esquecimento (delete account)
- ✅ Portabilidade de dados (exportação)
- ✅ Transparência (privacy policy)

---

## 📊 Conclusão

O **Gasto Certo (Zaq)** é uma solução completa e inovadora de gestão financeira que combina:

### **Pontos Fortes:**
1. 🤖 **IA de ponta** (Gemini 2.5) para NLP e análises
2. 📱 **Telegram nativo** - diferencial único no mercado
3. 👨‍👩‍👧 **Gestão familiar robusta** com roles e permissões
4. 🎯 **Features completas** (orçamento, metas, recorrentes, quiz)
5. 🔒 **Segurança de nível enterprise** (RLS, criptografia)

### **Oportunidades:**
1. 💰 **Monetização clara** via planos Família
2. 📈 **Escalabilidade** técnica (Supabase)
3. 🌎 **Expansão** (WhatsApp, mobile app)
4. 🏢 **B2B** (white-label, empresas)

### **Próximos Passos:**
1. Finalizar integração Stripe
2. Landing page otimizada para conversão
3. Campanha de lançamento
4. Programa de afiliados/indicação
5. Parcerias estratégicas (influenciadores financeiros)

---

**Versão:** 1.0  
**Última Atualização:** 04 de Dezembro de 2024  
**Autor:** Equipe Gasto Certo  

