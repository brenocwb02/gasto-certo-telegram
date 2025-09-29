import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { BudgetSummary } from "@/components/dashboard/BudgetSummary";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useFinancialStats, useProfile, useGoals } from "@/hooks/useSupabaseData";
import { useSubscription } from "@/hooks/useSubscription";
import { LicenseStatus } from "@/components/LicenseGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Sparkles,
  Plus
} from "lucide-react";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const { stats, loading: statsLoading } = useFinancialStats();
  const { profile } = useProfile();
  const { goals, loading: goalsLoading } = useGoals();
  const { isPremium, loading: subscriptionLoading } = useSubscription();

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
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      isOverTarget ? 'bg-expense' : 'bg-primary'
                    }`}
                    style={{width: `${Math.min(percentage, 100)}%`}}
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
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col sm:pl-14">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          {/* Welcome Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Bem-vindo ao Zac - Boas Contas{profile?.nome ? `, ${profile.nome}` : ''}! 👋
                </h1>
                <p className="text-muted-foreground">Controle financeiro familiar com propósito - Aqui está o resumo das suas finanças hoje</p>
              </div>
              <div className="flex items-center gap-3">
                <LicenseStatus />
                <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Nova Transação
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <TransactionForm 
                      onSuccess={() => setShowTransactionForm(false)}
                      onCancel={() => setShowTransactionForm(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
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

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              <FinancialChart />
              <RecentTransactions limit={5} />
            </div>
            
            {/* Sidebar Column */}
            <div className="lg:col-span-1 space-y-6">
              <QuickActions />
              {!subscriptionLoading && !isPremium && (
                <Card className="financial-card bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Sparkles className="h-5 w-5" />
                      Desbloqueie o Poder da IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Assine o Premium e registre despesas com uma simples mensagem no Telegram, como "gastei 50 reais no mercado".
                    </p>
                    <Button asChild className="w-full">
                      <NavLink to="/checkout">Fazer Upgrade Agora</NavLink>
                    </Button>
                  </CardContent>
                </Card>
              )}
              <BudgetSummary />
              <GoalsSection />
            </div>
          </div>
          
        </main>
      </div>
    </div>
  );
};

export default Index;


