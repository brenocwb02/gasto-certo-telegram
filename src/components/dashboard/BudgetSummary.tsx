import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudgets } from "@/hooks/useBudgets";
import { Calculator, Plus, AlertTriangle, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";

interface BudgetSummaryProps {
  month: Date;
  groupId?: string;
}

export const BudgetSummary = ({ month, groupId }: BudgetSummaryProps) => {
  const { budgets, loading } = useBudgets(month, groupId);
  // useCategories pode ser útil se quisermos mostrar nomes de categorias que não têm orçamento, 
  // mas aqui só mostramos os orçamentos existentes.

  if (loading) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Orçamento Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (budgets.length === 0) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Orçamento Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            Nenhum orçamento criado ainda.
          </p>
          <NavLink to="/orcamento">
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Orçamento
            </Button>
          </NavLink>
        </CardContent>
      </Card>
    );
  }

  const topBudgets = budgets.slice(0, 4);

  return (
    <Card className="financial-card h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Orçamento Mensal
        </CardTitle>
        <NavLink to="/orcamento">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            Ver Todos
          </Button>
        </NavLink>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        {topBudgets.map((budget) => {
          const percentage = Number(budget.amount) > 0
            ? (Number(budget.spent) / Number(budget.amount)) * 100
            : 0;
          const isOverBudget = percentage > 100;
          const isNearLimit = percentage > 80 && percentage <= 100;

          return (
            <div key={budget.category_id} className="space-y-2">
              <div className="flex justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs sm:text-sm font-medium truncate">{budget.category_name}</span>
                  {budget.is_default && (
                    <Sparkles className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                  {isOverBudget && (
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-expense flex-shrink-0" />
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                  <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                    R$ {Number(budget.spent).toFixed(0)} / {Number(budget.amount).toFixed(0)}
                  </span>
                  <Badge variant={isOverBudget ? "destructive" : isNearLimit ? "secondary" : "outline"} className="text-[10px] sm:text-xs">
                    {percentage.toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${isOverBudget
                    ? 'bg-expense'
                    : isNearLimit
                      ? 'bg-warning'
                      : 'bg-primary'
                    }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              {isOverBudget && (
                <p className="text-xs text-expense">
                  Excedeu o orçamento em R$ {(Number(budget.spent) - Number(budget.amount)).toFixed(2)}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};