import { useState } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LimitsBanner } from "@/components/dashboard/LimitsBanner";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { CashFlowForecast } from "@/components/dashboard/CashFlowForecast";
import { BudgetSummary } from "@/components/dashboard/BudgetSummary";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFinancialStats, useProfile, useGoals, useFinancialProfile, useAccounts } from "@/hooks/useSupabaseData";
import { PlanStatus } from "@/components/PlanGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { UpcomingBillsWidget } from "@/components/dashboard/UpcomingBillsWidget";
import { CreditCardWidget } from "@/components/dashboard/CreditCardWidget";
import { useFamily } from "@/hooks/useFamily";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Target,
  Plus,
  Heart,
  Lock,
  Lightbulb,
  AlertTriangle,
  Bot,
  Sparkles,
  Settings2
} from "lucide-react";
import { useLimits } from "@/hooks/useLimits";

const Dashboard = () => {
  const { currentGroup } = useFamily();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const { stats, loading: statsLoading } = useFinancialStats(currentGroup?.id);
  const { profile } = useProfile();
  const { goals, loading: goalsLoading } = useGoals(currentGroup?.id);
  const { financialProfile, hasCompletedQuiz, getFinancialHealthLevel } = useFinancialProfile();
  const { isTransactionLimitReached } = useLimits();
  const { accounts, loading: accountsLoading } = useAccounts(currentGroup?.id);
  const currentMonth = new Date();

  // Widget Visibility State
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    const saved = localStorage.getItem('dashboardWidgets');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      stats: true,
      charts: true,
      creditCards: true,
      upcomingBills: true,
      recentTransactions: true,
      goals: true,
      insights: true,
      health: true,
      budget: true,
      quickActions: true,
      limits: true // Visible by default for conversion
    };
  });

  const toggleWidget = (key: string) => {
    const newState = { ...visibleWidgets, [key]: !visibleWidgets[key] };
    setVisibleWidgets(newState);
    localStorage.setItem('dashboardWidgets', JSON.stringify(newState));
  };

  const FinancialHealthSection = () => {
    if (!visibleWidgets.health) return null;

    // Compact Widget
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

  const CreditCardsSection = () => {
    if (accountsLoading) {
      return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>;
    }

    // Only show PRINCIPAL cards (without parent_account_id)
    // Additional cards are included in the principal's invoice, so no need to display separately
    const creditCards = accounts.filter(a => a.tipo === 'cartao' && !a.parent_account_id);

    if (creditCards.length === 0) return null;

    return (
      <div className="space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
          <CreditCard className="h-4 w-4" />
          Meus Cartões
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          {creditCards.map(card => (
            <CreditCardWidget
              key={card.id}
              account={card}
              compact={true}
              groupId={currentGroup?.id}
              allAccounts={accounts}
            />
          ))}
        </div>
      </div>
    );
  };

  const AIInsightsSection = () => {
    const insights = [];

    if (statsLoading || !stats) return null;

    if (stats.savingsTrend > 5) {
      insights.push({
        icon: Lightbulb,
        type: "success",
        title: "Economia detectada!",
        message: `Sua economia cresceu ${stats.savingsTrend.toFixed(1)}% comparado ao mês anterior.`,
        borderColor: "border-l-green-500"
      });
    }

    const isNegativeMonth = stats.monthlyExpenses > stats.monthlyIncome;
    const isNegativeBalance = stats.totalBalance < 0;

    if (isNegativeBalance) {
      insights.push({
        icon: AlertTriangle,
        type: "warning",
        title: "Saldo Negativo",
        message: "Seu saldo total está negativo. Priorize o pagamento de dívidas.",
        borderColor: "border-l-red-500"
      });
    } else if (isNegativeMonth) {
      insights.push({
        icon: AlertTriangle,
        type: "warning",
        title: "Atenção aos gastos",
        message: "Suas despesas estão acima das receitas este mês.",
        borderColor: "border-l-orange-500"
      });
    }

    if (goals.length === 0 && !goalsLoading) {
      insights.push({
        icon: Target,
        type: "info",
        title: "Crie suas metas",
        message: "Que tal criar uma meta para Fundo de Emergência?",
        borderColor: "border-l-blue-500"
      });
    }

    if (insights.length === 0) {
      insights.push({
        icon: Sparkles,
        type: "info",
        title: "Tudo sob controle",
        message: "Suas finanças estão equilibradas. Continue assim!",
        borderColor: "border-l-blue-500"
      });
    }

    return (
      <Card className="mb-6 border-l-4 border-l-primary shadow-sm bg-gradient-to-r from-background to-muted/20">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-primary">
            <Bot className="h-4 w-4" />
            Insights Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-3">
            {insights.slice(0, 2).map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={`p-1.5 rounded-full bg-muted mt-0.5 ${insight.type === 'warning' ? 'text-orange-500 bg-orange-100' : 'text-blue-500 bg-blue-100'}`}>
                  <insight.icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const GoalsSection = () => (
    <Card className="financial-card h-full flex flex-col border-none shadow-sm bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Metas Atuais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        {goalsLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))
        ) : goals.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">Nenhuma meta definida.</p>
            <Button variant="outline" size="sm" asChild><a href="/metas">Criar Meta</a></Button>
          </div>
        ) : (
          goals.slice(0, 3).map((goal) => {
            const percentage = Number(goal.valor_meta) > 0 ? (Number(goal.valor_atual) / Number(goal.valor_meta)) * 100 : 0;
            return (
              <div key={goal.id} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium truncate max-w-[150px]">{goal.titulo}</span>
                  <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${percentage >= 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Olá{profile?.nome ? `, ${profile.nome}` : ''}! 🌟
          </h1>
          <p className="text-muted-foreground text-lg">
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
              <DropdownMenuCheckboxItem checked={visibleWidgets.stats} onCheckedChange={() => toggleWidget('stats')}>
                Saldo e Resumo
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleWidgets.charts} onCheckedChange={() => toggleWidget('charts')}>
                Gráficos
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleWidgets.creditCards} onCheckedChange={() => toggleWidget('creditCards')}>
                Cartões de Crédito
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleWidgets.upcomingBills} onCheckedChange={() => toggleWidget('upcomingBills')}>
                Contas a Pagar
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleWidgets.recentTransactions} onCheckedChange={() => toggleWidget('recentTransactions')}>
                Transações Recentes
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleWidgets.quickActions} onCheckedChange={() => toggleWidget('quickActions')}>
                Ações Rápidas
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleWidgets.goals} onCheckedChange={() => toggleWidget('goals')}>
                Metas
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleWidgets.insights} onCheckedChange={() => toggleWidget('insights')}>
                Insights IA
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={visibleWidgets.health} onCheckedChange={() => toggleWidget('health')}>
                Saúde Financeira
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
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

      {visibleWidgets.limits && <LimitsBanner />}

      {/* TOP: STATS CARDS */}
      {visibleWidgets.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="financial-card"><CardContent className="p-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
            ))
          ) : (
            <>
              <StatsCard title="Saldo Total" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalBalance)} change={`${stats.trend > 0 ? '+' : ''}${stats.trend.toFixed(1)}%`} changeType={stats.trend > 0 ? "positive" : "negative"} icon={Wallet} trend={Math.abs(stats.trend)} />
              <StatsCard title="Receitas" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyIncome)} change={`${stats.incomeTrend > 0 ? '+' : ''}${stats.incomeTrend.toFixed(1)}%`} changeType={stats.incomeTrend >= 0 ? "positive" : "negative"} icon={TrendingUp} trend={Math.abs(stats.incomeTrend)} />
              <StatsCard title="Despesas" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyExpenses)} change={`${stats.expenseTrend > 0 ? '+' : ''}${stats.expenseTrend.toFixed(1)}%`} changeType={stats.expenseTrend <= 0 ? "positive" : "negative"} icon={TrendingDown} trend={Math.abs(stats.expenseTrend)} />
              <StatsCard title="Economia" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlySavings)} change={`${stats.savingsTrend > 0 ? '+' : ''}${stats.savingsTrend.toFixed(1)}%`} changeType={stats.savingsTrend >= 0 ? "positive" : "neutral"} icon={Target} trend={Math.abs(stats.savingsTrend)} />
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT COLUMN (2/3): Main Data */}
        <div className="lg:col-span-2 space-y-6">
          {visibleWidgets.charts && (
            <div className="grid grid-cols-1 gap-6">
              <FinancialChart groupId={currentGroup?.id} />
              <CashFlowForecast groupId={currentGroup?.id} />
            </div>
          )}

          {visibleWidgets.recentTransactions && (
            <RecentTransactions limit={10} groupId={currentGroup?.id} />
          )}
        </div>

        {/* RIGHT COLUMN (1/3): Widgets & Sidebar */}
        <div className="space-y-6">
          {visibleWidgets.health && <FinancialHealthSection />}

          {visibleWidgets.creditCards && <CreditCardsSection />}

          {visibleWidgets.quickActions && <QuickActions />}

          {visibleWidgets.upcomingBills && <UpcomingBillsWidget groupId={currentGroup?.id} />}

          {visibleWidgets.insights && <AIInsightsSection />}

          {visibleWidgets.goals && <GoalsSection />}

          {visibleWidgets.budget && <BudgetSummary month={currentMonth} groupId={currentGroup?.id} />}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
