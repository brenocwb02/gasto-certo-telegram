import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Target,
  MessageSquare,
  Bot,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
                <h1 className="text-3xl font-bold text-foreground">Bem-vindo de volta! 👋</h1>
                <p className="text-muted-foreground">Aqui está o resumo das suas finanças hoje</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  Telegram conectado
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Saldo Total"
              value="R$ 12.456,78"
              change="+12,3% vs mês anterior"
              changeType="positive"
              icon={Wallet}
              trend={12}
            />
            <StatsCard
              title="Receitas do Mês"
              value="R$ 8.520,00"
              change="+5,2% vs mês anterior"
              changeType="positive"
              icon={TrendingUp}
              trend={5}
            />
            <StatsCard
              title="Despesas do Mês"
              value="R$ 3.890,22"
              change="-8,1% vs mês anterior"
              changeType="positive"
              icon={TrendingDown}
              trend={8}
            />
            <StatsCard
              title="Economia"
              value="R$ 4.629,78"
              change="Meta: 60% atingida"
              changeType="neutral"
              icon={Target}
              trend={60}
            />
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
            <Card className="financial-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Meta: Alimentação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">R$ 650 / R$ 1.000</span>
                    <span className="text-sm font-medium text-primary">65%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-1000" style={{width: "65%"}}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">Faltam R$ 350 para atingir a meta</p>
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-warning" />
                  Meta: Transporte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">R$ 420 / R$ 500</span>
                    <span className="text-sm font-medium text-warning">84%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-warning h-2 rounded-full transition-all duration-1000" style={{width: "84%"}}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">Faltam R$ 80 para atingir a meta</p>
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card border-expense/20 bg-gradient-to-r from-expense/5 to-expense/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-expense" />
                  Meta: Lazer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">R$ 380 / R$ 300</span>
                    <span className="text-sm font-medium text-expense">127%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-expense h-2 rounded-full transition-all duration-1000" style={{width: "100%"}}></div>
                  </div>
                  <p className="text-xs text-expense">Meta excedida em R$ 80</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
