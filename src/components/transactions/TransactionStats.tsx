import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionStatsProps {
    receitas: number;
    despesas: number;
    saldo: number;
    loading?: boolean;
}

export function TransactionStats({ receitas, despesas, saldo, loading }: TransactionStatsProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(Math.abs(value));
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 rounded-2xl bg-muted/20 animate-pulse" />
                ))}
            </div>
        );
    }

    const isNegativeBalance = saldo < 0;

    // Colors matching HeroSummaryCards.tsx
    // Income: Blue
    // Expense: Rose
    // Balance: Emerald (Positive) / Rose (Negative)

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* RECEITAS - BLUE */}
            <DashboardCard className={cn(
                "relative overflow-hidden rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:shadow-md",
                "bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20"
            )}>
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                    </div>
                    {/* Optional trend badge could go here */}
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Receitas</p>
                <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(receitas)}
                </p>
            </DashboardCard>

            {/* DESPESAS - ROSE */}
            <DashboardCard className={cn(
                "relative overflow-hidden rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:shadow-md",
                "bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20"
            )}>
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-rose-500/20">
                        <TrendingDown className="h-5 w-5 text-rose-500" />
                    </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Despesas</p>
                <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(despesas)}
                </p>
            </DashboardCard>

            {/* SALDO - EMERALD (Positive) / ROSE (Negative) */}
            <DashboardCard className={cn(
                "relative overflow-hidden rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:shadow-md",
                "bg-gradient-to-br",
                isNegativeBalance
                    ? "from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/30"
                    : "from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30"
            )}>
                <div className="flex items-center justify-between mb-3">
                    <div className={cn(
                        "p-2 rounded-lg",
                        isNegativeBalance ? "bg-rose-500/20" : "bg-emerald-500/20"
                    )}>
                        <Wallet className={cn(
                            "h-5 w-5",
                            isNegativeBalance ? "text-rose-500" : "text-emerald-500"
                        )} />
                    </div>
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Saldo do Período</p>
                <p className={cn(
                    "text-2xl font-bold",
                    isNegativeBalance ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                )}>
                    {isNegativeBalance ? "-" : "+"}{formatCurrency(saldo)}
                </p>
            </DashboardCard>
        </div>
    );
}
