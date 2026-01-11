import { useState } from "react";
import { useFamily } from "@/hooks/useFamily";
import { useFinancialStats, useProfile, useAccounts } from "@/hooks/useSupabaseData";
import { useLimits } from "@/hooks/useLimits";

// New Enhanced Components
import { HeroSummaryCards } from "@/components/dashboard/HeroSummaryCards";
import { BudgetSummary } from "@/components/dashboard/BudgetSummary";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";
import { QuickActionsBar } from "@/components/dashboard/QuickActionsBar";
import { AccountsWidget } from "@/components/dashboard/AccountsWidget";
import { Rule503020Widget } from "@/components/dashboard/Rule503020Widget";
import { UpcomingBillsWidget } from "@/components/dashboard/UpcomingBillsWidget";
import { DashboardCard, CardContent, CardHeader, CardTitle } from "@/components/dashboard/DashboardCard";

// Existing Components
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { CreditCardWidget } from "@/components/dashboard/CreditCardWidget";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { CollapsibleLimitsBanner } from "@/components/dashboard/CollapsibleLimitsBanner";
import { PlanStatus } from "@/components/PlanGuard";
import { TransactionForm } from "@/components/forms/TransactionForm";

import { Button } from "@/components/ui/button";
import { WelcomeWizard } from "@/components/onboarding/WelcomeWizard"; // Import New Onboarding Wizard
// Card removed
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Lock, Heart, CreditCard, Lightbulb, ChevronRight, Settings } from "lucide-react";

const defaultWidgets = {
  summary: true,
  charts: true,
  budget: true,
  recentTransactions: true,
  financialHealth: true,
  rule503020: true,
  quickActions: true,
  accounts: true,
  creditCards: true,
  alerts: true,
};

