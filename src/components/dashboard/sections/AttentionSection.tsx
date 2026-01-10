import { AlertTriangle, Receipt, PiggyBank, Lightbulb, Sparkles, Bot, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpcomingBillsWidget } from "@/components/dashboard/UpcomingBillsWidget";
import { BudgetSummary } from "@/components/dashboard/BudgetSummary";
import { cn } from "@/lib/utils";

interface AttentionSectionProps {
  groupId?: string;
  stats?: {
    monthlyIncome: number;
    monthlyExpenses: number;
    totalBalance: number;
    savingsTrend: number;
  } | null;
  loading?: boolean;
}

export function AttentionSection({ groupId, stats, loading }: AttentionSectionProps) {
  const currentMonth = new Date();

  // Generate AI insights
  const insights = [];

  if (stats && !loading) {
    if (stats.savingsTrend > 5) {
      insights.push({
        icon: Lightbulb,
        type: "success" as const,
        title: "Economia detectada!",
        message: `+${stats.savingsTrend.toFixed(1)}% vs mês anterior`,
      });
    }

    const isNegativeMonth = stats.monthlyExpenses > stats.monthlyIncome;
    const isNegativeBalance = stats.totalBalance < 0;

    if (isNegativeBalance) {
      insights.push({
        icon: AlertTriangle,
        type: "warning" as const,
        title: "Saldo Negativo",
        message: "Priorize o pagamento de dívidas",
      });
    } else if (isNegativeMonth) {
      insights.push({
        icon: AlertTriangle,
        type: "warning" as const,
        title: "Atenção",
        message: "Despesas acima das receitas",
      });
    }

    if (insights.length === 0) {
      insights.push({
        icon: Sparkles,
        type: "info" as const,
        title: "Tudo certo!",
        message: "Finanças equilibradas",
      });
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Atenção no Mês
      </h2>
      <Card className="shadow-sm border-l-4 border-l-amber-500">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {/* Upcoming Bills */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">Contas a Pagar</span>
              </div>
              <UpcomingBillsWidget groupId={groupId} />
            </div>

            {/* Budget Alerts */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Orçamento</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
                  <a href="/budget">
                    Ver todos <ChevronRight className="h-3 w-3 ml-0.5" />
                  </a>
                </Button>
              </div>
              <BudgetSummary month={currentMonth} groupId={groupId} />
            </div>

            {/* AI Insights */}
            {insights.length > 0 && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium">Insights</span>
                </div>
                <div className="space-y-2">
                  {insights.slice(0, 2).map((insight, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg",
                        insight.type === "warning"
                          ? "bg-amber-50 dark:bg-amber-900/20"
                          : insight.type === "success"
                          ? "bg-green-50 dark:bg-green-900/20"
                          : "bg-blue-50 dark:bg-blue-900/20"
                      )}
                    >
                      <div
                        className={cn(
                          "p-1 rounded-full",
                          insight.type === "warning"
                            ? "text-amber-600 bg-amber-100 dark:bg-amber-900/50"
                            : insight.type === "success"
                            ? "text-green-600 bg-green-100 dark:bg-green-900/50"
                            : "text-blue-600 bg-blue-100 dark:bg-blue-900/50"
                        )}
                      >
                        <insight.icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs">{insight.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{insight.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
