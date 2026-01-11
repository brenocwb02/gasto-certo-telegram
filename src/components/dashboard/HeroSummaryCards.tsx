import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { InteractiveSummaryCard } from "@/components/dashboard/InteractiveSummaryCard";

interface HeroSummaryCardsProps {
    stats: {
        totalBalance: number;
        monthlyIncome: number;
        monthlyExpenses: number;
        monthlySavings: number;
        trend: number;
        incomeTrend: number;
        expenseTrend: number;
        savingsTrend: number;
    } | null;
    loading: boolean;
}

export const HeroSummaryCards = ({ stats, loading }: HeroSummaryCardsProps) => {
    if (loading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Skeleton className="h-40 md:col-span-1 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
            </div>
        );
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatTrend = (value: number) => {
        const formatted = Math.abs(value).toFixed(1);
        const clean = formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
        return `${value >= 0 ? '+' : '-'}${clean}%`;
    };

    const isNegativeBalance = stats.totalBalance < 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* HERO CARD - Saldo Total (Maior e mais destacado) */}
            <div
                className={cn(
                    "relative overflow-hidden rounded-2xl p-6 md:row-span-1",
                    "bg-gradient-to-br border shadow-lg transition-all duration-300 hover:shadow-xl",
                    isNegativeBalance
                        ? "from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/30"
                        : "from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30"
                )}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                        "p-3 rounded-xl",
                        isNegativeBalance ? "bg-rose-500/20" : "bg-emerald-500/20"
                    )}>
                        <Wallet className={cn(
                            "h-7 w-7",
                            isNegativeBalance ? "text-rose-500" : "text-emerald-500"
                        )} />
                    </div>
                    <span className={cn(
                        "text-xs font-semibold px-2 py-1 rounded-full",
                        stats.trend >= 0
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                    )}>
                        {formatTrend(stats.trend)}
                    </span>
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Total</p>
                <h2 className={cn(
                    "text-3xl md:text-4xl font-bold tracking-tight",
                    isNegativeBalance ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                )}>
                    {formatCurrency(stats.totalBalance)}
                </h2>
                <p className="text-xs text-muted-foreground mt-2">Todas as contas</p>
            </div>

            {/* Cards Secundários */}
            <InteractiveSummaryCard
                title="Receitas"
                value={stats.monthlyIncome}
                trend={stats.incomeTrend}
                icon={TrendingUp}
                variant="blue"
            />
            <InteractiveSummaryCard
                title="Despesas"
                value={stats.monthlyExpenses}
                trend={stats.expenseTrend}
                icon={TrendingDown}
                variant="danger"
            />
            <InteractiveSummaryCard
                title="Economia"
                value={stats.monthlySavings}
                trend={stats.savingsTrend}
                icon={PiggyBank}
                variant="purple"
            />
        </div>
    );
};
