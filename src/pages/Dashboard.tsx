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
import { useFinancialStats, useProfile, useGoals, useFinancialProfile } from "@/hooks/useSupabaseData";
import { PlanStatus } from "@/components/PlanGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { useFamily } from "@/hooks/useFamily";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  Plus,
  Heart,
  Award,
  ArrowRight,
  Lock,
  Lightbulb,
  AlertTriangle,
  Bot,
  Sparkles
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
  const currentMonth = new Date();

  const [isHealthVisible, setIsHealthVisible] = useState(() => {
    return localStorage.getItem('hideHealthWidget') !== 'true';
  });

  const FinancialHealthSection = () => {
    if (!isHealthVisible) return null;

    const handleDismiss = () => {
      setIsHealthVisible(false);
      localStorage.setItem('hideHealthWidget', 'true');
    };

    if (!hasCompletedQuiz) {
      return (
        <Card className="financial-card relative group">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDismiss}
          >
            <span className="sr-only">Fechar</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </Button>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Saúde Financeira
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-6">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Descubra sua Saúde Financeira</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Faça nosso quiz e receba um score personalizado com recomendações.
            </p>
            <Button asChild className="w-full">
              <a href="/quiz-financeiro">Fazer Quiz <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </CardContent>
        </Card>
      );
    }

    const healthLevel = getFinancialHealthLevel(financialProfile?.financial_health_score || 0);

    return (
      <Card className="financial-card relative group">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDismiss}
        >
          <span className="sr-only">Fechar</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </Button>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Saúde Financeira
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${healthLevel.bgColor} ${healthLevel.color} mb-2`}>
              <Heart className="h-4 w-4 mr-1" />
              {healthLevel.level}
            </div>
          </div>

          <Button asChild variant="outline" className="w-full">
            <a href="/quiz-financeiro">
              Ver Detalhes
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  };
  // Insights IA Section
  const AIInsightsSection = () => {
    const insights = [];

    if (stats.savingsTrend > 0) {
      // Using savingsTrend as proxy for "Scenario Improved"
      // Or I can use monthlySavings > 0?
      // Let's use the exact logic from DashboardNew but adapted to available stats
    }
    // Actually, let's copy the logic exactly but adapt variables:
    // stats.trend in DashboardNew was the generic trend.
    // In Dashboard.tsx we have stats.savingsTrend, stats.incomeTrend, stats.expenseTrend.

    // Logic 1: Savings improved
    if (stats.savingsTrend > 5) {
      insights.push({
        icon: Lightbulb,
        type: "success",
        title: "Economia detectada!",
        message: `Sua economia cresceu ${stats.savingsTrend.toFixed(1)}% comparado ao mês anterior. Continue assim!`,
        borderColor: "border-l-green-500"
      });
    }

    // Logic 2: High Expenses (Expenses > Income)
    const isNegativeMonth = stats.monthlyExpenses > stats.monthlyIncome;
    const isNegativeBalance = stats.currentBalance < 0;

    if (isNegativeBalance) {
      insights.push({
        icon: AlertTriangle,
        type: "warning",
        title: "Saldo Negativo",
        message: "Seu saldo total está negativo. É importante priorizar o pagamento de dívidas.",
        borderColor: "border-l-red-500"
      });
    } else if (isNegativeMonth) {
      insights.push({
        icon: AlertTriangle,
        type: "warning",
        title: "Atenção aos gastos",
        message: "Suas despesas estão acima das receitas este mês. Considere revisar seu orçamento.",
        borderColor: "border-l-orange-500"
      });
    }

    // Logic 3: No Goals
    if (goals.length === 0 && !goalsLoading) {
      insights.push({
        icon: Target,
        type: "info",
        title: "Crie suas metas",
        message: "Você ainda não tem metas financeiras. Que tal criar uma meta para Fundo de Emergência?",
        borderColor: "border-l-blue-500"
      });
    }

    // Default
    if (insights.length === 0) {
      insights.push({
        icon: Sparkles,
        type: "info",
        title: "Tudo sob controle",
        message: "Suas finanças estão equilibradas. Continue registrando suas transações.",
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
    <Card className="financial-card h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas Atuais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        {goalsLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))
        ) : goals.length === 0 ? (
          <div className="text-center py-6">
            <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Nenhuma meta definida.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/metas">Criar Meta</a>
            </Button>
          </div>
        ) : (
          goals.slice(0, 3).map((goal) => {
            const percentage = Number(goal.valor_meta) > 0
              ? (Number(goal.valor_atual) / Number(goal.valor_meta)) * 100
              : 0;
            const isOverTarget = percentage >= 100;
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium truncate">{goal.titulo}</span>
                  <span className="text-muted-foreground">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${isOverTarget ? 'bg-success' : 'bg-primary'
                      }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Welcome Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Olá{profile?.nome ? `, ${profile.nome}` : ''}! 👋
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {currentGroup ? `Resumo do grupo: ${currentGroup.name}` : 'Resumo das suas finanças hoje'}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <PlanStatus />
            <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" disabled={isTransactionLimitReached}>
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

        {/* Limit Warnings */}
        <LimitsBanner />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="financial-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatsCard
              title="Saldo Total"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalBalance)}
              change={`${stats.trend > 0 ? '+' : ''}${stats.trend.toFixed(1)}% vs mês anterior`}
              changeType={stats.trend > 0 ? "positive" : "negative"}
              icon={Wallet}
              trend={Math.abs(stats.trend)}
            />
            <StatsCard
              title="Receitas do Mês"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyIncome)}
              change={`${stats.incomeTrend > 0 ? '+' : ''}${stats.incomeTrend.toFixed(1)}% vs mês anterior`}
              changeType={stats.incomeTrend >= 0 ? "positive" : "negative"}
              icon={TrendingUp}
              trend={Math.abs(stats.incomeTrend)}
            />
            <StatsCard
              title="Despesas do Mês"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyExpenses)}
              change={`${stats.expenseTrend > 0 ? '+' : ''}${stats.expenseTrend.toFixed(1)}% vs mês anterior`}
              changeType={stats.expenseTrend <= 0 ? "positive" : "negative"}
              icon={TrendingDown}
              trend={Math.abs(stats.expenseTrend)}
            />
            <StatsCard
              title="Economia"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlySavings)}
              change={`${stats.savingsTrend > 0 ? '+' : ''}${stats.savingsTrend.toFixed(1)}% vs mês anterior`}
              changeType={stats.savingsTrend >= 0 ? "positive" : "neutral"}
              icon={Target}
              trend={Math.abs(stats.savingsTrend)}
            />
          </>
        )}
      </div>

      {/* AI Insights Section */}
      <AIInsightsSection />

      {/* Main Dashboard Grid - Mobile First */}
      {/* Charts Row - Split 50/50 for balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CashFlowForecast groupId={currentGroup?.id} />
        <FinancialChart groupId={currentGroup?.id} />
      </div>

      {/* Details Row - Main Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column - Transactions & Tracking */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tracking Grid (Budget & Goals) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BudgetSummary month={currentMonth} groupId={currentGroup?.id} />
            <GoalsSection />
          </div>

          <RecentTransactions limit={5} groupId={currentGroup?.id} />
        </div>

        {/* Sidebar Column - Widgets */}
        <div className="lg:col-span-1 space-y-6 h-full flex flex-col">
          {/* Quick Actions - Hidden on mobile, shown on desktop - Priority 1 */}
          <div className="hidden lg:block">
            <QuickActions />
          </div>

          <FinancialHealthSection />
          {/* Removed Budget and Goals from here */}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
