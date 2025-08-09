import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useFinancialStats, useProfile, useGoals } from "@/hooks/useSupabaseData";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Target,
  MessageSquare,
  Bot,
  CheckCircle2,
  AlertCircle,
  Plus
} from "lucide-react";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const { stats, loading: statsLoading } = useFinancialStats();
  const { profile } = useProfile();
  const { goals, loading: goalsLoading } = useGoals();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isOpen={sidebarOpen} />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      <div className="lg:hidden">
        <Sidebar isOpen={false} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-6 space-y-6 animate-fade-in">
          {/* Welcome Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Bem-vindo de volta{profile?.nome ? `, ${profile.nome}` : ''}! 👋
                </h1>
                <p className="text-muted-foreground">Aqui está o resumo das suas finanças hoje</p>
              </div>
              <div className="flex items-center gap-3">
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
                <Badge variant="outline" className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  Telegram conectado
                </Badge>
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

          {/* Telegram Integration Status */}
          <Card className="financial-card border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                Integração Telegram
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">Bot conectado e ativo</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Envie uma mensagem para <strong>@GastoCertoBot</strong> para registrar transações
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>✨ 23 transações via Telegram este mês</span>
                    <span>⚡ Última atividade: há 2 horas</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Abrir Telegram
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial Chart - Takes 2 columns */}
            <div className="lg:col-span-2">
              <FinancialChart />
            </div>
            
            {/* Quick Actions */}
            <div>
              <QuickActions />
            </div>
          </div>

          {/* Recent Transactions */}
          <RecentTransactions />

          {/* Metas Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goalsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="financial-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : goals.length === 0 ? (
              <Card className="financial-card col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma meta criada</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie suas primeiras metas para acompanhar seus objetivos financeiros
                  </p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Meta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              goals.slice(0, 3).map((goal) => {
                const percentage = Number(goal.valor_meta) > 0 
                  ? (Number(goal.valor_atual) / Number(goal.valor_meta)) * 100 
                  : 0;
                const isOverTarget = percentage > 100;
                const remaining = Number(goal.valor_meta) - Number(goal.valor_atual);

                return (
                  <Card 
                    key={goal.id} 
                    className={`financial-card ${isOverTarget ? 'border-expense/20 bg-gradient-to-r from-expense/5 to-expense/10' : ''}`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {isOverTarget ? (
                          <AlertCircle className="h-4 w-4 text-expense" />
                        ) : percentage > 80 ? (
                          <Target className="h-4 w-4 text-warning" />
                        ) : (
                          <Target className="h-4 w-4 text-primary" />
                        )}
                        {goal.titulo}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(goal.valor_atual))} / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(goal.valor_meta))}
                          </span>
                          <span className={`text-sm font-medium ${
                            isOverTarget ? 'text-expense' : percentage > 80 ? 'text-warning' : 'text-primary'
                          }`}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${
                              isOverTarget ? 'bg-expense' : percentage > 80 ? 'bg-warning' : 'bg-primary'
                            }`}
                            style={{width: `${Math.min(percentage, 100)}%`}}
                          ></div>
                        </div>
                        <p className={`text-xs ${
                          isOverTarget ? 'text-expense' : 'text-muted-foreground'
                        }`}>
                          {isOverTarget 
                            ? `Meta excedida em ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(remaining))}`
                            : `Faltam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remaining)} para atingir a meta`
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
