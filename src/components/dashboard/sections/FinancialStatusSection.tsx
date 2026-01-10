import { Wallet, TrendingUp, TrendingDown, CreditCard, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FinancialStatusSectionProps {
  stats: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    trend: number;
  } | null;
  loading: boolean;
  currentInvoice?: number;
  nextDueDate?: { label: string; amount: number; daysUntil: number } | null;
}

export function FinancialStatusSection({
  stats,
  loading,
  currentInvoice = 0,
  nextDueDate,
}: FinancialStatusSectionProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const monthResult = stats ? stats.monthlyIncome - stats.monthlyExpenses : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const items = [
    {
      icon: Wallet,
      label: "Saldo Atual",
      value: formatCurrency(stats.totalBalance),
      color: stats.totalBalance >= 0 ? "text-primary" : "text-destructive",
      bgColor: stats.totalBalance >= 0 ? "bg-primary/10" : "bg-destructive/10",
    },
    {
      icon: monthResult >= 0 ? TrendingUp : TrendingDown,
      label: "Resultado do Mês",
      value: formatCurrency(monthResult),
      color: monthResult >= 0 ? "text-success" : "text-expense",
      bgColor: monthResult >= 0 ? "bg-success/10" : "bg-expense/10",
    },
    {
      icon: CreditCard,
      label: "Fatura Atual",
      value: formatCurrency(currentInvoice),
      color: currentInvoice > 0 ? "text-amber-600" : "text-muted-foreground",
      bgColor: currentInvoice > 0 ? "bg-amber-100 dark:bg-amber-900/20" : "bg-muted",
    },
    ...(nextDueDate
      ? [
          {
            icon: AlertCircle,
            label: nextDueDate.label,
            value: formatCurrency(nextDueDate.amount),
            color:
              nextDueDate.daysUntil <= 3
                ? "text-destructive"
                : nextDueDate.daysUntil <= 7
                ? "text-amber-600"
                : "text-muted-foreground",
            bgColor:
              nextDueDate.daysUntil <= 3
                ? "bg-destructive/10"
                : nextDueDate.daysUntil <= 7
                ? "bg-amber-100 dark:bg-amber-900/20"
                : "bg-muted",
            subtitle: `em ${nextDueDate.daysUntil} dias`,
          },
        ]
      : []),
  ];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Estado Financeiro
      </h2>
      <div className={cn("grid gap-3", items.length === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3")}>
        {items.map((item, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-lg", item.bgColor)}>
                  <item.icon className={cn("h-4 w-4", item.color)} />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
              </div>
              <p className={cn("text-lg font-bold", item.color)}>{item.value}</p>
              {"subtitle" in item && item.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
