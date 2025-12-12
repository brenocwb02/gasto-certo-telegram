import { useState } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LimitsBanner } from "@/components/dashboard/LimitsBanner";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { BudgetSummary } from "@/components/dashboard/BudgetSummary";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
    Info,
    Bot,
    Sparkles
} from "lucide-react";
import { useLimits } from "@/hooks/useLimits";

const DashboardNew = () => {
    const { currentGroup } = useFamily();
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const { stats, loading: statsLoading } = useFinancialStats(currentGroup?.id);
    const { profile } = useProfile();
    const { goals, loading: goalsLoading } = useGoals(currentGroup?.id);
    const { financialProfile, hasCompletedQuiz, getFinancialHealthLevel } = useFinancialProfile();
    const { isTransactionLimitReached } = useLimits();
    const currentMonth = new Date();

    // Insights IA Section (Clean Version)
    const AIInsightsSection = () => {
        const insights = [];

        if (stats.trend > 3) {
            insights.push({
                icon: Lightbulb,
                type: "success",
                title: "Economia detectada!",
                message: `Você economizou este mês comparado ao anterior. Continue assim!`,
                borderColor: "border-l-green-500"
            });
        }

        if (stats.monthlyExpenses > stats.monthlyIncome) {
            insights.push({
                icon: AlertTriangle,
                type: "warning",
                title: "Atenção aos gastos",
                message: "Suas despesas estão acima das receitas este mês. Considere revisar seu orçamento.",
                borderColor: "border-l-orange-500"
            });
        }

        if (goals.length === 0) {
            insights.push({
                icon: Target,
                type: "info",
                title: "Crie suas metas",
                message: "Você ainda não tem metas financeiras. Que tal criar uma meta para Fundo de Emergência?",
                borderColor: "border-l-blue-500"
            });
        }

        if (insights.length === 0) {
            insights.push({
                icon: Sparkles,
                type: "info",
                title: "Tudo certo!",
                message: "Suas finanças estão organizadas. Continue registrando suas transações regularmente.",
                borderColor: "border-l-blue-500"
            });
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="h-5 w-5 text-primary" />
                        Insights Inteligentes
                    </CardTitle>
                    <CardDescription>Recomendações personalizadas para você</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {insights.slice(0, 3).map((insight, idx) => (
                        <div key={idx} className={`border-l-4 ${insight.borderColor} bg-muted/30 p-4 rounded-r-lg`}>
                            <div className="flex items-start gap-3">
                                <insight.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.message}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    };

    // Financial Health + Goals Combined (Clean Version)
    const HealthAndGoalsSection = () => {
        const score = financialProfile?.financial_health_score || 0;
        const healthLevel = hasCompletedQuiz ? getFinancialHealthLevel(score) : null;

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Heart className="h-5 w-5 text-primary" />
                        Saúde Financeira
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Health Score */}
                    {!hasCompletedQuiz || !healthLevel ? (
                        <div className="text-center py-6">
                            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <h3 className="font-semibold mb-2">Descubra sua Saúde Financeira</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Faça nosso quiz e receba recomendações personalizadas.
                            </p>
                            <Button asChild className="w-full">
                                <a href="/quiz-financeiro">
                                    Fazer Quiz <ArrowRight className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="text-3xl font-bold text-primary">{score}</div>
                                    <div className="text-sm text-muted-foreground">/ 100</div>
                                </div>
                                <Badge className={`${healthLevel.bgColor} ${healthLevel.color} border-0`}>
                                    {healthLevel.level}
                                </Badge>
                            </div>
                            <Progress value={score} className="h-2" />
                            <Button asChild variant="outline" className="w-full" size="sm">
                                <a href="/quiz-financeiro">
                                    Refazer Quiz <ArrowRight className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    )}

                    {/* Goals Summary */}
                    <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Suas Metas
                            </h4>
                            <Button variant="ghost" size="sm" asChild>
                                <a href="/goals">Ver todas</a>
                            </Button>
                        </div>

                        {goalsLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-2 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : goals.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground mb-3">Nenhuma meta criada</p>
                                <Button variant="outline" size="sm" className="w-full" asChild>
                                    <a href="/goals">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Criar Meta
                                    </a>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {goals.slice(0, 2).map((goal) => {
                                    const percentage = Number(goal.valor_meta) > 0
                                        ? (Number(goal.valor_atual) / Number(goal.valor_meta)) * 100
                                        : 0;

                                    return (
                                        <div key={goal.id} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium truncate flex-1">{goal.titulo}</span>
                                                <span className="text-sm font-semibold text-primary ml-2">{percentage.toFixed(0)}%</span>
                                            </div>
                                            <Progress value={Math.min(percentage, 100)} className="h-2" />
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(goal.valor_atual))}
                                                </span>
                                                <span>
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(goal.valor_meta))}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
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

            {/* Stats Cards - KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
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

            {/* Main Content - OPTIMIZED GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Insights IA */}
                    <AIInsightsSection />

                    {/* Financial Chart */}
                    <FinancialChart groupId={currentGroup?.id} />

                    {/* Recent Transactions */}
                    <RecentTransactions limit={5} groupId={currentGroup?.id} />
                </div>

                {/* Right Sidebar - 1/3 width */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Health + Goals Combined */}
                    <HealthAndGoalsSection />

                    {/* Quick Actions */}
                    <QuickActions />

                    {/* Budget Summary */}
                    <BudgetSummary month={currentMonth} groupId={currentGroup?.id} />
                </div>
            </div>
        </div>
    );
};

export default DashboardNew;
