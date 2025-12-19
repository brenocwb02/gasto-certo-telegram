import { useState } from "react";
import { useFinancialStats, useProfile, useGoals, useFinancialProfile } from "@/hooks/useSupabaseData";
import { useFamily } from "@/hooks/useFamily";
import { useLimits } from "@/hooks/useLimits";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { CashFlowForecast } from "@/components/dashboard/CashFlowForecast";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Plus, Wallet, TrendingUp, TrendingDown, Target, Heart,
    ArrowRight, LayoutDashboard, Lock, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardBento() {
    const navigate = useNavigate();
    const { currentGroup } = useFamily();
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const { stats, loading: statsLoading } = useFinancialStats(currentGroup?.id);
    const { profile } = useProfile();
    const { goals, loading: goalsLoading } = useGoals(currentGroup?.id);
    const { hasCompletedQuiz, financialProfile } = useFinancialProfile();
    const { isTransactionLimitReached } = useLimits();

    // --- Widgets (Inline for prototype) ---

    const QuickActionsWidget = () => (
        <Card className="h-full bg-gradient-to-br from-background to-muted/50 border-input hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
                    <DialogTrigger asChild>
                        <Button className="w-full justify-start shadow-sm" disabled={isTransactionLimitReached}>
                            {isTransactionLimitReached ? <Lock className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                            Nova Transação
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

                <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/extrato">Extrato Completo</a>
                </Button>
            </CardContent>
        </Card>
    );

    const HealthWidget = () => (
        <Card className="h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Heart className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Heart className="h-4 w-4" /> Saúde Financeira
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!hasCompletedQuiz ? (
                    <div className="text-center py-2">
                        <Button size="sm" variant="secondary" asChild className="w-full">
                            <a href="/quiz-financeiro">Fazer Quiz</a>
                        </Button>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-1">
                            {financialProfile?.financial_health_score || 0}
                        </div>
                        <Badge variant="outline" className="mb-2">Excelente</Badge>
                        <Button size="sm" variant="ghost" className="w-full text-xs" asChild>
                            <a href="/quiz-financeiro">Ver Detalhes</a>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const GoalsWidget = () => (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                    <span className="flex items-center gap-2"><Target className="h-4 w-4" /> Metas</span>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                        <a href="/metas">Ver todas</a>
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {goalsLoading ? (
                    <Skeleton className="h-10 w-full" />
                ) : goals.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-4">Sem metas ativas</div>
                ) : (
                    goals.slice(0, 3).map(goal => {
                        const percentage = Number(goal.valor_meta) > 0 ? (Number(goal.valor_atual) / Number(goal.valor_meta)) * 100 : 0;
                        return (
                            <div key={goal.id} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="font-medium truncate max-w-[120px]">{goal.titulo}</span>
                                    <span>{percentage.toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${Math.min(percentage, 100)}%` }} />
                                </div>
                            </div>
                        )
                    })
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-4 p-4 md:p-8 pt-6 max-w-[1600px] mx-auto">
            {/* Header Navigation */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Dashboard Pro</h2>
                    <p className="text-muted-foreground">Visão geral do seu patrimônio (Modo Experimental).</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Clássico
                </Button>
            </div>

            {/* NEW LAYOUT: Header Stats Row + Content Grid */}

            {/* 1. STATUS ROW (Top) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Saldo Total"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalBalance)}
                    change={`${stats.trend > 0 ? '+' : ''}${stats.trend.toFixed(1)}%`}
                    changeType={stats.trend > 0 ? "positive" : "negative"}
                    icon={Wallet}
                    trend={Math.abs(stats.trend)}
                />
                <StatsCard
                    title="Receitas"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyIncome)}
                    change="Mês Atual"
                    changeType="positive"
                    icon={TrendingUp}
                    trend={0}
                />
                <StatsCard
                    title="Despesas"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyExpenses)}
                    change="Mês Atual"
                    changeType="negative"
                    icon={TrendingDown}
                    trend={0}
                />
                <StatsCard
                    title="Economia"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlySavings)}
                    change="Reserva"
                    changeType="neutral"
                    icon={Target}
                    trend={0}
                />
            </div>

            {/* 2. MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">

                {/* Left Column (Main Charts) - Spans 2 or 3 cols */}
                <div className="lg:col-span-2 xl:col-span-3 space-y-4">
                    {/* Forecast Chart */}
                    <CashFlowForecast groupId={currentGroup?.id} />

                    {/* Secondary Charts & Tables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FinancialChart groupId={currentGroup?.id} />
                        <RecentTransactions limit={5} groupId={currentGroup?.id} />
                    </div>
                </div>

                {/* Right Column (Sidebar Widgets) - Spans 1 col */}
                <div className="space-y-4">
                    <QuickActionsWidget />
                    <HealthWidget />
                    <GoalsWidget />
                </div>

            </div>
        </div>
    );
}
