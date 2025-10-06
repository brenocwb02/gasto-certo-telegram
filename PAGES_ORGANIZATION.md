# 📋 Organização de Páginas - Boas Contas

## 📊 Páginas no Menu Principal (Sidebar Superior)

Funcionalidades principais do sistema:

1. **Dashboard** (`/`) - Home, visão geral financeira
2. **Transações** (`/transactions`) - Gerenciar receitas e despesas
3. **Contas** (`/accounts`) - Gerenciar contas bancárias e cartões
4. **Categorias** (`/categories`) - Criar e editar categorias
5. **Orçamento** (`/orcamento`) - Planejamento mensal
6. **Relatórios** (`/reports`) - Gráficos e análises
7. **Metas** (`/goals`) - Objetivos financeiros
8. **Investimentos** (`/investimentos`) - Carteira de investimentos
9. **Patrimônio** (`/patrimonio`) - Patrimônio líquido total

## ⚙️ Páginas no Menu Inferior (Sidebar Inferior)

Configurações e recursos avançados:

1. **Recorrentes** (`/recorrentes`) - Contas fixas mensais
2. **Família** (`/familia`) - Gerenciar grupo familiar
3. **Telegram** (`/telegram-integration`) - Integração com bot
4. **Licença** (`/license`) - Status da assinatura
5. **Suporte** (`/support`) - Central de ajuda
6. **Configurações** (`/settings`) - Preferências do usuário
7. **Sair** - Logout (botão)

## 🔒 Páginas sem Menu (Utilitárias/Especiais)

Páginas de fluxo ou acesso direto:

1. **Landing** (`/landing`) - Página pública de marketing
2. **Auth** (`/auth`) - Login e registro
3. **Onboarding** (`/onboarding`) - Processo inicial guiado
4. **Quiz Financeiro** (`/quiz-financeiro`) - Perfil financeiro
5. **Checkout** (`/checkout`) - Página de pagamento/assinatura
6. **NotFound** (`*`) - Página 404

## ✅ Status das Páginas

- **Total de páginas com rotas**: 21 páginas
- **Páginas no menu**: 16 itens visíveis
- **Páginas utilitárias**: 6 páginas (sem menu)
- **Páginas mortas/obsoletas**: 0 (todas funcionais)

## 🗂️ Estrutura de Arquivos

Todos os arquivos de página estão em `src/pages/`:

```
src/pages/
├── Accounts.tsx ✅
├── Auth.tsx ✅
├── Budget.tsx ✅
├── Categories.tsx ✅
├── Checkout.tsx ✅
├── Dashboard.tsx ✅
├── FamilySettings.tsx ✅
├── Goals.tsx ✅
├── Investments.tsx ✅
├── Landing.tsx ✅
├── License.tsx ✅
├── NetWorth.tsx ✅
├── NotFound.tsx ✅
├── Onboarding.tsx ✅
├── QuizFinanceiro.tsx ✅
├── RecurringTransactions.tsx ✅
├── Reports.tsx ✅
├── Settings.tsx ✅
├── Support.tsx ✅
├── TelegramIntegration.tsx ✅
└── Transactions.tsx ✅
```

## 🎯 Recomendações

### Páginas Consistentes ✅
Todas as rotas no `App.tsx` têm arquivos correspondentes em `src/pages/`.

### Páginas no Sidebar ✅
Todas as funcionalidades principais estão acessíveis pelo menu lateral.

### Nenhuma Página para Exclusão ✅
Todas as páginas têm propósito e estão sendo utilizadas no sistema.

---

**Última atualização**: 2025-01-06
**Status**: Todas as páginas funcionais e organizadas
