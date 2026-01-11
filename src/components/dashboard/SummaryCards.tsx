import { Wallet, TrendingUp, CreditCard, CalendarClock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
    stats: any;
    loading: boolean;
}

export const SummaryCards = ({ stats, loading }: SummaryCardsProps) => {

    // Calcular Resultado do Mês (Receitas - Despesas)
    const monthResult = (stats?.monthlyIncome || 0) - (stats?.monthlyExpenses || 0);

    const cards = [
        {
            title: "Saldo Atual",
            value: stats?.totalBalance || 0,
            icon: Wallet,
            subtitle: "Em todas as contas",
            color: "text-blue-500",
            bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent/5",
            borderColor: "border-blue-500/20",
            iconBg: "bg-blue-500/20",
        },
        {
            title: "Resultado do Mês",
            value: monthResult,
            icon: TrendingUp,
            subtitle: "Receitas - Despesas",
            color: monthResult >= 0 ? "text-emerald-500" : "text-rose-500",
            bgGradient: monthResult >= 0 ? "from-emerald-500/10 via-emerald-500/5 to-transparent/5" : "from-rose-500/10 via-rose-500/5 to-transparent/5",
            borderColor: monthResult >= 0 ? "border-emerald-500/20" : "border-rose-500/20",
            iconBg: monthResult >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20",
        },
        {
            title: "Fatura Atual",
            value: -1250.00, // TODO: Buscar real
            icon: CreditCard,
            subtitle: "Fecha em 15/01",
            color: "text-violet-500",
            bgGradient: "from-violet-500/10 via-violet-500/5 to-transparent/5",
            borderColor: "border-violet-500/20",
            iconBg: "bg-violet-500/20",
        },
        {
            title: "Próximo Vencimento",
            value: -350.90, // TODO: Buscar real
            icon: CalendarClock,
            subtitle: "CEMIG - Hoje",
            color: "text-amber-500",
            bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent/5",
            borderColor: "border-amber-500/20",
            iconBg: "bg-amber-500/20",
            isWarning: true
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl bg-muted/50" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={cn(
                        "relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-default border",
                        "bg-gradient-to-br backdrop-blur-xl",
                        card.bgGradient,
                        card.borderColor
                    )}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={cn("p-3 rounded-xl backdrop-blur-md", card.iconBg)}>
                            <card.icon className={cn("h-6 w-6", card.color)} />
                        </div>
                    </div>

                    <div className="space-y-1 relative z-10">
                        <p className="text-sm font-medium text-muted-foreground/80">
                            {card.title}
                        </p>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.value)}
                        </h3>
                        <p className={cn("text-xs font-medium opacity-80",
                            card.isWarning ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                        )}>
                            {card.subtitle}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};
