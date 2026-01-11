import { useEffect, useState } from "react";
import { DashboardCard, CardContent, CardHeader, CardTitle } from "@/components/dashboard/DashboardCard";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BudgetItem {
    category: string;
    spent: number;
    limit: number;
    percentage: number;
}

interface BudgetProgressWidgetProps {
    groupId?: string;
}

export const BudgetProgressWidget = ({ groupId }: BudgetProgressWidgetProps) => {
    const [budgets, setBudgets] = useState<BudgetItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBudgets = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

                // Fetch budgets
                let budgetQuery = supabase
                    .from('budgets')
                    .select('categoria, valor_limite')
                    .gte('mes_referencia', startOfMonth.slice(0, 7))
                    .lte('mes_referencia', endOfMonth.slice(0, 7));

                if (groupId) {
                    budgetQuery = budgetQuery.eq('grupo_familiar_id', groupId);
                }

                const { data: budgetData, error: budgetError } = await budgetQuery;

                if (budgetError) throw budgetError;

                if (!budgetData || budgetData.length === 0) {
                    setBudgets([]);
                    setLoading(false);
                    return;
                }

                // Fetch transactions for the month
                let txQuery = supabase
                    .from('transactions')
                    .select('categoria, valor')
                    .eq('tipo', 'despesa')
                    .gte('data', startOfMonth)
                    .lte('data', endOfMonth);

                if (groupId) {
                    txQuery = txQuery.eq('grupo_familiar_id', groupId);
                }

                const { data: txData, error: txError } = await txQuery;

                if (txError) throw txError;

                // Calculate spending per category
                const spendingByCategory: Record<string, number> = {};
                (txData || []).forEach((tx) => {
                    const cat = tx.categoria || 'Outros';
                    spendingByCategory[cat] = (spendingByCategory[cat] || 0) + Math.abs(Number(tx.valor));
                });

                // Map budgets with spending
                const mapped: BudgetItem[] = budgetData.map((b) => {
                    const spent = spendingByCategory[b.categoria] || 0;
                    const limit = Number(b.valor_limite);
                    const percentage = limit > 0 ? (spent / limit) * 100 : 0;
                    return {
                        category: b.categoria,
                        spent,
                        limit,
                        percentage: Math.min(percentage, 100),
                    };
                });

                // Sort by percentage descending (most used first)
                mapped.sort((a, b) => b.percentage - a.percentage);

                setBudgets(mapped.slice(0, 4)); // Show top 4
            } catch (err) {
                console.error('Error fetching budgets:', err);
                setBudgets([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBudgets();
    }, [groupId]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const getProgressColor = (percentage: number) => {
        if (percentage >= 90) return "bg-rose-500";
        if (percentage >= 70) return "bg-amber-500";
        return "bg-emerald-500";
    };

    if (loading) {
        return (
            <DashboardCard className="border-none shadow-md">
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-2 w-full" />
                        </div>
                    ))}
                </CardContent>
            </DashboardCard>
        );
    }

    if (budgets.length === 0) {
        return (
            <DashboardCard className="border-none shadow-md bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <CardContent className="p-6 text-center">
                    <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground mb-3">Nenhum orçamento configurado</p>
                    <Button variant="outline" size="sm" asChild>
                        <a href="/orcamento">Configurar Orçamento</a>
                    </Button>
                </CardContent>
            </DashboardCard>
        );
    }

    return (
        <DashboardCard className="border-none shadow-md">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-violet-500" />
                    Orçamento Mensal
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
                    <a href="/orcamento" className="flex items-center gap-1">
                        Ver Todos <ChevronRight className="h-3 w-3" />
                    </a>
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {budgets.map((budget, index) => (
                    <div key={index} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate max-w-[120px]">{budget.category}</span>
                            <span className="text-xs text-muted-foreground">
                                {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                            </span>
                        </div>
                        <div className="relative">
                            <Progress
                                value={budget.percentage}
                                className="h-2"
                            />
                            <div
                                className={cn(
                                    "absolute top-0 left-0 h-2 rounded-full transition-all",
                                    getProgressColor(budget.percentage)
                                )}
                                style={{ width: `${budget.percentage}%` }}
                            />
                        </div>
                        <p className={cn(
                            "text-xs font-medium text-right",
                            budget.percentage >= 90 ? "text-rose-500" :
                                budget.percentage >= 70 ? "text-amber-500" : "text-emerald-500"
                        )}>
                            {budget.percentage.toFixed(0)}%
                        </p>
                    </div>
                ))}
            </CardContent>
        </DashboardCard>
    );
};
