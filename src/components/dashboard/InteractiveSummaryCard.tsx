import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveSummaryCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: number;
    trendLabel?: string;
    variant?: "default" | "success" | "danger" | "warning" | "purple" | "blue";
    className?: string;
    loading?: boolean;
}

const variantStyles = {
    default: {
        color: "text-blue-500",
        bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent",
        borderColor: "border-blue-500/20",
        iconBg: "bg-blue-500/20",
    },
    blue: {
        color: "text-blue-500",
        bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent",
        borderColor: "border-blue-500/20",
        iconBg: "bg-blue-500/20",
    },
    success: {
        color: "text-emerald-500",
        bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
        borderColor: "border-emerald-500/30",
        iconBg: "bg-emerald-500/20",
    },
    danger: {
        color: "text-rose-500",
        bgGradient: "from-rose-500/10 via-rose-500/5 to-transparent",
        borderColor: "border-rose-500/20",
        iconBg: "bg-rose-500/20",
    },
    warning: {
        color: "text-amber-500",
        bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent",
        borderColor: "border-amber-500/20",
        iconBg: "bg-amber-500/20",
    },
    purple: {
        color: "text-violet-500",
        bgGradient: "from-violet-500/10 via-violet-500/5 to-transparent",
        borderColor: "border-violet-500/20",
        iconBg: "bg-violet-500/20",
    },
};

export function InteractiveSummaryCard({
    title,
    value,
    icon: Icon,
    trend,
    trendLabel,
    variant = "default",
    className,
    loading = false,
}: InteractiveSummaryCardProps) {
    const styles = variantStyles[variant];

    const formatTrend = (val: number) => {
        const formatted = Math.abs(val).toFixed(1);
        const clean = formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted;
        return `${val >= 0 ? '+' : '-'}${clean}%`;
    };

    if (loading) {
        return (
            <div className={cn("h-32 rounded-2xl bg-muted animate-pulse", className)} />
        );
    }

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl p-5 transition-all duration-300 border group cursor-default",
                "hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1",
                "bg-gradient-to-br",
                styles.bgGradient,
                styles.borderColor,
                className
            )}
        >
            <div className="flex items-center justify-between mb-3">
                <div className={cn(
                    "p-2 rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
                    styles.iconBg
                )}>
                    <Icon className={cn("h-5 w-5", styles.color)} />
                </div>

                {trend !== undefined && (
                    <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full shadow-sm",
                        trend >= 0
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                    )}>
                        {formatTrend(trend)}
                    </span>
                )}
            </div>

            <p className="text-xs font-medium text-muted-foreground mb-1 group-hover:text-foreground transition-colors">
                {title}
            </p>

            <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:scale-105 transition-transform origin-left">
                {typeof value === 'number'
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                    : value
                }
            </h3>

            {trendLabel && (
                <p className="text-xs text-muted-foreground mt-1">{trendLabel}</p>
            )}
        </div>
    );
}
