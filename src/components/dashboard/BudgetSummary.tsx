import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudgets } from "@/hooks/useSupabaseData";
import { Calculator, Plus, AlertTriangle } from "lucide-react";
import { NavLink } from "react-router-dom";

export const BudgetSummary = () => {
  const currentMonth = new Date();
  const { budgets, loading } = useBudgets(currentMonth);

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
    <Card className="financial-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Orçamento Mensal
        </CardTitle>
        <NavLink to="/orcamento">
          <Button variant="outline" size="sm">
            Ver Todos
          </Button>
        </NavLink>
      </CardHeader>
      <CardContent className="space-y-4">
        {topBudgets.map((budget) => {
          const percentage = Number(budget.amount) > 0 
            ? (Number(budget.spent) / Number(budget.amount)) * 100 
            : 0;
          const isOverBudget = percentage > 100;
          const isNearLimit = percentage > 80 && percentage <= 100;

          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{budget.category_name}</span>
                  {isOverBudget && (
                    <AlertTriangle className="h-4 w-4 text-expense" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    R$ {Number(budget.spent).toFixed(2)} / R$ {Number(budget.amount).toFixed(2)}
                  </span>
                  <Badge variant={isOverBudget ? "destructive" : isNearLimit ? "secondary" : "outline"}>
                    {percentage.toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    isOverBudget 
                      ? 'bg-expense' 
                      : isNearLimit 
                        ? 'bg-warning' 
                        : 'bg-primary'
                  }`}
                  style={{width: `${Math.min(percentage, 100)}%`}}
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