const Dashboard = () => {
  const { currentGroup } = useFamily();
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  // Customization State
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    const saved = localStorage.getItem('dashboard-widgets-preference');
    return saved ? JSON.parse(saved) : defaultWidgets;
  });

  const toggleWidget = (key: keyof typeof defaultWidgets) => {
    const newState = { ...visibleWidgets, [key]: !visibleWidgets[key] };
    setVisibleWidgets(newState);
    localStorage.setItem('dashboard-widgets-preference', JSON.stringify(newState));
  };

  const { stats, loading: statsLoading } = useFinancialStats(currentGroup?.id);
  const { profile } = useProfile();
  const { isTransactionLimitReached } = useLimits();
  const { accounts, loading: accountsLoading, refetchAccounts } = useAccounts(currentGroup?.id);

  const handleUpdate = () => {
    refetchAccounts();
  };

  // Filter credit cards (only principal cards, not additional)
  const creditCards = accounts.filter(a => {
    if (a.tipo !== 'cartao' || a.parent_account_id) return false;
    const hasBalance = Math.abs(a.saldo_atual) > 0;
    const hasLimitUsage = a.limite_credito && a.limite_credito > 0;
    return hasBalance || hasLimitUsage;
  });

  // Contextual CTA based on balance
  const isNegativeBalance = stats && stats.totalBalance < 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <WelcomeWizard /> {/* Automatic Category Setup for new users */}
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            Olá{profile?.nome ? `, ${profile.nome}` : ''}! 🌟
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Configurar Dashboard</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Personalizar Dashboard</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Resumo (Cards)</span>
                    <Button
                      variant={visibleWidgets.summary ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleWidget('summary')}
                    >
                      {visibleWidgets.summary ? "Visível" : "Oculto"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Gráfico de Categorias</span>
                    <Button
                      variant={visibleWidgets.charts ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleWidget('charts')}
                    >
                      {visibleWidgets.charts ? "Visível" : "Oculto"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Orçamento</span>
                    <Button
                      variant={visibleWidgets.budget ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleWidget('budget')}
                    >
                      {visibleWidgets.budget ? "Visível" : "Oculto"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Transações Recentes</span>
                    <Button
                      variant={visibleWidgets.recentTransactions ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleWidget('recentTransactions')}
                    >
                      {visibleWidgets.recentTransactions ? "Visível" : "Oculto"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Contas e Cartões</span>
                    <Button
                      variant={visibleWidgets.accounts ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleWidget('accounts')}
                    >
                      {visibleWidgets.accounts ? "Visível" : "Oculto"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </h1>
          <p className="text-muted-foreground text-lg">
            Visão Geral Financeira
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PlanStatus />
          <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 shadow-sm bg-brand-navy hover:bg-brand-navy/90 text-white" size="default" disabled={isTransactionLimitReached}>
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

      {/* Limits Banner */}
      <CollapsibleLimitsBanner />


      {/* SECTION 1: HERO SUMMARY CARDS */}
      {visibleWidgets.summary && <HeroSummaryCards stats={stats} loading={statsLoading} />}



      {/* Contextual CTA for Negative Balance */}
      {isNegativeBalance && visibleWidgets.alerts && (
        <DashboardCard className="border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 dark:border-rose-800">
          <CardContent className="p-4 flex items-center justify-between">
            {/* Content logic kept same */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-800/50 rounded-full">
                <Lightbulb className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="font-medium text-rose-700 dark:text-rose-300">Seu saldo está negativo</p>
                <p className="text-sm text-rose-600/80 dark:text-rose-400/80">Veja dicas para equilibrar suas finanças</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300" asChild>
              <a href="/reports">Ver Dicas <ChevronRight className="h-4 w-4 ml-1" /></a>
            </Button>
          </CardContent>
        </DashboardCard>
      )}

      {/* MAIN GRID: 2/3 Left + 1/3 Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT COLUMN (2/3): Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Chart */}
          {visibleWidgets.charts && <FinancialChart groupId={currentGroup?.id} />}

          {/* Budget Progress */}
          {visibleWidgets.budget && <BudgetSummary month={new Date()} groupId={currentGroup?.id} />}

          {/* Recent Transactions */}
          {visibleWidgets.recentTransactions && <RecentTransactions limit={5} groupId={currentGroup?.id} />}
        </div>

        {/* RIGHT COLUMN (1/3): Widgets */}
        <div className="space-y-4">
          {/* Financial Health Banner */}
          {visibleWidgets.financialHealth && (
            <DashboardCard>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 rounded-lg shrink-0">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-none mb-1 text-foreground">Sua Saúde Financeira</h3>
                    <p className="text-xs text-muted-foreground">Descubra seu perfil</p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                  <a href="/quiz-financeiro">Quiz</a>
                </Button>
              </CardContent>
            </DashboardCard>
          )}

          {/* 50/30/20 Rule Widget */}
          {visibleWidgets.rule503020 && <Rule503020Widget groupId={currentGroup?.id} />}

          {/* Quick Actions */}
          {visibleWidgets.quickActions && <QuickActionsBar groupId={currentGroup?.id} disabled={isTransactionLimitReached} />}

          {/* Upcoming Bills */}
          <UpcomingBillsWidget groupId={currentGroup?.id} />

          {/* Accounts Widget */}
          {visibleWidgets.accounts && <AccountsWidget groupId={currentGroup?.id} />}

          {/* Credit Cards */}
          {(visibleWidgets.creditCards && (accountsLoading || creditCards.length > 0)) && (
            accountsLoading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : (
              <DashboardCard>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-violet-500" />
                    Meus Cartões
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {creditCards.slice(0, 2).map(card => (
                    <CreditCardWidget
                      key={card.id}
                      account={card}
                      compact={true}
                      groupId={currentGroup?.id}
                      allAccounts={accounts}
                      onUpdate={handleUpdate}
                    />
                  ))}
                </CardContent>
              </DashboardCard>
            )
          )}

          {/* Alerts Widget */}
          {visibleWidgets.alerts && <AlertsWidget groupId={currentGroup?.id} totalBalance={stats?.totalBalance || 0} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
