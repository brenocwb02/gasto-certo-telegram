import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, Edit, Trash2 } from "lucide-react";
import { useBudgets } from "@/hooks/useSupabaseData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { useFamily } from "@/hooks/useFamily";

const Budget = () => {
  const { currentGroup } = useFamily();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentMonth] = useState(new Date());
  const { budgets, loading, refetchBudgets } = useBudgets(currentMonth, currentGroup?.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Orçamento | Boas Contas";
  }, []);

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingBudget(null);
    refetchBudgets();
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm("Tem certeza que deseja excluir este orçamento?")) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;

      toast({
        title: "Orçamento excluído",
        description: "O orçamento foi excluído com sucesso.",
      });
      refetchBudgets();
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o orçamento.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orçamento Mensal</h1>
          <p className="text-muted-foreground">Gerencie seus limites de gastos por categoria.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBudget(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
            </DialogHeader>
            <BudgetForm budget={editingBudget} onSuccess={handleSuccess} groupId={currentGroup?.id} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum orçamento definido</h3>
            <p className="text-muted-foreground mb-4">
              Comece definindo limites de gastos para suas categorias de despesa.
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingBudget(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Orçamento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Orçamento</DialogTitle>
                </DialogHeader>
                <BudgetForm onSuccess={handleSuccess} groupId={currentGroup?.id} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget: any) => {
            const spent = budget.spent || 0;
            const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const remaining = budget.amount - spent;
            const isOverBudget = progress > 100;
            const isNearLimit = progress > 80 && progress <= 100;

            return (
              <Card key={budget.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.category_color || '#6366f1' }} />
                      {budget.category_name || 'Categoria não encontrada'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{formatCurrency(budget.amount)}</span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(budget)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(budget.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span className={`font-medium ${isOverBudget ? 'text-destructive' :
                        isNearLimit ? 'text-orange-500' :
                          'text-muted-foreground'
                        }`}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(progress, 100)}
                      className={`h-2 ${isOverBudget ? '[&>div]:bg-destructive' :
                        isNearLimit ? '[&>div]:bg-orange-500' :
                          '[&>div]:bg-primary'
                        }`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Gasto: <span className="font-medium">{formatCurrency(spent)}</span></span>
                    <span className={remaining >= 0 ? '' : 'text-destructive font-medium'}>
                      {remaining >= 0 ? 'Restante: ' : 'Excesso: '}
                      {formatCurrency(Math.abs(remaining))}
                    </span>
                  </div>
                  {isOverBudget && (
                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                      ⚠️ Orçamento ultrapassado em {formatCurrency(spent - budget.amount)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

export default Budget;

