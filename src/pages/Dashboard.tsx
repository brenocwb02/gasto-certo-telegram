import { useState } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LimitsBanner } from "@/components/dashboard/LimitsBanner";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
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
  AlertCircle,
  Lock
} from "lucide-react";
import { useLimits } from "@/hooks/useLimits";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Dashboard = () => {
  const { currentGroup } = useFamily();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const { stats, loading: statsLoading } = useFinancialStats(currentGroup?.id);
  const { profile } = useProfile();
  const { goals, loading: goalsLoading } = useGoals(currentGroup?.id);
  const { financialProfile, hasCompletedQuiz, getFinancialHealthLevel } = useFinancialProfile();
  const {
    isTransactionLimitReached,
    transactionUsage,
    transactionLimit,
    plan
  } = useLimits();
  const currentMonth = new Date();

  const FinancialHealthSection = () => {
    if (!hasCompletedQuiz) {
      return (
        <Card className="financial-card">
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
              Faça nosso quiz e receba um score personalizado com recomendações para melhorar suas finanças.
            </p>
            <Button asChild className="w-full">
              <a href="/quiz-financeiro">
                Fazer Quiz
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      );
    }

    const score = financialProfile?.financial_health_score || 0;
    const healthLevel = getFinancialHealthLevel(score);

    return (
      <Card className="financial-card">
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

  const GoalsSection = () => (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle>Metas Atuais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="text-center py-4">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma meta criada.</p>
          </div>
        ) : (
          goals.slice(0, 3).map((goal) => {
            const percentage = Number(goal.valor_meta) > 0
              ? (Number(goal.valor_atual) / Number(goal.valor_meta)) * 100
              : 0;
            const isOverTarget = percentage > 100;

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    {goal.titulo}
                  </span>
                  <span className={`text-sm font-medium ${isOverTarget ? 'text-expense' : 'text-primary'}`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${isOverTarget ? 'bg-expense' : 'bg-primary'
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
              change="+5,2% vs mês anterior"
              changeType="positive"
              icon={TrendingUp}
              trend={5}
            />
            <StatsCard
              title="Despesas do Mês"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyExpenses)}
              change="-8,1% vs mês anterior"
              changeType="positive"
              icon={TrendingDown}
              trend={8}
            />
            <StatsCard
              title="Economia"
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlySavings)}
              change="Meta: 60% atingida"
              changeType="neutral"
              icon={Target}
              trend={60}
            />
          </>
        )}
      </div>

      {/* Main Dashboard Grid - Mobile First */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Quick Actions - First on Mobile */}
        <div className="lg:hidden">
          <QuickActions />
        </div>

        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <FinancialChart groupId={currentGroup?.id} />
          <RecentTransactions limit={5} groupId={currentGroup?.id} />
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          <FinancialHealthSection />
          {/* Quick Actions - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <QuickActions />
          </div>
          <BudgetSummary month={currentMonth} groupId={currentGroup?.id} />
          <GoalsSection />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
