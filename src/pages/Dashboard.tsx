import { useState, useMemo } from "react";
import { useFinancialStats, useProfile, useGoals, useFinancialProfile, useAccounts } from "@/hooks/useSupabaseData";
import { useFamily } from "@/hooks/useFamily";
import { useLimits } from "@/hooks/useLimits";
import { useTransactions } from "@/hooks/useSupabaseData";

// UI Components
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";

// Dashboard Sections
import {
  FinancialStatusSection,
  MoneyLocationSection,
  MonthAnalysisSection,
  AttentionSection,
  HistorySection,
} from "@/components/dashboard/sections";
import { CollapsibleLimitsBanner } from "@/components/dashboard/CollapsibleLimitsBanner";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { PlanStatus } from "@/components/PlanGuard";

// Icons
import {
  Plus,
  Lock,
  Heart,
  Settings2,
} from "lucide-react";

const Dashboard = () => {
  const { currentGroup } = useFamily();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const { stats, loading: statsLoading } = useFinancialStats(currentGroup?.id);
  const { profile } = useProfile();
  useGoals(currentGroup?.id); // Load goals for cache
  const { financialProfile, hasCompletedQuiz, getFinancialHealthLevel } = useFinancialProfile();
  const { isTransactionLimitReached } = useLimits();
  const { accounts, loading: accountsLoading, refetchAccounts } = useAccounts(currentGroup?.id);
  const { transactions } = useTransactions(currentGroup?.id);

  const handleUpdate = () => {
    refetchAccounts();
  };

  // Widget Visibility State
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    const saved = localStorage.getItem('dashboardWidgets');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      financialStatus: true,
      moneyLocation: true,
      monthAnalysis: true,
      attention: true,
      history: true,
      health: true,
      limits: true,
    };
  });

  const toggleWidget = (key: string) => {
    const newState = { ...visibleWidgets, [key]: !visibleWidgets[key] };
    setVisibleWidgets(newState);
    localStorage.setItem('dashboardWidgets', JSON.stringify(newState));
  };

  // Calculate current invoice total and next due date for status section
  const { currentInvoice, nextDueDate } = useMemo(() => {
    // Calculate total credit card balance (current invoice approximation)
    const creditCards = accounts.filter(a => a.tipo === 'cartao' && !a.parent_account_id);
    const invoiceTotal = creditCards.reduce((sum, card) => {
      // Include child cards
      const childCards = accounts.filter(a => a.parent_account_id === card.id);
      const childBalance = childCards.reduce((s, c) => s + Math.abs(Number(c.saldo_atual) || 0), 0);
      return sum + Math.abs(Number(card.saldo_atual) || 0) + childBalance;
    }, 0);

    // Find next critical due date from pending expenses
    const pendingExpenses = transactions
      ?.filter((t: any) => t.tipo === 'despesa' && !t.efetivada)
      .sort((a: any, b: any) => new Date(a.data_transacao).getTime() - new Date(b.data_transacao).getTime());

    let nextDue = null;
    if (pendingExpenses && pendingExpenses.length > 0) {
      const nextBill = pendingExpenses[0];
      const dueDate = new Date(nextBill.data_transacao);
      const today = new Date();
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 7) {
        nextDue = {
          label: `Próx. Vencimento`,
          amount: Number(nextBill.valor),
          daysUntil: Math.max(0, daysUntil),
        };
      }
    }

    return { currentInvoice: invoiceTotal, nextDueDate: nextDue };
  }, [accounts, transactions]);

  // Financial Health Section (Compact Banner)
  const FinancialHealthBanner = () => {
    if (!visibleWidgets.health) return null;

    return (
      <Card className="relative overflow-hidden border-none bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md">
        <div className="p-4 flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-white/15 rounded-full backdrop-blur-sm shrink-0">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-none mb-1">
                {hasCompletedQuiz
                  ? `Saúde ${getFinancialHealthLevel(financialProfile?.financial_health_score || 0).level}`
                  : "Sua Saúde Financeira"}
              </h3>
              <p className="text-xs text-blue-100/80 line-clamp-1">
                {hasCompletedQuiz ? "Continue assim!" : "Descubra seu perfil."}
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="secondary" className="h-8 text-xs bg-white text-indigo-600 hover:bg-blue-50 border-0 shadow-sm whitespace-nowrap px-3 shrink-0">
            <a href="/quiz-financeiro">
              {hasCompletedQuiz ? "Ver Score" : "Quiz"}
            </a>
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
            Olá{profile?.nome ? `, ${profile.nome}` : ''}! 🌟
          </h1>
          <p className="text-muted-foreground">
            Visão Geral Financeira
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PlanStatus />

          {/* Customization Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Personalizar Dashboard</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={visibleWidgets.financialStatus} onCheckedChange={() => toggleWidget('financialStatus')}>
                Estado Financeiro
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleWidgets.moneyLocation} onCheckedChange={() => toggleWidget('moneyLocation')}>
                Onde Está Meu Dinheiro
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleWidgets.monthAnalysis} onCheckedChange={() => toggleWidget('monthAnalysis')}>
                Análise do Mês
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleWidgets.attention} onCheckedChange={() => toggleWidget('attention')}>
                Atenção no Mês
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleWidgets.history} onCheckedChange={() => toggleWidget('history')}>
                Histórico
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={visibleWidgets.health} onCheckedChange={() => toggleWidget('health')}>
                Saúde Financeira
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleWidgets.limits} onCheckedChange={() => toggleWidget('limits')}>
                Avisos de Plano
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 shadow-sm" size="default" disabled={isTransactionLimitReached}>
                {isTransactionLimitReached ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span className="hidden sm:inline">Nova Transação</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <TransactionForm
                onSuccess={() => setShowTransactionForm(false)}
                onCancel={() => setShowTransactionForm(false)}
                groupId={currentGroup?.id}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* LIMITS BANNER */}
      {visibleWidgets.limits && <CollapsibleLimitsBanner />}

      {/* FINANCIAL HEALTH BANNER */}
      <FinancialHealthBanner />

      {/* SECTION 1: Estado Financeiro (Top Priority) */}
      {visibleWidgets.financialStatus && (
        <FinancialStatusSection
          stats={stats}
          loading={statsLoading}
          currentInvoice={currentInvoice}
          nextDueDate={nextDueDate}
        />
      )}

      {/* SECTION 2: Onde Está Meu Dinheiro (2-column grid) */}
      {visibleWidgets.moneyLocation && (
        <MoneyLocationSection
          accounts={accounts}
          loading={accountsLoading}
          groupId={currentGroup?.id}
          onUpdate={handleUpdate}
        />
      )}

      {/* SECTION 3: Análise do Mês (Charts only) */}
      {visibleWidgets.monthAnalysis && (
        <MonthAnalysisSection groupId={currentGroup?.id} />
      )}

      {/* SECTION 4 & 5: Grid for Attention + History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 4: Atenção no Mês (Action Required) */}
        {visibleWidgets.attention && (
          <AttentionSection
            groupId={currentGroup?.id}
            stats={stats}
            loading={statsLoading}
          />
        )}

        {/* SECTION 5: Histórico (Recent Transactions) */}
        {visibleWidgets.history && (
          <HistorySection
            groupId={currentGroup?.id}
            limit={6}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
